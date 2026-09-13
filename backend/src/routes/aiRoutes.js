const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { suggestCropType } = require("../utils/aiCropAnalysis");

router.post("/suggest-crop", verifyToken, async (req, res) => {
  try {
    const { imageDataUrl } = req.body;
    if (!imageDataUrl) {
      return res.status(400).json({ success: false, message: "Image is required" });
    }
    const base64Data = imageDataUrl.split(",")[1] || imageDataUrl;
    const buffer = Buffer.from(base64Data, "base64");
    const result = await suggestCropType(buffer);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
