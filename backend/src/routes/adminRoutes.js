const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");
const { getAllClaims, getClaimById, updateClaimStatus, getStats } = require("../controllers/adminController");

router.use(verifyToken, adminOnly);

router.get("/stats", getStats);
router.get("/claims", getAllClaims);
router.get("/claims/:id", getClaimById);
router.patch("/claims/:id/status", updateClaimStatus);

module.exports = router;
