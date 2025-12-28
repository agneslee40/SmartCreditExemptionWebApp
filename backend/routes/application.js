import express from "express";
import pool from "../config/db.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { extractPdfText, extractApplicantCourseResultWithAI, extractSunwayCreditHoursWithAI, buildSimilarityEvidence, runAiAnalysis } from "../services/aiService.js";
import { fileURLToPath } from "url";



const router = express.Router();

/* =========================================================
   Helpers
   ========================================================= */
function parseCodes(raw) {
  return String(raw || "")
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function toSlStatus(finalDecision) {
  const d = String(finalDecision || "").trim().toLowerCase();
  return d === "approve" ? "Approved" : "Rejected";
}


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
   AI: run & persist into ai_analysis + applications snapshot
   ========================================================= */
async function runAndPersistAi(appId) {
  const appR = await pool.query(`SELECT * FROM applications WHERE id = $1`, [appId]);
  if (appR.rows.length === 0) throw new Error("Application not found");
  const application = appR.rows[0];

  const docsR = await pool.query(
    `SELECT id, file_name, file_type, file_path, uploaded_at
     FROM documents
     WHERE application_id = $1
     ORDER BY uploaded_at DESC, id DESC`,
    [appId]
  );
  const documents = docsR.rows;

  
  const codes = parseCodes(application.requested_subject_code);

  const sunwayR = await pool.query(
    `SELECT subject_code, subject_name, credit_hours, syllabus_pdf_path
     FROM sunway_courses
     WHERE subject_code = ANY($1::text[])`,
    [codes]
  );

  const sunwayCourses = sunwayR.rows;

  const ai = await runAiAnalysis(application, documents, sunwayCourses);

  const insertR = await pool.query(
    `INSERT INTO ai_analysis (application_id, similarity, grade_detected, credit_hours, decision, reasoning)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [appId, ai.similarity, ai.gradeDetected, ai.creditHours, ai.decision, ai.reasoning]
  );

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// helper to convert "/uploads/xxx.pdf" -> absolute disk path
function webPathToAbs(webPath) {
  // webPath like "/uploads/sunway/ETC1023.pdf"
  const clean = String(webPath || "").replace(/^\/+/, "");
  // routes/ -> backend/ so go up one level
  return path.join(__dirname, "..", clean);
}

/* =========================================================
   0) GET /api/applications/:id/review
   IMPORTANT: NO pdf parsing here.
   The review page should consume:
   - applicant docs (URLs)
   - sunway courses (URLs)
   - latest ai_analysis row (reasoning JSON)
   ========================================================= */
router.get("/:id/review", async (req, res) => {
  try {
    const appId = Number(req.params.id);
    if (!Number.isFinite(appId)) return res.status(400).json({ error: "Invalid application id" });

    // 1) application
    const appR = await pool.query("SELECT * FROM applications WHERE id=$1", [appId]);
    const application = appR.rows[0];
    if (!application) return res.status(404).json({ error: "Application not found" });

    // 2) applicant documents (+ URL for react-pdf)
    const docsR = await pool.query(
      "SELECT * FROM documents WHERE application_id=$1 ORDER BY uploaded_at ASC",
      [appId]
    );

    const applicant_documents = docsR.rows.map((d) => {
      // Your DB stores absolute Windows path like C:\...\backend\uploads\123_file.pdf
      const filename = String(d.file_path || "").split(/[/\\]/).pop();
      return {
        ...d,
        // direct static URL (because you have app.use("/uploads", express.static(...)))
        file_url: filename ? `http://localhost:5000/uploads/${filename}` : null,
      };
    });

    // 3) Sunway courses (fixed backend library)
    const codes = parseCodes(application.requested_subject_code);
    const sunwayR = await pool.query(
      "SELECT * FROM sunway_courses WHERE subject_code = ANY($1::text[]) ORDER BY subject_code",
      [codes]
    );

    const sunway_courses = sunwayR.rows.map((c) => ({
      ...c,
      syllabus_url: c.syllabus_pdf_path ? `http://localhost:5000${c.syllabus_pdf_path}` : null,
    }));

    // 4) Latest AI analysis row (if exists)
    const aiR = await pool.query(
      `SELECT *
       FROM ai_analysis
       WHERE application_id = $1
       ORDER BY analyzed_at DESC
       LIMIT 1`,
      [appId]
    );
    const ai_analysis = aiR.rows[0] || null;

    // 5) Return review payload
    return res.json({
      application,
      applicant_documents,
      sunway_courses,
      ai_analysis,
    });
  } catch (err) {
    console.error("GET /applications/:id/review error:", err);
    return res.status(500).json({ error: "Failed to build review payload", details: err.message });
  }
});

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
   ========================================================= */
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

    // Optional: you referenced this table; keep as-is if it exists
    let subjects = [];
    try {
      const subjectsResult = await pool.query(
        `SELECT subject_code, subject_name
         FROM application_requested_subjects
         WHERE application_id = $1
         ORDER BY id ASC`,
        [appId]
      );
      subjects = subjectsResult.rows;
    } catch {
      // ignore if table not present
      subjects = [];
    }

    const app = appResult.rows[0];
    app.requested_subjects = subjects;

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
      requested_subject_code,
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

    const academic_session = intake && semester ? `${String(intake).replace("-", "")} | ${semester}` : null;

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
        requested_subject_code || null,
      ]
    );

    // If a doc uploaded in create call: save into documents + auto-run AI
    try {
      if (document_path) {
        await pool.query(
          `INSERT INTO documents (application_id, file_name, file_type, file_path)
           VALUES ($1, $2, $3, $4)`,
          [result.rows[0].id, req.file.originalname, req.file.mimetype, document_path]
        );
        await runAndPersistAi(result.rows[0].id);
      }
    } catch (aiErr) {
      console.error("Auto AI run after create failed:", aiErr);
    }

    res.status(201).json({ message: "Application created", application: result.rows[0] });
  } catch (err) {
    console.error("POST /applications error:", err);
    res.status(500).json({ error: "Failed to create application", details: err.message });
  }
});

