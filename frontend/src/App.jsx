import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";

// Pages
import Dashboard from "./pages/Dashboard";
import TasksManagement from "./pages/TasksManagement";
import ApplicationReview from "./pages/ApplicationReview";
import Teams from "./pages/Teams";
import Login from "./pages/Login";
import ApplicationDetails from "./pages/ApplicationDetails";
import ReferenceCases from "./pages/ReferenceCases";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login has no layout */}
        <Route path="/login" element={<Login />} />

        {/* All pages with Topbar & Navbar */}
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks" element={<TasksManagement />} />
          <Route path="/tasks/applications/:id" element={<ApplicationDetails />} />
          <Route path="/tasks/applications/:id/review" element={<ApplicationReview />} />
          <Route path="/teams" element={<Teams />} />   
          <Route path="/reference" element={<ReferenceCases />} />      
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
