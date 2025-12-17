// backend/services/aiService.js
import fs from "fs/promises";
import path from "path";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

// -------------------------
// PDF -> TEXT (Node-safe)
// -------------------------
export async function extractPdfText(filePath) {
  const buf = await fs.readFile(filePath);

  // IMPORTANT: pdfjs wants Uint8Array, not Buffer
  const data = new Uint8Array(buf);

  const loadingTask = pdfjs.getDocument({
    data,
    disableWorker: true, // ✅ Node: avoid workerSrc issues
  });

  const pdf = await loadingTask.promise;

  let fullText = "";

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    const pageText = content.items
      .map((it) => (it?.str ? String(it.str) : ""))
      .join(" ");

    fullText += pageText + "\n";
  }

  return fullText;
}

/* =========================================================
   Similarity Evidence Engine (chunk cosine)
   ========================================================= */

const STOP = new Set([
  "the","a","an","and","or","to","of","in","on","for","with","is","are","was","were",
  "this","that","these","those","as","at","by","from","be","been","it","its","will",
  "can","may","should","must","not","no","yes","your","you","we","our","their","they",
  "course","module","students","student"
]);

function normalizeTokens(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length >= 3 && !STOP.has(t));
}

function tfVector(tokens) {
  const m = new Map();
  for (const t of tokens) m.set(t, (m.get(t) || 0) + 1);
  return m;
}

function cosineSim(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (const v of a.values()) na += v * v;
  for (const v of b.values()) nb += v * v;
  na = Math.sqrt(na); nb = Math.sqrt(nb);
  if (!na || !nb) return 0;

  const [small, big] = a.size <= b.size ? [a, b] : [b, a];
  for (const [k, v] of small.entries()) {
    const bv = big.get(k);
    if (bv) dot += v * bv;
  }
  return dot / (na * nb);
}

function chunkText(text, maxChars = 450) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length >= 20);

  const chunks = [];
  let buf = "";

  for (const line of lines) {
    if ((buf + " " + line).length > maxChars) {
      if (buf.trim().length) chunks.push(buf.trim());
      buf = line;
    } else {
      buf = buf ? (buf + " " + line) : line;
    }
  }
  if (buf.trim().length) chunks.push(buf.trim());

  return chunks.slice(0, 160);
}

function guessSection(chunk) {
  const c = String(chunk || "").toLowerCase();
  if (c.includes("course outcome") || c.includes("learning outcome") || c.match(/\bco\d+\b/)) return "Learning Outcomes";
  if (c.includes("assessment") || c.includes("weightage")) return "Assessment";
  if (c.includes("synopsis") || c.includes("description")) return "Synopsis";
  if (c.includes("prerequisite")) return "Prerequisites";
  if (c.includes("credit hour") || c.includes("slt")) return "Credit Hours";
  return "Other";
}

/**
 * Build top matching excerpt pairs and section summaries
 */
export function buildSimilarityEvidence(appText, sunwayText, topK = 10) {
  const appChunks = chunkText(appText);
  const sunChunks = chunkText(sunwayText);
  const sunVecs = sunChunks.map((t) => tfVector(normalizeTokens(t)));

  const pairs = [];

  for (const aChunk of appChunks) {
    const aVec = tfVector(normalizeTokens(aChunk));

    let bestJ = -1;
    let bestS = 0;

    for (let j = 0; j < sunChunks.length; j++) {
      const s = cosineSim(aVec, sunVecs[j]);
      if (s > bestS) {
        bestS = s;
        bestJ = j;
      }
    }

    // threshold to avoid pure-noise matches
    if (bestJ >= 0 && bestS > 0.18) {
      pairs.push({
        score: Number(bestS.toFixed(3)),          // 0.000–1.000
        applicant_excerpt: aChunk,
        sunway_excerpt: sunChunks[bestJ],
        section: guessSection(sunChunks[bestJ]),
      });
    }
  }

  pairs.sort((x, y) => y.score - x.score);

  // section summary (top 40 pairs)
  const sectionAgg = {};
  for (const p of pairs.slice(0, Math.min(40, pairs.length))) {
    sectionAgg[p.section] = sectionAgg[p.section] || { sum: 0, n: 0 };
    sectionAgg[p.section].sum += p.score;
    sectionAgg[p.section].n += 1;
  }

  const section_scores = Object.entries(sectionAgg)
    .map(([section, v]) => ({
      section,
      avg_score: Number((v.sum / v.n).toFixed(3)),
      matches: v.n
    }))
    .sort((a, b) => b.avg_score - a.avg_score);

  return { top_pairs: pairs.slice(0, topK), section_scores };
}

/* =========================================================
   Evidence-based similarity score (ONE truth)
   ========================================================= */

/**
 * Convert evidence pairs into a single similarity (0–1).
 * We use average of top N pair scores, then clamp.
 */
function evidenceToSimilarity(evidence, topN = 10) {
  const pairs = evidence?.top_pairs || [];
  if (!pairs.length) return 0;

  const take = pairs.slice(0, Math.min(topN, pairs.length));
  const avg = take.reduce((sum, p) => sum + (Number(p.score) || 0), 0) / take.length;

  // avg is already 0..1 in cosine world, so keep as-is, clamp to [0,1]
  return Math.max(0, Math.min(1, Number(avg.toFixed(3))));
}

/* =========================================================
   Grade & credit hours (temporary, non-LLM)
   ========================================================= */

