import express from "express";
import pool from "../config/db.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { runAiAnalysis } from "../services/aiService.js";


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

async function runAndPersistAi(appId) {
  // fetch application
  const appR = await pool.query(`SELECT * FROM applications WHERE id = $1`, [appId]);
  if (appR.rows.length === 0) throw new Error("Application not found");
  const application = appR.rows[0];

  // fetch documents
  const docsR = await pool.query(
    `SELECT id, file_name, file_type, file_path, uploaded_at
     FROM documents
     WHERE application_id = $1
     ORDER BY uploaded_at DESC, id DESC`,
    [appId]
  );
  const documents = docsR.rows;

  // run AI
  const ai = await runAiAnalysis(application, documents);

  // insert into ai_analysis
  const insertR = await pool.query(
    `INSERT INTO ai_analysis (application_id, similarity, grade_detected, credit_hours, decision, reasoning)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      appId,
      ai.similarity,
      ai.gradeDetected,
      ai.creditHours,
      ai.decision,
      ai.reasoning,
    ]
  );

  // update applications snapshot fields (so ApplicationDetails can show quickly)
  await pool.query(
    `UPDATE applications
     SET ai_score = $1,
         ai_decision = $2,
         mark_detected = $3,
         grade_detected = $4
     WHERE id = $5`,
    [
      ai.similarity,
      ai.decision,
      ai.markDetected ? String(ai.markDetected) : null,
      ai.gradeDetected,
      appId,
    ]
  );

  return insertR.rows[0];
}


const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.includes("pdf")) return cb(new Error("PDFs only"));
    cb(null, true);
  },
});

/* =========================================================
   AI SUGGESTED OUTCOME (STUB IMPLEMENTATION)
   - You can replace this later with your real Python pipeline.
   - This writes into:
     1) ai_analysis table (history)
     2) applications table (latest fields)
   ========================================================= */
async function runAiForApplication(applicationDbId) {
  // 1) Load application + docs
  const appRes = await pool.query(`SELECT * FROM applications WHERE id = $1`, [applicationDbId]);
  if (appRes.rows.length === 0) throw new Error("Application not found");
  const app = appRes.rows[0];

  const docsRes = await pool.query(
    `SELECT id, file_name, file_type, file_path, uploaded_at
     FROM documents
     WHERE application_id = $1
     ORDER BY uploaded_at DESC`,
    [applicationDbId]
  );
  const docs = docsRes.rows;

  // 2) ---- STUB extraction logic ----
  // Replace these with your real outputs later:
  // - similarity: float 0..1
  // - grade_detected: varchar
  // - credit_hours: int
  // - decision: Approve/Reject
  //
  // Example heuristic:
  const gradeDetected = app.grade_detected || "A-";      // placeholder if not generated yet
  const markDetected = app.mark_detected || "85";        // placeholder
  const creditHours = 3;                                 // placeholder
  const similarity = 0.82;                               // placeholder (82%)

  // decision rule (same as your prototype)
  const gradeOrder = ["F","D-","D","D+","C-","C","C+","B-","B","B+","A-","A","A+"];
  const gradeOk = gradeOrder.indexOf(String(gradeDetected).toUpperCase()) >= gradeOrder.indexOf("C");
  const simOk = similarity >= 0.8;
  const creditOk = creditHours >= 3;

  const decision = gradeOk && simOk && creditOk ? "Approve" : "Reject";

  const reasoning = {
    summary: "Stub reasoning (replace with real extraction later).",
    checks: {
      grade: { detected: gradeDetected, required: ">= C", pass: gradeOk },
      similarity: { detected: similarity, required: ">= 0.80", pass: simOk },
      credit_hours: { detected: creditHours, required: ">= 3", pass: creditOk },
    },
    docs_used: docs.map((d) => ({ id: d.id, file_name: d.file_name })),
  };

  // 3) Insert into ai_analysis history
  const aiInsert = await pool.query(
    `INSERT INTO ai_analysis (application_id, similarity, grade_detected, credit_hours, decision, reasoning)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING *`,
    [applicationDbId, similarity, gradeDetected, creditHours, decision, reasoning]
  );

  const aiRow = aiInsert.rows[0];

  // 4) Update latest fields in applications
  // store similarity in ai_score (0..1) and decision in ai_decision
  await pool.query(
    `UPDATE applications
     SET ai_score = $1,
         ai_decision = $2,
         mark_detected = $3,
         grade_detected = $4
     WHERE id = $5`,
    [similarity, decision, markDetected, gradeDetected, applicationDbId]
  );

  return aiRow;
}

/* =========================================================
   1) GET /api/applications
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

/* =========================================================
   3) GET /api/applications/:id/documents
   ========================================================= */
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

/* =========================================================
   4) Document view/download
   NOTE: define these BEFORE "/:id" routes in real projects,
   but this works because they start with "/documents/...".
   ========================================================= */
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
    if (!fs.existsSync(doc.file_path)) return res.status(404).json({ error: "File missing on server" });

    res.setHeader("Content-Type", doc.file_type || "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${doc.file_name}"`);
    fs.createReadStream(doc.file_path).pipe(res);
  } catch (err) {
    console.error("GET /applications/documents/:docId/download error:", err);
    res.status(500).json({ error: "Failed to download document" });
  }
});

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
    if (!fs.existsSync(doc.file_path)) return res.status(404).json({ error: "File missing on server" });

    res.setHeader("Content-Type", doc.file_type || "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${doc.file_name}"`);
    fs.createReadStream(doc.file_path).pipe(res);
  } catch (err) {
    console.error("GET /applications/documents/:docId/view error:", err);
    res.status(500).json({ error: "Failed to view document" });
  }
});

/* =========================================================
   5) GET latest AI analysis
   ========================================================= */
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

/* =========================================================
   6) POST run AI (manual regenerate)
   ========================================================= */
router.post("/:id/ai-analysis/run", async (req, res) => {
  try {
    const appId = Number(req.params.id);
    if (!Number.isFinite(appId)) return res.status(400).json({ error: "Invalid application id" });

    const row = await runAndPersistAi(appId);
    res.json({ message: "AI analysis generated", analysis: row });
  } catch (err) {
    console.error("POST /applications/:id/ai-analysis/run error:", err);
    res.status(500).json({ error: "Failed to run AI analysis", details: err.message });
  }
});




/* =========================================================
   7) POST /api/applications (create application)
   ========================================================= */
router.post("/", upload.single("document"), async (req, res) => {
  try {
    const {
      application_id,
      student_name,
      student_id,
      intake,
      semester,
      qualification,
      former_institution,
      requested_subject,
      type,
      remarks,
      date_submitted,
      programme,
      nric_passport,
      prev_year_completion,
      prev_subject_name,
      requested_subject_code
    } = req.body;

    const toISODate = (s) => {
      if (!s) return null;
      const m = String(s).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (!m) return null;
      const dd = m[1].padStart(2, "0");
      const mm = m[2].padStart(2, "0");
      const yyyy = m[3];
      return `${yyyy}-${mm}-${dd}`;
    };

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
         remarks, document_path,
         programme, nric_passport,
         prev_year_completion, prev_subject_name,
         requested_subject_code)
       VALUES
        ($1,$2,$3,
         $4,$5,$6,
         $7,$8,$9,
         $10,$11,
         $12,$13,$14,
         $15,$16,
         $17,$18,
         $19,$20,
         $21)
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
        programme || null,
        nric_passport || null,
        prev_year_completion || null,
        prev_subject_name || null,
        requested_subject_code || null
      ]
    );

    // OPTIONAL: If you want AI to run immediately on creation:
    // Usually better to run after all docs are uploaded.
    // If you uploaded 1 doc in this POST, you can run here.
    try {
      await runAiForApplication(result.rows[0].id);
    } catch (e) {
      console.warn("AI run skipped/failed on create:", e.message);
    }
    // Auto-run AI if a document was uploaded in the create call
    try {
      if (document_path) {
        await pool.query(
          `INSERT INTO documents (application_id, file_name, file_type, file_path)
          VALUES ($1, $2, $3, $4)`,
          [result.rows[0].id, req.file.originalname, req.file.mimetype, document_path]
        );

        // then run AI using documents table
        await runAndPersistAi(result.rows[0].id);
      }
    } catch (aiErr) {
      console.error("Auto AI run after create failed:", aiErr);
      // don’t block creation flow; just log
    }

    res.status(201).json({ message: "Application created", application: result.rows[0] });
  } catch (err) {
    console.error("POST /applications error:", err);
    res.status(500).json({ error: "Failed to create application", details: err.message });
  }
});

/* =========================================================
   8) POST /api/applications/:id/documents (upload multiple)
   - After upload, auto-run AI
   ========================================================= */
router.post("/:id/documents", upload.array("documents", 10), async (req, res) => {
  try {
    const appId = Number(req.params.id);
    if (!Number.isFinite(appId)) return res.status(400).json({ error: "Invalid application id" });

    const app = await pool.query("SELECT id FROM applications WHERE id = $1", [appId]);
    if (app.rows.length === 0) return res.status(404).json({ error: "Application not found" });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded. Use key: documents" });
    }

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

    // ✅ auto-run AI after docs upload
    // auto-run AI after uploading docs (now we have more evidence)
    try {
      await runAndPersistAi(applicationDbId);
    } catch (aiErr) {
      console.error("Auto AI run after doc upload failed:", aiErr);
    }


    res.status(201).json({
      message: "Documents uploaded",
      application_id: appId,
      documents: inserted,
      ai_generated: ai,
    });
  } catch (err) {
    console.error("POST /applications/:id/documents error:", err);
    res.status(500).json({ error: "Failed to upload documents", details: err.message });
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
   9) PATCH /api/applications/:id (update decisions/status)
   FIXED: removed undefined `status`
   ========================================================= */
router.patch("/:id", async (req, res) => {
  try {
    const {
      final_decision,
      ai_score,
      ai_decision,
      remarks,
      pl_status,
      sl_status,
      registry_status
    } = req.body;

    const sets = [];
    const vals = [];

    if (final_decision !== undefined) { vals.push(final_decision); sets.push(`final_decision = $${vals.length}`); }
    if (ai_score !== undefined)       { vals.push(ai_score);       sets.push(`ai_score = $${vals.length}`); }
    if (ai_decision !== undefined)    { vals.push(ai_decision);    sets.push(`ai_decision = $${vals.length}`); }
    if (remarks !== undefined)        { vals.push(remarks);        sets.push(`remarks = $${vals.length}`); }
    if (pl_status !== undefined)      { vals.push(pl_status);      sets.push(`pl_status = $${vals.length}`); }
    if (sl_status !== undefined)      { vals.push(sl_status);      sets.push(`sl_status = $${vals.length}`); }
    if (registry_status !== undefined){ vals.push(registry_status);sets.push(`registry_status = $${vals.length}`); }

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

export default router;
