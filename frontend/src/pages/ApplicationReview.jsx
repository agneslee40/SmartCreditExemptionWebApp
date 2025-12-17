import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import PdfViewer from "../components/PdfViewer";

export default function ApplicationReview() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState(null);
  const [selectedDocId, setSelectedDocId] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await api.get(`/applications/${id}/review`);
        setPayload(res.data);

        const first = res.data?.applicant_documents?.[0];
        setSelectedDocId(first?.id ?? null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (!payload) return <div style={{ padding: 24 }}>No data.</div>;

  const docs = payload.applicant_documents || [];
  const selectedDoc = docs.find(d => d.id === selectedDocId) || null;

  return (
    <div style={{ display: "flex", height: "calc(100vh - 80px)" }}>
      {/* Left sidebar */}
      <div style={{ width: 320, borderRight: "1px solid #eee", padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>Applicant Documents</h3>

        <select
          style={{ width: "100%", padding: 8 }}
          value={selectedDocId ?? ""}
          onChange={(e) => setSelectedDocId(Number(e.target.value))}
        >
          {docs.map(d => (
            <option key={d.id} value={d.id}>
              {d.file_name}
            </option>
          ))}
        </select>

        <div style={{ marginTop: 12, fontSize: 13, color: "#666" }}>
          Selected URL:
          <div style={{ wordBreak: "break-all" }}>
            {selectedDoc?.file_url || "-"}
          </div>
        </div>
      </div>

      {/* Main viewer */}
      <div style={{ flex: 1 }}>
        <PdfViewer fileUrl={selectedDoc?.file_url} />
      </div>
    </div>
  );
}
