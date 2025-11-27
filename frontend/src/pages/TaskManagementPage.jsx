import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../components/Layout/MainLayout";
import axios from "axios";

const API_BASE = "http://localhost:5000";

export default function TaskManagementPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/applications`);
        setApplications(res.data); // expect array from backend
      } catch (err) {
        console.error("Failed to fetch applications", err);
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, []);

  const handleViewDetails = (id) => {
    navigate(`/applications/${id}`);
  };

  const handleReview = (id) => {
    navigate(`/applications/${id}/review`);
  };

  return (
    <MainLayout>
      <div className="tasks-page">
        <h1>Tasks Management</h1>
        {loading ? (
          <p>Loading applications...</p>
        ) : (
          <table className="tasks-table">
            <thead>
              <tr>
                <th>Application ID</th>
                <th>Student Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Assigned Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id}>
                  <td>{app.application_id}</td>
                  <td>{app.student_name}</td>
                  <td>{app.type}</td> {/* Credit Exemption / Credit Transfer */}
                  <td>{app.status}</td> {/* Pending, Approved, etc. */}
                  <td>{app.assigned_role || "PL / SL"}</td>
                  <td>
                    <button onClick={() => handleViewDetails(app.id)}>View Details</button>
                    <button onClick={() => handleReview(app.id)}>Review</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </MainLayout>
  );
}
