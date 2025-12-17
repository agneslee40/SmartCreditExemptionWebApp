// frontend/src/pages/ApplicationReview.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { api } from "../api/client";

// ✅ react-pdf
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// ✅ FIX: Worker version mismatch (API version must match worker version)
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

function normalizeFileUrl(filePath) {
  if (!filePath) return "";
  if (filePath.startsWith("http")) return filePath;

  // convert Windows backslashes to URL slashes
  let p = String(filePath).replaceAll("\\", "/");

  // strip leading "backend/" if stored that way
  p = p.replace(/^backend\//, "");

  // ensure it starts with uploads/
  if (!p.startsWith("uploads/")) {
    p = `uploads/${p.replace(/^\/+/, "")}`;
  }
  return `http://localhost:5000/${p}`;
}

function gradeToRank(grade) {
  if (!grade) return -1;
  const g = String(grade).trim().toUpperCase();
  // simple rank order
  const order = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"];
  const idx = order.indexOf(g);
  return idx === -1 ? -1 : order.length - idx; // higher is better
}

export default function ApplicationReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Back button should return to previous page user came from
  const handleBack = () => {
    if (location.key !== "default") navigate(-1);
    else navigate("/tasks"); // fallback
  };

  const [loading, setLoading] = useState(true);
  const [reviewData, setReviewData] = useState(null);

  const [selectedApplicantDocId, setSelectedApplicantDocId] = useState("");
  const [selectedSunwayCode, setSelectedSunwayCode] = useState("");

  // PDF state
  const [appPdfPages, setAppPdfPages] = useState(null);
  const [sunPdfPages, setSunPdfPages] = useState(null);
  const [appPage, setAppPage] = useState(1);
  const [sunPage, setSunPage] = useState(1);

  const [appZoom, setAppZoom] = useState(1.0);
  const [sunZoom, setSunZoom] = useState(1.0);

  const [appPdfError, setAppPdfError] = useState("");
  const [sunPdfError, setSunPdfError] = useState("");

  // Override UI
  const [showOverride, setShowOverride] = useState(false);
  const [overrideSimilarity, setOverrideSimilarity] = useState("");
  const [overrideGrade, setOverrideGrade] = useState("");
  const [overrideCreditHours, setOverrideCreditHours] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [savingOverride, setSavingOverride] = useState(false);

  // Similarity Evidence state
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [evidenceError, setEvidenceError] = useState("");
  const [evidenceByKey, setEvidenceByKey] = useState({}); // key = `${docId}__${sunwayCode}`

  const fetchReview = async () => {
    const res = await api.get(`/applications/${id}/review`);
    setReviewData(res.data);

    // set default selections once
    const docs = res.data?.applicant_documents || [];
    const sun = res.data?.sunway_courses || [];

    const initialDocId = docs[0]?.id ? String(docs[0].id) : "";
    const initialSunway = sun[0]?.subject_code ? String(sun[0].subject_code) : "";

    setSelectedApplicantDocId((prev) => prev || initialDocId);
    setSelectedSunwayCode((prev) => prev || initialSunway);
  };

  // Load review page
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        await fetchReview();
      } catch (e) {
        console.error(e);
        alert("Failed to load Application Review.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const applicantDocs = reviewData?.applicant_documents || [];
  const sunwayCourses = reviewData?.sunway_courses || [];
  const application = reviewData?.application || {};
  const ai = reviewData?.ai_analysis || null;

  const selectedApplicantDoc = useMemo(
    () => applicantDocs.find((d) => String(d.id) === String(selectedApplicantDocId)),
    [applicantDocs, selectedApplicantDocId]
  );

  const selectedSunwayCourse = useMemo(
    () => sunwayCourses.find((s) => String(s.subject_code) === String(selectedSunwayCode)),
    [sunwayCourses, selectedSunwayCode]
  );

  // --- System Suggestion values (prefer AI analysis when available)
  const similarityPct = useMemo(() => {
    // ai.similarity may be 0..1, OR might already be 0..100 depending on your backend
    const v = ai?.similarity;
    if (v == null) return null;
    const num = Number(v);
    if (Number.isNaN(num)) return null;
    if (num <= 1) return Math.round(num * 100);
    return Math.round(num);
  }, [ai]);

  const detectedGrade = ai?.grade_detected ?? null;
  const detectedApplicantCredits = ai?.applicant_credit_hours ?? null;
  const requiredSunwayCredits = selectedSunwayCourse?.credit_hours ?? null;

  const passSimilarity = similarityPct != null ? similarityPct >= 80 : false;
  const passGrade = detectedGrade ? gradeToRank(detectedGrade) >= gradeToRank("C") : false;
  const passCredit =
    requiredSunwayCredits != null && detectedApplicantCredits != null
      ? Number(detectedApplicantCredits) >= Number(requiredSunwayCredits)
      : false;

  const autoDecision = passSimilarity && passGrade && passCredit ? "APPROVE" : "REJECT";

  // If override panel opens, prefill with AI values (or fallback)
  useEffect(() => {
    if (!showOverride) return;

    setOverrideSimilarity(similarityPct != null ? String(similarityPct) : "");
    setOverrideGrade(detectedGrade ?? "");
    setOverrideCreditHours(
      detectedApplicantCredits != null ? String(detectedApplicantCredits) : ""
    );
  }, [showOverride, similarityPct, detectedGrade, detectedApplicantCredits]);

  // --- PDF URLs
  const applicantPdfUrl = useMemo(() => {
    return normalizeFileUrl(selectedApplicantDoc?.file_path);
  }, [selectedApplicantDoc]);

  const sunwayPdfUrl = useMemo(() => {
    return normalizeFileUrl(selectedSunwayCourse?.file_path);
  }, [selectedSunwayCourse]);

  // Reset pdf pages on doc changes
  useEffect(() => {
    setAppPdfPages(null);
    setAppPage(1);
    setAppPdfError("");
  }, [applicantPdfUrl]);

  useEffect(() => {
    setSunPdfPages(null);
    setSunPage(1);
    setSunPdfError("");
  }, [sunwayPdfUrl]);

  // --- Evidence fetch
  const evidenceKey = `${selectedApplicantDocId}__${selectedSunwayCode}`;
  const currentEvidence = evidenceByKey[evidenceKey]?.evidence;

  useEffect(() => {
    const run = async () => {
      if (!selectedApplicantDocId || !selectedSunwayCode) return;
      if (evidenceByKey[evidenceKey]) return;

      try {
        setEvidenceLoading(true);
        setEvidenceError("");

        const res = await api.get(
          `/applications/${id}/similarity-evidence?docId=${encodeURIComponent(
            selectedApplicantDocId
          )}&sunwayCode=${encodeURIComponent(selectedSunwayCode)}`
        );

        setEvidenceByKey((prev) => ({
          ...prev,
          [evidenceKey]: res.data,
        }));
      } catch (e) {
        console.error(e);
        setEvidenceError("Failed to load similarity evidence.");
      } finally {
        setEvidenceLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, selectedApplicantDocId, selectedSunwayCode]);

  // --- Accept AI Recommendation
  const handleAcceptAi = async () => {
    try {
      await api.post(`/applications/${id}/accept-ai-recommendation`, {
        docId: Number(selectedApplicantDocId),
        sunwayCode: selectedSunwayCode,
      });
      alert("AI recommendation accepted and saved.");
      await fetchReview();
    } catch (e) {
      console.error(e);
      alert("Failed to accept AI recommendation.");
    }
  };

  // --- Save Override (only one button)
  const handleSaveOverride = async () => {
    if (!overrideReason.trim()) {
      alert("Override reason is required.");
      return;
    }

    const finalSimilarity = Number(overrideSimilarity);
    const finalCreditHours = Number(overrideCreditHours);

    if (Number.isNaN(finalSimilarity) || finalSimilarity < 0 || finalSimilarity > 100) {
      alert("Final Similarity (%) must be a number between 0 and 100.");
      return;
    }
    if (Number.isNaN(finalCreditHours) || finalCreditHours < 0) {
      alert("Final Credit Hours must be a valid number.");
      return;
    }
    if (!overrideGrade.trim()) {
      alert("Final Grade is required.");
      return;
    }

    // re-evaluate decision based on override inputs
    const oPassSimilarity = finalSimilarity >= 80;
    const oPassGrade = gradeToRank(overrideGrade) >= gradeToRank("C");
    const oPassCredit =
      requiredSunwayCredits != null ? finalCreditHours >= Number(requiredSunwayCredits) : true;

    const finalDecision = oPassSimilarity && oPassGrade && oPassCredit ? "APPROVE" : "REJECT";

    try {
      setSavingOverride(true);

      await api.post(`/applications/${id}/override`, {
        docId: Number(selectedApplicantDocId),
        sunwayCode: selectedSunwayCode,
        final_similarity: finalSimilarity,
        final_grade: overrideGrade.trim(),
        final_credit_hours: finalCreditHours,
        override_reason: overrideReason.trim(),
        final_decision: finalDecision,
      });

      alert("Override saved.");
      setShowOverride(false);
      setOverrideReason("");
      await fetchReview();
    } catch (e) {
      console.error(e);
      alert("Failed to save override.");
    } finally {
      setSavingOverride(false);
    }
  };

  if (loading) return <div className="mt-10 text-sm">Loading…</div>;
  if (!reviewData) return <div className="mt-10 text-sm">No data.</div>;

  return (
    <div className="bg-white">
      {/* Top actions row */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={handleBack}
          className="px-5 py-2 rounded-full border border-gray-200 bg-white text-sm hover:bg-gray-50"
        >
          ← Back
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleAcceptAi}
            className="px-6 py-3 rounded-full bg-white border border-gray-200 text-[#0B0F2A] font-semibold hover:bg-gray-50"
          >
            Accept AI Recommendation
          </button>

          <button
            onClick={() => setShowOverride((v) => !v)}
            className="px-6 py-3 rounded-full bg-[#0B0F2A] text-white font-semibold hover:opacity-95"
          >
            Override
          </button>
        </div>
      </div>

      {/* Heading (match ApplicationDetails styling) */}
      <h1 className="mt-8 text-6xl font-extrabold tracking-tight text-[#0B0F2A]">
        Application Review
      </h1>
      <div className="mt-2 text-[#0B0F2A]/70">
        Case: {application?.application_id || "—"} • {application?.type || "Credit Exemption"}
      </div>

      {/* Main grid */}
      <div className="mt-8 grid grid-cols-12 gap-6">
        {/* Left panel */}
        <div className="col-span-12 lg:col-span-3">
          <div className="rounded-[24px] border border-gray-100 bg-white shadow-sm p-5 h-[760px] overflow-y-auto">
            <div className="text-lg font-extrabold text-[#0B0F2A]">Documents</div>

            <div className="mt-4">
              <div className="text-xs font-semibold text-[#0B0F2A]/70 mb-2">
                Applicant Documents
              </div>
              <select
                value={selectedApplicantDocId}
                onChange={(e) => setSelectedApplicantDocId(e.target.value)}
                className="w-full px-4 py-3 rounded-[16px] border border-gray-200 bg-white"
              >
                {applicantDocs.map((d) => (
                  <option key={d.id} value={String(d.id)}>
                    {d.file_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5">
              <div className="text-xs font-semibold text-[#0B0F2A]/70 mb-2">Sunway Syllabus</div>
              <select
                value={selectedSunwayCode}
                onChange={(e) => setSelectedSunwayCode(e.target.value)}
                className="w-full px-4 py-3 rounded-[16px] border border-gray-200 bg-white"
              >
                {sunwayCourses.map((s) => (
                  <option key={s.subject_code} value={String(s.subject_code)}>
                    {s.subject_code} — {s.subject_name}
                  </option>
                ))}
              </select>
            </div>

            {/* ✅ Override panel inserted between Documents and System Suggestion */}
            {showOverride && (
              <div className="mt-8">
                <div className="text-lg font-extrabold text-[#0B0F2A]">Manual Override</div>

                <div className="mt-3">
                  <label className="text-xs font-semibold text-[#0B0F2A]/70">
                    Final Similarity (%)
                  </label>
                  <input
                    value={overrideSimilarity}
                    onChange={(e) => setOverrideSimilarity(e.target.value)}
                    className="mt-2 w-full px-4 py-3 rounded-[16px] border border-gray-200 bg-white"
                    placeholder="e.g., 82"
                  />
                </div>

                <div className="mt-3">
                  <label className="text-xs font-semibold text-[#0B0F2A]/70">Final Grade</label>
                  <input
                    value={overrideGrade}
                    onChange={(e) => setOverrideGrade(e.target.value)}
                    className="mt-2 w-full px-4 py-3 rounded-[16px] border border-gray-200 bg-white"
                    placeholder="e.g., A-"
                  />
                </div>

                <div className="mt-3">
                  <label className="text-xs font-semibold text-[#0B0F2A]/70">
                    Final Credit Hours
                  </label>
                  <input
                    value={overrideCreditHours}
                    onChange={(e) => setOverrideCreditHours(e.target.value)}
                    className="mt-2 w-full px-4 py-3 rounded-[16px] border border-gray-200 bg-white"
                    placeholder="e.g., 4"
                  />
                </div>

                <div className="mt-3">
                  <label className="text-xs font-semibold text-[#0B0F2A]/70">
                    Override Reason (required)
                  </label>
                  <textarea
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="mt-2 w-full px-4 py-3 rounded-[16px] border border-gray-200 bg-white"
                    rows={4}
                    placeholder="Explain why you are overriding the AI recommendation…"
                  />
                </div>

                <button
                  onClick={handleSaveOverride}
                  disabled={savingOverride}
                  className="mt-4 w-full px-6 py-3 rounded-full bg-[#0B0F2A] text-white font-semibold hover:opacity-95 disabled:opacity-60"
                >
                  {savingOverride ? "Saving…" : "Save Override"}
                </button>
              </div>
            )}

            {/* System Suggestion */}
            <div className="mt-10">
              <div className="text-lg font-extrabold text-[#0B0F2A]">System Suggestion</div>

              <div className="mt-3 rounded-[20px] border border-gray-100 bg-[#F7F7F7] p-4">
                <div className="text-sm font-semibold text-[#0B0F2A]">
                  Decision: {ai?.decision || autoDecision}
                </div>

                <div className="mt-2 text-sm font-semibold text-[#0B0F2A]">
                  Similarity: {similarityPct != null ? `${similarityPct}%` : "—"}
                </div>

                {/* show criteria (like your old version) */}
                <div className="mt-3 text-xs text-[#0B0F2A]/70 space-y-1">
                  <div>
                    Detected Grade:{" "}
                    <span className="font-semibold text-[#0B0F2A]">
                      {detectedGrade ?? "—"}
                    </span>
                  </div>
                  <div>
                    Applicant Credit Hours:{" "}
                    <span className="font-semibold text-[#0B0F2A]">
                      {detectedApplicantCredits ?? "—"}
                    </span>
                  </div>
                  <div>
                    Sunway Credit Hours:{" "}
                    <span className="font-semibold text-[#0B0F2A]">
                      {requiredSunwayCredits ?? "—"}
                    </span>
                  </div>

                  <div className="mt-2 text-[11px] text-[#0B0F2A]/60">
                    Similarity is computed from extracted PDF text and supported by the evidence
                    below.
                    <br />
                    <span className="text-[#0B0F2A]/60">
                      Note: scanned transcripts require OCR to extract grade/credits.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Similarity Evidence */}
            <div className="mt-10">
              <div className="text-lg font-extrabold text-[#0B0F2A]">Similarity Evidence</div>

              {evidenceLoading && (
                <div className="mt-3 text-sm text-[#0B0F2A]/70">Loading evidence…</div>
              )}
              {evidenceError && (
                <div className="mt-3 text-sm text-red-600">{evidenceError}</div>
              )}

              {!evidenceLoading && !evidenceError && currentEvidence && (
                <>
                  <div className="mt-4">
                    <div className="text-sm font-bold text-[#0B0F2A]">Sections</div>
                    <div className="mt-2 space-y-2">
                      {(currentEvidence.section_scores || []).map((s) => (
                        <div
                          key={s.section}
                          className="px-3 py-2 rounded-full bg-[#F7F7F7] border border-gray-100 text-xs font-semibold"
                        >
                          {s.section}: {Math.round((s.avg_score || 0) * 100)}% • {s.matches} matches
                        </div>
                      ))}
                      {(currentEvidence.section_scores || []).length === 0 && (
                        <div className="text-sm text-[#0B0F2A]/70">No section breakdown.</div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="text-sm font-bold text-[#0B0F2A]">Top Matched Excerpts</div>

                    <div className="mt-3 space-y-4">
                      {(currentEvidence.top_pairs || []).slice(0, 5).map((p, idx) => (
                        <div
                          key={idx}
                          className="rounded-[18px] border border-gray-100 bg-white p-4 shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-extrabold text-[#0B0F2A]">
                              Match #{idx + 1} • {Math.round((p.score || 0) * 100)}%
                            </div>
                            <div className="text-xs font-semibold text-[#0B0F2A]/60">
                              {p.section || "—"}
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-3">
                            <div>
                              <div className="text-xs font-bold text-[#0B0F2A]/70 mb-2">
                                Applicant
                              </div>
                              <div className="h-28 overflow-y-auto rounded-[14px] border border-gray-100 bg-[#F7F7F7] p-3 text-xs leading-relaxed whitespace-pre-wrap">
                                {p.applicant_excerpt}
                              </div>
                            </div>

                            <div>
                              <div className="text-xs font-bold text-[#0B0F2A]/70 mb-2">Sunway</div>
                              <div className="h-28 overflow-y-auto rounded-[14px] border border-gray-100 bg-[#F7F7F7] p-3 text-xs leading-relaxed whitespace-pre-wrap">
                                {p.sunway_excerpt}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {(currentEvidence.top_pairs || []).length === 0 && (
                        <div className="text-sm text-[#0B0F2A]/70">
                          No strong matches found (try different doc / syllabus).
                        </div>
                      )}

                      <div className="text-[11px] text-[#0B0F2A]/60">
                        *Evidence is generated by matching text chunks extracted from PDFs (TF
                        cosine).
                      </div>
                    </div>
                  </div>
                </>
              )}

              {!evidenceLoading && !evidenceError && !currentEvidence && (
                <div className="mt-3 text-sm text-[#0B0F2A]/70">
                  Evidence will appear after AI analysis is generated.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Applicant PDF */}
        <div className="col-span-12 lg:col-span-4">
          <div className="rounded-[24px] border border-gray-100 bg-white shadow-sm p-4 h-[760px] overflow-hidden">
            <div className="text-lg font-extrabold text-[#0B0F2A] mb-3">Applicant PDF</div>

            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => setAppPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 rounded-[14px] border border-gray-200 text-sm"
                disabled={!appPdfPages}
              >
                Prev
              </button>

              <div className="text-sm font-semibold text-[#0B0F2A]">
                Page {appPage} / {appPdfPages || "—"}
              </div>

              <button
                onClick={() => setAppPage((p) => Math.min(appPdfPages || p, p + 1))}
                className="px-4 py-2 rounded-[14px] border border-gray-200 text-sm"
                disabled={!appPdfPages}
              >
                Next
              </button>

              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => setAppZoom((z) => Math.max(0.6, Math.round((z - 0.1) * 10) / 10))}
                  className="px-3 py-2 rounded-[14px] border border-gray-200 text-sm"
                >
                  −
                </button>
                <div className="text-sm font-semibold w-14 text-center">
                  {Math.round(appZoom * 100)}%
                </div>
                <button
                  onClick={() => setAppZoom((z) => Math.min(2.0, Math.round((z + 0.1) * 10) / 10))}
                  className="px-3 py-2 rounded-[14px] border border-gray-200 text-sm"
                >
                  +
                </button>
              </div>
            </div>

            <div className="h-[680px] overflow-auto rounded-[18px] border border-gray-100 bg-white flex justify-center">
              <Document
                file={applicantPdfUrl}
                onLoadSuccess={(pdf) => setAppPdfPages(pdf.numPages)}
                onLoadError={(err) => {
                  console.error(err);
                  setAppPdfError(err?.message || "Failed to load PDF file.");
                }}
                loading={<div className="p-4 text-sm">Loading PDF…</div>}
                error={
                  <div className="p-4 text-sm text-red-600">
                    {appPdfError || "Failed to load PDF file."}
                  </div>
                }
              >
                {appPdfPages && (
                  <Page pageNumber={appPage} scale={appZoom} renderAnnotationLayer renderTextLayer />
                )}
              </Document>
            </div>
          </div>
        </div>

        {/* Sunway PDF */}
        <div className="col-span-12 lg:col-span-5">
          <div className="rounded-[24px] border border-gray-100 bg-white shadow-sm p-4 h-[760px] overflow-hidden">
            <div className="text-lg font-extrabold text-[#0B0F2A] mb-3">Sunway Syllabus PDF</div>

            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => setSunPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 rounded-[14px] border border-gray-200 text-sm"
                disabled={!sunPdfPages}
              >
                Prev
              </button>

              <div className="text-sm font-semibold text-[#0B0F2A]">
                Page {sunPage} / {sunPdfPages || "—"}
              </div>

              <button
                onClick={() => setSunPage((p) => Math.min(sunPdfPages || p, p + 1))}
                className="px-4 py-2 rounded-[14px] border border-gray-200 text-sm"
                disabled={!sunPdfPages}
              >
                Next
              </button>

              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => setSunZoom((z) => Math.max(0.6, Math.round((z - 0.1) * 10) / 10))}
                  className="px-3 py-2 rounded-[14px] border border-gray-200 text-sm"
                >
                  −
                </button>
                <div className="text-sm font-semibold w-14 text-center">
                  {Math.round(sunZoom * 100)}%
                </div>
                <button
                  onClick={() => setSunZoom((z) => Math.min(2.0, Math.round((z + 0.1) * 10) / 10))}
                  className="px-3 py-2 rounded-[14px] border border-gray-200 text-sm"
                >
                  +
                </button>
              </div>
            </div>

            <div className="h-[680px] overflow-auto rounded-[18px] border border-gray-100 bg-white flex justify-center">
              <Document
                file={sunwayPdfUrl}
                onLoadSuccess={(pdf) => setSunPdfPages(pdf.numPages)}
                onLoadError={(err) => {
                  console.error(err);
                  setSunPdfError(err?.message || "Failed to load PDF file.");
                }}
                loading={<div className="p-4 text-sm">Loading PDF…</div>}
                error={
                  <div className="p-4 text-sm text-red-600">
                    {sunPdfError || "Failed to load PDF file."}
                  </div>
                }
              >
                {sunPdfPages && (
                  <Page pageNumber={sunPage} scale={sunZoom} renderAnnotationLayer renderTextLayer />
                )}
              </Document>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
