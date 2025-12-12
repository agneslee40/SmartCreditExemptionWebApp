import { Outlet } from "react-router-dom";
import Topbar from "./Topbar";

export default function Layout() {
  return (
    <div className="min-h-screen bg-white">
      <Topbar />
      <div className="px-10 py-8">
        <Outlet />
      </div>
    </div>
  );
}
