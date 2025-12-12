import Navbar from "./Navbar";

export default function Topbar() {
  return (
    <div className="w-full flex justify-between items-center px-10 py-6 bg-white">
      {/* Profile */}
      <img
        src="https://i.pravatar.cc/80"
        className="w-12 h-12 rounded-full"
        alt="profile"
      />

      {/* NAVBAR (your pill buttons) */}
      <Navbar />

      {/* ICONS */}
      <div className="flex gap-6">
        <div className="w-14 h-14 rounded-full bg-[#0B0F2A] flex items-center justify-center">
          {/* replace later with your white outline icon */}
          <span className="text-white text-2xl">🔔</span>
        </div>
        <div className="w-14 h-14 rounded-full bg-[#0B0F2A] flex items-center justify-center">
          <span className="text-white text-2xl">⚙️</span>
        </div>
      </div>
    </div>
  );
}
