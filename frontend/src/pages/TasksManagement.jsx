// src/pages/TasksManagement.jsx
import React from "react";

const mockTasks = [
  {
    id: "APP-2025-001",
    studentName: "Tan Wei Ling",
    studentId: "22123456",
    programme: "BSc (Hons) in Computer Science",
    type: "Credit Exemption",
    requestedSubject: "Computer Mathematics",
    role: "Programme Leader",
    status: "Pending My Review",
    submittedOn: "2025-11-18",
    lastUpdated: "2025-11-20",
  },
  {
    id: "APP-2025-002",
    studentName: "Lim Jia Hui",
    studentId: "22114567",
    programme: "BSc (Hons) in Information Systems",
    type: "Credit Transfer",
    requestedSubject: "Programming Principles",
    role: "Subject Lecturer",
    status: "Waiting on Subject Lecturer",
    submittedOn: "2025-11-16",
    lastUpdated: "2025-11-19",
  },
  {
    id: "APP-2025-003",
    studentName: "Ng Chee Han",
    studentId: "22117890",
    programme: "BSc (Hons) in Computer Science",
    type: "Credit Exemption",
    requestedSubject: "Data Structures & Algorithms",
    role: "Programme Leader",
    status: "Pending My Review",
    submittedOn: "2025-11-15",
    lastUpdated: "2025-11-18",
  },
];

function StatusPill({ status }) {
  let colorClasses =
    "bg-gray-100 text-gray-700 border border-gray-200"; // default

  if (status === "Pending My Review") {
    colorClasses = "bg-orange-50 text-orange-700 border border-orange-200";
  } else if (status === "Waiting on Subject Lecturer") {
    colorClasses = "bg-blue-50 text-blue-700 border border-blue-200";
  } else if (status === "Completed") {
    colorClasses = "bg-emerald-50 text-emerald-700 border border-emerald-200";
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${colorClasses}`}
    >
      {status}
    </span>
  );
}

export default function TasksManagement() {
  return (
    <div className="h-full flex flex-col">
      {/* Page header */}
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-slate-900">
          Tasks Management
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          View and manage all credit exemption and transfer applications that
          require your attention.
        </p>
      </div>

      {/* Filters row */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Role toggle */}
        <div className="inline-flex rounded-full border border-slate-200 bg-white p-1">
          <button className="rounded-full bg-orange-500 px-3 py-1 text-xs font-medium text-white shadow-sm">
            Programme Leader
          </button>
          <button className="rounded-full px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50">
            Subject Lecturer
          </button>
        </div>

        {/* Type filter */}
        <select className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/60">
          <option>All types</option>
          <option>Credit Exemption</option>
          <option>Credit Transfer</option>
        </select>

        {/* Status filter */}
        <select className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/60">
          <option>All statuses</option>
          <option>Pending My Review</option>
          <option>Waiting on Subject Lecturer</option>
          <option>Completed</option>
        </select>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search box */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by student, subject or application ID"
            className="h-9 w-72 rounded-lg border border-slate-200 bg-white px-3 pr-8 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/60"
          />
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
            🔍
          </span>
        </div>
      </div>

      {/* Main table card */}
      <div className="flex-1 rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Table header bar */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              All Applications
            </h2>
            <p className="text-xs text-slate-500">
              Showing {mockTasks.length} applications assigned to you.
            </p>
          </div>
          <button className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50">
            Export CSV
          </button>
        </div>

        {/* Scrollable table */}
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50">
              <tr>
                {/* Action column FIRST (Review / View details) */}
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Action
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Application ID
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Student
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Programme
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Type
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Requested Subject
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Your Role
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Submitted On
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody>
              {mockTasks.map((task) => (
                <tr
                  key={task.id}
                  className="border-t border-slate-100 hover:bg-slate-50/60"
                >
                  {/* Action button in FIRST column */}
                  <td className="px-4 py-2">
                    {task.status === "Waiting on Subject Lecturer" ? (
                      <button className="rounded-full bg-blue-500 px-4 py-1 text-xs font-semibold text-white shadow-sm hover:bg-blue-600">
                        Remind
                      </button>
                    ) : (
                      <button className="rounded-full bg-orange-500 px-4 py-1 text-xs font-semibold text-white shadow-sm hover:bg-orange-600">
                        Review
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-2 font-mono text-[11px] text-slate-900">
                    {task.id}
                  </td>
                  <td className="px-4 py-2">
                    <div className="font-medium text-slate-900">
                      {task.studentName}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {task.studentId}
                    </div>
                  </td>
                  <td className="px-4 py-2 max-w-xs">
                    <div className="truncate text-[11px] text-slate-700">
                      {task.programme}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-[11px] text-slate-700">
                    {task.type}
                  </td>
                  <td className="px-4 py-2 text-[11px] text-slate-700">
                    {task.requestedSubject}
                  </td>
                  <td className="px-4 py-2 text-[11px] text-slate-700">
                    {task.role}
                  </td>
                  <td className="px-4 py-2">
                    <StatusPill status={task.status} />
                  </td>
                  <td className="px-4 py-2 text-[11px] text-slate-700">
                    {task.submittedOn}
                  </td>
                  <td className="px-4 py-2 text-[11px] text-slate-700">
                    {task.lastUpdated}
                  </td>
                </tr>
              ))}

              {/* Empty state example (for later when no data) */}
              {mockTasks.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-8 text-center text-xs text-slate-400"
                  >
                    No applications found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
