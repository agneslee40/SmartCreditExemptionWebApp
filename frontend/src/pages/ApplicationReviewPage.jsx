import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import MainLayout from "../components/Layout/MainLayout";
import axios from "axios";

const API_BASE = "http://localhost:5000";

export default function ApplicationReviewPage() {
  const { id } = useParams();
  const [appData, setAppData] = useState(null);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [docContent, setDocContent] = useState("");
  const [activePanel, setActivePanel] = useState("suggested"); // "suggested", "basic", "comments", "decision", "history"
  const [analyzing, setAnalyzing] = useState(false);

  const fetchApplication = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/applications/${id}`);
      setAppData(res.data);

      // Preselect first document for dropdown
      if (res.data.supporting_documents && res.data.supporting_documents.length > 0) {
        setSelectedDocId(res.data.supporting_documents[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch application", err);
    }
  };

  const fetchDocumentContent = async (docId) => {
    try {
      const res = await axios.get(`${API_BASE}/api/documents/${docId}`); 
      // You need a backend endpoint that returns extracted text for a document ID.
      setDocContent(res.data.text || "");
    } catch (err) {
      console.error("Failed to fetch document content", err);
    }
  };

  useEffect(() => {
    fetchApplication();
  }, [id]);

  useEffect(() => {
    if (selectedDocId) {
      fetchDocumentContent(selectedDocId);
    }
  }, [selectedDocId]);

  const handleRunAnalysis = async () => {
    try {
      setAnalyzing(true);
      const res = await axios.post(`${API_BASE}/api/applications/${id}/analyze`);
      // assume backend calls Python, updates DB, returns updated application
      setAppData(res.data);
    } catch (err) {
      console.error("AI analysis failed", err);
    } finally {
      setAnalyzing(false);
    }
  };

  if (!appData) {
    return (
      <MainLayout>
        <p>Loading...</p>
      </MainLayout>
    );
  }

  const ai = appData.ai_reasoning || {}; // depends how you stored it

  return (
    <MainLayout>
      <div className="review-page">
        {/* Top header row (like Figma) */}
        <div className="review-header">
          <div>
            <h1>Application Review</h1>
            <p>{appData.application_id} • {appData.type}</p>
          </div>
          <div className="review-doc-select">
            <label>Document:</label>
            <select
              value={selectedDocId || ""}
              onChange={(e) => setSelectedDocId(e.target.value)}
            >
              {appData.supporting_documents?.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.display_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="review-body">
          {/* Left: document viewer */}
          <div className="review-document-panel">
            <div className="document-viewer">
              {/* In future you can show PDF with highlight; now we just show text */}
              <pre className="document-text">
                {docContent || "No content available for this document."}
              </pre>
            </div>
          </div>

          {/* Right: vertical icon navigation + content */}
          <div className="review-side-panel">
            {/* Icon navigation */}
            <div className="review-tabs">
              <button
                className={activePanel === "suggested" ? "tab active" : "tab"}
                onClick={() => setActivePanel("suggested")}
              >
                Suggested Outcome
              </button>
              <button
                className={activePanel === "basic" ? "tab active" : "tab"}
                onClick={() => setActivePanel("basic")}
              >
                Basic Info
              </button>
              <button
                className={activePanel === "comments" ? "tab active" : "tab"}
                onClick={() => setActivePanel("comments")}
              >
                Comments
              </button>
              <button
                className={activePanel === "decision" ? "tab active" : "tab"}
                onClick={() => setActivePanel("decision")}
              >
                Decision
              </button>
              <button
                className={activePanel === "history" ? "tab active" : "tab"}
                onClick={() => setActivePanel("history")}
              >
                Version Control
              </button>
            </div>

            {/* Panel content based on activePanel */}
            <div className="review-panel-content">
              {activePanel === "suggested" && (
                <SuggestedOutcomePanel
                  appData={appData}
                  ai={ai}
                  analyzing={analyzing}
                  onRunAnalysis={handleRunAnalysis}
                />
              )}
              {activePanel === "basic" && <BasicInfoPanel appData={appData} />}
              {activePanel === "comments" && <CommentsPanel appData={appData} />}
              {activePanel === "decision" && <DecisionPanel appData={appData} />}
              {activePanel === "history" && <HistoryPanel appData={appData} />}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}


function SuggestedOutcomePanel({ appData, ai, analyzing, onRunAnalysis }) {
  const type = appData.type; // "Credit Exemption" or "Credit Transfer"

  const hasAI = ai && typeof ai.similarity_percent !== "undefined";

  return (
    <div className="suggested-outcome-panel">
      <div className="panel-header">
        <h2>Suggested Outcome</h2>
        <button onClick={onRunAnalysis} disabled={analyzing}>
          {hasAI ? "Re-run Analysis" : "Run Analysis"}
        </button>
      </div>

      {analyzing && <p>Analyzing with AI...</p>}

      {!hasAI && !analyzing && (
        <p>No AI analysis yet. Click "Run Analysis" to generate suggestions.</p>
      )}

      {hasAI && !analyzing && (
        <div className="ai-cards">
          {/* 1. Similarity */}
          <div className="ai-card">
            <h3>Similarity to Sunway Syllabus</h3>
            <p>{ai.similarity_percent}%</p>
            <p>{ai.similarity_ok ? "≥ 80% (OK)" : "< 80% (Not met)"}</p>
          </div>

          {/* 2. Grade requirement */}
          <div className="ai-card">
            <h3>Minimum Grade Requirement</h3>
            <p>Detected Grade: {ai.detected_grade || "Not detected"}</p>
            <p>{ai.grade_ok ? "Requirement met" : "Requirement not met"}</p>
          </div>

          {/* 3. Credit hours */}
          <div className="ai-card">
            <h3>Minimum Credit Hours</h3>
            <p>Detected: {ai.detected_credit_hours ?? "Not detected"}</p>
            <p>{ai.credit_ok ? "Requirement met" : "Requirement not met"}</p>
          </div>

          {/* 4. Extra for credit transfer */}
          {type === "Credit Transfer" && (
            <div className="ai-card">
              <h3>Suggested Equivalent Grade</h3>
              <p>{appData.suggested_equivalent_grade || "N/A"}</p>
            </div>
          )}

          {/* Final suggestion */}
          <div className="ai-card final">
            <h3>AI Suggested Decision</h3>
            <p>{appData.ai_decision?.toUpperCase() || "N/A"}</p>
            <small>Final decision is still made by PL/SL.</small>
          </div>
        </div>
      )}
    </div>
  );
}
