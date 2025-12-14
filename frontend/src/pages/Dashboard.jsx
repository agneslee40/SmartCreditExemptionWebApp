// src/pages/Dashboard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const pendingActions = [
  {
    id: "A001",
    date: "7th January 2025",
    studentId: "22115737",
    session: "202301 | 1",
    prevQual: "Bahasa Melayu",
    institution: "Wesley Methodist School Kuala Lumpur (INTERNATIONAL)",
    subject: "MPU 3213 Malay Language for Communication",
    type: "Credit Exemption",
  },
  {
    id: "A002",
    date: "7th January 2025",
    studentId: "22115738",
    session: "202301 | 1",
    prevQual: "Bahasa Melayu",
    institution: "Wesley Methodist School Kuala Lumpur (INTERNATIONAL)",
    subject: "MPU 3213 Malay Language for Communication",
    type: "Credit Exemption",
  },
  {
    id: "A003",
    date: "7th January 2025",
    studentId: "22115739",
    session: "202301 | 1",
    prevQual: "Bahasa Melayu",
    institution: "Wesley Methodist School Kuala Lumpur (INTERNATIONAL)",
    subject: "MPU 3213 Malay Language for Communication",
    type: "Credit Exemption",
  },
];

// Add lecturer contact info here (so Remind knows who to email)
const waitingOnSL = [
  {
    id: "A001",
    date: "7th January 2025",
    studentId: "22115737",
    session: "202301 | 1",
    prevQual: "Bahasa Melayu",
    institution: "Wesley Methodist School Kuala Lumpur (INTERNATIONAL)",
    subject: "MPU 3213 Malay Language for Communication",
    type: "Credit Exemption",

    // ✅ for Remind
    lecturerName: "Subject Lecturer",
    lecturerEmail: "sl@sunway.edu.my",
  },
];

function buildMailtoForReminder(row) {
  const to = row.lecturerEmail || "";
  const appLink = `${window.location.origin}/tasks/applications/${row.id}/review`;

  const subject = `[Reminder] Action needed for Application ${row.id} (${row.type})`;

  const body = `
Hi ${row.lecturerName || "Dr./Mr./Ms."},

This is a gentle reminder to review and take action on the following credit exemption/transfer application:

Application ID: ${row.id}
Date Submitted: ${row.date}
Student ID: ${row.studentId}
Academic Session: ${row.session}
Requested Subject: ${row.subject}
Type: ${row.type}
Former Institution: ${row.institution}

Quick link to review:
${appLink}

Thank you.
`;

  // mailto expects URL-encoded subject/body
  const params = new URLSearchParams({
    subject,
    body: body.trim(),
  });

  return `mailto:${encodeURIComponent(to)}?${params.toString()}`;
}

function SectionCard({ title, countBadge, rows, actionLabel, onActionClick }) {
  return (
    <section className="mt-10">
      <div className="flex items-center gap-6 mb-6">
        <div className="w-20 h-20 rounded-full bg-[#FF6B2C] text-[#0B0F2A] flex items-center justify-center text-4xl font-bold shadow-md">
          {countBadge}
        </div>
        <h2 className="text-4xl font-extrabold tracking-tight text-[#050827]">
          {title}
        </h2>
      </div>

      <div className="mt-4 rounded-[32px] bg-[#EFEFEF] px-6 py-5">
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full text-sm text-left">
            <thead className="text-gray-500 border-b">
              <tr className="h-12">
                <th className="w-[110px]"></th>
                <th>ID</th>
                <th>Date</th>
                <th>Student ID, Name</th>
                <th>Academic Session</th>
                <th>Previously Take Qualification</th>
                <th>Former Institution</th>
                <th>Requested Subject</th>
                <th>Type</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="h-14 border-b last:border-0">
                  <td className="pr-4">
                    <button
                      onClick={() => onActionClick(row)}
                      className="px-5 py-2 rounded-full bg-[#FF6B2C] text-white text-xs font-semibold shadow-sm hover:shadow-md transition"
                    >
                      {actionLabel}
                    </button>
                  </td>

                  <td className="pr-4">{row.id}</td>
                  <td className="pr-4">{row.date}</td>
                  <td className="pr-4">{row.studentId}</td>
                  <td className="pr-4">{row.session}</td>
                  <td className="pr-4">{row.prevQual}</td>
                  <td className="pr-4">{row.institution}</td>
                  <td className="pr-4">{row.subject}</td>
                  <td className="pr-4">{row.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* optional helper note */}
        {title === "Waiting on Subject Lecturers" && (
          <div className="mt-4 text-xs text-[#0B0F2A]/60">
            Tip: “Remind” opens your default email app with a pre-filled draft.
          </div>
        )}
      </div>
    </section>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  const handleReview = (row) => {
    navigate(`/tasks/applications/${row.id}/review`);
  };

  const handleRemind = (row) => {
    const mailto = buildMailtoForReminder(row);
    window.location.href = mailto;
  };

  return (
    <div className="bg-white">
      <SectionCard
        title="Your Pending Actions"
        countBadge={pendingActions.length}
        rows={pendingActions}
        actionLabel="Review"
        onActionClick={handleReview}
      />

      <SectionCard
        title="Waiting on Subject Lecturers"
        countBadge={waitingOnSL.length}
        rows={waitingOnSL}
        actionLabel="Remind"
        onActionClick={handleRemind}
      />
    </div>
  );
}
