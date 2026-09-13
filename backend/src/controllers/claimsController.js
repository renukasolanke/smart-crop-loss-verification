const crypto = require("crypto");
const pool = require("../config/db");
const { analyzeCropDamage } = require("../utils/aiCropAnalysis");
const { generateClaimReportPDF } = require("../utils/reportGenerator");

const createClaim = async (req, res) => {
  try {
    const farmer_id = req.user.user_id;
    const { imageDataUrl, latitude, longitude, gps_accuracy, capture_time, plot_id, crop_type, damage_description } = req.body;

    if (!imageDataUrl || !latitude || !longitude) {
      return res.status(400).json({ success: false, message: "Image and GPS location are required" });
    }

    const base64Data = imageDataUrl.split(",")[1] || imageDataUrl;
    const buffer = Buffer.from(base64Data, "base64");
    const sha256_hash = crypto.createHash("sha256").update(buffer).digest("hex");

    const dup = await pool.query("SELECT image_id FROM images WHERE sha256_hash = $1", [sha256_hash]);
    const isDuplicate = dup.rows.length > 0;

    const imageInsert = await pool.query(
      `INSERT INTO images (image_path, sha256_hash, file_size, mime_type, capture_time, image_data)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING image_id`,
      ["inline-base64-" + sha256_hash.slice(0, 12), sha256_hash, buffer.length, "image/jpeg", capture_time || new Date(), imageDataUrl]
    );
    const image_id = imageInsert.rows[0].image_id;

    const claimInsert = await pool.query(
      `INSERT INTO claims (farmer_id, plot_id, image_id, latitude, longitude, gps_accuracy, capture_time, crop_type, damage_description, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'submitted')
       RETURNING claim_id, status, created_at`,
      [farmer_id, plot_id || null, image_id, latitude, longitude, gps_accuracy || null, capture_time || new Date(), crop_type || null, damage_description || null]
    );
    const claim = claimInsert.rows[0];

    const aiResult = await analyzeCropDamage(buffer);

    // ===== FRAUD SCORING (matches documented scoring table) =====
    let fraudScore = 0;
    const gisResult = plot_id ? "PASS" : "FLAG";
    if (!plot_id) fraudScore += 45; // outside plot

    let gpsResult;
    if (gps_accuracy > 30) {
      fraudScore += 20;
      gpsResult = "POOR";
    } else if (gps_accuracy > 10) {
      fraudScore += 10;
      gpsResult = "MODERATE";
    } else {
      gpsResult = "GOOD";
    }

    const duplicateResult = isDuplicate ? "FLAG" : "PASS";
    if (isDuplicate) fraudScore += 40;

    // Invalid capture time: capture more than 24 hours before upload
    let captureTimeValid = true;
    if (capture_time) {
      const captureDate = new Date(capture_time);
      const uploadDate = new Date();
      const hoursDiff = (uploadDate - captureDate) / (1000 * 60 * 60);
      if (hoursDiff > 24) {
        fraudScore += 15;
        captureTimeValid = false;
      }
    }

    fraudScore = Math.min(fraudScore, 100);
    const confidenceScore = 100 - fraudScore;
    const finalResult = fraudScore <= 20 ? "LOW_RISK" : fraudScore <= 50 ? "MEDIUM_RISK" : "HIGH_RISK";

    await pool.query(
      `INSERT INTO verification_results (claim_id, gis_result, gps_result, duplicate_result, ai_damage_score, fraud_score, confidence_score, final_result)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [claim.claim_id, gisResult, gpsResult, duplicateResult, aiResult.damagePercent, fraudScore, confidenceScore, finalResult]
    );

    await pool.query(
      `INSERT INTO audit_logs (claim_id, user_id, action, details) VALUES ($1, $2, $3, $4)`,
      [claim.claim_id, farmer_id, "claim_submitted", "Claim submitted with fraud score " + fraudScore + ", confidence " + confidenceScore]
    );

    res.status(201).json({
      success: true,
      message: "Claim submitted successfully",
      claim: {
        ...claim,
        fraud_score: fraudScore,
        confidence_score: confidenceScore,
        final_result: finalResult,
        duplicate_detected: isDuplicate,
        capture_time_valid: captureTimeValid,
        ai_analysis: aiResult,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

const getMyClaims = async (req, res) => {
  try {
    const farmer_id = req.user.user_id;
    const result = await pool.query(
      `SELECT c.claim_id, c.crop_type, c.damage_description, c.status, c.latitude, c.longitude,
              c.created_at, p.gat_number, p.village, p.district,
              v.fraud_score, v.final_result, v.confidence_score, v.ai_damage_score
       FROM claims c
       LEFT JOIN plots p ON c.plot_id = p.plot_id
       LEFT JOIN verification_results v ON v.claim_id = c.claim_id
       WHERE c.farmer_id = $1
       ORDER BY c.created_at DESC`,
      [farmer_id]
    );
    res.json({ success: true, claims: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

const downloadReport = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT c.*, u.name as farmer_name, u.mobile as farmer_mobile,
              p.gat_number, p.village, p.taluka, p.district, p.area_acres,
              v.gis_result, v.gps_result, v.duplicate_result,
              v.fraud_score, v.final_result, v.admin_remarks, v.ai_damage_score, v.confidence_score, v.verified_at
       FROM claims c
       JOIN users u ON c.farmer_id = u.user_id
       LEFT JOIN plots p ON c.plot_id = p.plot_id
       LEFT JOIN verification_results v ON v.claim_id = c.claim_id
       WHERE c.claim_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Claim not found" });
    }

    const claim = result.rows[0];

    if (req.user.role !== "admin" && claim.farmer_id !== req.user.user_id) {
      return res.status(403).json({ success: false, message: "Not authorized to view this report" });
    }

    generateClaimReportPDF(res, claim);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createClaim, getMyClaims, downloadReport };
