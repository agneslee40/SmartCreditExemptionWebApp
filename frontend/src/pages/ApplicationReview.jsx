import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import PdfViewer from "../components/PdfViewer";

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
      await api.post(`/applications/${id}/accept-ai`, {
        // optional: record which syllabus they were viewing
        sunway_subject_code: selectedSunwayCode
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
        <div>
          <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Application Review</div>
          <div style={{ color: "#666", fontSize: 13 }}>
            {application ? `Case: ${application.application_id} • ${application.type}` : "Loading case…"}
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
                <div><b>Decision:</b> {ai.decision}</div>
                <div><b>Similarity:</b> {(ai.similarity * 100).toFixed(0)}%</div>
                <div><b>Grade:</b> {ai.grade_detected || "-"}</div>
                <div><b>Credit Hours:</b> {ai.credit_hours ?? "-"}</div>

                <div style={{ marginTop: 10 }}>
                  <div style={{ fontWeight: 800, marginBottom: 6 }}>Checks</div>
                  <pre style={preStyle}>
                    {JSON.stringify(ai.reasoning?.checks, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Similarity Evidence */}
          <div style={cardStyle}>
            <div style={cardTitle}>Similarity Evidence</div>

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
                {/* section scores */}
                <div>
                  <div style={{ fontWeight: 800, marginBottom: 6 }}>Sections</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {(evidence.evidence.section_scores || []).slice(0, 5).map((s) => (
                      <div key={s.section} style={pillStyle}>
                        {s.section}: {(s.avg_score * 100).toFixed(0)}% • {s.matches} matches
                      </div>
                    ))}
                  </div>
                </div>

                {/* top pairs */}
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
                  *This evidence is generated by matching text chunks extracted from PDFs (local cosine similarity).
                </div>
              </div>
            )}
          </div>

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
          <div style={pdfTitle}>Applicant PDF</div>
          <div style={pdfBody}>
            {loading ? <div style={{ padding: 16 }}>Loading…</div> : <PdfViewer fileUrl={selectedApplicant?.file_url} />}
          </div>
        </div>

        {/* RIGHT PDF */}
        <div style={pdfCard}>
          <div style={pdfTitle}>Sunway Syllabus PDF</div>
          <div style={pdfBody}>
            {loading ? <div style={{ padding: 16 }}>Loading…</div> : <PdfViewer fileUrl={selectedSunway?.syllabus_url} />}
          </div>
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
  overflow: "hidden"
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
