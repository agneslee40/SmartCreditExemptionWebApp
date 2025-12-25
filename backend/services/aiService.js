// backend/services/aiService.js
import fs from "fs/promises";
import path from "path";
import axios from "axios";


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

const GRADE_RANK = {
  "A+": 13, "A": 12, "A-": 11,
  "B+": 10, "B": 9, "B-": 8,
  "C+": 7, "C": 6, "C-": 5,
  "D+": 4, "D": 3, "D-": 2,
  "F": 1
};

function gradeAtLeastC(g) {
  const key = String(g || "").toUpperCase().trim();
  return (GRADE_RANK[key] ?? 0) >= GRADE_RANK["C"];
}


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

export function similarityFromEvidence(evidence) {
  if (!evidence?.section_scores?.length) return 0;

  // Option 1 (simple): take best section score
  const best = Math.max(...evidence.section_scores.map(s => Number(s.avg_score || 0)));

  // clamp 0..1
  return Math.max(0, Math.min(1, best));
}

async function geminiSimilarityScore({ applicantText, sunwayText }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Missing GEMINI_API_KEY");

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  // keep prompts short-ish to reduce cost/latency
  const a = applicantText.slice(0, 12000);
  const s = sunwayText.slice(0, 12000);

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const prompt = `
You are evaluating course-to-course similarity for credit exemption/transfer.

Return STRICT JSON ONLY:
{
  "similarity": <number between 0 and 1>
}

Rules:
- similarity is semantic similarity between course content (topics + outcomes), not formatting.
- ignore headers/footers/tables of administrative info.
- output JSON only.

APPLICANT COURSE TEXT:
${a}

SUNWAY COURSE TEXT:
${s}
`.trim();

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1 }
    }),
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Gemini HTTP ${resp.status}: ${t}`);
  }

  const data = await resp.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

  // parse JSON safely
  let obj;
  try {
    obj = JSON.parse(text);
  } catch {
    // sometimes model wraps JSON; try extracting first {...}
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("Gemini returned non-JSON");
    obj = JSON.parse(m[0]);
  }

  const sim = Number(obj?.similarity);
  if (!Number.isFinite(sim)) throw new Error("Gemini similarity is not a number");
  return Math.max(0, Math.min(1, sim));
}

export async function hybridSimilarity({ applicantText, sunwayText }) {
  const aLen = (applicantText || "").length;
  const sLen = (sunwayText || "").length;

  // If either side is too short, TF cosine becomes nonsense → fallback to Gemini
  const POOR_TEXT = aLen < 1000 || sLen < 1000;

  if (!POOR_TEXT) {
    const tf = tfCosineSimilarity(applicantText, sunwayText);
    return { score: tf, method: "tf_cosine" };
  }

  const gem = await geminiSimilarityScore({ applicantText, sunwayText });
  return { score: gem, method: "gemini_fallback" };
}



/* =========================================================
   Keep your existing runAiAnalysis stub (unchanged)
   ========================================================= */
export async function runAiAnalysis(application, documents, sunwayCourses = []) {
  // 1) Decide transcript path (MOST IMPORTANT)
  // Your applications.document_path is the transcript path in your table.
  const transcriptPath = application.document_path;
  const reasoning = {};
  const similarity = 0;
  // 2) Decide which applicant course to extract
  const targetCourseName = application.prev_subject_name || "";

  let applicantGrade = null;
  let applicantCreditHours = null;

  if (transcriptPath && targetCourseName) {
    const transcriptText = await extractPdfText(transcriptPath);

    const applicantExtract = await extractApplicantCourseResultWithAI({
          transcriptText,
      targetCourseName,
    });

    applicantGrade = applicantExtract?.grade ?? null;
    applicantCreditHours = applicantExtract?.credit_hours ?? null;
  }

  // 3) Sunway credit hours (prefer DB; fallback to AI if missing)
  let sunwayCreditHours = null;

  if (sunwayCourses.length) {
    const nums = sunwayCourses
      .map(c => Number(c.credit_hours))
      .filter(n => Number.isFinite(n));

    // If multiple requested subjects, use the MAX as benchmark
    if (nums.length) sunwayCreditHours = Math.max(...nums);
  }

  if (sunwayCreditHours == null && sunwayCourses.length) {
    // fallback: AI extract from syllabus PDF text (slower)
    for (const c of sunwayCourses) {
      if (!c?.syllabus_pdf_path) continue;

      // syllabus_pdf_path is like "/uploads/sunway/ETC1023.pdf"
      // convert to absolute path on disk
      const abs = path.join(process.cwd(), "backend", c.syllabus_pdf_path.replace(/^\/+/, ""));
      try {
        const syllabusText = await extractPdfText(abs);
        const swExtract = await extractSunwayCreditHoursWithAI({ syllabusText });
        const n = Number(swExtract?.credit_hours);
        if (Number.isFinite(n)) {
          sunwayCreditHours = Math.max(sunwayCreditHours ?? 0, n);
        }
      } catch {
        // ignore per-course failures
      }
    }
  }

  // 4) Similarity (keep your existing)
  // Extract text for ALL applicant docs (or at least syllabus-like ones)
  // pick a single "best applicant doc" first (simple heuristic)
  // 1) pick applicant content doc for similarity (NOT transcript)
  const nonTranscriptDocs = (documents || []).filter(d =>
    !/transcript|result|academic\s*record/i.test(d.file_name || "")
  );

  // Prefer doc whose file name matches prev_subject_name
  const targetName = String(application?.prev_subject_name || "").toLowerCase();
  let applicantContentDoc =
    nonTranscriptDocs.find(d => (d.file_name || "").toLowerCase().includes(targetName))
    || nonTranscriptDocs[0]
    || documents?.[0];

  const applicantDocPath = applicantContentDoc?.file_path || null;

  const applicantContentText = applicantContentDoc
    ? await extractPdfText(applicantContentDoc.file_path)
    : "";

  // 2) compare against EACH requested sunway syllabus
  const perCourse = [];

  for (const c of (sunwayCourses || [])) {


    const swFilename = String(c.syllabus_pdf_path || "").split("/").pop();
    const sunwaySyllabusPath = swFilename
      ? path.join(process.cwd(), "backend", "uploads", "sunway", swFilename)
      : null;

    if (!transcriptPath || !applicantDocPath || !sunwaySyllabusPath) {
      // fallback to old logic or push 0
    } else {
      const out = await analyzeExemptionWithGeminiFiles({
        transcriptPath,
        applicantDocPath,
        sunwaySyllabusPath,
        prevSubjectName: application.prev_subject_name,
        requestedSubjectName: c.subject_name,
        requestedSubjectCode: c.subject_code,
      });

      perCourse.push({
        sunway: `${c.subject_code} ${c.subject_name}`,
        score: Number(out.similarity) || 0,
        method: "gemini_files",
      });

      // set grade/credit once (first non-null)
      if (applicantGrade == null && out.grade_detected != null) applicantGrade = out.grade_detected;
      if (applicantCreditHours == null && out.credit_hours != null) applicantCreditHours = out.credit_hours;

      // store evidence into reasoning
      reasoning.similarity_evidence_by_course = reasoning.similarity_evidence_by_course || {};
      reasoning.similarity_evidence_by_course[c.subject_code] = out.evidence;

      continue; // skip old text-based similarity for this course
    }


    const sunAbs = path.join(process.cwd(), "backend", "uploads", "sunway", swFilename);
    const sunText = swFilename ? await extractPdfText(sunAbs) : "";

    const { score, method } = await hybridSimilarity({
      applicantText: applicantContentText,
      sunwayText: sunText
    });

    perCourse.push({
      subject_code: c.subject_code,
      subject_name: c.subject_name,
      score,
      method,
      applicant_doc_used: { id: applicantContentDoc?.id, file_name: applicantContentDoc?.file_name }
    });
  }

  // 3) overall similarity (for multi requested subjects)
  // For credit exemption: safest is MIN (all must pass)
  const similarityOverall =
    perCourse.length ? Math.min(...perCourse.map(x => x.score)) : 0;

  // Store details so UI can show “how similarity came”
  reasoning.similarity = {
    overall: similarityOverall,
    per_course: perCourse
  };

// keep your existing checks but use similarityOverall instead of hardcode

  const similarityPass = similarityOverall >= 0.8;
  const gradePass = gradeAtLeastC(applicantGrade);
  const creditHoursPass =
    applicantCreditHours != null &&
    sunwayCreditHours != null &&
    Number(applicantCreditHours) >= Number(sunwayCreditHours);
    
  const decision = (similarityPass && gradePass && creditHoursPass) ? "Approve" : "Reject";

  // 5) Checks (adjust as you like)
  const checks = {
    similarity: {
      pass: similarityPass,
      detected: similarityOverall,
      required: ">= 0.80"
    },
    grade: {
      pass: gradePass,
      detected: applicantGrade,
      required: ">= C (from transcript)"
    },
    credit_hours: {
      pass: creditHoursPass,
      detected: applicantCreditHours,
      required: `>= Sunway (${sunwayCreditHours ?? "?"})`
    },
    sunway_credit_hours: {
      pass: sunwayCreditHours != null,
      detected: sunwayCreditHours,
      required: "From DB (or AI fallback)"
    }
  };


  return {
    similarity: similarityOverall,
    decision,
    gradeDetected: applicantGrade,
    creditHours: applicantCreditHours,
    markDetected: application.mark_detected ?? null,
    reasoning: {
      summary: "Grade & credit hours extracted from transcript using Gemini JSON extraction.",
      checks,
      target_course: targetCourseName,
      transcript_used: transcriptPath,
      requested_sunway: (sunwayCourses || []).map(s => ({
        subject_code: s.subject_code,
        subject_name: s.subject_name,
        credit_hours: s.credit_hours,
      })),
      docs_used: (documents || []).map(d => ({ id: d.id, file_name: d.file_name })),
    }
  };
}

async function pdfPathToInlinePart(absPath) {
  const buf = await fs.readFile(absPath);
  return {
    inlineData: {
      mimeType: "application/pdf",
      data: buf.toString("base64"),
    },
  };
}


// ---- Gemini JSON helper (FREE tier friendly) ----
export async function callGeminiJSON({ prompt, jsonSchema }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY in backend/.env");

  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    },
  };

  // If you want to enforce structure, embed schema into prompt (Gemini JSON mode helps, but still be defensive)
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || "Gemini API error");
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned empty response");

  // Defensive parse
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Gemini did not return valid JSON");
  }

  return parsed;
}

export async function callGeminiJSONWithParts({ parts, model = "gemini-2.5-flash" }) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY in environment variables.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const payload = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    },
  };

  const resp = await axios.post(url, payload, {
    headers: { "Content-Type": "application/json" },
    timeout: 60000,
  });

  const text =
    resp?.data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";

  if (!text) {
    throw new Error("Gemini returned empty response text.");
  }

  // same “strip code fences” defense
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

async function analyzeExemptionWithGeminiFiles({
  transcriptPath,
  applicantDocPath,
  sunwaySyllabusPath,
  prevSubjectName,
  requestedSubjectName,
  requestedSubjectCode,
}) {
  const prompt = `
