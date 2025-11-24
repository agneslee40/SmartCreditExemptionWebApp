import express from "express";
import axios from "axios";
import pool from "../config/db.js";

const router = express.Router();

/**
 * POST /api/matching/analyze
 *
 * Body example:
 * {
 *   "application_id": "A001",
 *   "applicant_files": [
 *      "datasets/applicants/SunwayTranscripts.pdf",
 *      "datasets/applicants/DuplicateComputerMathematicsLecturePlan.pdf"
 *   ],
 *   "sunway_files": [
 *      "datasets/sunway/ComputerMathematicsLecturePlan.pdf"
 *   ]
 * }
 *
 * Flow:
 * 1. Find application in DB by application_id
 * 2. Call Python http://127.0.0.1:8000/analyze with type, subject_name, files
 * 3. Save AI result (similarity, ai_decision) into PostgreSQL
 * 4. Return updated application + AI reasoning
 */
router.post("/analyze", async (req, res) => {
  try {
    const { application_id, applicant_files, sunway_files } = req.body;

    if (!application_id) {
      return res.status(400).json({ error: "application_id is required" });
    }
    if (!Array.isArray(applicant_files) || applicant_files.length === 0) {
      return res.status(400).json({ error: "applicant_files must be a non-empty array" });
    }
    if (!Array.isArray(sunway_files) || sunway_files.length === 0) {
      return res.status(400).json({ error: "sunway_files must be a non-empty array" });
    }

    // 1️⃣ Get application info from DB
    const appResult = await pool.query(
      `SELECT id, application_id, type, requested_subject
       FROM applications
       WHERE application_id = $1`,
      [application_id]
    );

    if (appResult.rows.length === 0) {
      return res.status(404).json({ error: "Application not found" });
    }

    const appRow = appResult.rows[0];
    const appType = appRow.type || "Credit Exemption"; // fallback if null
    const subjectName = appRow.requested_subject || "Unknown Subject";

    // 2️⃣ Call Python AI service
    const pyResponse = await axios.post("http://127.0.0.1:8000/analyze", {
      type: appType,
      subject_name: subjectName,
      subject_aliases: [subjectName], // you can later expand with synonyms
      applicant_files,
      sunway_files
    });

    const { ai_decision, reasoning, suggested_equivalent_grade } = pyResponse.data;
    const similarity = reasoning ? reasoning.similarity_percent : null;

    // 3️⃣ Save AI result into PostgreSQL
    const updateResult = await pool.query(
      `UPDATE applications
       SET ai_score = $1,
           ai_decision = $2,
           remarks = COALESCE(remarks, '') || $3
       WHERE id = $4
       RETURNING *`,
      [
        similarity,
        ai_decision,
        `\n[AI] ${JSON.stringify(reasoning)}`,
        appRow.id
      ]
    );

    const updatedApp = updateResult.rows[0];

    // 4️⃣ Respond back to caller
    return res.json({
      message: "AI analysis complete",
      application_id: application_id,
      ai_decision,
      similarity,
      suggested_equivalent_grade,
      reasoning,
      application: updatedApp
    });
  } catch (err) {
    console.error("Error in /api/matching/analyze:", err.message);
    // If Python returned an error, include its message if available
    if (err.response && err.response.data) {
      return res.status(500).json({
        error: "Python AI service error",
        details: err.response.data
      });
    }
    return res.status(500).json({ error: "Server error while analyzing" });
  }
});

export default router;
