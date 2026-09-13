const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { createClaim, getMyClaims, downloadReport } = require("../controllers/claimsController");

router.post("/", verifyToken, createClaim);
router.get("/", verifyToken, getMyClaims);
router.get("/:id/report", verifyToken, downloadReport);

module.exports = router;
