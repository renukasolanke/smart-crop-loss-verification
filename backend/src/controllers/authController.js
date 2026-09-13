const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

// REGISTER
const register = async (req, res) => {
  try {
    const { name, mobile, email, password, role, village, district } = req.body;

    if (!name || !mobile || !password) {
      return res.status(400).json({ success: false, message: "Name, mobile and password are required" });
    }

    // Check if user already exists
    const existingUser = await pool.query("SELECT * FROM users WHERE mobile = $1", [mobile]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ success: false, message: "User with this mobile number already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insert user
    const newUser = await pool.query(
      `INSERT INTO users (name, mobile, email, password_hash, role, village, district)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING user_id, name, mobile, email, role, village, district, created_at`,
      [name, mobile, email || null, password_hash, role || "farmer", village || null, district || null]
    );

    res.status(201).json({ success: true, message: "User registered successfully", user: newUser.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// LOGIN
const login = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    if (!mobile || !password) {
      return res.status(400).json({ success: false, message: "Mobile and password are required" });
    }

    const result = await pool.query("SELECT * FROM users WHERE mobile = $1", [mobile]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        user_id: user.user_id,
        name: user.name,
        mobile: user.mobile,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

module.exports = { register, login };
