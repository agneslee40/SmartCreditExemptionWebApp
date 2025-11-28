export default function ApplicationReview() {
  return (
    <div className="w-full flex gap-10">
      
      {/* Left: Document viewer */}
      <div className="w-2/3 bg-white rounded-3xl shadow p-6 h-[85vh] overflow-scroll">
        <p className="text-gray-500">PDF viewer / Highlight UI here...</p>
      </div>

      {/* Right: AI Block */}
      <div className="w-1/3 bg-white rounded-3xl shadow p-6">
        <h2 className="text-3xl font-bold mb-4">Suggested Outcome</h2>

        <div className="text-4xl font-extrabold text-green-600">Approve</div>

        <div className="mt-8 space-y-6">

          <div className="p-4 bg-orange-100 rounded-xl">
            <p className="font-bold">1. Grade</p>
            <p>A+</p>
          </div>

          <div className="p-4 bg-yellow-100 rounded-xl">
            <p className="font-bold">2. Similarity</p>
            <p>81%</p>
          </div>

          <div className="p-4 bg-blue-100 rounded-xl">
            <p className="font-bold">3. Credit Hours</p>
            <p>4</p>
          </div>

        </div>

      </div>

    </div>
  );
}
