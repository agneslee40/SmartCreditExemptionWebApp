import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";

// Pages
import Dashboard from "./pages/Dashboard";
import TasksManagement from "./pages/TasksManagement";
import ApplicationReview from "./pages/ApplicationReview";
import Teams from "./pages/Teams";
import Login from "./pages/Login";
import ApplicationDetails from "./pages/ApplicationDetails";


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
          <Route path="/review/:id" element={<ApplicationReview />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/details/:id" element={<ApplicationDetails />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
