import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import PdfViewer from "../components/PdfViewer";

function IconBack({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15 18 9 12l6-6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatusPill({ label, tone = "gray" }) {
  const toneMap = {
    orange: "bg-[#FF7A2F] text-black",
    red: "bg-red-500 text-white",
    gray: "bg-[#D9D9D9] text-[#0B0F2A]",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold ${toneMap[tone]}`}>
      {label}
    </span>
  );
}

function statusTone(status) {
  if (!status) return "gray";
  const s = String(status).toLowerCase();
  if (s === "approved") return "orange";
  if (s === "rejected") return "red";
  return "gray";
}

function safeDate(d) {
  if (!d) return "-";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString();
}


// Grade ranking helper (>= C)
const GRADE_RANK = {
  "A+": 13, "A": 12, "A-": 11,
  "B+": 10, "B": 9, "B-": 8,
  "C+": 7, "C": 6, "C-": 5,
  "D+": 4, "D": 3, "D-": 2,
  "F": 1
};

function normalizeGrade(g) {
  return String(g || "")
    .toUpperCase()
    .replace(/–/g, "-")
    .replace(/\s+/g, "");
}

function gradeAtLeastC(g) {
  const key = normalizeGrade(g);
  return (GRADE_RANK[key] ?? 0) >= GRADE_RANK["C"];
}


export default function ApplicationReview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/tasks"); // fallback
  };


  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState(null);

  const [selectedApplicantDocId, setSelectedApplicantDocId] = useState(null);
  const [selectedSunwayCode, setSelectedSunwayCode] = useState("");

  // Override
  const [overrideOpen, setOverrideOpen] = useState(false);
  // Left panel highlight
  const [activeLeftCard, setActiveLeftCard] = useState("system"); // "system" | "override"

  const [finalSimilarity, setFinalSimilarity] = useState(""); // percent
  const [finalGrade, setFinalGrade] = useState("");
  const [finalCreditHours, setFinalCreditHours] = useState("");
  const [overrideReason, setOverrideReason] = useState("");


  // --- Confirm/Summary modal (Accept AI / Override) ---
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionMode, setActionMode] = useState(null); // "accept" | "override"
  const [actionStep, setActionStep] = useState("confirm"); // "confirm" | "summary"
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionResult, setActionResult] = useState(null); // backend response (updated application, etc.)
  const [actionError, setActionError] = useState("");

  // Evidence
  const [eviLoading, setEviLoading] = useState(false);
  const [eviError, setEviError] = useState("");
  const [evidence, setEvidence] = useState(null);

  function openConfirm(mode) {
    setActionMode(mode);
    setActionStep("confirm");
    setActionResult(null);
    setActionError("");
    setActionModalOpen(true);
  }

  function closeActionModal() {
    setActionModalOpen(false);
    setActionMode(null);
    setActionStep("confirm");
    setActionResult(null);
    setActionError("");
    setActionSubmitting(false);
  }

  // Load review payload
  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const res = await api.get(`/applications/${id}/review`);
        if (!mounted) return;

        const data = res.data;
        setPayload(data);


        const firstApplicant = data?.applicant_documents?.[0];
        setSelectedApplicantDocId(firstApplicant?.id ?? null);

        const firstSunway = data?.sunway_courses?.[0];
        setSelectedSunwayCode(firstSunway?.subject_code ?? "");

        const ai = data?.ai_analysis;
        setFinalSimilarity(ai?.similarity != null ? String(Math.round(ai.similarity * 100)) : "");
        setFinalGrade(ai?.grade_detected ?? "");
        setFinalCreditHours(ai?.credit_hours != null ? String(ai.credit_hours) : "");
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [id]);

  

  // Derived data
  const docs = payload?.applicant_documents || [];
  const sunwayCourses = payload?.sunway_courses || [];
  const ai = payload?.ai_analysis || null;
  const application = payload?.application || null;

  const vm = {
  header: {
    type: application?.type || "-",
    displayId: application?.application_id || application?.id || "-",
    date: safeDate(application?.created_at || application?.date_submitted),
  },
  status: {
    sl: application?.sl_status || "Pending",
    pl: application?.pl_status || "Pending",
    reg: application?.registry_status || "Pending",
  },
};


  const selectedApplicant = useMemo(() => {
    return docs.find(d => d.id === selectedApplicantDocId) || null;
  }, [docs, selectedApplicantDocId]);

  const selectedSunway = useMemo(() => {
    return sunwayCourses.find(c => c.subject_code === selectedSunwayCode) || null;
  }, [sunwayCourses, selectedSunwayCode]);

  const selectedCourseEvidence = useMemo(() => {
    const code = selectedSunwayCode;
    const evByCourse = payload?.ai_analysis?.reasoning?.similarity_evidence_by_course || {};
    return code ? (evByCourse[code] || null) : null;
  }, [payload, selectedSunwayCode]);

  // Live rule evaluation (override inputs)
  const checks = useMemo(() => {
    const sim = Number(finalSimilarity);
    const ch = Number(finalCreditHours);
    const sunwayCH = Number(selectedSunway?.credit_hours ?? 0);

    return {
      similarityPass: Number.isFinite(sim) && sim >= 80,
      gradePass: gradeAtLeastC(finalGrade),
      creditHoursPass: Number.isFinite(ch) && ch >= sunwayCH
    };
  }, [finalSimilarity, finalGrade, finalCreditHours, selectedSunway]);

  const allPass = checks.similarityPass && checks.gradePass && checks.creditHoursPass;

  


  async function confirmYes() {
    setActionSubmitting(true);
    setActionError("");

    try {
      let res;

      if (actionMode === "accept") {
        res = await api.post(`/applications/${id}/override`, {
          accept_ai: true,
        });
      }

      if (actionMode === "override") {
        // Use exact values user is seeing in the override panel
        res = await api.post(`/applications/${id}/override`, {
          final_similarity: Number(finalSimilarity) / 100,
          final_grade: finalGrade,
          final_credit_hours: Number(finalCreditHours),
          override_reason: overrideReason,
          final_decision: allPass ? "Approve" : "Reject",
          sunway_subject_code: selectedSunwayCode,
        });
      }

      setActionResult(res.data);
      setActionStep("summary");

    } catch (e) {
      console.error(e);
      setActionError(
        e?.response?.data?.error || "Action failed. Please check backend / console."
      );
    } finally {
      setActionSubmitting(false);
    }
  }

  async function summaryOk() {
    closeActionModal();
    goBack();
  }



  // 5) UI
  return (
    <div className="bg-white px-7 py-4">
      {/* Top row: back + title block + right actions (same style as Application Details) */}
      <div className="flex items-start justify-between gap-6">
        {/* Left: back + title + meta */}
        <div>
          <button
            onClick={goBack}
            className="inline-flex items-center justify-center rounded-xl p-2 text-[#0B0F2A] hover:bg-black/5"
            title="Back"
          >
            <IconBack className="h-8 w-8" />
          </button>

          <h1 className="mt-2 mb-2 text-6xl font-extrabold tracking-tight text-[#0B0F2A]">
            Application Review
          </h1>

          <div className="mt-6 text-sm font-semibold text-[#0B0F2A]/80">
            {application ? `Case: ${application.application_id} • ${application.type}` : "Loading case…"}
          </div>

          {application && (
            <div className="mt-2 space-y-1 text-sm leading-6">
              <div>
                <span className="font-extrabold text-[#941B0C]">Previously Taken Subject:</span>{" "}
                <span className="text-[#0B0F2A]/80">{application.prev_subject_name || "-"}</span>
              </div>

              <div>
                <span className="font-extrabold text-[#61A0AF]">Requested Subject:</span>{" "}
                <span className="text-[#0B0F2A]/80">
                  {application.requested_subject || "-"}
                  {application.requested_subject_code ? ` (${application.requested_subject_code})` : ""}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right: action buttons */}
        <div className="mt-14 flex items-center gap-3">
          <button
            onClick={() => openConfirm("accept")}
            className="rounded-xl border border-black/10 bg-white px-5 py-3 font-extrabold text-[#0B0F2A] hover:bg-black/5 disabled:opacity-50"
            disabled={!ai}
            title={!ai ? "No AI analysis yet" : ""}
          >
            Accept AI Recommendation
          </button>

          <button
            onClick={() => {
              setOverrideOpen((v) => {
                const next = !v;
                setActiveLeftCard(next ? "override" : "system");
                return next;
              });
            }}
            className="rounded-xl bg-[#0B0F2A] px-5 py-3 font-extrabold text-white hover:opacity-95"
          >
            {overrideOpen ? "Close Override" : "Override Decision"}
          </button>
        </div>
      </div>


      <div style={{ height: 16 }} />

      {/* Main layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "340px 1fr 1fr",
          gap: 16,
          alignItems: "stretch"
        }}
      >
        {/* LEFT: sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          {/* Documents card */}
          <div style={cardStyle}>
            <div style={cardTitle}>Documents</div>

            <div style={{ fontSize: 12, color: "#666", fontWeight: 700, marginTop: 10 }}>
              Applicant Documents
            </div>
            <select
              style={selectStyle}
              value={selectedApplicantDocId ?? ""}
              onChange={(e) => setSelectedApplicantDocId(Number(e.target.value))}
            >
              {docs.map(d => (
                <option key={d.id} value={d.id}>
                  {d.file_name}
                </option>
              ))}
            </select>

            <div style={{ fontSize: 12, color: "#666", fontWeight: 700, marginTop: 12 }}>
              Sunway Syllabus
            </div>
            {sunwayCourses.length === 0 ? (
              <div style={{ fontSize: 13, color: "crimson", marginTop: 6 }}>
                No Sunway course matched.
                <br />
                Check requested_subject_code and sunway_courses.
              </div>
            ) : (
              <select
                style={selectStyle}
                value={selectedSunwayCode}
                onChange={(e) => setSelectedSunwayCode(e.target.value)}
              >
                {sunwayCourses.map(c => (
                  <option key={c.subject_code} value={c.subject_code}>
                    {c.subject_code} — {c.subject_name}
                  </option>
                ))}
              </select>
            )}
          </div>
          
          {/* Override panel */}
          {overrideOpen && (
            <div
              style={cardWithActive(activeLeftCard === "override")}
              onClick={() => setActiveLeftCard("override")}
            >
              <div style={cardTitle}>Manual Override</div>

              <div style={{ fontSize: 13, marginTop: 10 }}>
                <label style={labelStyle}>Final Similarity (%)</label>
                <input
                  type="number"
                  value={finalSimilarity}
                  onChange={e => setFinalSimilarity(e.target.value)}
                  style={inputStyle}
                />

                <label style={labelStyle}>Final Grade</label>
                <input
                  value={finalGrade}
                  onChange={e => setFinalGrade(e.target.value)}
                  style={inputStyle}
                />

                <label style={labelStyle}>Final Credit Hours</label>
                <input
                  type="number"
                  value={finalCreditHours}
                  onChange={e => setFinalCreditHours(e.target.value)}
                  style={inputStyle}
                />

                <label style={labelStyle}>Override Reason (required)</label>
                <textarea
                  rows={3}
                  value={overrideReason}
                  onChange={e => setOverrideReason(e.target.value)}
                  style={{ ...inputStyle, resize: "vertical" }}
                />

                <div style={{ marginTop: 12, padding: 10, background: "#f7f7f7", borderRadius: 10 }}>
                  <div style={{ fontWeight: 800, marginBottom: 6 }}>Rule Evaluation</div>
                  <div>Similarity ≥ 80%: {checks.similarityPass ? "✅" : "❌"}</div>
                  <div>Grade ≥ C: {checks.gradePass ? "✅" : "❌"}</div>
                  <div>Credit Hours ≥ Sunway ({selectedSunway?.credit_hours ?? 0}): {checks.creditHoursPass ? "✅" : "❌"}</div>

                  <div style={{ marginTop: 8 }}>
                    <b>Final Decision:</b>{" "}
                    <span style={{ color: allPass ? "green" : "crimson", fontWeight: 900 }}>
                      {allPass ? "APPROVE" : "REJECT"}
                    </span>
                  </div>
                </div>

                <button
                  style={{
                    marginTop: 12,
                    width: "100%",
                    padding: 10,
                    borderRadius: 10,
                    border: "none",
                    background: "#0f172a",
                    color: "#fff",
                    fontWeight: 900,
                    cursor: "pointer"
                  }}
                  onClick={() => {
                    if (!overrideReason.trim()) {
                      alert("Please enter an override reason (required).");
                      return;
                    }
                    openConfirm("override");
                  }}
                >
                  Save Override
                </button>
              </div>
            </div>
          )}

          {/* System Suggestion */}
          <div
            style={cardWithActive(activeLeftCard === "system")}
            onClick={() => setActiveLeftCard("system")}
          >
            <div style={cardTitle}>System Suggestion</div>

            {!ai ? (
              <div style={{ fontSize: 13, color: "#666", marginTop: 10 }}>
                No AI analysis yet.
              </div>
            ) : (
              <div style={{ fontSize: 13, lineHeight: 1.5, marginTop: 8 }}>
                <div style={{ marginTop: 10, fontSize: 12, color: "#666", lineHeight: 1.4 }}>
                  Note: This recommendation is generated by <b>Google Gemini</b> for decision support only.
                  Please verify against the official syllabus and student documents.
                </div>

                <div style={{ marginTop: 10 }}><b>Decision:</b> {application?.ai_decision ?? "-"}</div>
                <div><b>Similarity:</b> {application?.ai_score != null ? `${Math.round(Number(application.ai_score) * 100)}%` : "-"}</div>
                <div><b>Grade:</b> {ai.grade_detected || "-"}</div>
                <div><b>Credit Hours:</b> {ai.credit_hours ?? "-"}</div>
              </div>
            )}
          </div>

          
        </div>
      
        
        {/* CENTER PDF */}
        <div style={pdfCard}>
          <div
            style={{
              ...pdfTitle,
              color: "#941B0C" 
            }}
          >
            Previously Taken Subject (Student Document)
          </div>
          <div style={pdfBody}>
            {loading ? <div style={{ padding: 16 }}>Loading…</div> : <PdfViewer fileUrl={selectedApplicant?.file_url} />}
          </div>
        </div>

        {/* RIGHT PDF */}
        <div style={pdfCard}>
          <div
            style={{
              ...pdfTitle,
              color: "#61A0AF" // orange 
            }}
          >
            Requested Sunway Subject (Official Syllabus)
          </div>

          <div style={pdfBody}>
            {loading ? <div style={{ padding: 16 }}>Loading…</div> : <PdfViewer fileUrl={selectedSunway?.syllabus_url} />}
          </div>
        </div>
      </div>

      {/* Full-width Similarity Evidence */}
      <div
        style={{
          marginTop: 18,
          borderRadius: 18,
          background: "white",
          border: "1px solid #eee",
          padding: 18,
        }}
      >
        <div style={{ fontWeight: 900, fontSize: 18 }}>Similarity Evidence</div>
        <div style={{ fontSize: 13, color: "#666", marginTop: 6 }}>
          Using applicant supporting docs vs selected Sunway syllabus.
        </div>

        {/* Sections table */}
        {(() => {
          
          const sectionRows =
            selectedCourseEvidence?.section_scores?.map(s => ({
              section: s.section,
              score: Number(s.score ?? 0),
              matches: Number(s.matches ?? 0),
            })) || [
              { section: "Learning Outcomes", score: 0, matches: 0 },
              { section: "Assessment", score: 0, matches: 0 },
              { section: "Synopsis", score: 0, matches: 0 },
              { section: "Prerequisites", score: 0, matches: 0 },
              { section: "Topics", score: 0, matches: 0 },
              { section: "Other", score: 0, matches: 0 },
            ];


          const weights = {
            "Learning Outcomes": 0.35,
            "Assessment": 0.20,
            "Synopsis": 0.15,
            "Prerequisites": 0.05,
            "Topics": 0.20,
            "Other": 0.05,
          };

          const overall =
            sectionRows.reduce((acc, r) => acc + r.score * (weights[r.section] || 0), 0);

          return (
            <>
              {/* Overall summary */}
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 14,
                  border: "1px solid #eee",
                  background: "#fff",
                }}
              >
                <div>
                  <div style={{ fontWeight: 900, fontSize: 16 }}>
                    Overall Similarity: {Math.round(overall * 100)}%
                  </div>
                  <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                    Weighted by section importance.
                  </div>
                </div>

                <div style={{ fontSize: 12, color: "#555", textAlign: "right", lineHeight: 1.4 }}>
                  <div style={{ fontWeight: 900 }}>Overall formula</div>
                  <div>
                    Σ(section_score × weight)
                  </div>
                </div>
              </div>

              
              
              {/* Section breakdown card */}
              <div
                style={{
                  marginTop: 16,
                  border: "1px solid #eee",
                  borderRadius: 14,
                  background: "#fff",
                  padding: 12,
                }}
              >
                <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 10 }}>
                  Section Breakdown
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "220px 110px 110px 140px 1fr",
                    gap: 12,
                    fontSize: 13,
                    fontWeight: 900,
                    paddingBottom: 10,
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <div>Section</div>
                  <div>Score</div>
                  <div>Weight</div>
                  <div>Contribution</div>
                  <div>Matches (semantic)</div>
                </div>

                {sectionRows.map((r) => (
                  <div
                    key={r.section}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "220px 110px 110px 140px 1fr",
                      gap: 12,
                      padding: "12px 0",
                      borderBottom: "1px solid #f2f2f2",
                      fontSize: 13,
                    }}
                  >
                    {(() => {
                      const w = weights[r.section] || 0;
                      const contrib = r.score * w;

                      return (
                        <>
                          <div style={{ fontWeight: 800 }}>{r.section}</div>
                          <div style={{ fontWeight: 800 }}>{Math.round(r.score * 100)}%</div>
                          <div style={{ color: "#444", fontWeight: 800 }}>{Math.round(w * 100)}%</div>
                          <div style={{ color: "#666" }}>
                            {Math.round(r.score * 100)}% × {Math.round(w * 100)}% = {Math.round(contrib * 100)}%
                          </div>
                          <div style={{ color: "#666" }}>
                            {r.matches === 0
                              ? "No match found"
                              : `${r.matches} matched excerpt${r.matches === 1 ? "" : "s"}`}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                ))}
              </div>

            </>
          );
        })()}

  

        {/* All matched excerpts */}
        <div style={{ marginTop: 22 }}>
          <div style={{ height: 1, background: "#eee", margin: "6px 0 18px" }} />
          <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 10 }}>
            All Matched Excerpts 
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "180px 1fr 1fr 1fr",
              gap: 12,
              fontSize: 12,
              fontWeight: 900,
              paddingBottom: 10,
              borderBottom: "1px solid #eee",
              color: "#444",
            }}
          >
            <div>Section</div>
            <div>Applicant excerpt</div>
            <div>Sunway excerpt</div>
            <div>Why it matches</div>
          </div>

          {(selectedCourseEvidence?.matched_pairs || []).map((row, idx) => (
            <div
              key={idx}
              style={{
                display: "grid",
                gridTemplateColumns: "180px 1fr 1fr 1fr",
                gap: 12,
                padding: "16px 0",
                borderBottom: "1px solid #f2f2f2",
                fontSize: 13,
                alignItems: "start",
              }}
            >
              <div style={{ fontWeight: 800 }}>{row.section}</div>

              <div style={{ background: "#F5F5F5", borderRadius: 12, padding: 10, lineHeight: 1.4 }}>
                {row.applicant_excerpt}
              </div>

              <div style={{ background: "#F5F5F5", borderRadius: 12, padding: 10, lineHeight: 1.4 }}>
                {row.sunway_excerpt}
              </div>

              <div style={{ color: "#555", lineHeight: 1.4 }}>
                {row.why_match}
              </div>
            </div>
          ))}
        </div>


        <div style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
          Similarity evidence is generated by Gemini
          using semantic comparison (synonyms/meaning-based matches).
        </div>
      </div>
      {actionModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-black/10">
            <div className="px-7 py-6">
              <div className="text-2xl font-extrabold text-[#0B0F2A]">
                {actionStep === "confirm"
                  ? (actionMode === "accept" ? "Confirm Accept AI Recommendation" : "Confirm Override Decision")
                  : "Decision Submitted"}
              </div>

              <div className="mt-3 text-sm text-[#0B0F2A]/70 leading-6">
                {actionStep === "confirm" && actionMode === "accept" && (
                  <>Are you sure you want to accept the AI recommendation?</>
                )}

                {actionStep === "confirm" && actionMode === "override" && (
                  <>
                    Are you sure you want to override with the override details below?
                    <div className="mt-4 rounded-2xl bg-[#EFEFEF] p-4">
                      <div className="text-sm font-extrabold text-[#0B0F2A]">Override Summary</div>
                      <div className="mt-2 space-y-1 text-sm text-[#0B0F2A]/80">
                        <div><b>Final Similarity:</b> {finalSimilarity || "-"}%</div>
                        <div><b>Final Grade:</b> {finalGrade || "-"}</div>
                        <div><b>Final Credit Hours:</b> {finalCreditHours || "-"}</div>
                        <div><b>Final Decision:</b> {allPass ? "Approve" : "Reject"}</div>
                        <div className="pt-2"><b>Reason:</b> {overrideReason || "-"}</div>
                      </div>
                    </div>
                  </>
                )}

                {actionStep === "summary" && (
                  <>
                    Your decision has been recorded successfully.
                    <div className="mt-4 rounded-2xl bg-[#EFEFEF] p-4">
                      <div className="text-sm font-extrabold text-[#0B0F2A]">Final Decision Summary</div>
                      <div className="mt-2 space-y-1 text-sm text-[#0B0F2A]/80">
                        <div><b>Case:</b> {application?.application_id || "-"}</div>
                        <div><b>Mode:</b> {actionResult?.mode === "accept_ai" ? "Accepted AI Recommendation" : "Manual Override"}</div>
                        <div><b>Final Decision:</b> {actionResult?.application?.final_decision || "-"}</div>
                        <div><b>Final Similarity:</b> {actionResult?.application?.final_similarity != null ? `${Math.round(actionResult.application.final_similarity * 100)}%` : "-"}</div>
                        <div><b>Final Grade:</b> {actionResult?.application?.final_grade || "-"}</div>
                        <div><b>Final Credit Hours:</b> {actionResult?.application?.final_credit_hours ?? "-"}</div>
                        <div><b>SL Status:</b> {actionResult?.application?.sl_status || "-"}</div>
                      </div>
                    </div>
                  </>
                )}

                {actionError && (
                  <div className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
                    {actionError}
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                {actionStep === "confirm" ? (
                  <>
                    <button
                      onClick={closeActionModal}
                      className="rounded-xl border border-black/10 bg-white px-5 py-3 font-extrabold text-[#0B0F2A] hover:bg-black/5"
                      disabled={actionSubmitting}
                    >
                      Cancel
                    </button>

                    <button
                      onClick={confirmYes}
                      className="rounded-xl bg-[#0B0F2A] px-6 py-3 font-extrabold text-white hover:opacity-95 disabled:opacity-50"
                      disabled={actionSubmitting}
                    >
                      {actionSubmitting ? "Saving..." : "Yes"}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={summaryOk}
                    className="rounded-xl bg-[#0B0F2A] px-6 py-3 font-extrabold text-white hover:opacity-95"
                  >
                    OK
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* ---------- styles ---------- */
const cardStyle = {
  background: "#fff",
  border: "1px solid #eee",
  borderRadius: 14,
  padding: 14,
  boxShadow: "0 1px 6px rgba(0,0,0,0.04)"
};

function cardWithActive(isActive) {
  return {
    ...cardStyle,
    border: isActive ? "2px solid #0B0F2A" : cardStyle.border,
    boxShadow: isActive ? "0 8px 24px rgba(11,15,42,0.10)" : cardStyle.boxShadow,
    background: isActive ? "#FBFBFF" : cardStyle.background,
  };
}


const cardTitle = {
  fontWeight: 900,
  fontSize: 16
};

const selectStyle = {
  width: "100%",
  padding: 10,
  marginTop: 6,
  borderRadius: 10,
  border: "1px solid #ddd",
  background: "#fff",
  fontWeight: 700
};

const preStyle = {
  whiteSpace: "pre-wrap",
  background: "#f7f7f7",
  padding: 10,
  borderRadius: 10,
  fontSize: 12,
  maxHeight: 180,
  overflow: "auto"
};

const labelStyle = { display: "block", marginTop: 10, fontWeight: 800 };
const inputStyle = {
  width: "100%",
  padding: 10,
  borderRadius: 10,
  border: "1px solid #ddd",
  marginTop: 6
};

const pdfCard = {
  background: "#fff",
  border: "1px solid #eee",
  borderRadius: 14,
  overflow: "hidden",
  boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
  minWidth: 0
};

const pdfTitle = {
  padding: "12px 14px",
  fontWeight: 900,
  borderBottom: "1px solid #eee"
};

const pdfBody = {
  height: "calc(100vh - 190px)", 
  overflow: "auto"
};

const pillStyle = {
  padding: "6px 10px",
  borderRadius: 999,
  background: "#f7f7f7",
  border: "1px solid #eee",
  fontSize: 12,
  fontWeight: 800
};

const evidenceCard = {
  border: "1px solid #eee",
  borderRadius: 12,
  padding: 10,
  background: "#fff"
};

const smallLabel = {
  fontSize: 12,
  fontWeight: 900,
  color: "#666",
  marginBottom: 4
};

const excerptBox = {
  background: "#f7f7f7",
  borderRadius: 10,
  padding: 10,
  fontSize: 12,
  lineHeight: 1.4,
  maxHeight: 120,
  overflow: "auto",
  border: "1px solid #eee"
};
