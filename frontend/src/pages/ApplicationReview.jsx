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

  // Override inputs (human editable)
  const [finalSimilarity, setFinalSimilarity] = useState(""); // percent 0-100
  const [finalGrade, setFinalGrade] = useState("");
  const [finalCreditHours, setFinalCreditHours] = useState("");
  const [overrideReason, setOverrideReason] = useState("");

  // Load review payload
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await api.get(`/applications/${id}/review`);
        const data = res.data;
        setPayload(data);

        const firstApplicant = data?.applicant_documents?.[0];
        setSelectedApplicantDocId(firstApplicant?.id ?? null);

        const firstSunway = data?.sunway_courses?.[0];
        setSelectedSunwayCode(firstSunway?.subject_code ?? "");

        // Initialize override fields from AI
        const ai = data?.ai_analysis;
        setFinalSimilarity(
          ai?.similarity != null ? String(Math.round(ai.similarity * 100)) : ""
        );
        setFinalGrade(ai?.grade_detected ?? "");
        setFinalCreditHours(
          ai?.credit_hours != null ? String(ai.credit_hours) : ""
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // ✅ Derived values (safe even when payload is null)
  const docs = payload?.applicant_documents || [];
  const sunwayCourses = payload?.sunway_courses || [];

  const selectedApplicant =
    docs.find((d) => d.id === selectedApplicantDocId) || null;

  const selectedSunway =
    sunwayCourses.find((c) => c.subject_code === selectedSunwayCode) || null;

  const ai = payload?.ai_analysis;

  // ✅ Hooks MUST always run (no early return before this)
  const checks = useMemo(() => {
    const sim = Number(finalSimilarity);
    const ch = Number(finalCreditHours);
    const sunwayCH = Number(selectedSunway?.credit_hours ?? 0);

    return {
      similarityPass: Number.isFinite(sim) && sim >= 80,
      gradePass: gradeAtLeastC(finalGrade),
      creditHoursPass: Number.isFinite(ch) && ch >= sunwayCH
    };
  }, [finalSimilarity, finalGrade, finalCreditHours, selectedSunway?.credit_hours]);

  const allPass =
    checks.similarityPass && checks.gradePass && checks.creditHoursPass;

  async function saveOverride() {
    if (!overrideReason.trim()) {
      alert("Please enter an override reason (required).");
      return;
    }

    try {
      await api.post(`/applications/${id}/override`, {
        final_similarity: Number(finalSimilarity) / 100, // store 0.82 etc
        final_grade: finalGrade,
        final_credit_hours: Number(finalCreditHours),
        override_reason: overrideReason,
        final_decision: allPass ? "Approve" : "Reject",
        sunway_subject_code: selectedSunwayCode
      });

      alert("Override saved ✅");

      // reload
      const res = await api.get(`/applications/${id}/review`);
      setPayload(res.data);
    } catch (e) {
      console.error(e);
      alert("Failed to save override ❌ (check backend route / console)");
    }
  }

  // ✅ Now safe to return early (hooks already ran)
  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (!payload) return <div style={{ padding: 24 }}>No data.</div>;

  return (
    <div style={{ display: "flex", height: "calc(100vh - 80px)" }}>
      {/* Left sidebar */}
      <div
        style={{
          width: 340,
          minWidth: 380,
          flexShrink: 0,
          borderRight: "1px solid #eee",
          padding: 16,
          overflowY: "auto"
        }}
      >
        <h3 style={{ marginTop: 0 }}>Applicant Documents</h3>

        <select
          style={{ width: "100%", padding: 8 }}
          value={selectedApplicantDocId ?? ""}
          onChange={(e) => setSelectedApplicantDocId(Number(e.target.value))}
        >
          {docs.map((d) => (
            <option key={d.id} value={d.id}>
              {d.file_name}
            </option>
          ))}
        </select>

        <hr style={{ margin: "16px 0" }} />

        <h3 style={{ marginTop: 0 }}>Sunway Syllabus</h3>

        {sunwayCourses.length === 0 ? (
          <div style={{ fontSize: 13, color: "crimson" }}>
            No Sunway course matched.
            <br />
            Check requested_subject_code and sunway_courses table.
          </div>
        ) : (
          <select
            style={{ width: "100%", padding: 8 }}
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

        <div style={{ marginTop: 12, fontSize: 12, color: "#666" }}>
          <div>
            <b>Applicant URL</b>
          </div>
          <div style={{ wordBreak: "break-all" }}>
            {selectedApplicant?.file_url || "-"}
          </div>

          <div style={{ marginTop: 10 }}>
            <b>Sunway URL</b>
          </div>
          <div style={{ wordBreak: "break-all" }}>
            {selectedSunway?.syllabus_url || "-"}
          </div>
        </div>

        <hr style={{ margin: "16px 0" }} />
        <h3 style={{ marginTop: 0 }}>AI Analysis</h3>

        {ai ? (
          <div style={{ fontSize: 13, lineHeight: 1.4 }}>
            <div>
              <b>Decision:</b> {ai.decision}
            </div>
            <div>
              <b>Similarity:</b> {(ai.similarity * 100).toFixed(0)}%
            </div>
            <div>
              <b>Grade:</b> {ai.grade_detected || "-"}
            </div>
            <div>
              <b>Credit Hours:</b> {ai.credit_hours ?? "-"}
            </div>

            <div style={{ marginTop: 10 }}>
              <b>Checks</b>
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  background: "#f7f7f7",
                  padding: 8,
                  borderRadius: 8
                }}
              >
                {JSON.stringify(ai.reasoning?.checks, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: "#666" }}>No AI analysis yet.</div>
        )}

        <hr style={{ margin: "16px 0" }} />
        <h3 style={{ marginTop: 0 }}>Manual Override</h3>

        <div style={{ fontSize: 13 }}>
          <label>Final Similarity (%)</label>
          <input
            type="number"
            value={finalSimilarity}
            onChange={(e) => setFinalSimilarity(e.target.value)}
            style={{ width: "100%", padding: 6, marginTop: 4 }}
          />

          <div style={{ height: 8 }} />

          <label>Final Grade</label>
          <input
            value={finalGrade}
            onChange={(e) => setFinalGrade(e.target.value)}
            style={{ width: "100%", padding: 6, marginTop: 4 }}
          />

          <div style={{ height: 8 }} />

          <label>Final Credit Hours</label>
          <input
            type="number"
            value={finalCreditHours}
            onChange={(e) => setFinalCreditHours(e.target.value)}
            style={{ width: "100%", padding: 6, marginTop: 4 }}
          />

          <div style={{ height: 8 }} />

          <label>Override Reason (required)</label>
          <textarea
            rows={3}
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
            style={{ width: "100%", padding: 6, marginTop: 4 }}
          />
        </div>

        <div
          style={{
            marginTop: 12,
            padding: 10,
            background: "#f7f7f7",
            borderRadius: 8
          }}
        >
          <div>
            <b>Rule Evaluation</b>
          </div>
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
          style={{ marginTop: 12, width: "100%", padding: 10 }}
          onClick={saveOverride}
        >
          Save Override
        </button>
      </div>

      {/* Main: side-by-side viewers */}
      <div style={{ flex: 1, display: "flex" }}>
        <div style={{ flex: 1, borderRight: "1px solid #eee" }}>
          <div style={{ padding: 10, fontWeight: 600 }}>Applicant PDF</div>
          {selectedApplicant?.file_url ? (
            <PdfViewer fileUrl={selectedApplicant.file_url} />
          ) : (
            <div style={{ padding: 20, color: "#666" }}>
              No applicant document selected.
            </div>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ padding: 10, fontWeight: 600 }}>Sunway Syllabus PDF</div>
          {selectedSunway?.syllabus_url ? (
            <PdfViewer fileUrl={selectedSunway.syllabus_url} />
          ) : (
            <div style={{ padding: 20, color: "#666" }}>
              No Sunway syllabus selected.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
