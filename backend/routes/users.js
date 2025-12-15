import express from "express";
import pool from "../config/db.js";

const router = express.Router();

/**
 * GET /api/users?role=SL
 * Returns basic user list for dropdown/search (id, name, email, role)
 */
router.get("/", async (req, res) => {
  try {
    const { role } = req.query;

    const vals = [];
    let where = "";

    if (role) {
      vals.push(role);
      where = `WHERE role = $1`;
    }

    const result = await pool.query(
      `SELECT id, name, email, role
       FROM users
       ${where}
       ORDER BY name ASC`,
      vals
    );

    res.json(result.rows);
  } catch (err) {
    console.error("GET /users error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

export default router;
