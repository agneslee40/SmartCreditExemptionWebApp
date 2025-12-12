import { NavLink } from "react-router-dom";

const tabs = [
  { name: "Home", path: "/" },
  { name: "Teams", path: "/teams" },
  { name: "Tasks Management", path: "/tasks" },
  { name: "Reference Cases", path: "/reference" }, // create route later if needed
];

export default function Navbar() {
  return (
    <div className="rounded-full bg-[#0B0F2A] px-3 py-2 shadow-md">
      <div className="flex gap-3">
        {tabs.map((t) => (
          <NavLink
            key={t.path}
            to={t.path}
            className={({ isActive }) =>
              [
                "px-6 py-2 rounded-full font-semibold transition",
                // inner shadow (the “pressed-in” look)
                "shadow-[inset_0_2px_6px_rgba(0,0,0,0.25)]",
                isActive
                  ? "bg-[#FF7A2F] text-black"
                  : "bg-[#F2F2F2] text-black",
              ].join(" ")
            }
          >
            {t.name}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