/* =========================================================
   8) POST /api/applications/:id/documents (upload multiple)
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

    let analysis = null;
    try {
      analysis = await runAndPersistAi(appId);
    } catch (aiErr) {
      console.error("Auto AI run after doc upload failed:", aiErr);
    }

    res.status(201).json({
      message: "Documents uploaded",
      application_id: appId,
      documents: inserted,
      ai_generated: !!analysis,
      analysis,
    });
  } catch (err) {
    console.error("POST /applications/:id/documents error:", err);
    res.status(500).json({ error: "Failed to upload documents", details: err.message });
  }
});

/* =========================================================
   Assign an SL to an application (PL action)
   ========================================================= */
router.patch("/:id/assign", async (req, res) => {
  try {
    const appId = Number(req.params.id);
    const { sl_user_id } = req.body || {};
    if (!sl_user_id) return res.status(400).json({ error: "sl_user_id is required" });

    if (!Number.isFinite(appId)) return res.status(400).json({ error: "Invalid application id" });
    if (!Number.isFinite(Number(sl_user_id))) return res.status(400).json({ error: "Invalid sl_user_id" });

    const sl = await pool.query(`SELECT id, name, email FROM users WHERE id = $1 AND role = 'SL'`, [sl_user_id]);
    if (sl.rows.length === 0) return res.status(404).json({ error: "Subject Lecturer not found" });

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
      registry_status,
      final_similarity,
      final_grade,
      final_credit_hours,
      final_equivalent_grade,
      override_reason,
      overridden_by,
    } = req.body || {};

    const sets = [];
    const vals = [];

    const add = (field, value) => {
      vals.push(value);
      sets.push(`${field} = $${vals.length}`);
    };

    if (final_decision !== undefined) add("final_decision", final_decision);
    if (ai_score !== undefined) add("ai_score", ai_score);
    if (ai_decision !== undefined) add("ai_decision", ai_decision);
    if (remarks !== undefined) add("remarks", remarks);

    if (pl_status !== undefined) add("pl_status", pl_status);
    if (sl_status !== undefined) add("sl_status", sl_status);
    if (registry_status !== undefined) add("registry_status", registry_status);

    // override fields
    if (final_similarity !== undefined) add("final_similarity", final_similarity);
    if (final_grade !== undefined) add("final_grade", final_grade);
    if (final_credit_hours !== undefined) add("final_credit_hours", final_credit_hours);
    if (final_equivalent_grade !== undefined) add("final_equivalent_grade", final_equivalent_grade);
    if (override_reason !== undefined) add("override_reason", override_reason);

    if (overridden_by !== undefined) {
      add("overridden_by", overridden_by);
      add("overridden_at", new Date());
    }

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

// POST /api/applications/:id/override
// Supports two flows:
// 1) accept_ai: true  => mark reviewed using latest ai_analysis (reason NOT required)
// 2) accept_ai: false => manual override values (reason REQUIRED)
router.post("/:id/override", async (req, res) => {
  const client = await pool.connect();
  try {
    const appId = Number(req.params.id);

    const {
      accept_ai,                 // true/false
      final_similarity,          // 0.82 (NOT 82)
      final_grade,               // "A-"
      final_credit_hours,        // 3
      final_equivalent_grade,    // optional
      override_reason,           // required only when manual override
      final_decision,            // "Approve" / "Reject" (optional when accept_ai=true)
      sunway_subject_code        // optional (for logging)
    } = req.body;

    // TODO later: replace with req.user.id from auth middleware
    const overriddenBy = req.body.overridden_by ?? null;

    await client.query("BEGIN");

    // 0) fetch old values (for version_history)
    const oldR = await client.query(
      `SELECT final_similarity, final_grade, final_credit_hours, final_equivalent_grade, final_decision
       FROM applications WHERE id = $1`,
      [appId]
    );

    if (oldR.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Application not found" });
    }

    const old = oldR.rows[0];

    // 1) decide effective values (either accept_ai or manual override)
    let effSimilarity = final_similarity ?? null;
    let effGrade = final_grade ?? null;
    let effCreditHours = final_credit_hours ?? null;
    let effEqGrade = final_equivalent_grade ?? null;
    let effDecision = final_decision ?? null;
    let effReason = override_reason ?? null;

    if (accept_ai === true) {
      // Pull latest AI analysis to “lock in” the review
      const aiR = await client.query(
        `SELECT similarity, grade_detected, credit_hours, decision
         FROM ai_analysis
         WHERE application_id = $1
         ORDER BY analyzed_at DESC
         LIMIT 1`,
        [appId]
      );

      if (aiR.rowCount === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "No AI analysis found to accept" });
      }

      const ai = aiR.rows[0];
      effSimilarity = ai.similarity ?? null;
      effGrade = ai.grade_detected ?? null;
      effCreditHours = ai.credit_hours ?? null;
      effDecision = ai.decision ?? null;

      // reason optional when accepting AI
      effReason = (override_reason && String(override_reason).trim())
        ? String(override_reason).trim()
        : "Accepted AI suggestion (marked as reviewed)";
    } else {
      // manual override => reason required
      if (!override_reason || !String(override_reason).trim()) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "override_reason is required for manual override" });
      }
      effReason = String(override_reason).trim();
    }

    // 2) update applications (also mark SL reviewed if you want)
    const slStatus = toSlStatus(effDecision);

    const upd = await client.query(
      `UPDATE applications
      SET final_similarity = $1,
          final_grade = $2,
          final_credit_hours = $3,
          final_equivalent_grade = $4,
          final_decision = $5,
          override_reason = $6,
          overridden_by = $7,
          overridden_at = NOW(),
          sl_status = $8,
          pl_status = CASE
            WHEN pl_status = 'Assigned' THEN 'To Be Review'
            ELSE pl_status
          END
      WHERE id = $9
      RETURNING *`,
      [
        effSimilarity,
        effGrade,
        effCreditHours,
        effEqGrade,
        effDecision,
        effReason,
        overriddenBy,
        slStatus,
        appId
      ]
    );


    const updated = upd.rows[0];

    // 3) version history (log only changed fields)
    const changes = [
      ["final_similarity", old.final_similarity, updated.final_similarity],
      ["final_grade", old.final_grade, updated.final_grade],
      ["final_credit_hours", old.final_credit_hours, updated.final_credit_hours],
      ["final_equivalent_grade", old.final_equivalent_grade, updated.final_equivalent_grade],
      ["final_decision", old.final_decision, updated.final_decision],
    ].filter(([_, a, b]) => String(a ?? "") !== String(b ?? ""));

    for (const [field, oldValue, newValue] of changes) {
      await client.query(
        `INSERT INTO version_history (application_id, user_id, field_changed, old_value, new_value)
         VALUES ($1, $2, $3, $4, $5)`,
        [appId, overriddenBy, field, oldValue ?? null, newValue ?? null]
      );
    }

    await client.query("COMMIT");

    return res.json({
      ok: true,
      mode: accept_ai === true ? "accept_ai" : "manual_override",
      application: updated,
      logged_changes: changes.map(([field]) => field),
      sunway_subject_code: sunway_subject_code ?? null
    });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    return res.status(500).json({ error: "Failed to save override" });
  } finally {
    client.release();
  }
});



