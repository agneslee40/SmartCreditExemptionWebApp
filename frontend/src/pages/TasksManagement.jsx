export default function TasksManagement() {
  return (
    <div className="w-full">
      <h1 className="text-5xl font-extrabold mb-6">Tasks Management</h1>

      <div className="flex gap-6 mb-6">
        <input
          type="text"
          placeholder="Search"
          className="px-6 py-3 rounded-full bg-gray-100 w-80"
        />
      </div>

      <div className="bg-white p-6 rounded-3xl shadow">
        <p className="text-gray-500">Tasks table placeholder...</p>
      </div>
    </div>
  );
}
