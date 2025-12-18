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
function gradeAtLeastC(g) {
  const key = String(g || "").toUpperCase().trim();
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
  const [finalSimilarity, setFinalSimilarity] = useState(""); // percent
  const [finalGrade, setFinalGrade] = useState("");
  const [finalCreditHours, setFinalCreditHours] = useState("");
  const [overrideReason, setOverrideReason] = useState("");

  // Evidence
  const [eviLoading, setEviLoading] = useState(false);
  const [eviError, setEviError] = useState("");
  const [evidence, setEvidence] = useState(null);

  // 1) Load review payload
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

  

  // 2) Derived data (safe defaults so hooks never break)
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

  // 3) Live rule evaluation (override inputs)
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

  // 4) Fetch similarity evidence whenever selection changes
  useEffect(() => {
    let mounted = true;

    async function loadEvidence() {
      setEviError("");
      setEvidence(null);

      if (!selectedApplicantDocId || !selectedSunwayCode) return;

      setEviLoading(true);
      try {
        const res = await api.get(
          `/applications/${id}/similarity-evidence`,
          { params: { docId: selectedApplicantDocId, sunwayCode: selectedSunwayCode } }
        );
        if (!mounted) return;
        setEvidence(res.data);
      } catch (e) {
        console.error(e);
        if (!mounted) return;
        setEviError("Failed to load similarity evidence. Check backend console.");
      } finally {
        if (mounted) setEviLoading(false);
      }
    }

    loadEvidence();
    return () => { mounted = false; };
  }, [id, selectedApplicantDocId, selectedSunwayCode]);

  async function acceptAi() {
    try {
      await api.post(`/applications/${id}/override`, {
        accept_ai: true
        // optional: record which syllabus they were viewing
        //sunway_subject_code: selectedSunwayCode
      });
      alert("AI recommendation accepted ✅");
      const res = await api.get(`/applications/${id}/review`);
      setPayload(res.data);
    } catch (e) {
      console.error(e);
      alert("Failed to accept AI ❌ (check backend route)");
    }
  }

  async function saveOverride() {
    if (!overrideReason.trim()) {
      alert("Please enter an override reason (required).");
      return;
    }

    try {
      await api.post(`/applications/${id}/override`, {
        final_similarity: Number(finalSimilarity) / 100,
        final_grade: finalGrade,
        final_credit_hours: Number(finalCreditHours),
        override_reason: overrideReason,
        final_decision: allPass ? "Approve" : "Reject",
        sunway_subject_code: selectedSunwayCode
      });

      alert("Override saved ✅");

      const res = await api.get(`/applications/${id}/review`);
      setPayload(res.data);
      setOverrideOpen(false);
      setOverrideReason("");
    } catch (e) {
      console.error(e);
      alert("Failed to save override ❌ (check backend route / console)");
    }
  }

  // 5) UI
  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <button
            onClick={goBack}
            className="inline-flex items-center justify-center rounded-xl p-2 text-[#0B0F2A] hover:bg-black/5"
            title="Back"
          >
            <IconBack className="h-8 w-8" />
          </button>


          <div>
            <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Application Review</div>
            <div style={{ color: "#666", fontSize: 13 }}>
              {application ? `Case: ${application.application_id} • ${application.type}` : "Loading case…"}
              {application && (
                <div style={{ marginTop: 6, color: "#666", fontSize: 13, lineHeight: 1.4 }}>
                  <div>
                    <b style={{ color: "#941B0C" }}>
                      Previously Taken Subject:
                    </b>{" "}
                    {application.prev_subject_name || "-"}
                  </div>

                  <div>
                    <b style={{ color: "#61A0AF" }}>
                      Requested Subject:
                    </b>{" "}
                    {application.requested_subject || "-"}
                    {application.requested_subject_code
                      ? ` (${application.requested_subject_code})`
                      : ""}
                  </div>

                  

                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={acceptAi}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "#fff",
              fontWeight: 700,
              cursor: "pointer"
            }}
            disabled={!ai}
            title={!ai ? "No AI analysis yet" : ""}
          >
            Accept AI Recommendation
          </button>

          <button
            onClick={() => setOverrideOpen(v => !v)}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "none",
              background: "#0f172a",
              color: "#fff",
              fontWeight: 800,
              cursor: "pointer"
            }}
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

          {/* System Suggestion */}
          <div style={cardStyle}>
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
                
                <div style ={{marginTop: 10}}><b>Decision:</b> {application?.ai_decision ?? "-"}</div>
                <div><b>Similarity:</b> {application?.ai_score != null ? `${Math.round(Number(application.ai_score) * 100)}%` : "-"}</div>
                <div><b>Grade:</b> {ai.grade_detected || "-"}</div>
                <div><b>Credit Hours:</b> {ai.credit_hours ?? "-"}</div>
                

              
              </div>
            )}
          </div>
{/* 
          //Similarity Evidence
          <div style={cardStyle}>
            <div style={cardTitle}>Similarity Evidence</div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
              Using all applicant supporting documents (excluding transcript) vs selected Sunway syllabus.
            </div>

            {loading ? (
              <div style={{ fontSize: 13, color: "#666", marginTop: 10 }}>Loading…</div>
            ) : eviLoading ? (
              <div style={{ fontSize: 13, color: "#666", marginTop: 10 }}>Extracting & matching text…</div>
            ) : eviError ? (
              <div style={{ fontSize: 13, color: "crimson", marginTop: 10 }}>{eviError}</div>
            ) : !evidence?.evidence ? (
              <div style={{ fontSize: 13, color: "#666", marginTop: 10 }}>
                Select an applicant doc + Sunway syllabus to generate evidence.
              </div>
            ) : (
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                //section scores
                <div>
                  <div style={{ fontWeight: 800, marginBottom: 6 }}>Sections</div>

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "160px 90px 1fr",
                    gap: 10,
                    fontSize: 12,
                    fontWeight: 800,
                    color: "#444",
                    paddingBottom: 6,
                    borderBottom: "1px solid #eee"
                  }}>
                    <div>Section</div>
                    <div>Score</div>
                    <div>Matches (semantic)</div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                    {(evidence.evidence.sections || []).map((s) => (
                      <div key={s.section} style={{
                        display: "grid",
                        gridTemplateColumns: "160px 90px 1fr",
                        gap: 10,
                        border: "1px solid #eee",
                        borderRadius: 12,
                        padding: 10,
                        background: "#fff"
                      }}>
                        <div style={{ fontWeight: 900 }}>{s.section}</div>
                        <div style={{ fontWeight: 900 }}>{Math.round((s.similarity || 0) * 100)}%</div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {(s.matches || []).length === 0 ? (
                            <div style={{ fontSize: 12, color: "#777" }}>No match found (0%)</div>
                          ) : (
                            (s.matches || []).slice(0, 3).map((m, idx) => (
                              <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                <div>
                                  <div style={smallLabel}>Applicant ({m.app_doc})</div>
                                  <div style={excerptBox}>{m.app_excerpt}</div>
                                </div>
                                <div>
                                  <div style={smallLabel}>Sunway ({m.sunway_doc})</div>
                                  <div style={excerptBox}>{m.sunway_excerpt}</div>
                                </div>
                                <div style={{ gridColumn: "1 / span 2", fontSize: 12, color: "#555" }}>
                                  <b>Why:</b> {m.why_match}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>


                //top pairs
                <div>
                  <div style={{ fontWeight: 800, marginBottom: 6 }}>Top Matched Excerpts</div>
                  {(evidence.evidence.top_pairs || []).map((p, idx) => (
                    <div key={idx} style={evidenceCard}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <div style={{ fontWeight: 800 }}>
                          Match #{idx + 1} • {(p.score * 100).toFixed(0)}%
                        </div>
                        <div style={{ fontSize: 12, color: "#666", fontWeight: 700 }}>
                          {p.section}
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
                        <div>
                          <div style={smallLabel}>Applicant</div>
                          <div style={excerptBox}>{p.applicant_excerpt}</div>
                        </div>
                        <div>
                          <div style={smallLabel}>Sunway</div>
                          <div style={excerptBox}>{p.sunway_excerpt}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: 12, color: "#666" }}>
                  *Evidence and section similarity are generated by Gemini using semantic comparison across applicant supporting documents and the Sunway syllabus.
                </div>

              </div>
            )}
          </div>
*/}

          {/* Override panel */}
          {overrideOpen && (
            <div style={cardStyle}>
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
                  onClick={saveOverride}
                >
                  Save Override
                </button>
              </div>
            </div>
          )}
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
              color: "#61A0AF" // orange (same family as your active tab)
            }}
          >
            Requested Sunway Subject (Official Syllabus)
          </div>

          <div style={pdfBody}>
            {loading ? <div style={{ padding: 16 }}>Loading…</div> : <PdfViewer fileUrl={selectedSunway?.syllabus_url} />}
          </div>
        </div>
      </div>

      {/* Full-width Similarity Evidence (moved below PDFs) */}
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
        {/* Dummy section scores + weights (for demo) */}
        {(() => {
          
          const sectionRows = [
            { section: "Learning Outcomes", score: 0.78, matches: 2 },
            { section: "Assessment", score: 0.62, matches: 1 },
            { section: "Synopsis", score: 0.55, matches: 0 },
            { section: "Prerequisites", score: 0.0, matches: 0 },
            { section: "Topics", score: 0.71, matches: 1 },
            { section: "Other", score: 0.2, matches: 0 },
          ];

          // weights must sum to 1.0
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
                    Overall Similarity: 62%
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

              

              {/* pass sectionRows to the table below */}
              <div style={{ marginTop: 16 }}>
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
                            {r.matches === 0 ? "No match found" : `${r.matches} matched excerpts`}
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

  

        {/* All matched excerpts (Dummy) */}
        <div style={{ marginTop: 18 }}>
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

          {[
            {
              section: "Learning Outcomes",
              app: "Explain diode/transistor operations and apply circuit analysis methods to solve electronics problems.",
              sun: "Describe characteristics of discrete components and analyze rectifier/amplifier circuit operations.",
              why: "Same intent: component behaviour + circuit analysis (semantic match)."
            },
            {
              section: "Learning Outcomes",
              app: "Apply fundamental circuit laws (KCL/KVL) to analyse simple electronic circuits.",
              sun: "Analyse the operations of rectifier circuits using circuit principles.",
              why: "Both evaluate circuit analysis skills (different wording)."
            },
            {
              section: "Assessment",
              app: "Assessment includes quizzes, lab exercises, and final examination.",
              sun: "Assessment comprises quizzes, laboratory practicals, and a final exam.",
              why: "Same assessment structure."
            },
            {
              section: "Topics",
              app: "Topics include diodes, BJTs, and basic amplifier circuits.",
              sun: "Topics include diodes, BJTs, FETs, and amplifiers.",
              why: "Overlapping key topic list."
            },
          ].map((row, idx) => (
            <div
              key={idx}
              style={{
                display: "grid",
                gridTemplateColumns: "180px 1fr 1fr 1fr",
                gap: 12,
                padding: "12px 0",
                borderBottom: "1px solid #f2f2f2",
                fontSize: 13,
                alignItems: "start",
              }}
            >
              <div style={{ fontWeight: 800 }}>{row.section}</div>

              <div style={{ background: "#F5F5F5", borderRadius: 12, padding: 10, lineHeight: 1.4 }}>
                {row.app}
              </div>

              <div style={{ background: "#F5F5F5", borderRadius: 12, padding: 10, lineHeight: 1.4 }}>
                {row.sun}
              </div>

              <div style={{ color: "#555", lineHeight: 1.4 }}>
                {row.why}
              </div>
            </div>
          ))}
        </div>


        <div style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
          Similarity evidence is generated by Gemini
          using semantic comparison (synonyms/meaning-based matches).
        </div>
      </div>

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
  height: "calc(100vh - 210px)", // keeps PDFs visible without horizontal scroll
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
