import { Outlet } from "react-router-dom";
import Topbar from "./Topbar";

export default function Layout() {
  return (
    <div className="bg-[#F4F4F7] min-h-screen w-full">
      <Topbar />
      <div className="px-10 py-8">
        <Outlet />
      </div>
    </div>
  );
}
