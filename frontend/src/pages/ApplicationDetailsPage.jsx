import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "../components/Layout/MainLayout";
import axios from "axios";

const API_BASE = "http://localhost:5000";

export default function ApplicationDetailsPage() {
  const { id } = useParams();
  const [appData, setAppData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchApp = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/applications/${id}`);
        setAppData(res.data);
      } catch (err) {
        console.error("Failed to fetch application", err);
      } finally {
        setLoading(false);
      }
    };
    fetchApp();
  }, [id]);

  if (loading) {
    return (
      <MainLayout>
        <p>Loading...</p>
      </MainLayout>
    );
  }

  if (!appData) {
    return (
      <MainLayout>
        <p>Application not found.</p>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="app-details-page">
        <h1>Application Details</h1>
        <section className="app-meta">
          <p><strong>Application ID:</strong> {appData.application_id}</p>
          <p><strong>Type:</strong> {appData.type}</p>
          <p><strong>Student:</strong> {appData.student_name} ({appData.student_id})</p>
          <p><strong>Programme:</strong> {appData.programme}</p>
          <p><strong>Requested Subject:</strong> {appData.requested_subject}</p>
          {/* Add more fields to mirror Figma */}
        </section>

        <section className="app-docs">
          <h2>Supporting Documents</h2>
          <ul>
            {appData.supporting_documents?.map((doc) => (
              <li key={doc.id}>{doc.display_name}</li>
            ))}
          </ul>
        </section>

        <button onClick={() => navigate(`/applications/${id}/review`)}>
          Go to Review
        </button>
      </div>
    </MainLayout>
  );
}
