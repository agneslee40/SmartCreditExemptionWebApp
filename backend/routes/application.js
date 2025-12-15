import express from "express";
import pool from "../config/db.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

/* ---------- File Upload Setup (PDFs) ---------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(process.cwd(), "backend", "uploads");
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ts = Date.now();
    const safe = file.originalname.replace(/\s+/g, "_");
    cb(null, `${ts}_${safe}`);
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.includes("pdf")) return cb(new Error("PDFs only"));
    cb(null, true);
  },
});

/* =========================================================
   1) GET /api/applications
   - Returns list for Home/Tasks screens
   - Supports filters: type, status, session, search
   - Later can add "assigned_to" filtering
   ========================================================= */
router.get("/", async (req, res) => {
  try {
    const { type, status, session, q } = req.query;

    const where = [];
    const vals = [];

    if (type) {
      vals.push(type);
      where.push(`type = $${vals.length}`);
    }
    if (status) {
      vals.push(status);
      where.push(`status = $${vals.length}`);
    }
    if (session) {
      vals.push(session);
      where.push(`academic_session = $${vals.length}`);
    }
    if (q) {
      // simple text search across common columns
      vals.push(`%${q}%`);
      where.push(`(
        student_name ILIKE $${vals.length} OR
        student_id   ILIKE $${vals.length} OR
        requested_subject ILIKE $${vals.length} OR
        former_institution ILIKE $${vals.length}
      )`);
    }

    const sql = `
      SELECT id, application_id, date_submitted, student_id, student_name,
             academic_session, qualification, former_institution, requested_subject,
             type, status, ai_score, ai_decision, final_decision, remarks
      FROM applications
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY date_submitted DESC, id DESC
      LIMIT 200;
    `;

    const result = await pool.query(sql, vals);
    res.json(result.rows);
  } catch (err) {
    console.error("GET /applications error:", err);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

/* =========================================================
   2) GET /api/applications/:id
   - Details page (3.2 Application Details)
   ========================================================= */
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM applications
       WHERE id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("GET /applications/:id error:", err);
    res.status(500).json({ error: "Failed to fetch application" });
  }
});

/* =========================================================
   3) POST /api/applications
   - Create application + (optional) upload PDF
   - Matches “Upload / New request” flow
   - For demo, PL can create; later students could too (if needed)
   ========================================================= */
router.post("/", upload.single("document"), async (req, res) => {
  try {
    const {
      application_id,
      student_name,
      student_id,
      intake,          // e.g. "2025-01"
      semester,        // e.g. "1"
      qualification,
      former_institution,
      requested_subject,
      type,            // "Credit Exemption" | "Credit Transfer"
      remarks,
      date_submitted   // e.g. "15/12/2025"
    } = req.body;

    // helper: convert "dd/mm/yyyy" -> "yyyy-mm-dd" for PostgreSQL DATE
    const toISODate = (s) => {
      if (!s) return null;
      const m = String(s).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (!m) return null;
      const dd = m[1].padStart(2, "0");
      const mm = m[2].padStart(2, "0");
      const yyyy = m[3];
      return `${yyyy}-${mm}-${dd}`;
    };

    // derive academic_session from intake+semester (example: "202501 | 1")
    const academic_session =
      intake && semester ? `${String(intake).replace("-", "")} | ${semester}` : null;

    const document_path = req.file ? req.file.path : null;

    const result = await pool.query(
      `INSERT INTO applications
        (application_id, student_name, student_id,
         intake, semester, academic_session,
         qualification, former_institution, requested_subject,
         type, date_submitted,
         status, remarks, document_path)
       VALUES
        ($1,$2,$3,
         $4,$5,$6,
         $7,$8,$9,
         $10,$11,
         $12,$13,$14)
       RETURNING *`,
      [
        application_id,
        student_name,
        student_id,
        intake || null,
        semester || null,
        academic_session,
        qualification || null,
        former_institution || null,
        requested_subject || null,
        type || null,
        toISODate(date_submitted) || null,
        "To Be Assign",              // your initial status
        remarks || null,
        document_path,
      ]
    );

    res.status(201).json({ message: "Application created", application: result.rows[0] });
  } catch (err) {
    console.error("POST /applications error:", err);
    res.status(500).json({ error: "Failed to create application", details: err.message });
  }
});

