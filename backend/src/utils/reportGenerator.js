const PDFDocument = require("pdfkit");

const GREEN = "#1F4D3A";
const GOLD = "#C89B3C";
const INK = "#212820";
const GRAY = "#5b665c";
const LIGHT = "#F5F6F0";
const BORDER = "#d8d9cf";

const riskColor = (result) => {
  if (result === "LOW_RISK") return { bg: "#e2f1e6", fg: GREEN };
  if (result === "MEDIUM_RISK") return { bg: "#faf1de", fg: "#8a6c1f" };
  if (result === "HIGH_RISK") return { bg: "#fbeae6", fg: "#B3432B" };
  return { bg: "#eef0e9", fg: GRAY };
};

const statusColor = (status) => {
  if (status === "approved") return { bg: "#e2f1e6", fg: GREEN };
  if (status === "rejected") return { bg: "#fbeae6", fg: "#B3432B" };
  if (status === "manual_review") return { bg: "#faf1de", fg: "#8a6c1f" };
  return { bg: "#eef0e9", fg: GRAY };
};

const generateClaimReportPDF = (res, claim) => {
  const doc = new PDFDocument({ margin: 0, size: "A4", bufferPages: true });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=claim-" + claim.claim_id + "-report.pdf");
  doc.pipe(res);

  const pageWidth = 595.28;
  const marginX = 50;
  const contentWidth = pageWidth - marginX * 2;

  // ===== HEADER BAND =====
  doc.rect(0, 0, pageWidth, 90).fill(GREEN);
  doc.fillColor("#F5F6F0").fontSize(19).font("Helvetica-Bold").text("Bhoomi Raksha", marginX, 28);
  doc.fillColor("#cfe0d6").fontSize(9).font("Helvetica").text("Smart Crop Loss Verification System", marginX, 52);
  doc.fillColor(GOLD).fontSize(9).font("Helvetica-Bold").text("PROTOTYPE / DEMO REPORT", marginX, 68);

  let y = 112;

  // ===== TITLE + META =====
  doc.fillColor(INK).fontSize(15).font("Helvetica-Bold").text("Crop Loss Verification Report", marginX, y);
  y += 20;
  doc.fillColor(GRAY).fontSize(9).font("Helvetica")
    .text("Claim ID: #" + claim.claim_id + "        Generated: " + new Date().toLocaleString("en-IN"), marginX, y);
  y += 24;

  // ===== STATUS + RISK BADGES ROW =====
  const sc = statusColor(claim.status);
  const rc = riskColor(claim.final_result);
  const badgeY = y;

  doc.roundedRect(marginX, badgeY, 160, 34, 4).fill(sc.bg);
  doc.fillColor(GRAY).fontSize(8).font("Helvetica").text("CLAIM STATUS", marginX + 12, badgeY + 6);
  doc.fillColor(sc.fg).fontSize(12).font("Helvetica-Bold").text((claim.status || "—").replace("_", " ").toUpperCase(), marginX + 12, badgeY + 17);

  doc.roundedRect(marginX + 175, badgeY, 160, 34, 4).fill(rc.bg);
  doc.fillColor(GRAY).fontSize(8).font("Helvetica").text("FRAUD RISK", marginX + 187, badgeY + 6);
  doc.fillColor(rc.fg).fontSize(12).font("Helvetica-Bold").text((claim.final_result || "—").replace("_", " ").toUpperCase(), marginX + 187, badgeY + 17);

  doc.roundedRect(marginX + 350, badgeY, 145, 34, 4).fill(LIGHT).stroke(BORDER);
  doc.fillColor(GRAY).fontSize(8).font("Helvetica").text("AI DAMAGE ESTIMATE", marginX + 362, badgeY + 6);
  doc.fillColor(INK).fontSize(12).font("Helvetica-Bold").text(
    claim.ai_damage_score != null ? claim.ai_damage_score + "%" : "N/A",
    marginX + 362, badgeY + 17
  );

  y = badgeY + 34 + 26;

  // ===== SECTION HELPER =====
  const sectionHeader = (title) => {
    doc.rect(marginX, y, contentWidth, 22).fill(GREEN);
    doc.fillColor("#F5F6F0").fontSize(10).font("Helvetica-Bold").text(title, marginX + 10, y + 6);
    y += 22;
  };

  const kvTable = (rows) => {
    rows.forEach((r, i) => {
      const rowH = r.tall ? 40 : 20;
      if (i % 2 === 0) {
        doc.rect(marginX, y, contentWidth, rowH).fill("#fafbf7");
      }
      doc.fillColor(GRAY).fontSize(9).font("Helvetica").text(r.label, marginX + 10, y + 6, { width: 160 });
      doc.fillColor(INK).fontSize(9).font("Helvetica-Bold").text(r.value || "—", marginX + 180, y + 6, { width: contentWidth - 190 });
      y += rowH;
    });
    doc.rect(marginX, y - rows.reduce((s, r) => s + (r.tall ? 40 : 20), 0), contentWidth, rows.reduce((s, r) => s + (r.tall ? 40 : 20), 0))
      .stroke(BORDER);
    y += 14;
  };

  // ===== FARMER DETAILS =====
  sectionHeader("FARMER DETAILS");
  kvTable([
    { label: "Full Name", value: claim.farmer_name },
    { label: "Mobile Number", value: claim.farmer_mobile },
  ]);

  // ===== LAND DETAILS =====
  sectionHeader("LAND DETAILS");
  kvTable([
    { label: "Gat Number", value: claim.gat_number },
    { label: "Village", value: claim.village },
    { label: "Taluka", value: claim.taluka },
    { label: "District", value: claim.district },
    { label: "Area", value: claim.area_acres ? claim.area_acres + " acres" : null },
  ]);

  // ===== CLAIM INFORMATION =====
  sectionHeader("CLAIM INFORMATION");
  kvTable([
    { label: "Crop Type", value: claim.crop_type },
    { label: "Damage Description", value: claim.damage_description, tall: true },
    { label: "GPS Coordinates", value: claim.latitude + ", " + claim.longitude },
    { label: "GPS Accuracy", value: claim.gps_accuracy ? claim.gps_accuracy + " m" : null },
    { label: "Submitted On", value: new Date(claim.created_at).toLocaleString("en-IN") },
  ]);

  // Check page break before verification section
  if (y > 620) {
    doc.addPage();
    y = 50;
  }

  // ===== VERIFICATION RESULTS =====
  sectionHeader("VERIFICATION RESULTS");
  kvTable([
    { label: "GIS Land Match", value: claim.gis_result },
    { label: "GPS Quality", value: claim.gps_result },
    { label: "Duplicate Image Check", value: claim.duplicate_result },
    { label: "AI Crop Damage Estimate", value: claim.ai_damage_score != null ? claim.ai_damage_score + "% (Prototype/Demo Mode)" : "Not available" },
    { label: "Fraud Risk Score", value: (claim.fraud_score ?? 0) + " points" },
    { label: "Overall Risk Classification", value: claim.final_result ? claim.final_result.replace("_", " ") : null },
  ]);

  if (y > 650) {
    doc.addPage();
    y = 50;
  }

  // ===== ADMIN DECISION =====
  sectionHeader("ADMIN DECISION");
  kvTable([
    { label: "Status", value: claim.status ? claim.status.replace("_", " ").toUpperCase() : null },
    { label: "Remarks", value: claim.admin_remarks, tall: !!claim.admin_remarks },
    { label: "Verified On", value: claim.verified_at ? new Date(claim.verified_at).toLocaleString("en-IN") : "Pending" },
  ]);

  // ===== DISCLAIMER BOX =====
  y += 6;
  const disclaimerText = "Disclaimer: This is a prototype system built for academic demonstration. AI damage estimates are generated using a heuristic color-pattern analysis method, not a trained machine learning model. GIS land data used is synthetic/demo data, not official government cadastral records. This report should not be used for actual insurance or government claim processing.";
  const disclaimerHeight = doc.heightOfString(disclaimerText, { width: contentWidth - 20, fontSize: 8 }) + 16;

  if (y + disclaimerHeight > 780) {
    doc.addPage();
    y = 50;
  }

  doc.roundedRect(marginX, y, contentWidth, disclaimerHeight, 3).fill("#f7f5ee").stroke(BORDER);
  doc.fillColor(GRAY).fontSize(8).font("Helvetica-Oblique").text(disclaimerText, marginX + 10, y + 8, { width: contentWidth - 20 });

  // ===== FOOTER ON ALL PAGES =====
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.fillColor(BORDER).lineWidth(0.5).moveTo(marginX, 800).lineTo(pageWidth - marginX, 800).stroke();
    doc.fillColor(GRAY).fontSize(7.5).font("Helvetica")
      .text("Bhoomi Raksha — Smart Crop Loss Verification System (Prototype)", marginX, 808)
      .text("Page " + (i + 1) + " of " + range.count, pageWidth - marginX - 100, 808, { width: 100, align: "right" });
  }

  doc.end();
};

module.exports = { generateClaimReportPDF };
