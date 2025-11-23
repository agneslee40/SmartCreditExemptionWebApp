import express from "express";
import pool from "../config/db.js";

const router = express.Router();

router.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW();");
    res.json({
      message: "PostgreSQL is working 🎉",
      time: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database test failed" });
  }
});

export default router;
