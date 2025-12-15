// backend/routes/users.js
import express from "express";
import pool from "../config/db.js";

const router = express.Router();

/**
 * GET /api/users
 * Optional query:
 *  - role=SL (or PL/Admin)
 *  - q=search text (matches name/email)
 *
 * Example:
 *  GET http://localhost:5000/api/users?role=SL&q=demo
 */
router.get("/", async (req, res) => {
  try {
    const { role, q } = req.query;

    const where = [];
    const vals = [];

    if (role) {
      vals.push(role);
      where.push(`role = $${vals.length}`);
    }

    if (q) {
      vals.push(`%${q}%`);
      where.push(`(name ILIKE $${vals.length} OR email ILIKE $${vals.length})`);
    }

    const sql = `
      SELECT id, name, email, role
      FROM users
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY name ASC
      LIMIT 50;
    `;

    const result = await pool.query(sql, vals);
    return res.json(result.rows);
  } catch (err) {
    console.error("GET /users error:", err);
    return res.status(500).json({ error: "Failed to fetch users" });
  }
});

export default router;
