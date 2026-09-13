require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./config/db");
const authRoutes = require("./routes/authRoutes");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/", (req, res) => {
  res.json({ message: "Smart Crop Loss Verification API is running" });
});

app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ success: true, time: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.use("/auth", authRoutes);
app.use("/plots", require("./routes/gisRoutes"));
app.use("/claims", require("./routes/claimsRoutes"));
app.use("/admin", require("./routes/adminRoutes"));
app.use("/ai", require("./routes/aiRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