/**
 * GET /api/applications/:id/similarity-evidence?docId=12&sunwayCode=ETC1023
 * Returns top matching text chunks as "evidence" (no PDF highlighting needed yet).
 */
router.get("/:id/similarity-evidence", async (req, res) => {
  try {
    const appId = Number(req.params.id);
    const docId = Number(req.query.docId);
    const sunwayCode = String(req.query.sunwayCode || "").trim();

    if (!Number.isFinite(appId)) return res.status(400).json({ error: "Invalid application id" });
    if (!Number.isFinite(docId)) return res.status(400).json({ error: "Invalid docId" });
    if (!sunwayCode) return res.status(400).json({ error: "Missing sunwayCode" });

    // 1) get applicant doc path
    const docR = await pool.query(
      "SELECT * FROM documents WHERE id=$1 AND application_id=$2",
      [docId, appId]
    );
    const doc = docR.rows[0];
    if (!doc) return res.status(404).json({ error: "Applicant document not found" });

    // 2) get sunway syllabus path
    const swR = await pool.query(
      "SELECT * FROM sunway_courses WHERE subject_code=$1",
      [sunwayCode]
    );
    const sw = swR.rows[0];
    if (!sw) return res.status(404).json({ error: "Sunway course not found" });
    if (!sw.syllabus_pdf_path) return res.status(400).json({ error: "Sunway syllabus_pdf_path missing" });

    // doc.file_path = absolute windows path
    const applicantPath = doc.file_path;

    // sw.syllabus_pdf_path = "/uploads/sunway/ETC1023.pdf"
    const swFilename = String(sw.syllabus_pdf_path).split("/").pop();
    const sunwayPath = path.join(process.cwd(), "backend", "uploads", "sunway", swFilename);

    // 3) extract text
    const [appText, sunText] = await Promise.all([
      extractPdfText(applicantPath),
      extractPdfText(sunwayPath),
    ]);

    // 4) build evidence
    const evidence = buildSimilarityEvidence(appText, sunText, 10);

    return res.json({
      applicant_doc: { id: doc.id, file_name: doc.file_name },
      sunway_course: { subject_code: sw.subject_code, subject_name: sw.subject_name },
      evidence
    });
  } catch (err) {
    console.error("GET /applications/:id/similarity-evidence error:", err);
    return res.status(500).json({ error: "Failed to generate similarity evidence", details: err.message });
  }
});

export default router;
