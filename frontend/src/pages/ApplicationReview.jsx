import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";

// IMPORTANT: make sure you have this somewhere in your app setup too.
// If you already configured worker elsewhere, you can remove this line.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const API = "http://localhost:5000/api";

export default function ApplicationReview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [runningAI, setRunningAI] = useState(false);

  const [application, setApplication] = useState(null);
  const [applicantDocs, setApplicantDocs] = useState([]);
  const [sunwayCourses, setSunwayCourses] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  // selections
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [selectedSunwayCode, setSelectedSunwayCode] = useState("");

  // pdf paging + zoom
  const [appNumPages, setAppNumPages] = useState(null);
  const [sunNumPages, setSunNumPages] = useState(null);
  const [appPage, setAppPage] = useState(1);
  const [sunPage, setSunPage] = useState(1);
  const [appScale, setAppScale] = useState(0.85);
  const [sunScale, setSunScale] = useState(0.85);

  // override UI
  const [showOverride, setShowOverride] = useState(false);
  const [overrideDecision, setOverrideDecision] = useState("Approve");
  const [overrideReason, setOverrideReason] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedDoc = useMemo(
    () => applicantDocs.find((d) => d.id === Number(selectedDocId)),
    [applicantDocs, selectedDocId]
  );

  const selectedSunway = useMemo(
    () => sunwayCourses.find((s) => s.subject_code === selectedSunwayCode),
    [sunwayCourses, selectedSunwayCode]
  );

  // load review payload
  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/applications/${id}/review`);
        if (!alive) return;

        setApplication(res.data.application);
        setApplicantDocs(res.data.applicant_documents || []);
        setSunwayCourses(res.data.sunway_courses || []);
        setAiAnalysis(res.data.ai_analysis || null);

        // default selections
        const firstDoc = (res.data.applicant_documents || [])[0];
        const firstSun = (res.data.sunway_courses || [])[0];

        setSelectedDocId(firstDoc ? firstDoc.id : null);
        setSelectedSunwayCode(firstSun ? firstSun.subject_code : "");

        setAppPage(1);
        setSunPage(1);
      } catch (e) {
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [id]);

  // auto-run AI if none exists (after we have defaults)
  useEffect(() => {
    if (loading) return;
    if (!application) return;
    if (aiAnalysis) return;
    if (!selectedDocId || !selectedSunwayCode) return;

    let alive = true;

    async function run() {
      setRunningAI(true);
      try {
        const res = await axios.post(`${API}/applications/${id}/run-ai`, {
          docId: Number(selectedDocId),
          sunwayCode: String(selectedSunwayCode),
        });
        if (!alive) return;
        setAiAnalysis(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        if (alive) setRunningAI(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [loading, application, aiAnalysis, id, selectedDocId, selectedSunwayCode]);

  const similarityPct = useMemo(() => {
    const sim = aiAnalysis?.similarity;
    if (typeof sim !== "number") return "-";
    return `${Math.round(sim * 100)}%`;
  }, [aiAnalysis]);

  const evidence = aiAnalysis?.reasoning?.evidence || null;
  const topPairs = evidence?.top_pairs || [];
  const sectionScores = evidence?.section_scores || [];

  async function acceptAI() {
    try {
      setSaving(true);
      await axios.post(`${API}/applications/${id}/override`, {
        accept_ai: true,
        overridden_by: null, // later replace with auth user id
        sunway_subject_code: selectedSunwayCode || null,
      });
      // refresh review payload to reflect updated application fields (optional)
      const res = await axios.get(`${API}/applications/${id}/review`);
      setAiAnalysis(res.data.ai_analysis || aiAnalysis);
    } catch (e) {
      console.error(e);
      alert("Failed to accept AI");
    } finally {
      setSaving(false);
    }
  }

  async function saveOverride() {
    if (!overrideReason.trim()) {
      alert("Override reason is required.");
      return;
    }
    try {
      setSaving(true);
      await axios.post(`${API}/applications/${id}/override`, {
        accept_ai: false,
        final_decision: overrideDecision,
        override_reason: overrideReason.trim(),
        overridden_by: null,
        sunway_subject_code: selectedSunwayCode || null,
      });
      setShowOverride(false);
      setOverrideReason("");
      // refresh
      const res = await axios.get(`${API}/applications/${id}/review`);
      setAiAnalysis(res.data.ai_analysis || aiAnalysis);
    } catch (e) {
      console.error(e);
      alert("Failed to save override");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (!application) return <div style={{ padding: 24 }}>No data.</div>;

  return (
    <div style={{ padding: "28px 40px" }}>
      {/* Top bar: back + title + actions */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, justifyContent: "space-between" }}>
        <div>
          <button
            onClick={() => navigate(-1)}
            style={{
              border: "1px solid #e5e7eb",
              background: "white",
              borderRadius: 10,
              padding: "8px 12px",
              cursor: "pointer",
              marginBottom: 14,
            }}
          >
            ← Back
          </button>

          <h2 style={{ margin: 0 }}>Application Review</h2>
          <div style={{ marginTop: 6, color: "#6b7280" }}>
            Case: {application.application_id} • {application.type}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            onClick={acceptAI}
            disabled={saving || runningAI || !aiAnalysis}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              background: "white",
              cursor: saving || runningAI || !aiAnalysis ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
            title={!aiAnalysis ? "AI analysis not ready yet" : "Accept AI recommendation"}
          >
            Accept AI Recommendation
          </button>

          <button
            onClick={() => setShowOverride(true)}
            disabled={saving}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid #111827",
              background: "#111827",
              color: "white",
              cursor: saving ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            Override
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "360px 1fr 1fr",
          gap: 18,
          alignItems: "start",
        }}
      >
        {/* LEFT PANEL */}
        <div
          style={{
            border: "1px solid #eef0f3",
            borderRadius: 16,
            padding: 16,
            background: "white",
            height: "calc(100vh - 220px)",
            overflow: "auto",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Documents</h3>

          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Applicant Documents</div>
          <select
            value={selectedDocId || ""}
            onChange={(e) => {
              setSelectedDocId(e.target.value);
              setAppPage(1);
            }}
            style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #e5e7eb" }}
          >
            {applicantDocs.map((d) => (
              <option key={d.id} value={d.id}>
                {d.file_name}
              </option>
            ))}
          </select>

          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 14, marginBottom: 6 }}>Sunway Syllabus</div>
          <select
            value={selectedSunwayCode}
            onChange={(e) => {
              setSelectedSunwayCode(e.target.value);
              setSunPage(1);
            }}
            style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #e5e7eb" }}
          >
            {sunwayCourses.map((s) => (
              <option key={s.subject_code} value={s.subject_code}>
                {s.subject_code} — {s.subject_name}
              </option>
            ))}
          </select>

          {/* System Suggestion */}
          <div style={{ marginTop: 18 }}>
            <h3>System Suggestion</h3>

            <div
              style={{
                background: "#f9fafb",
                border: "1px solid #eef0f3",
                borderRadius: 14,
                padding: 12,
              }}
            >
              <div style={{ fontWeight: 700 }}>
                Decision:{" "}
                <span style={{ fontWeight: 700 }}>
                  {runningAI ? "Generating…" : aiAnalysis?.decision || "-"}
                </span>
              </div>
              <div style={{ marginTop: 6, fontWeight: 700 }}>
                Similarity: <span style={{ fontWeight: 700 }}>{runningAI ? "…" : similarityPct}</span>
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
                Similarity is computed from extracted PDF text and supported by the evidence below.
              </div>
            </div>
          </div>

          {/* Similarity Evidence */}
          <div style={{ marginTop: 18 }}>
            <h3>Similarity Evidence</h3>

            {!aiAnalysis && !runningAI && (
              <div style={{ fontSize: 13, color: "#6b7280" }}>
                Evidence will appear after AI analysis is generated.
              </div>
            )}

            {runningAI && (
              <div style={{ fontSize: 13, color: "#6b7280" }}>
                Generating evidence…
              </div>
            )}

            {!!aiAnalysis && (
              <>
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Sections</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {sectionScores.map((s) => (
                      <div
                        key={s.section}
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: 999,
                          padding: "6px 10px",
                          background: "white",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {s.section}: {Math.round(s.avg_score * 100)}% • {s.matches} matches
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Top Matched Excerpts</div>

                  {topPairs.length === 0 && (
                    <div style={{ fontSize: 13, color: "#6b7280" }}>
                      No strong matches found (try different doc / syllabus).
                    </div>
                  )}

                  {topPairs.map((p, idx) => (
                    <div
                      key={idx}
                      style={{
                        border: "1px solid #eef0f3",
                        borderRadius: 14,
                        padding: 12,
                        background: "white",
                        marginBottom: 10,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <div style={{ fontWeight: 800 }}>
                          Match #{idx + 1} • {Math.round(p.score * 100)}%
                        </div>
                        <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 700 }}>{p.section}</div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>Applicant</div>
                          <div
                            style={{
                              background: "#f9fafb",
                              border: "1px solid #eef0f3",
                              borderRadius: 12,
                              padding: 10,
                              maxHeight: 120,
                              overflow: "auto",
                              fontSize: 12,
                              lineHeight: 1.35,
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {p.applicant_excerpt}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>Sunway</div>
                          <div
                            style={{
                              background: "#f9fafb",
                              border: "1px solid #eef0f3",
                              borderRadius: 12,
                              padding: 10,
                              maxHeight: 120,
                              overflow: "auto",
                              fontSize: 12,
                              lineHeight: 1.35,
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {p.sunway_excerpt}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
                    *Evidence is generated by matching text chunks extracted from PDFs (TF cosine).
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* MIDDLE: Applicant PDF */}
        <PdfCard
          title="Applicant PDF"
          fileUrl={selectedDoc?.file_url}
          page={appPage}
          setPage={setAppPage}
          numPages={appNumPages}
          setNumPages={setAppNumPages}
          scale={appScale}
          setScale={setAppScale}
        />

        {/* RIGHT: Sunway PDF */}
        <PdfCard
          title="Sunway Syllabus PDF"
          fileUrl={selectedSunway?.syllabus_url}
          page={sunPage}
          setPage={setSunPage}
          numPages={sunNumPages}
          setNumPages={setSunNumPages}
          scale={sunScale}
          setScale={setSunScale}
        />
      </div>

      {/* Override modal */}
      {showOverride && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(17,24,39,0.35)",
            display: "grid",
            placeItems: "center",
            zIndex: 50,
          }}
          onClick={() => setShowOverride(false)}
        >
          <div
            style={{
              width: 520,
              background: "white",
              borderRadius: 18,
              padding: 18,
              border: "1px solid #eef0f3",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>Manual Override</h3>

            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Final Decision</div>
              <select
                value={overrideDecision}
                onChange={(e) => setOverrideDecision(e.target.value)}
                style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #e5e7eb" }}
              >
                <option value="Approve">Approve</option>
                <option value="Reject">Reject</option>
              </select>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Override Reason (required)</div>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                rows={4}
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
              <button
                onClick={() => setShowOverride(false)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  background: "white",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveOverride}
                disabled={saving}
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "1px solid #111827",
                  background: "#111827",
                  color: "white",
                  cursor: saving ? "not-allowed" : "pointer",
                  fontWeight: 700,
                }}
              >
                Save Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PdfCard({
  title,
  fileUrl,
  page,
  setPage,
  numPages,
  setNumPages,
  scale,
  setScale,
}) {
  return (
    <div style={{ border: "1px solid #eef0f3", borderRadius: 16, background: "white", overflow: "hidden" }}>
      <div style={{ padding: 14, borderBottom: "1px solid #eef0f3" }}>
        <div style={{ fontWeight: 800 }}>{title}</div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={btnSmall(page <= 1)}
          >
            Prev
          </button>

          <div style={{ fontSize: 13, fontWeight: 700 }}>
            Page {page} / {numPages || "—"}
          </div>

          <button
            onClick={() => setPage((p) => (numPages ? Math.min(numPages, p + 1) : p + 1))}
            disabled={!!numPages && page >= numPages}
            style={btnSmall(!!numPages && page >= numPages)}
          >
            Next
          </button>

          <div style={{ width: 1, height: 20, background: "#e5e7eb" }} />

          <button onClick={() => setScale((s) => Math.max(0.6, Number((s - 0.1).toFixed(2))))} style={btnSmall(false)}>
            −
          </button>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{Math.round(scale * 100)}%</div>
          <button onClick={() => setScale((s) => Math.min(1.6, Number((s + 0.1).toFixed(2))))} style={btnSmall(false)}>
            +
          </button>
        </div>
      </div>

      <div
        style={{
          height: "calc(100vh - 320px)",
          overflow: "auto",
          padding: 12, // padding reduces “trimmed edges” feeling
          background: "white",
        }}
      >
        {!fileUrl ? (
          <div style={{ color: "#6b7280", padding: 14 }}>No PDF selected.</div>
        ) : (
          <Document
            file={fileUrl}
            onLoadSuccess={({ numPages: n }) => {
              setNumPages(n);
              setPage((p) => Math.min(p, n));
            }}
            loading={<div style={{ padding: 14 }}>Loading PDF…</div>}
            error={<div style={{ padding: 14, color: "crimson" }}>Failed to load PDF.</div>}
          >
            <Page
              pageNumber={page}
              scale={scale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
        )}
      </div>
    </div>
  );
}

function btnSmall(disabled) {
  return {
    padding: "6px 10px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    background: "white",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 700,
    opacity: disabled ? 0.5 : 1,
  };
}
