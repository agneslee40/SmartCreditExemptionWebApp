export default function Login() {
  return (
    <div className="w-full h-screen flex items-center justify-center"
      style={{ backgroundImage: "url('/sunway.jpg')", backgroundSize: "cover" }}
    >
      <div className="bg-white/30 backdrop-blur-lg p-10 rounded-3xl w-[400px] text-center">
        <h1 className="text-4xl font-extrabold mb-6">Login</h1>

        <input
          type="email"
          placeholder="Email Address"
          className="w-full mb-6 px-4 py-3 rounded-full bg-white/40"
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-6 px-4 py-3 rounded-full bg-white/40"
        />

        <button className="bg-orange-500 text-white w-full py-3 rounded-full text-lg font-semibold">
          Login
        </button>

        <p className="mt-4 underline cursor-pointer">Forget Password</p>
      </div>
    </div>
  );
}
