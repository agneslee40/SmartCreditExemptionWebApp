import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import dotenv from "dotenv";

const router = express.Router();


/* =========================================================
   POST /api/auth/login
   ---------------------------------------------------------
   Logs in a user using email + password.
   For this CP2 demo, only Subject Lecturer (SL) accounts can log in.
   ========================================================= */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1) Find user by email
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];

    // 2) Demo restriction: allow SL accounts only
    if (user.role !== "SL") {
      return res.status(403).json({ error: "Access denied. SL accounts only." });
    }

    // 3) Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // 4) Create JWT token (expires in 1 hour)
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 5) Send token + minimal user profile back to frontend
    res.json({
      message: "Login successful",
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during login" });
  }
});

export default router;
