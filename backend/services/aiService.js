// backend/services/aiService.js
import fs from "fs/promises";
import path from "path";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

// -------------------------
// PDF text extraction
// -------------------------
export async function extractPdfText(filePath) {
  const buf = await fs.readFile(filePath);
  const data = new Uint8Array(buf); // IMPORTANT: pdfjs expects Uint8Array (not Buffer)

  const loadingTask = pdfjsLib.getDocument({
    data,
    disableWorker: true, // IMPORTANT for Node
  });

  const pdf = await loadingTask.promise;

  let fullText = "";
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const strings = content.items.map((it) => it.str);
    fullText += strings.join(" ") + "\n";
  }

  return normalizeText(fullText);
}

function normalizeText(t) {
  return String(t || "")
    .replace(/\s+/g, " ")
    .replace(/–/g, "-")
    .replace(/[“”]/g, '"')
    .trim();
}

// -------------------------
// Similarity helpers (TF cosine)
// -------------------------
function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9+\-/\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => w.length >= 2);
}

function termFreq(tokens) {
  const m = new Map();
  for (const t of tokens) m.set(t, (m.get(t) || 0) + 1);
  return m;
}

function cosineFromTF(tfA, tfB) {
  // dot / (||A|| * ||B||)
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (const [, v] of tfA) normA += v * v;
  for (const [, v] of tfB) normB += v * v;

  // iterate smaller map for dot
  const [small, big] = tfA.size < tfB.size ? [tfA, tfB] : [tfB, tfA];
  for (const [k, v] of small) {
    const vb = big.get(k);
    if (vb) dot += v * vb;
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function splitChunks(text, chunkSize = 900, overlap = 150) {
  const s = String(text || "");
  const chunks = [];
  let i = 0;
  while (i < s.length) {
    const end = Math.min(s.length, i + chunkSize);
    const piece = s.slice(i, end).trim();
    if (piece.length > 60) chunks.push(piece);
    if (end === s.length) break;
    i = end - overlap;
    if (i < 0) i = 0;
  }
  return chunks;
}

function guessSection(chunk) {
  const c = chunk.toLowerCase();
  if (c.includes("learning outcome") || c.includes("course outcome") || c.includes("co1") || c.includes("co2")) {
    return "Learning Outcomes";
  }
  if (c.includes("assessment") || c.includes("weightage") || c.includes("final examination")) {
    return "Assessment";
  }
  if (c.includes("teaching") || c.includes("learning") || c.includes("lecture") || c.includes("tutorial")) {
    return "Teaching & Learning";
  }
  if (c.includes("synopsis") || c.includes("course summary") || c.includes("course name")) {
    return "Course Summary";
  }
  return "Other";
}

// -------------------------
// Evidence builder
// -------------------------
export function buildSimilarityEvidence(applicantText, sunwayText) {
  // 1) overall similarity (full doc)
  const tfA_full = termFreq(tokenize(applicantText));
  const tfB_full = termFreq(tokenize(sunwayText));
  const overall = cosineFromTF(tfA_full, tfB_full); // 0..1

  // 2) chunk-level top matches
  const aChunks = splitChunks(applicantText);
  const bChunks = splitChunks(sunwayText);

  // precompute TF for B chunks to reduce work a bit
  const bTF = bChunks.map((c) => ({
    text: c,
    tf: termFreq(tokenize(c)),
    section: guessSection(c),
  }));

  const pairs = [];

  for (const a of aChunks) {
    const aTF = termFreq(tokenize(a));
    let best = { score: 0, bText: "", section: "Other" };

    for (const b of bTF) {
      const score = cosineFromTF(aTF, b.tf);
      if (score > best.score) {
        best = { score, bText: b.text, section: b.section };
      }
    }

    if (best.score >= 0.18) {
      pairs.push({
        score: Number(best.score.toFixed(3)),
        applicant_excerpt: a,
        sunway_excerpt: best.bText,
        section: best.section,
      });
    }
  }

  // sort and keep top N
  pairs.sort((x, y) => y.score - x.score);
  const top_pairs = pairs.slice(0, 6);

  // 3) section scores (based on top_pairs only)
  const sectionMap = new Map();
  for (const p of top_pairs) {
    const key = p.section || "Other";
    if (!sectionMap.has(key)) sectionMap.set(key, []);
    sectionMap.get(key).push(p.score);
  }

  const section_scores = Array.from(sectionMap.entries()).map(([section, scores]) => {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return {
      section,
      avg_score: Number(avg.toFixed(3)),
      matches: scores.length,
    };
  });

  // IMPORTANT: this is the SAME number you should use for “system suggestion similarity”
  return {
    overall_similarity: Number(overall.toFixed(3)),
    section_scores,
    top_pairs,
  };
}