You are evaluating a university credit exemption request.

You will receive some PDFs that include:
1) Student transcript (contains grades and completed subjects)
2) Student's previous institution course document (syllabus/outline/assessment info)
3) Sunway University subject syllabus (the target course requested by student for credit exemption)

Task:
- Identify the student's grade for the previous completed subject "${prevSubjectName}" from the transcript.
- Identify the credit hours for the previous completed subject (from transcript if possible; otherwise from the previous course PDF).
- Identify the credit hours for the Sunway subject "${requestedSubjectName}" (${requestedSubjectCode}) from the Sunway syllabus PDF.
- Compare the previous completed course content (PDF #2) against the Sunway syllabus (PDF #3) and produce:
  - similarity: a number from 0 to 1
  - evidence aligned to the similarity score: section_scores + top_pairs of excerpts

Return STRICT JSON ONLY in this schema:
{
  "grade_detected": string|null,
  "credit_hours": number|null,
  "similarity": number,
  "decision": "Approve"|"Reject",
  "evidence": {
    "section_scores": [
      {"section": string, "avg_score": number, "matches": number}
    ],
    "matched_pairs": [
      {
        "section": string,
        "score": number,
        "applicant_excerpt": string,
        "sunway_excerpt": string,
        "why_match": string
      }
    ]
  }
}

Rules for evidence:
-Allowed sections ONLY: Learning Outcomes, Assessment, Synopsis, Prerequisites, Topics, Other.
-evidence.section_scores must include ALL 6 sections (use score 0 and matches 0 if no match).
-evidence.section_scores[i].matches MUST equal the number of evidence.matched_pairs where section matches.
-evidence.matched_pairs should include up to 12 total rows (prioritize strongest matches), but must still be consistent with matches counts (so if matches says 2, provide 2 rows for that section).

Decision rule:
- Approve only if similarity >= 0.80 AND grade_detected is >= C AND credit_hours >= detected sunway credit hours.
- Otherwise Reject.
If grade/credit cannot be found, set them null and still compute similarity + evidence.
  `.trim();

  const parts = [
    { text: prompt },
    await pdfPathToInlinePart(transcriptPath),
    await pdfPathToInlinePart(applicantDocPath),
    await pdfPathToInlinePart(sunwaySyllabusPath),
  ];

  return await callGeminiJSONWithParts({ parts });
}


export async function extractApplicantCourseResultWithAI({ transcriptText, targetCourseName }) {
  const trimmed = transcriptText.slice(0, 35000); // keep token cost small

  const prompt = `
  You are extracting structured data from a university transcript.

  Task:
  Find the course in the transcript that best matches the target course name:
  TARGET_COURSE_NAME: "${targetCourseName}"

  Return the student's achieved GRADE and the CREDIT_HOURS (or "Credit", "Credit Value", etc.) for that matched course.

  Rules:
  - You MUST extract grade and credit_hours from the SAME row/entry as the matched course.
  - If the transcript has multiple similar names, choose the one whose course name is the closest match to TARGET_COURSE_NAME.
  - Do NOT guess. If credit hours is not present on the same row/entry, return null.
  - Grade must be exactly as written (e.g., "C", "C+", "A-", "B").

  Transcript text:
  ---
  ${trimmed}
  ---

  Return ONLY JSON in this format:
  {
    "match_found": boolean,
    "matched_course_name": string|null,
    "matched_course_code": string|null,
    "grade": string|null,
    "credit_hours": number|null,
    "confidence": number
  }
  `;

  return callGeminiJSON({ prompt });
}


export async function extractSunwayCreditHoursWithAI({ syllabusText }) {
  const trimmed = syllabusText.slice(0, 25000);

  const prompt = `
You are extracting structured data from a Sunway course syllabus PDF text.

Task:
Extract the course credit hours value.

Look for fields like:
- "Credit Hours"
- "SLT Credit Hours"
- "Credit Hour(s)"
- "Credit"

Return ONLY JSON:
{
  "credit_hours": number|null,
  "confidence": number
}

Syllabus text:
---
${trimmed}
---
`;

  return callGeminiJSON({ prompt });
}
