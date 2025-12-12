import { NavLink } from "react-router-dom";

// tighter + bolder like Figma
const pillBase =
  "px-6 py-2 rounded-full font-extrabold text-lg leading-none " +
  "transition-all select-none";

// Figma-style: darker inner shadow (not bright)
const pillInactive =
  "bg-white text-[#0B0F2A] " +
  "shadow-[inset_0_6px_10px_rgba(0,0,0,0.18),inset_0_-2px_6px_rgba(255,255,255,0.65)]";

const pillActive =
  "bg-gradient-to-b from-[#FF8A4B] to-[#FF6B2C] text-black " +
  "shadow-[inset_0_8px_14px_rgba(0,0,0,0.22),inset_0_-3px_8px_rgba(255,255,255,0.25)]";

export default function Navbar() {
  return (
    <div className="bg-[#0B0F2A] rounded-full px-4 py-3 flex gap-3 justify-center shadow-md">
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `${pillBase} ${isActive ? pillActive : pillInactive}`
        }
      >
        Home
      </NavLink>

      <NavLink
        to="/teams"
        className={({ isActive }) =>
          `${pillBase} ${isActive ? pillActive : pillInactive}`
        }
      >
        Teams
      </NavLink>

      <NavLink
        to="/tasks"
        className={({ isActive }) =>
          `${pillBase} ${isActive ? pillActive : pillInactive}`
        }
      >
        Tasks Management
      </NavLink>

      <NavLink
        to="/reference"
        className={({ isActive }) =>
          `${pillBase} ${isActive ? pillActive : pillInactive}`
        }
      >
        Reference Cases
      </NavLink>
    </div>
  );
}
