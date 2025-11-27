// src/components/Layout/MainLayout.jsx
import { Link, useLocation } from "react-router-dom";

export default function MainLayout({ children }) {
  const location = useLocation();

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">Smart Credit Exemption</div>
        <nav className="nav">
          <Link className={location.pathname.startsWith("/tasks") ? "nav-item active" : "nav-item"} to="/tasks">
            Tasks Management
          </Link>
          {/* You can add other menu items like Dashboard, Teams, etc. */}
        </nav>
      </aside>

      {/* Main content */}
      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            {/* e.g. breadcrumb, page title can go here later */}
          </div>
          <div className="topbar-right">
            {/* user info / role (PL / SL) */}
            <span>Logged in as PL/SL</span>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
