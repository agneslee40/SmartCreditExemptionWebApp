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

  // override UI state
  const [overrideOpen, setOverrideOpen] = useState(false);

  // Override inputs
  const [finalSimilarity, setFinalSimilarity] = useState(""); // percent 0-100
  const [finalGrade, setFinalGrade] = useState("");
  const [finalCreditHours, setFinalCreditHours] = useState("");
  const [overrideReason, setOverrideReason] = useState("");

  async function reload() {
    const res = await api.get(`/applications/${id}/review`);
    const data = res.data;
    setPayload(data);

    const firstApplicant = data?.applicant_documents?.[0];
    setSelectedApplicantDocId(firstApplicant?.id ?? null);

    const firstSunway = data?.sunway_courses?.[0];
    setSelectedSunwayCode(firstSunway?.subject_code ?? "");

    // Initialize override fields:
    // 1) if application already has final_* -> show those
    // 2) else default to AI suggested values
    const app = data?.application;
    const ai = data?.ai_analysis;

    const simPct =
      app?.final_similarity != null
        ? String(Math.round(app.final_similarity * 100))
        : ai?.similarity != null
          ? String(Math.round(ai.similarity * 100))
          : "";

    const grade =
      app?.final_grade != null && app.final_grade !== ""
        ? app.final_grade
        : ai?.grade_detected ?? "";

    const ch =
      app?.final_credit_hours != null
        ? String(app.final_credit_hours)
        : ai?.credit_hours != null
          ? String(ai.credit_hours)
          : "";

    setFinalSimilarity(simPct);
    setFinalGrade(grade);
    setFinalCreditHours(ch);

    // if already overridden before, open the panel and show reason
    if (app?.override_reason) {
      setOverrideOpen(true);
      setOverrideReason(app.override_reason);
    } else {
      setOverrideReason("");
    }
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await reload();
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const docs = payload?.applicant_documents || [];
  const sunwayCourses = payload?.sunway_courses || [];
  const app = payload?.application;
  const ai = payload?.ai_analysis;

  const selectedApplicant =
    docs.find((d) => d.id === selectedApplicantDocId) || null;

  const selectedSunway =
    sunwayCourses.find((c) => c.subject_code === selectedSunwayCode) || null;

  const checks = useMemo(() => {
    const sim = Number(finalSimilarity);
    const ch = Number(finalCreditHours);
    const sunwayCH = Number(selectedSunway?.credit_hours ?? 0);

    return {
      similarityPass: Number.isFinite(sim) && sim >= 80,
      gradePass: gradeAtLeastC(finalGrade),
      creditHoursPass: Number.isFinite(ch) && ch >= sunwayCH,
    };
  }, [finalSimilarity, finalGrade, finalCreditHours, selectedSunway]);

  const allPass = checks.similarityPass && checks.gradePass && checks.creditHoursPass;
  const finalDecision = allPass ? "Approve" : "Reject";

  async function acceptAI() {
    if (!ai) {
      alert("No AI analysis to accept yet.");
      return;
    }
    try {
      await api.post(`/applications/${id}/override`, {
        final_similarity: ai.similarity,            // already 0-1
        final_grade: ai.grade_detected,
        final_credit_hours: ai.credit_hours,
        override_reason: "Accepted AI recommendation",
        final_decision: ai.decision || "Approve",
        sunway_subject_code: selectedSunwayCode,
      });

      alert("Saved as Reviewed ✅ (AI accepted)");
      await reload();
    } catch (e) {
      console.error(e);
      alert("Failed to accept AI ❌ (check backend logs)");
    }
  }

  async function saveOverride() {
    if (!overrideReason.trim()) {
      alert("Override reason is required.");
      return;
    }
    try {
      await api.post(`/applications/${id}/override`, {
        final_similarity: Number(finalSimilarity) / 100,
        final_grade: finalGrade,
        final_credit_hours: Number(finalCreditHours),
        override_reason: overrideReason,
        final_decision: finalDecision,
        sunway_subject_code: selectedSunwayCode,
      });

      alert("Override saved ✅");
      await reload();
    } catch (e) {
      console.error(e);
      alert("Failed to save override ❌ (check backend logs)");
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (!payload) return <div style={{ padding: 24 }}>No data.</div>;

  // Evidence placeholder (UI-ready)
  const evidence = ai?.reasoning?.evidence || []; // later you fill this from backend

  return (
    <div style={{ padding: 16 }}>
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>Application Review</div>
          <div style={{ color: "#666", fontSize: 13 }}>
            {app?.application_id ? `Case: ${app.application_id}` : `ID: ${id}`}
            {" "}•{" "}
            {app?.type || "-"}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={acceptAI}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "#fff",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Accept AI Recommendation
          </button>

          <button
            onClick={() => setOverrideOpen((v) => !v)}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: overrideOpen ? "#111827" : "#fff",
              color: overrideOpen ? "#fff" : "#111827",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            {overrideOpen ? "Close Override" : "Override"}
          </button>
        </div>
      </div>

      {/* Main layout: Left panel + two PDFs */}
      <div style={{ display: "flex", gap: 14, height: "calc(100vh - 170px)" }}>
        {/* Left panel (LOCKED width so it will NEVER become cramped) */}
        <div
          style={{
            flex: "0 0 360px",
            minWidth: 360,
            maxWidth: 360,
            border: "1px solid #eee",
            borderRadius: 16,
            padding: 14,
            overflowY: "auto",
            background: "#fff",
          }}
        >
          {/* Selectors */}
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Documents</div>

          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
              Applicant Documents
            </div>
            <select
              style={{ width: "100%", padding: 10, borderRadius: 10 }}
              value={selectedApplicantDocId ?? ""}
              onChange={(e) => setSelectedApplicantDocId(Number(e.target.value))}
            >
              {docs.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.file_name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
              Sunway Syllabus
            </div>

            {sunwayCourses.length === 0 ? (
              <div style={{ fontSize: 13, color: "crimson" }}>
                No Sunway course matched.
                <br />
                Check requested_subject_code and sunway_courses table.
              </div>
            ) : (
              <select
                style={{ width: "100%", padding: 10, borderRadius: 10 }}
                value={selectedSunwayCode}
                onChange={(e) => setSelectedSunwayCode(e.target.value)}
              >
                {sunwayCourses.map((c) => (
                  <option key={c.subject_code} value={c.subject_code}>
                    {c.subject_code} — {c.subject_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <hr style={{ margin: "14px 0" }} />

          {/* AI Decision card */}
          <div style={{ fontWeight: 800, marginBottom: 8 }}>System Suggestion</div>
          {ai ? (
            <div
              style={{
                padding: 12,
                borderRadius: 14,
                background: "#f7f7f7",
                border: "1px solid #eee",
              }}
            >
              <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                <div><b>Decision:</b> {ai.decision}</div>
                <div><b>Similarity:</b> {(ai.similarity * 100).toFixed(0)}%</div>
                <div><b>Grade:</b> {ai.grade_detected || "-"}</div>
                <div><b>Credit Hours:</b> {ai.credit_hours ?? "-"}</div>
              </div>

              <div style={{ marginTop: 10 }}>
                <div style={{ fontWeight: 800, fontSize: 13 }}>Checks</div>
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    background: "#fff",
                    padding: 10,
                    borderRadius: 12,
                    border: "1px solid #eee",
                    fontSize: 12,
                    marginTop: 6,
                  }}
                >
                  {JSON.stringify(ai.reasoning?.checks, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: "#666" }}>No AI analysis yet.</div>
          )}

          <hr style={{ margin: "14px 0" }} />

          {/* Evidence placeholder */}
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Similarity Evidence</div>
          {evidence.length === 0 ? (
            <div style={{ fontSize: 13, color: "#666" }}>
              Evidence not available yet.
              <br />
              (Next step: backend should return matched text pairs like
              “Sunway CO1 ↔ Applicant topic paragraph”)
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {evidence.map((ev, idx) => (
                <div
                  key={idx}
                  style={{
                    border: "1px solid #eee",
                    borderRadius: 12,
                    padding: 10,
                    background: "#fff",
                  }}
                >
                  <div style={{ fontSize: 12, color: "#666" }}>
                    Match Score: {Math.round((ev.score ?? 0) * 100)}%
                  </div>
                  <div style={{ marginTop: 6, fontSize: 12 }}>
                    <b>Sunway:</b> {ev.sunway_excerpt}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 12 }}>
                    <b>Applicant:</b> {ev.applicant_excerpt}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Override panel */}
          {overrideOpen && (
            <>
              <hr style={{ margin: "14px 0" }} />
              <div style={{ fontWeight: 800, marginBottom: 8 }}>Manual Override</div>

              <div style={{ fontSize: 13 }}>
                <label style={{ fontWeight: 700 }}>Final Similarity (%)</label>
                <input
                  type="number"
                  value={finalSimilarity}
                  onChange={(e) => setFinalSimilarity(e.target.value)}
                  style={{ width: "100%", padding: 10, borderRadius: 10, marginTop: 6 }}
                />

                <div style={{ height: 10 }} />

                <label style={{ fontWeight: 700 }}>Final Grade</label>
                <input
                  value={finalGrade}
                  onChange={(e) => setFinalGrade(e.target.value)}
                  style={{ width: "100%", padding: 10, borderRadius: 10, marginTop: 6 }}
                />

                <div style={{ height: 10 }} />

                <label style={{ fontWeight: 700 }}>Final Credit Hours</label>
                <input
                  type="number"
                  value={finalCreditHours}
                  onChange={(e) => setFinalCreditHours(e.target.value)}
                  style={{ width: "100%", padding: 10, borderRadius: 10, marginTop: 6 }}
                />

                <div style={{ height: 10 }} />

                <label style={{ fontWeight: 700 }}>Override Reason (required)</label>
                <textarea
                  rows={3}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  style={{ width: "100%", padding: 10, borderRadius: 10, marginTop: 6 }}
                />
              </div>

              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 14,
                  background: "#f7f7f7",
                  border: "1px solid #eee",
                }}
              >
                <div style={{ fontWeight: 800, marginBottom: 6 }}>Rule Evaluation</div>
                <div>Similarity ≥ 80%: {checks.similarityPass ? "✅" : "❌"}</div>
                <div>Grade ≥ C: {checks.gradePass ? "✅" : "❌"}</div>
                <div>
                  Credit Hours ≥ Sunway ({selectedSunway?.credit_hours ?? 0}):{" "}
                  {checks.creditHoursPass ? "✅" : "❌"}
                </div>

                <div style={{ marginTop: 8 }}>
                  <b>Final Decision:</b>{" "}
                  <span style={{ color: allPass ? "green" : "crimson" }}>
                    {allPass ? "APPROVE" : "REJECT"}
                  </span>
                </div>
              </div>

              <button
                onClick={saveOverride}
                style={{
                  marginTop: 12,
                  width: "100%",
                  padding: 12,
                  borderRadius: 12,
                  border: "none",
                  background: "#111827",
                  color: "#fff",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Save Override
              </button>
            </>
          )}
        </div>

        {/* PDF columns */}
        <div style={{ flex: 1, display: "flex", gap: 14, minWidth: 0 }}>
          <div
            style={{
              flex: 1,
              minWidth: 0,
              border: "1px solid #eee",
              borderRadius: 16,
              background: "#fff",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ padding: 12, fontWeight: 800, borderBottom: "1px solid #eee" }}>
              Applicant PDF
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <PdfViewer fileUrl={selectedApplicant?.file_url} />
            </div>
          </div>

          <div
            style={{
              flex: 1,
              minWidth: 0,
              border: "1px solid #eee",
              borderRadius: 16,
              background: "#fff",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ padding: 12, fontWeight: 800, borderBottom: "1px solid #eee" }}>
              Sunway Syllabus PDF
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <PdfViewer fileUrl={selectedSunway?.syllabus_url} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
