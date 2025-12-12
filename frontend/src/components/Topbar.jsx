import { NavLink } from "react-router-dom";

export default function Topbar() {
  return (
    <div className="w-full flex justify-between items-center px-10 py-6 bg-white">

      {/* Profile */}
      <img
        src="https://i.pravatar.cc/80"
        className="w-12 h-12 rounded-full"
      />

      {/* NAV BUTTONS */}
      <div className="flex gap-4 bg-[#0A0A23] px-6 py-3 rounded-full">
        
        <NavLink
          to="/"
          className={({ isActive }) =>
            `px-4 py-1 rounded-full font-semibold ${
              isActive ? "bg-white text-black" : "text-white"
            }`
          }
        >
          Home
        </NavLink>

        <NavLink
          to="/teams"
          className={({ isActive }) =>
            `px-4 py-1 rounded-full font-semibold ${
              isActive ? "bg-white text-black" : "text-white"
            }`
          }
        >
          Teams
        </NavLink>

        <NavLink
          to="/tasks"
          className={({ isActive }) =>
            `px-4 py-1 rounded-full font-semibold ${
              isActive ? "bg-orange-500 text-white" : "text-white"
            }`
          }
        >
          Tasks Management
        </NavLink>

        <button className="text-white font-semibold">
          Reference Cases
        </button>

      </div>

      {/* ICONS */}
      <div className="flex gap-6 text-[#0A0A23] text-3xl">
        <span>🔔</span>
        <span>⚙️</span>
      </div>
    </div>
  );
}
