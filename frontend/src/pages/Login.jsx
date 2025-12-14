import { useNavigate } from "react-router-dom";
export default function Login() {
  const navigate = useNavigate();
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
          className="w-full mb-5 px-5 py-3 rounded-full bg-white/40 placeholder-white/80 text-white outline-none"
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-6 px-5 py-3 rounded-full bg-white/40 placeholder-white/80 text-white outline-none"
        />

        <button
          onClick={() => navigate("/")}
          className="bg-orange-500 text-white w-full py-3 rounded-full text-lg font-semibold"
        >
          Login
        </button>

        <p className="mt-5 text-white underline cursor-pointer text-sm">
          Forget Password
        </p>
      </div>
    </div>
  );
}
