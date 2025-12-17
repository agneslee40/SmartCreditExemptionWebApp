// backend/services/aiService.js
import fs from "fs/promises";
import path from "path";

// ✅ Use pdfjs-dist directly (no pdf-parse)
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

// In Node, pdfjs needs a worker disabled
// (legacy build usually works without explicit worker config)


// -------------------------
// PDF -> TEXT (robust)
// -------------------------
export async function extractPdfText(filePath) {
  const buf = await fs.readFile(filePath);
  const data = new Uint8Array(buf);

  const loadingTask = pdfjs.getDocument({
    data,
    disableWorker: true,  // ✅ Node: avoid workerSrc issues
  });
  const pdf = await loadingTask.promise;

  let fullText = "";

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    const pageText = content.items
      .map((it) => (it.str ? String(it.str) : ""))
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
  return chunks.slice(0, 140);
}

function guessSection(chunk) {
  const c = String(chunk || "").toLowerCase();
  if (c.includes("course outcome") || c.includes("learning outcome") || c.match(/\bco\d+\b/)) return "Learning Outcomes";
  if (c.includes("assessment") || c.includes("weightage")) return "Assessment";
  if (c.includes("synopsis") || c.includes("description")) return "Synopsis";
  if (c.includes("prerequisite")) return "Prerequisites";
  return "Other";
}

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

    if (bestJ >= 0 && bestS > 0.18) {
      pairs.push({
        score: Number(bestS.toFixed(3)),
        applicant_excerpt: aChunk,
        sunway_excerpt: sunChunks[bestJ],
        section: guessSection(sunChunks[bestJ]),
      });
    }
  }

  pairs.sort((x, y) => y.score - x.score);

  // section summary
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
   Keep your existing runAiAnalysis stub (unchanged)
   ========================================================= */
export async function runAiAnalysis(application, documents) {
  const similarity = Number(application.ai_score ?? 0.82);
  const decision = application.ai_decision ?? "Approve";
  const gradeDetected = application.grade_detected ?? "A-";
  const creditHours = 3;

  return {
    similarity,
    decision,
    gradeDetected,
    creditHours,
    markDetected: application.mark_detected ?? null,
    reasoning: {
      summary: "Stub reasoning (replace with real extraction later).",
      checks: {
        similarity: { pass: similarity >= 0.8, detected: similarity, required: ">= 0.80" },
        grade: { pass: true, detected: gradeDetected, required: ">= C" },
        credit_hours: { pass: true, detected: creditHours, required: ">= 3" }
      },
      docs_used: (documents || []).map(d => ({ id: d.id, file_name: d.file_name }))
    }
  };
}
