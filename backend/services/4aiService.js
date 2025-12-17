// backend/services/aiService.js
import fs from "fs/promises";
import path from "path";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

// -----------------------------
// 1) PDF text extraction (stable)
// -----------------------------
export async function extractPdfText(filePath) {
  const data = await fs.readFile(filePath);
  const uint8 = new Uint8Array(data); // ✅ pdfjs requires Uint8Array
  const loadingTask = pdfjsLib.getDocument({ data: uint8 });
  const pdf = await loadingTask.promise;

  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((it) => it.str);
    fullText += strings.join(" ") + "\n";
  }
  return fullText;
}

// -----------------------------
// 2) Basic TF cosine similarity evidence (your existing approach, but stable)
// -----------------------------
function tokenize(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function tf(tokens) {
  const m = new Map();
  for (const t of tokens) m.set(t, (m.get(t) || 0) + 1);
  return m;
}

function cosine(tfA, tfB) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (const [, v] of tfA) normA += v * v;
  for (const [, v] of tfB) normB += v * v;

  const small = tfA.size < tfB.size ? tfA : tfB;
  const large = tfA.size < tfB.size ? tfB : tfA;

  for (const [k, v] of small) {
    const w = large.get(k);
    if (w) dot += v * w;
  }

  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function chunkText(text, chunkSize = 900, overlap = 150) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const out = [];
  let i = 0;
  while (i < clean.length) {
    out.push(clean.slice(i, i + chunkSize));
    i += chunkSize - overlap;
  }
  return out;
}

export function buildSimilarityEvidence(applicantText, sunwayText) {
  // sections are optional; keep simple first
  const aChunks = chunkText(applicantText);
  const sChunks = chunkText(sunwayText);

  const pairs = [];

  for (const a of aChunks) {
    const tfA = tf(tokenize(a));
    let best = { score: 0, s: "" };

    for (const s of sChunks) {
      const score = cosine(tfA, tf(tokenize(s)));
      if (score > best.score) best = { score, s };
    }

    // keep only meaningful matches
    if (best.score >= 0.20) {
      pairs.push({
        score: best.score,
        applicant_excerpt: a,
        sunway_excerpt: best.s,
        section: "Overall",
      });
    }
  }

  pairs.sort((x, y) => y.score - x.score);

  const top_pairs = pairs.slice(0, 6);
  const avg = top_pairs.length
    ? top_pairs.reduce((sum, p) => sum + p.score, 0) / top_pairs.length
    : 0;

  return {
    top_pairs,
    section_scores: [
      { section: "Overall", avg_score: avg, matches: top_pairs.length },
    ],
  };
}

// -----------------------------
// 3) LLM JSON extraction (Gemini free-tier)
// -----------------------------
// You can use this specifically for transcript grade + credit hour extraction.
// It’s WAY more robust than regex across universities.
export async function extractTranscriptJSONWithGemini({ geminiApiKey, transcriptText, targetCourseHint }) {
  if (!geminiApiKey) throw new Error("Missing GEMINI_API_KEY");

  // Lazy import so backend doesn't crash if not installed yet
  const { GoogleGenerativeAI } = await import("@google/generative-ai");

  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
You are extracting data from a student's academic transcript text.

Return STRICT JSON only, no markdown.

Task:
1) Identify the course entry that best matches this hint: ${JSON.stringify(targetCourseHint || "")}
2) Output:
{
  "matched_course_name": string|null,
  "matched_course_code": string|null,
  "grade": string|null,
  "credit_hours": number|null,
  "confidence": number (0 to 1),
  "evidence_snippet": string|null
}

Transcript text:
${transcriptText}
`.trim();

  const resp = await model.generateContent(prompt);
  const raw = resp.response.text().trim();

  // parse JSON safely
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("LLM did not return JSON");
  return JSON.parse(raw.slice(start, end + 1));
}
