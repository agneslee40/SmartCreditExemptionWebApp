import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import PdfViewer from "../components/PdfViewer";

export default function ApplicationReview() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState(null);

  const [selectedApplicantDocId, setSelectedApplicantDocId] = useState(null);
  const [selectedSunwayCode, setSelectedSunwayCode] = useState("");

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
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (!payload) return <div style={{ padding: 24 }}>No data.</div>;

  const docs = payload.applicant_documents || [];
  const selectedApplicant = docs.find(d => d.id === selectedApplicantDocId) || null;

  const sunwayCourses = payload.sunway_courses || [];
  const selectedSunway =
    sunwayCourses.find(c => c.subject_code === selectedSunwayCode) || null;

  return (
    <div style={{ display: "flex", height: "calc(100vh - 80px)" }}>
      {/* Left sidebar */}
      <div style={{ width: 320, borderRight: "1px solid #eee", padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>Applicant Documents</h3>

        <select
          style={{ width: "100%", padding: 8 }}
          value={selectedApplicantDocId ?? ""}
          onChange={(e) => setSelectedApplicantDocId(Number(e.target.value))}
        >
          {docs.map(d => (
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
            {sunwayCourses.map(c => (
              <option key={c.subject_code} value={c.subject_code}>
                {c.subject_code} — {c.subject_name}
              </option>
            ))}
          </select>
        )}

        <div style={{ marginTop: 12, fontSize: 12, color: "#666" }}>
          <div><b>Applicant URL</b></div>
          <div style={{ wordBreak: "break-all" }}>
            {selectedApplicant?.file_url || "-"}
          </div>

          <div style={{ marginTop: 10 }}><b>Sunway URL</b></div>
          <div style={{ wordBreak: "break-all" }}>
            {selectedSunway?.syllabus_url || "-"}
          </div>
        

        
        </div>

        <hr style={{ margin: "16px 0" }} />
        <h3 style={{ marginTop: 0 }}>AI Analysis</h3>

        {payload.ai_analysis ? (
        <div style={{ fontSize: 13, lineHeight: 1.4 }}>
            <div><b>Decision:</b> {payload.ai_analysis.decision}</div>
            <div><b>Similarity:</b> {(payload.ai_analysis.similarity * 100).toFixed(0)}%</div>
            <div><b>Grade:</b> {payload.ai_analysis.grade_detected || "-"}</div>
            <div><b>Credit Hours:</b> {payload.ai_analysis.credit_hours ?? "-"}</div>

            <div style={{ marginTop: 10 }}>
            <b>Checks</b>
            <pre style={{ whiteSpace: "pre-wrap", background: "#f7f7f7", padding: 8, borderRadius: 8 }}>
                {JSON.stringify(payload.ai_analysis.reasoning?.checks, null, 2)}
            </pre>
            </div>
        </div>
        ) : (
        <div style={{ fontSize: 13, color: "#666" }}>
            No AI analysis yet.
        </div>
        )}
      </div>
      


      {/* Main: side-by-side viewers */}
      <div style={{ flex: 1, display: "flex" }}>
        <div style={{ flex: 1, borderRight: "1px solid #eee" }}>
          <div style={{ padding: 10, fontWeight: 600 }}>Applicant PDF</div>
          <PdfViewer fileUrl={selectedApplicant?.file_url} />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ padding: 10, fontWeight: 600 }}>Sunway Syllabus PDF</div>
          <PdfViewer fileUrl={selectedSunway?.syllabus_url} />
        </div>
      </div>
    </div>
  );
}
