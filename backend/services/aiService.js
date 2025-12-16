// backend/services/aiService.js
import fs from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");


/**
 * REAL (basic) pipeline:
 * - Extract text from uploaded PDFs
 * - Detect grade (A+, A, B+, ...), mark (%), credit hours
 * - Compute a simple similarity score using token Jaccard
 *
 * This is NOT your final NLP model yet, but it's real:
 * it changes per application + per PDF contents, and stores into DB.
 */

const GRADE_ORDER = ["F", "D-", "D", "D+", "C-", "C", "C+", "B-", "B", "B+", "A-", "A", "A+"];

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => w.length >= 3); // drop tiny tokens
}

function jaccardSimilarity(aText, bText) {
  const a = new Set(tokenize(aText));
  const b = new Set(tokenize(bText));
  if (a.size === 0 || b.size === 0) return 0;

  let inter = 0;
  for (const w of a) if (b.has(w)) inter++;

  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

function parseBestGrade(text) {
  const t = String(text || "").toUpperCase();
  const matches = t.match(/\b(A\+|A-|A|B\+|B-|B|C\+|C-|C|D\+|D-|D|F)\b/g);
  if (!matches || matches.length === 0) return null;

  // pick the best grade found
  let best = matches[0];
  for (const g of matches) {
    if (GRADE_ORDER.indexOf(g) > GRADE_ORDER.indexOf(best)) best = g;
  }
  return best;
}

function gradeAtLeastC(grade) {
  if (!grade) return false;
  return GRADE_ORDER.indexOf(String(grade).toUpperCase()) >= GRADE_ORDER.indexOf("C");
}

function parseMarkPercent(text) {
  // e.g. "91%" or "Mark: 91%"
  const m = String(text || "").match(/(\d{1,3})\s*%/);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  return clamp(n, 0, 100);
}

function parseCreditHours(text) {
  // tries common patterns: "Credit Hours: 4", "Credit Hour(s) 3", "Credits: 4"
  const t = String(text || "");
  const patterns = [
    /credit\s*hours?\s*[:\-]?\s*(\d+(\.\d+)?)/i,
    /credits?\s*[:\-]?\s*(\d+(\.\d+)?)/i,
  ];

  for (const re of patterns) {
    const m = t.match(re);
    if (m) {
      const n = Number(m[1]);
      if (Number.isFinite(n)) return n;
    }
  }

  // fallback: find first small number in context of "credit"
  const fallback = t.match(/credit.{0,25}(\d+(\.\d+)?)/i);
  if (fallback) {
    const n = Number(fallback[1]);
    if (Number.isFinite(n)) return n;
  }

  return null;
}

async function extractPdfText(filePath) {
  if (!filePath) return "";
  if (!fs.existsSync(filePath)) return "";
  const buf = fs.readFileSync(filePath);
  const data = await pdfParse(buf);
  return data?.text || "";
}

function pickDocsForSimilarity(docs) {
  // Heuristic:
  // - try to find docs that look like "Sunway syllabus" vs "Applicant syllabus"
  // - if can't, compare all doc pairs and take highest similarity
  const lower = (s) => String(s || "").toLowerCase();

  const sunway = docs.find((d) => lower(d.file_name).includes("sunway") || lower(d.file_name).includes("course syllabus"));
  const applicant = docs.find((d) => lower(d.file_name).includes("applicant") || lower(d.file_name).includes("syllabus"));

  return { sunway, applicant };
}

export async function runAiAnalysis(application, documents = []) {
  // 1) Extract all pdf texts
  const docsWithText = [];
  for (const d of documents) {
    const text = await extractPdfText(d.file_path);
    docsWithText.push({ ...d, _text: text });
  }

  // 2) Similarity
  let similarity = 0;
  let simSource = "documents";

  const { sunway, applicant } = pickDocsForSimilarity(docsWithText);

  if (sunway && applicant) {
    similarity = jaccardSimilarity(sunway._text, applicant._text);
    simSource = `${sunway.file_name} vs ${applicant.file_name}`;
  } else {
    // fallback: best pair similarity across all docs
    for (let i = 0; i < docsWithText.length; i++) {
      for (let j = i + 1; j < docsWithText.length; j++) {
        const s = jaccardSimilarity(docsWithText[i]._text, docsWithText[j]._text);
        if (s > similarity) {
          similarity = s;
          simSource = `${docsWithText[i].file_name} vs ${docsWithText[j].file_name}`;
        }
      }
    }
  }

  similarity = clamp(similarity, 0, 1);

  // 3) Grade + Mark (from any transcript-like doc, else from all docs)
  const transcriptCandidates = docsWithText.filter((d) => String(d.file_name || "").toLowerCase().includes("transcript"));
  const gradeDetected =
    parseBestGrade(transcriptCandidates.map((d) => d._text).join("\n")) ||
    parseBestGrade(docsWithText.map((d) => d._text).join("\n")) ||
    null;

  const markDetected =
    parseMarkPercent(transcriptCandidates.map((d) => d._text).join("\n")) ||
    parseMarkPercent(docsWithText.map((d) => d._text).join("\n")) ||
    null;

  // 4) Credit hours (from any syllabus-like doc, else from all docs)
  const creditCandidates = docsWithText.filter((d) => {
    const n = String(d.file_name || "").toLowerCase();
    return n.includes("syllabus") || n.includes("course") || n.includes("outline") || n.includes("sunway");
  });

  const creditHours =
    parseCreditHours(creditCandidates.map((d) => d._text).join("\n")) ||
    parseCreditHours(docsWithText.map((d) => d._text).join("\n")) ||
    null;

  // 5) Decision rules (same as your prototype logic)
  const decision =
    similarity >= 0.8 &&
    (creditHours ?? 0) >= 3 &&
    gradeAtLeastC(gradeDetected)
      ? "Approve"
      : "Reject";

  // 6) Reasoning payload (store JSONB in ai_analysis.reasoning)
  const reasoning = {
    similarity: {
      value: similarity,
      threshold: 0.8,
      source: simSource,
    },
    grade: {
      value: gradeDetected,
      requirement: "≥ C",
      source: transcriptCandidates.length ? "Transcript (detected)" : "Documents (detected)",
    },
    mark: {
      value: markDetected,
      source: transcriptCandidates.length ? "Transcript (detected)" : "Documents (detected)",
    },
    credit_hours: {
      value: creditHours,
      requirement: "≥ 3",
      source: creditCandidates.length ? "Syllabus/Course docs (detected)" : "Documents (detected)",
    },
  };

  return {
    similarity,
    gradeDetected,
    markDetected,
    creditHours,
    decision,
    reasoning,
  };
}
