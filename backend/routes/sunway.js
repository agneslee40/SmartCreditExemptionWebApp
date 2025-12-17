import express from "express";
import db from "../config/db.js";

const router = express.Router();

// GET all / filter by codes
// /api/sunway/courses?codes=EEE101,EEE102
router.get("/courses", async (req, res) => {
  try {
    const codes = (req.query.codes || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    if (codes.length === 0) {
      const r = await db.query("SELECT * FROM sunway_courses ORDER BY subject_code");
      return res.json(r.rows);
    }

    const r = await db.query(
      "SELECT * FROM sunway_courses WHERE subject_code = ANY($1::text[]) ORDER BY subject_code",
      [codes]
    );
    res.json(r.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch sunway courses" });
  }
});

export default router;
