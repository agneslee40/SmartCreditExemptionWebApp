import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import TaskManagementPage from "./pages/TaskManagementPage";
import ApplicationDetailsPage from "./pages/ApplicationDetailsPage";
import ApplicationReviewPage from "./pages/ApplicationReviewPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/tasks" element={<TaskManagementPage />} />
        <Route path="/applications/:id" element={<ApplicationDetailsPage />} />
        <Route path="/applications/:id/review" element={<ApplicationReviewPage />} />
        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/tasks" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
