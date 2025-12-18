import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { api } from "../api/client";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <div
      className="w-full h-screen flex items-center justify-center bg-center bg-cover"
      style={{ backgroundImage: "url('/loginSunwaybg.jpg')" }}
    >
      <div className="bg-white/25 backdrop-blur-xl p-10 rounded-[32px] w-[420px] text-center shadow-2xl">
        <h1 className="text-4xl font-extrabold text-white mb-8">
          Login
        </h1>

        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-5 px-5 py-3 rounded-full bg-white/40 placeholder-white/80 text-white outline-none"
        />


        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-6 px-5 py-3 rounded-full bg-white/40 placeholder-white/80 text-white outline-none"
        />


        <button
          disabled={loading}
          onClick={async () => {
            try {
              setLoading(true);
              const res = await api.post("/auth/login", { email, password });

              // save auth
              localStorage.setItem("token", res.data.token);
              localStorage.setItem("user", JSON.stringify(res.data.user)); // includes role

              navigate("/");
            } catch (e) {
              alert(e?.response?.data?.error || "Login failed");
            } finally {
              setLoading(false);
            }
          }}
          className="bg-orange-500 text-white w-full py-3 rounded-full text-lg font-semibold disabled:opacity-70"
        >
          {loading ? "Logging in..." : "Login"}
        </button>


       
      </div>
    </div>
  );
}