// Very basic grade detection (you said you may later switch to LLM JSON normalization)
function detectGradeFromText(text) {
  const t = String(text || "");
  // tries to find grade patterns like "Grade: A-" or isolated grades
  const m =
    t.match(/\bgrade\s*[:\-]?\s*(A\+|A\-|A|B\+|B\-|B|C\+|C\-|C|D\+|D\-|D|F)\b/i) ||
    t.match(/\b(A\+|A\-|A|B\+|B\-|B|C\+|C\-|C|D\+|D\-|D|F)\b/);

  return m ? String(m[1]).toUpperCase() : null;
}

function detectCreditHoursFromText(text) {
  const t = String(text || "");
  // tries "Credit Hour(s) 3" / "Credit Value: 4" / "SLT Credit Hours 3"
  const m =
    t.match(/\bcredit\s*(hours?|hour)\s*[:\-]?\s*(\d{1,2})\b/i) ||
    t.match(/\bcredit\s*value\s*[:\-]?\s*(\d{1,2})\b/i) ||
    t.match(/\bslt\s*credit\s*hours?\s*[:\-]?\s*(\d{1,2})\b/i);

  const num = m ? Number(m[m.length - 1]) : NaN;
  return Number.isFinite(num) ? num : null;
}

/* =========================================================
   MAIN: runAiAnalysis (now evidence-based)
   ========================================================= */

/**
 * application: row from applications table
 * documents: rows from documents table for this application
 * options.sunwayCourses: array of sunway courses rows (must include syllabus_pdf_path, subject_code, credit_hours)
 *
 * IMPORTANT:
 * - Similarity is now derived from evidence (same logic as evidence API).
 * - We choose best applicant doc per sunway course (prevents wrong pairing).
 */
export async function runAiAnalysis(application, documents, options = {}) {
  const sunwayCourses = options.sunwayCourses || [];

  // Extract text for all applicant docs once
  const applicantDocsText = [];
  for (const d of (documents || [])) {
    if (!d?.file_path) continue;
    const text = await extractPdfText(d.file_path);
    applicantDocsText.push({
      id: d.id,
      file_name: d.file_name,
      file_path: d.file_path,
      text
    });
  }

  // For each sunway course: extract sunway text and find best applicant doc match
  const perCourse = [];

  for (const sw of sunwayCourses) {
    if (!sw?.syllabus_pdf_path) continue;

    // sw.syllabus_pdf_path like "/uploads/sunway/ETC1023.pdf"
    const swFilename = String(sw.syllabus_pdf_path).split("/").pop();
    const sunwayPath = path.join(process.cwd(), "backend", "uploads", "sunway", swFilename);

    const sunwayText = await extractPdfText(sunwayPath);

    let best = null;

    for (const ad of applicantDocsText) {
      const evidence = buildSimilarityEvidence(ad.text, sunwayText, 10);
      const sim = evidenceToSimilarity(evidence, 10);

      if (!best || sim > best.similarity) {
        best = {
          applicant_doc_id: ad.id,
          applicant_file_name: ad.file_name,
          sunway_subject_code: sw.subject_code,
          similarity: sim,
          evidence_preview: evidence, // keep top_pairs + section_scores
          sunway_credit_hours: sw.credit_hours ?? null,
          sunway_subject_name: sw.subject_name ?? null
        };
      }
    }

    if (best) perCourse.push(best);
  }

  // Overall similarity:
  // If multiple sunway requested, take average of the best-per-course similarities.
  // If only one, it's just that one.
  let similarity = 0;
  if (perCourse.length) {
    similarity =
      perCourse.reduce((sum, x) => sum + (Number(x.similarity) || 0), 0) / perCourse.length;
    similarity = Math.max(0, Math.min(1, Number(similarity.toFixed(3))));
  }

  // Grade / credit hours detection (temporary):
  // we try detect from the applicant doc that best matched the first sunway course
  let gradeDetected = null;
  let creditHours = null;

  if (perCourse.length) {
    const bestDocId = perCourse[0].applicant_doc_id;
    const bestDoc = applicantDocsText.find(x => x.id === bestDocId);
    if (bestDoc) {
      gradeDetected = detectGradeFromText(bestDoc.text);
      creditHours = detectCreditHoursFromText(bestDoc.text);
    }
  }

  // Decision logic (same thresholds you used before)
  const decision = similarity >= 0.8 ? "Approve" : "Reject";

  return {
    similarity, // 0..1
    decision,
    gradeDetected: gradeDetected ?? application.grade_detected ?? null,
    creditHours: creditHours ?? null,
    markDetected: application.mark_detected ?? null,

    reasoning: {
      method: "evidence_chunk_cosine",
      summary: "Similarity is computed from top matching text chunks between applicant documents and Sunway syllabus.",
      per_course: perCourse.map(x => ({
        sunway_subject_code: x.sunway_subject_code,
        sunway_subject_name: x.sunway_subject_name,
        sunway_credit_hours: x.sunway_credit_hours,
        best_applicant_doc_id: x.applicant_doc_id,
        best_applicant_file_name: x.applicant_file_name,
        similarity: x.similarity,
        section_scores: x.evidence_preview?.section_scores || []
      })),
      docs_used: (documents || []).map(d => ({ id: d.id, file_name: d.file_name })),
      checks: {
        similarity: { pass: similarity >= 0.8, detected: similarity, required: ">= 0.80" },
        grade: { pass: true, detected: gradeDetected ?? "-", required: ">= C (later)" },
        credit_hours: { pass: true, detected: creditHours ?? "-", required: ">= Sunway (later)" }
      }
    }
  };
}
