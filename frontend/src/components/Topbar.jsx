import Navbar from "./Navbar";

export default function Topbar() {
  return (
    <div className="relative flex items-center px-10 py-6 bg-white">
      
      
      <div className="absolute left-1/2 -translate-x-1/2">
        <Navbar />
      </div>
      <div className="w-14 h-14" />

      
    </div>
  );
}
