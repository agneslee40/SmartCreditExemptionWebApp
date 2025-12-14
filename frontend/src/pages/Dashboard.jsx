// src/pages/Dashboard.jsx
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
  },
];

function SectionCard({ title, countBadge, rows }) {
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
              {/* no header label for action column */}
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
                {/* ACTION FIRST COLUMN */}
                <td className="pr-4">
                  <button className="px-5 py-2 rounded-full bg-[#FF6B2C] text-white text-xs font-semibold shadow-sm hover:shadow-md transition">
                    {title === "Waiting on Subject Lecturers" ? "Remind" : "Review"}
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
      </div>
    </section>
  );
}

export default function Dashboard() {
  return (
    <div className="bg-white">
      <SectionCard
        title="Your Pending Actions"
        countBadge={pendingActions.length}
        rows={pendingActions}
      />
      <SectionCard
        title="Waiting on Subject Lecturers"
        countBadge={waitingOnSL.length}
        rows={waitingOnSL}
      />
    </div>
  );
}
