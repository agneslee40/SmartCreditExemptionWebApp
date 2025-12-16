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
    const { type, session, q } = req.query;

    const where = [];
    const vals = [];

    if (type) {
      vals.push(type);
      where.push(`type = $${vals.length}`);
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
      SELECT 
        a.id, a.application_id, a.date_submitted, a.student_id, a.student_name,
        a.academic_session, a.qualification, a.former_institution, a.requested_subject,
        a.type,
        a.pl_status, a.sl_status, a.registry_status,
        a.ai_score, a.ai_decision, a.final_decision, a.remarks,
        a.assigned_to,
        u.name  AS sl_name,
        u.email AS sl_email
      FROM applications a
      LEFT JOIN users u ON u.id = a.assigned_to
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY a.date_submitted DESC, a.id DESC
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
// 2) GET /api/applications/:id  (Details page)
router.get("/:id", async (req, res) => {
  try {
    const appId = Number(req.params.id);
    if (!Number.isFinite(appId)) return res.status(400).json({ error: "Invalid application id" });

    const appResult = await pool.query(
      `SELECT *
       FROM applications
       WHERE id = $1`,
      [appId]
    );
    if (appResult.rows.length === 0) return res.status(404).json({ error: "Not found" });

    const subjectsResult = await pool.query(
      `SELECT subject_code, subject_name
       FROM application_requested_subjects
       WHERE application_id = $1
       ORDER BY id ASC`,
      [appId]
    );

    const app = appResult.rows[0];
    app.requested_subjects = subjectsResult.rows; // array

    res.json(app);
  } catch (err) {
    console.error("GET /applications/:id error:", err);
    res.status(500).json({ error: "Failed to fetch application" });
  }
});


// GET /api/applications/:id/documents
router.get("/:id/documents", async (req, res) => {
  try {
    const appId = Number(req.params.id);
    if (!Number.isFinite(appId)) return res.status(400).json({ error: "Invalid application id" });

    const r = await pool.query(
      `SELECT id, file_name, file_type, file_path, uploaded_at
       FROM documents
       WHERE application_id = $1
       ORDER BY uploaded_at DESC, id DESC`,
      [appId]
    );

    // Add file_size (best-effort). If file doesn't exist, size = null.
    const docs = r.rows.map((d) => {
      try {
        const stat = fs.statSync(d.file_path);
        return { ...d, file_size: stat.size };
      } catch {
        return { ...d, file_size: null };
      }
    });

    res.json(docs);
  } catch (err) {
    console.error("GET /applications/:id/documents error:", err);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

// GET /api/applications/documents/:docId/download
router.get("/documents/:docId/download", async (req, res) => {
  try {
    const docId = Number(req.params.docId);
    if (!Number.isFinite(docId)) return res.status(400).json({ error: "Invalid doc id" });

    const r = await pool.query(
      `SELECT id, file_name, file_type, file_path
       FROM documents
       WHERE id = $1`,
      [docId]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: "Document not found" });

    const doc = r.rows[0];

    if (!fs.existsSync(doc.file_path)) {
      return res.status(404).json({ error: "File missing on server" });
    }

    res.setHeader("Content-Type", doc.file_type || "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${doc.file_name}"`);
    fs.createReadStream(doc.file_path).pipe(res);
  } catch (err) {
    console.error("GET /applications/documents/:docId/download error:", err);
    res.status(500).json({ error: "Failed to download document" });
  }
});

// GET /api/applications/documents/:docId/view
router.get("/documents/:docId/view", async (req, res) => {
  try {
    const docId = Number(req.params.docId);
    if (!Number.isFinite(docId)) return res.status(400).json({ error: "Invalid doc id" });

    const r = await pool.query(
      `SELECT id, file_name, file_type, file_path
       FROM documents
       WHERE id = $1`,
      [docId]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: "Document not found" });

    const doc = r.rows[0];

    if (!fs.existsSync(doc.file_path)) {
      return res.status(404).json({ error: "File missing on server" });
    }

    res.setHeader("Content-Type", doc.file_type || "application/pdf");
    // inline = open in browser
    res.setHeader("Content-Disposition", `inline; filename="${doc.file_name}"`);
    fs.createReadStream(doc.file_path).pipe(res);
  } catch (err) {
    console.error("GET /applications/documents/:docId/view error:", err);
    res.status(500).json({ error: "Failed to view document" });
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
          pl_status, sl_status, registry_status,
          remarks, document_path)
        VALUES
        ($1,$2,$3,
          $4,$5,$6,
          $7,$8,$9,
          $10,$11,
          $12,$13,$14,
          $15,$16)
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
        "To Be Assign",
        "Pending",
        "Pending",
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

// Assign an SL to an application (PL action)
router.patch("/:id/assign", async (req, res) => {
  try {
    const appId = Number(req.params.id);
    const { sl_user_id } = req.body || {};
    if (!sl_user_id) return res.status(400).json({ error: "sl_user_id is required" });

    if (!Number.isFinite(appId)) return res.status(400).json({ error: "Invalid application id" });
    if (!Number.isFinite(Number(sl_user_id))) return res.status(400).json({ error: "Invalid sl_user_id" });

    // ensure SL exists + role is SL
    const sl = await pool.query(`SELECT id, name, email FROM users WHERE id = $1 AND role = 'SL'`, [sl_user_id]);
    if (sl.rows.length === 0) return res.status(404).json({ error: "Subject Lecturer not found" });

    // update application assignment + statuses
    const updated = await pool.query(
      `UPDATE applications
       SET assigned_to = $1,
           pl_status = 'Assigned',
           sl_status = 'To Be Review'
       WHERE id = $2
       RETURNING *`,
      [sl_user_id, appId]
    );

    if (updated.rows.length === 0) return res.status(404).json({ error: "Application not found" });

    res.json({
      message: "SL assigned",
      application: updated.rows[0],
      sl: sl.rows[0],
    });
  } catch (err) {
    console.error("PATCH /applications/:id/assign error:", err);
    res.status(500).json({ error: "Failed to assign SL" });
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
      final_decision,    // 'approved' | 'rejected'
      ai_score,          // 0.0 - 1.0
      ai_decision,       // 'approve' | 'reject'
      remarks,
      pl_status,      
      sl_status, 
      registry_status
    } = req.body;

    // Build dynamic SET
    const sets = [];
    const vals = [];
    if (status !== undefined)         { vals.push(status);         sets.push(`status = $${vals.length}`); }
    if (final_decision !== undefined) { vals.push(final_decision); sets.push(`final_decision = $${vals.length}`); }
    if (ai_score !== undefined)       { vals.push(ai_score);       sets.push(`ai_score = $${vals.length}`); }
    if (ai_decision !== undefined)    { vals.push(ai_decision);    sets.push(`ai_decision = $${vals.length}`); }
    if (remarks !== undefined)        { vals.push(remarks);        sets.push(`remarks = $${vals.length}`); }
    if (pl_status !== undefined)       { vals.push(pl_status);       sets.push(`pl_status = $${vals.length}`); }
    if (sl_status !== undefined)       { vals.push(sl_status);       sets.push(`sl_status = $${vals.length}`); }
    if (registry_status !== undefined) { vals.push(registry_status); sets.push(`registry_status = $${vals.length}`); }

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


router.get("/:id/ai-analysis/latest", async (req, res) => {
  try {
    const { id } = req.params;
    const q = `
      SELECT *
      FROM ai_analysis
      WHERE application_id = $1
      ORDER BY analyzed_at DESC
      LIMIT 1
    `;
    const { rows } = await pool.query(q, [id]);
    res.json(rows[0] || null);
  } catch (err) {
    console.error("GET /applications/:id/ai-analysis/latest error:", err);
    res.status(500).json({ error: "Failed to fetch AI analysis" });
  }
});



export default router;
