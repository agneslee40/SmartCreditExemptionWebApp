import { NavLink } from "react-router-dom";

const pillBase =
  "px-8 py-3 rounded-full font-semibold transition-all " +
  "shadow-[inset_0_6px_12px_rgba(255,255,255,0.55)]"; // inner shadow look

const pillInactive = "bg-white text-[#0B0F2A]";
const pillActive = "bg-[#FF7A2F] text-black";

export default function Navbar() {
  return (
    <div className="bg-[#0B0F2A] rounded-full px-4 py-3 flex gap-4 justify-center">
      <NavLink to="/" end className={({ isActive }) =>
        `${pillBase} ${isActive ? pillActive : pillInactive}`
      }>
        Home
      </NavLink>

      <NavLink to="/teams" className={({ isActive }) =>
        `${pillBase} ${isActive ? pillActive : pillInactive}`
      }>
        Teams
      </NavLink>

      <NavLink to="/tasks" className={({ isActive }) =>
        `${pillBase} ${isActive ? pillActive : pillInactive}`
      }>
        Tasks Management
      </NavLink>

      <NavLink to="/reference" className={({ isActive }) =>
        `${pillBase} ${isActive ? pillActive : pillInactive}`
      }>
        Reference Cases
      </NavLink>
    </div>
  );
}
