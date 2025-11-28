export default function Teams() {
  return (
    <div>
      <h1 className="text-5xl font-extrabold">My Teams</h1>

      <div className="grid grid-cols-3 gap-8 mt-10">
        <div className="bg-purple-200 p-6 rounded-3xl shadow h-64">
          <p className="font-bold text-xl">Computer Science</p>
        </div>

        <div className="bg-pink-200 p-6 rounded-3xl shadow h-64">
          <p className="font-bold text-xl">Finance</p>
        </div>

        <div className="bg-yellow-200 p-6 rounded-3xl shadow h-64">
          <p className="font-bold text-xl">Culinary</p>
        </div>
      </div>
    </div>
  );
}
