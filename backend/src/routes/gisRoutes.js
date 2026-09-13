const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { seedPlots, matchPlot, getMyPlots } = require("../controllers/gisController");

router.post("/seed", seedPlots);
router.get("/match", matchPlot);
router.get("/mine", verifyToken, getMyPlots);

module.exports = router;
