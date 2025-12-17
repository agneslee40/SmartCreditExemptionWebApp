// frontend/src/pages/ApplicationReview.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { api } from "../api/client";

// ✅ FIX: use local worker bundled with your installed pdfjs-dist (NO CDN)
// Works in Vite/React
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

function normalizePdfUrl(u) {
  if (!u) return "";
  // if backend returns a filesystem path, you must convert it into an API route
  // but in your project you already serve PDFs via /api/files/...
  // so keep url as-is if it starts with http or /api
  if (u.startsWith("http")) return u;
  if (u.startsWith("/")) return `http://localhost:5000${u}`;
  return u;
}

function PdfPanel({ title, fileUrl }) {
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [scale, setScale] = useState(1.0);
  const [error, setError] = useState("");

  useEffect(() => {
    // reset when file changes
    setPage(1);
    setNumPages(null);
    setError("");
  }, [fileUrl]);

  const canPrev = page > 1;
  const canNext = numPages ? page < numPages : false;

  return (
    <div className="rounded-[24px] bg-white border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="text-lg font-extrabold text-[#050827]">{title}</div>

        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <button
            className={`px-4 py-2 rounded-full border text-sm ${
              canPrev ? "bg-white hover:bg-gray-50" : "bg-gray-100 text-gray-400"
            }`}
            disabled={!canPrev}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>

          <div className="text-sm text-[#050827] font-semibold">
            Page {page} / {numPages || "—"}
          </div>

          <button
            className={`px-4 py-2 rounded-full border text-sm ${
              canNext ? "bg-white hover:bg-gray-50" : "bg-gray-100 text-gray-400"
            }`}
            disabled={!canNext}
            onClick={() => setPage((p) => (numPages ? Math.min(numPages, p + 1) : p))}
          >
            Next
          </button>

          <div className="mx-2 w-px h-6 bg-gray-200" />

          <button
            className="px-3 py-2 rounded-full border text-sm bg-white hover:bg-gray-50"
            onClick={() => setScale((s) => Math.max(0.6, +(s - 0.1).toFixed(2)))}
          >
            −
          </button>

          <div className="w-16 text-center text-sm font-semibold">
            {Math.round(scale * 100)}%
          </div>

          <button
            className="px-3 py-2 rounded-full border text-sm bg-white hover:bg-gray-50"
            onClick={() => setScale((s) => Math.min(2.0, +(s + 0.1).toFixed(2)))}
          >
            +
          </button>
        </div>
      </div>

      <div className="p-4">
        {!fileUrl ? (
          <div className="text-sm text-gray-500">No PDF file specified.</div>
        ) : (
          <>
            {error ? (
              <div className="text-sm text-red-500">{error}</div>
            ) : (
              <div className="w-full overflow-auto">
                <Document
                  file={fileUrl}
                  onLoadSuccess={(info) => setNumPages(info.numPages)}
                  onLoadError={(e) => setError(String(e?.message || e))}
                  loading={<div className="text-sm text-gray-500">Loading PDF…</div>}
                >
                  <Page
                    pageNumber={page}
                    scale={scale}
                    renderTextLayer={false}        // ✅ avoids weird cropping/overlay issues
                    renderAnnotationLayer={false}  // ✅ keeps clean UI
                  />
                </Document>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ApplicationReview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState(null);

  const [selectedDocId, setSelectedDocId] = useState("");
  const [selectedSunwayCode, setSelectedSunwayCode] = useState("");

  const [showOverride, setShowOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");

  const [finalSimilarity, setFinalSimilarity] = useState("");
  const [finalGrade, setFinalGrade] = useState("");
  const [finalCreditHours, setFinalCreditHours] = useState("");

  const [evidenceByKey, setEvidenceByKey] = useState({});
  const [evidenceError, setEvidenceError] = useState("");

  // ---------- Load review data ----------
  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        setEvidenceError("");

        const res = await api.get(`/applications/${id}/review`);
        if (!alive) return;

        setReview(res.data);

        // defaults
        const firstDoc = res.data?.applicant_documents?.[0];
        const firstSunway = res.data?.sunway_syllabi?.[0];

        setSelectedDocId(firstDoc?.id ? String(firstDoc.id) : "");
        setSelectedSunwayCode(firstSunway?.subject_code ? String(firstSunway.subject_code) : "");

        // AI result into override defaults (so Override form can prefill)
        const ai = res.data?.ai_result;
        if (ai) {
          setFinalSimilarity(ai.similarity_percent ?? "");
          setFinalGrade(ai.detected_grade ?? "");
          setFinalCreditHours(ai.applicant_credit_hours ?? "");
        }
      } catch (e) {
        console.error(e);
        alert("Failed to load Application Review data.");
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => (alive = false);
  }, [id]);

  const key = useMemo(() => `${selectedDocId}__${selectedSunwayCode}`, [selectedDocId, selectedSunwayCode]);

  // ---------- Auto-run AI analysis if missing ----------
  useEffect(() => {
    if (!review) return;
    if (review.ai_result) return;

    // ✅ auto-run once if none exists
    (async () => {
      try {
        await api.post(`/applications/${id}/run-ai-analysis`);
        const refreshed = await api.get(`/applications/${id}/review`);
        setReview(refreshed.data);

        const ai = refreshed.data?.ai_result;
        if (ai) {
          setFinalSimilarity(ai.similarity_percent ?? "");
          setFinalGrade(ai.detected_grade ?? "");
          setFinalCreditHours(ai.applicant_credit_hours ?? "");
        }
      } catch (e) {
        console.error(e);
        // don’t block UI; just leave “No AI analysis yet”
      }
    })();
  }, [review, id]);

  // ---------- Load similarity evidence whenever doc/syllabus changes ----------
  useEffect(() => {
    if (!selectedDocId || !selectedSunwayCode) return;

    let alive = true;
    async function loadEvidence() {
      try {
        setEvidenceError("");
        const res = await api.get(
          `/applications/${id}/similarity-evidence?docId=${encodeURIComponent(selectedDocId)}&sunwayCode=${encodeURIComponent(selectedSunwayCode)}`
        );
        if (!alive) return;
        setEvidenceByKey((prev) => ({ ...prev, [key]: res.data }));
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setEvidenceError("Failed to load similarity evidence.");
      }
    }

    loadEvidence();
    return () => (alive = false);
  }, [id, selectedDocId, selectedSunwayCode, key]);

  if (loading) return <div className="mt-10 text-sm">Loading…</div>;
  if (!review) return <div className="mt-10 text-sm">No data.</div>;

  const applicantDocs = review.applicant_documents || [];
  const sunwaySyllabi = review.sunway_syllabi || [];

  const selectedDoc = applicantDocs.find((d) => String(d.id) === String(selectedDocId));
  const selectedSunway = sunwaySyllabi.find((s) => String(s.subject_code) === String(selectedSunwayCode));

  const applicantPdfUrl = normalizePdfUrl(selectedDoc?.file_url || selectedDoc?.url || "");
  const sunwayPdfUrl = normalizePdfUrl(selectedSunway?.file_url || selectedSunway?.url || "");

  const ai = review.ai_result;

  const evidencePayload = evidenceByKey[key];
  const evidence = evidencePayload?.evidence;

  // ---------- Actions ----------
  const acceptAI = async () => {
    try {
      await api.post(`/applications/${id}/accept-ai`, {
        docId: selectedDocId,
        sunwayCode: selectedSunwayCode,
      });
      alert("Saved AI recommendation.");
    } catch (e) {
      console.error(e);
      alert("Failed to accept AI recommendation.");
    }
  };

  const saveOverride = async () => {
    if (!overrideReason.trim()) {
      alert("Override reason is required.");
      return;
    }
    try {
      await api.post(`/applications/${id}/override`, {
        docId: selectedDocId,
        sunwayCode: selectedSunwayCode,
        final_similarity: Number(finalSimilarity),
        final_grade: String(finalGrade || "").trim(),
        final_credit_hours: Number(finalCreditHours),
        reason: overrideReason.trim(),
      });
      alert("Override saved.");
      setShowOverride(false);
    } catch (e) {
      console.error(e);
      alert("Failed to save override.");
    }
  };

  return (
    <div className="bg-white">
      <div className="flex items-center justify-between mt-6">
        <button
          className="px-6 py-3 rounded-full border bg-white hover:bg-gray-50"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

        <div className="flex items-center gap-3">
          <button
            className="px-6 py-3 rounded-full border bg-white hover:bg-gray-50 font-semibold"
            onClick={acceptAI}
          >
            Accept AI Recommendation
          </button>

          <button
            className="px-6 py-3 rounded-full bg-[#0B0F2A] text-white font-semibold hover:opacity-95"
            onClick={() => setShowOverride((v) => !v)}
          >
            Override
          </button>
        </div>
      </div>

      {/* ✅ heading size matches your ApplicationDetails vibe */}
      <h1 className="text-6xl font-extrabold tracking-tight text-[#050827] mt-8">
        Application Review
      </h1>
      <div className="text-[#050827]/70 mt-2">
        Case: {review.case_id || "—"} • {review.type || "Credit Exemption"}
      </div>

      <div className="mt-8 grid grid-cols-12 gap-6">
        {/* LEFT PANEL */}
        <div className="col-span-3">
          <div className="rounded-[24px] bg-white border border-gray-200 p-6">
            <div className="text-lg font-extrabold text-[#050827]">Documents</div>

            <div className="mt-4">
              <div className="text-xs text-[#050827]/60 mb-2">Applicant Documents</div>
              <select
                className="w-full border rounded-[16px] px-4 py-3"
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
              >
                {applicantDocs.map((d) => (
                  <option key={d.id} value={String(d.id)}>
                    {d.file_name || d.fileName || `Doc ${d.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5">
              <div className="text-xs text-[#050827]/60 mb-2">Sunway Syllabus</div>
              <select
                className="w-full border rounded-[16px] px-4 py-3"
                value={selectedSunwayCode}
                onChange={(e) => setSelectedSunwayCode(e.target.value)}
              >
                {sunwaySyllabi.map((s) => (
                  <option key={s.subject_code} value={String(s.subject_code)}>
                    {s.subject_code} — {s.subject_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Override section appears ONLY when user clicks Override */}
            {showOverride && (
              <div className="mt-8">
                <div className="text-lg font-extrabold text-[#050827]">Manual Override</div>

                <div className="mt-4 text-sm">
                  <div className="mb-2">Final Similarity (%)</div>
                  <input
                    className="w-full border rounded-[16px] px-4 py-3"
                    value={finalSimilarity}
                    onChange={(e) => setFinalSimilarity(e.target.value)}
                    placeholder="e.g., 82"
                  />
                </div>

                <div className="mt-4 text-sm">
                  <div className="mb-2">Final Grade</div>
                  <input
                    className="w-full border rounded-[16px] px-4 py-3"
                    value={finalGrade}
                    onChange={(e) => setFinalGrade(e.target.value)}
                    placeholder="e.g., A-"
                  />
                </div>

                <div className="mt-4 text-sm">
                  <div className="mb-2">Final Credit Hours</div>
                  <input
                    className="w-full border rounded-[16px] px-4 py-3"
                    value={finalCreditHours}
                    onChange={(e) => setFinalCreditHours(e.target.value)}
                    placeholder="e.g., 3"
                  />
                </div>

                <div className="mt-4 text-sm">
                  <div className="mb-2">Override Reason (required)</div>
                  <textarea
                    className="w-full border rounded-[16px] px-4 py-3 min-h-[110px]"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                  />
                </div>

                <button
                  className="mt-4 w-full px-6 py-3 rounded-full bg-[#FF6B2C] text-white font-semibold hover:opacity-95"
                  onClick={saveOverride}
                >
                  Save Override
                </button>
              </div>
            )}

            <div className="mt-8">
              <div className="text-lg font-extrabold text-[#050827]">System Suggestion</div>

              {ai ? (
                <div className="mt-3 rounded-[20px] bg-[#EFEFEF] p-4 text-sm">
                  <div className="font-semibold">Decision: {ai.decision || "—"}</div>
                  <div className="mt-2 font-semibold">Similarity: {ai.similarity_percent ?? "—"}%</div>

                  <div className="mt-3 text-[#050827]/80">
                    Detected Grade: {ai.detected_grade || "—"}
                    <br />
                    Applicant Credit Hours: {ai.applicant_credit_hours ?? "—"}
                    <br />
                    Sunway Credit Hours: {ai.sunway_credit_hours ?? "—"}
                  </div>

                  <div className="mt-3 text-xs text-[#050827]/60">
                    Similarity is computed from extracted PDF text and supported by the evidence below.
                  </div>
                </div>
              ) : (
                <div className="mt-3 rounded-[20px] bg-[#EFEFEF] p-4 text-sm text-[#050827]/70">
                  No AI analysis yet.
                </div>
              )}
            </div>

            <div className="mt-8">
              <div className="text-lg font-extrabold text-[#050827]">Similarity Evidence</div>

              {evidenceError ? (
                <div className="mt-3 text-sm text-red-500">{evidenceError}</div>
              ) : !evidence ? (
                <div className="mt-3 text-sm text-[#050827]/60">
                  Evidence will appear after AI analysis is generated.
                </div>
              ) : (
                <div className="mt-3">
                  {/* Sections */}
                  <div className="text-sm font-semibold mb-2">Sections</div>
                  <div className="flex flex-wrap gap-2">
                    {(evidence.section_scores || []).map((s) => (
                      <div
                        key={s.section}
                        className="px-3 py-2 rounded-full bg-[#EFEFEF] text-xs font-semibold"
                      >
                        {s.section}: {Math.round((s.avg_score || 0) * 100)}% • {s.matches} matches
                      </div>
                    ))}
                  </div>

                  {/* Top pairs */}
                  <div className="mt-5 text-sm font-semibold">Top Matched Excerpts</div>
                  <div className="mt-2 space-y-3">
                    {(evidence.top_pairs || []).length === 0 ? (
                      <div className="text-sm text-[#050827]/60">
                        No strong matches found (try different doc / syllabus).
                      </div>
                    ) : (
                      evidence.top_pairs.map((p, idx) => (
                        <div key={idx} className="rounded-[20px] border p-4">
                          <div className="flex items-center justify-between">
                            <div className="font-bold">
                              Match #{idx + 1} • {Math.round((p.score || 0) * 100)}%
                            </div>
                            <div className="text-xs text-[#050827]/60">{p.section}</div>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-3">
                            <div>
                              <div className="text-xs font-semibold text-[#050827]/70 mb-1">
                                Applicant
                              </div>
                              <div className="text-xs bg-[#EFEFEF] rounded-[14px] p-3 max-h-[140px] overflow-auto whitespace-pre-wrap">
                                {p.applicant_excerpt}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-[#050827]/70 mb-1">
                                Sunway
                              </div>
                              <div className="text-xs bg-[#EFEFEF] rounded-[14px] p-3 max-h-[140px] overflow-auto whitespace-pre-wrap">
                                {p.sunway_excerpt}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-3 text-xs text-[#050827]/60">
                    *Evidence is generated by matching text chunks extracted from PDFs (TF cosine).
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PDF panels */}
        <div className="col-span-4">
          <PdfPanel title="Applicant PDF" fileUrl={applicantPdfUrl} />
        </div>

        <div className="col-span-5">
          <PdfPanel title="Sunway Syllabus PDF" fileUrl={sunwayPdfUrl} />
        </div>
      </div>
    </div>
  );
}