/* =========================================================
   3B) POST /api/applications/:id/documents
   - Upload multiple PDFs for an existing application
   - Saves file records into documents table
   ========================================================= */
router.post("/:id/documents", upload.array("documents", 10), async (req, res) => {
  try {
    const appId = req.params.id;

    // check application exists
    const app = await pool.query("SELECT id FROM applications WHERE id = $1", [appId]);
    if (app.rows.length === 0) return res.status(404).json({ error: "Application not found" });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded. Use key: documents" });
    }

    // insert each uploaded file into documents table
    const inserted = [];
    for (const f of req.files) {
      const result = await pool.query(
        `INSERT INTO documents (application_id, file_name, file_type, file_path)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [appId, f.originalname, f.mimetype, f.path]
      );
      inserted.push(result.rows[0]);
    }

    res.status(201).json({
      message: "Documents uploaded",
      application_id: appId,
      documents: inserted,
    });
  } catch (err) {
    console.error("POST /applications/:id/documents error:", err);
    res.status(500).json({ error: "Failed to upload documents" });
  }
});


/* =========================================================
   4) PATCH /api/applications/:id
   - Update status / decisions (PL or SL action)
   - Can call this from “Review” and “Application Details”
   - Accepts ai_score/ai_decision too (when AI returns)
   ========================================================= */
router.patch("/:id", async (req, res) => {
  try {
    const {
      status,            // 'In Progress' | 'Approved' | 'Rejected' | ...
      final_decision,    // 'approved' | 'rejected'
      ai_score,          // 0.0 - 1.0
      ai_decision,       // 'approve' | 'reject'
      remarks
    } = req.body;

    // Build dynamic SET
    const sets = [];
    const vals = [];
    if (status !== undefined)         { vals.push(status);         sets.push(`status = $${vals.length}`); }
    if (final_decision !== undefined) { vals.push(final_decision); sets.push(`final_decision = $${vals.length}`); }
    if (ai_score !== undefined)       { vals.push(ai_score);       sets.push(`ai_score = $${vals.length}`); }
    if (ai_decision !== undefined)    { vals.push(ai_decision);    sets.push(`ai_decision = $${vals.length}`); }
    if (remarks !== undefined)        { vals.push(remarks);        sets.push(`remarks = $${vals.length}`); }

    if (sets.length === 0) return res.status(400).json({ error: "Nothing to update" });

    vals.push(req.params.id);

    const result = await pool.query(
      `UPDATE applications
       SET ${sets.join(", ")}
       WHERE id = $${vals.length}
       RETURNING *`,
      vals
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Application updated", application: result.rows[0] });
  } catch (err) {
    console.error("PATCH /applications/:id error:", err);
    res.status(500).json({ error: "Failed to update application" });
  }
});

/* =========================================================
   5) POST /api/applications/:id/documents
   - Upload MULTIPLE PDFs for one application
   - Saves files into backend/uploads
   - Inserts rows into documents table
   ========================================================= */
router.post("/:id/documents", upload.array("documents", 10), async (req, res) => {
  try {
    const applicationDbId = Number(req.params.id);

    if (!Number.isFinite(applicationDbId)) {
      return res.status(400).json({ error: "Invalid application id" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded. Use key 'documents'." });
    }

    // (Optional but recommended) ensure application exists
    const check = await pool.query(`SELECT id FROM applications WHERE id = $1`, [applicationDbId]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: "Application not found" });
    }

    // Insert each uploaded file into documents table
    const inserted = [];
    for (const f of req.files) {
      const r = await pool.query(
        `INSERT INTO documents (application_id, file_name, file_type, file_path)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [applicationDbId, f.originalname, f.mimetype, f.path]
      );
      inserted.push(r.rows[0]);
    }

    return res.status(201).json({
      message: "Documents uploaded",
      count: inserted.length,
      documents: inserted,
    });
  } catch (err) {
    console.error("POST /applications/:id/documents error:", err);
    return res.status(500).json({ error: "Failed to upload documents" });
  }
});


export default router;
