// backend/services/aiService.js
import fs from "fs";
import { createRequire } from "module";

// =====================
// TF-IDF + Cosine Utils
// =====================

function tokenizeTfidf(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter(w => w.length >= 3);
}

function tfidfVector(tokensA, tokensB) {
  const vocab = new Map();
  const add = (t) => { if (!vocab.has(t)) vocab.set(t, vocab.size); };

  tokensA.forEach(add);
  tokensB.forEach(add);

  const N = 2;
  const df = new Array(vocab.size).fill(0);

  const seenA = new Set(tokensA);
  const seenB = new Set(tokensB);

  for (const t of seenA) df[vocab.get(t)]++;
  for (const t of seenB) df[vocab.get(t)]++;

  const idf = df.map(d => Math.log((N + 1) / (d + 1)) + 1);

  const vecA = new Array(vocab.size).fill(0);
  const vecB = new Array(vocab.size).fill(0);

  const tfA = new Map();
  const tfB = new Map();

  tokensA.forEach(t => tfA.set(t, (tfA.get(t) || 0) + 1));
  tokensB.forEach(t => tfB.set(t, (tfB.get(t) || 0) + 1));

  const lenA = tokensA.length || 1;
  const lenB = tokensB.length || 1;

  for (const [t, c] of tfA.entries()) {
    const i = vocab.get(t);
    vecA[i] = (c / lenA) * idf[i];
  }
  for (const [t, c] of tfB.entries()) {
    const i = vocab.get(t);
    vecB[i] = (c / lenB) * idf[i];
  }

  return { vecA, vecB };
}

function cosine(vecA, vecB) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    na += vecA[i] * vecA[i];
    nb += vecB[i] * vecB[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function splitIntoChunks(text) {
  const t = String(text || "").trim();
  if (!t) return [];

  // Simple, explainable heuristic: paragraph-level chunks
  return t
    .split(/\n\s*\n+/)
    .map(s => s.trim())
    .filter(Boolean);
}

function similarityWithBreakdown(textA, textB) {
  const chunksA = splitIntoChunks(textA);
  const chunksB = splitIntoChunks(textB);

  // fallback: whole-doc similarity
  if (chunksA.length === 0 || chunksB.length === 0) {
    const tokensA = tokenizeTfidf(textA);
    const tokensB = tokenizeTfidf(textB);
    const { vecA, vecB } = tfidfVector(tokensA, tokensB);
    const overall = cosine(vecA, vecB);
    return { overall, breakdown: [] };
  }

  let weightedSum = 0;
  let weightTotal = 0;
  const breakdown = [];

  for (let i = 0; i < chunksA.length; i++) {
    const tokensA = tokenizeTfidf(chunksA[i]);

    let best = 0;
    let bestJ = -1;

    for (let j = 0; j < chunksB.length; j++) {
      const tokensB = tokenizeTfidf(chunksB[j]);
      const { vecA, vecB } = tfidfVector(tokensA, tokensB);
      const s = cosine(vecA, vecB);
      if (s > best) {
        best = s;
        bestJ = j;
      }
    }

    const weight = Math.max(tokensA.length, 1);
    weightedSum += weight * best;
    weightTotal += weight;

    breakdown.push({
      applicant_chunk: i,
      matched_sunway_chunk: bestJ,
      similarity: best,
      weight
    });
  }

  const overall = weightTotal ? weightedSum / weightTotal : 0;
  return { overall, breakdown };
}

function joinTexts(docs) {
  return docs.map(d => d._text || "").join("\n\n");
}

function matchApplicantToSunway(sunwayText, applicantDocs) {
  let bestSingle = { score: 0, docId: null, breakdown: [] };

  for (const d of applicantDocs) {
    const r = similarityWithBreakdown(sunwayText, d._text || "");
    if (r.overall > bestSingle.score) {
      bestSingle = {
        score: r.overall,
        docId: d.id,
        breakdown: r.breakdown
      };
    }
  }

  const combinedText = joinTexts(applicantDocs);
  const combinedRes = similarityWithBreakdown(sunwayText, combinedText);

  return {
    best_single: bestSingle,
    combined: {
      score: combinedRes.overall,
      breakdown: combinedRes.breakdown
    }
  };
}


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

export { matchApplicantToSunway, similarityWithBreakdown };

