const pool = require("../config/db");
const { fetchWeatherData } = require("../utils/weatherService");

const getAllClaims = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.claim_id, c.crop_type, c.damage_description, c.status,
              c.latitude, c.longitude, c.gps_accuracy, c.capture_time, c.created_at,
              u.name as farmer_name, u.mobile as farmer_mobile,
              p.gat_number, p.village, p.taluka, p.district, p.area_acres,
              i.sha256_hash, i.image_path,
              v.verification_id, v.gis_result, v.gps_result, v.duplicate_result,
              v.fraud_score, v.final_result, v.admin_remarks, v.ai_damage_score, v.confidence_score
       FROM claims c
       JOIN users u ON c.farmer_id = u.user_id
       LEFT JOIN plots p ON c.plot_id = p.plot_id
       LEFT JOIN images i ON c.image_id = i.image_id
       LEFT JOIN verification_results v ON v.claim_id = c.claim_id
       ORDER BY
         CASE v.final_result
           WHEN 'HIGH_RISK' THEN 1
           WHEN 'MEDIUM_RISK' THEN 2
           WHEN 'LOW_RISK' THEN 3
           ELSE 4
         END,
         c.created_at DESC`
    );
    res.json({ success: true, claims: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const getClaimById = async (req, res) => {
  try {
    const { id } = req.params;
    const claimResult = await pool.query(
      `SELECT c.*, u.name as farmer_name, u.mobile as farmer_mobile,
              p.gat_number, p.village, p.taluka, p.district, p.area_acres,
              i.image_data,
              v.verification_id, v.gis_result, v.gps_result, v.duplicate_result,
              v.fraud_score, v.final_result, v.admin_remarks, v.ai_damage_score, v.confidence_score
       FROM claims c
       JOIN users u ON c.farmer_id = u.user_id
       LEFT JOIN plots p ON c.plot_id = p.plot_id
       LEFT JOIN images i ON c.image_id = i.image_id
       LEFT JOIN verification_results v ON v.claim_id = c.claim_id
       WHERE c.claim_id = $1`,
      [id]
    );
    if (claimResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Claim not found" });
    }

    const claim = claimResult.rows[0];
    const weather = await fetchWeatherData(claim.latitude, claim.longitude, claim.capture_time || claim.created_at);

    res.json({ success: true, claim: { ...claim, weather } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateClaimStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;
    const validStatuses = ["approved", "rejected", "manual_review"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    await pool.query("UPDATE claims SET status = $1 WHERE claim_id = $2", [status, id]);
    await pool.query(
      "UPDATE verification_results SET admin_remarks = $1, verified_at = NOW() WHERE claim_id = $2",
      [remarks || null, id]
    );
    await pool.query(
      `INSERT INTO audit_logs (claim_id, user_id, action, details) VALUES ($1, $2, $3, $4)`,
      [id, req.user.user_id, "admin_" + status, remarks || ("Claim marked as " + status)]
    );

    res.json({ success: true, message: "Claim " + status + " successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const getStats = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE c.status = 'approved') as approved,
        COUNT(*) FILTER (WHERE c.status IN ('submitted','pending_review')) as pending,
        COUNT(*) FILTER (WHERE c.status = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE v.final_result = 'HIGH_RISK' AND c.status NOT IN ('approved','rejected')) as high_risk_alerts,
        COUNT(*) FILTER (WHERE c.status = 'manual_review') as manual_review
       FROM claims c
       LEFT JOIN verification_results v ON v.claim_id = c.claim_id`
    );
    res.json({ success: true, stats: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAllClaims, getClaimById, updateClaimStatus, getStats };



