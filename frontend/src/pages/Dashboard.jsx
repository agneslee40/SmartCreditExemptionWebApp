// frontend/src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

function buildMailtoForReminder(row) {
  const to = (row.lecturer_email || "").trim(); // optional if you store it later
  const subject = `[Reminder] Action needed for Application ${row.application_id || row.id}`;
  const body = `
Hi,

This is a gentle reminder to review and take action on the following application:

Application ID: ${row.application_id || row.id}
Student Name: ${row.student_name || "-"}
Student ID: ${row.student_id || "-"}
Academic Session: ${row.academic_session || "-"}
Requested Subject: ${row.requested_subject || "-"}
Type: ${row.type || "-"}
Former Institution: ${row.former_institution || "-"}

Thank you.
`.trim();

  const qs = `subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return `mailto:${encodeURIComponent(to)}?${qs}`;
}

function SectionCard({ title, countBadge, rows, getActionLabel, onActionClick, showTip }) {
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
                <th>Student ID</th>
                <th>Student Name</th>
                <th>Academic Session</th>
                <th>Qualification</th>
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
                      {getActionLabel(row)}
                    </button>
                  </td>

                  <td className="pr-4">{row.application_id}</td>
                  <td className="pr-4">
                    {row.date_submitted ? String(row.date_submitted).slice(0, 10) : "-"}
                  </td>
                  <td className="pr-4">{row.student_id || "-"}</td>
                  <td className="pr-4">{row.student_name || "-"}</td>
                  <td className="pr-4">{row.academic_session || "-"}</td>
                  <td className="pr-4">{row.qualification || "-"}</td>
                  <td className="pr-4">{row.former_institution || "-"}</td>
                  <td className="pr-4">{row.requested_subject || "-"}</td>
                  <td className="pr-4">{row.type || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showTip && (
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
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get("/applications");
        setApps(res.data || []);
      } catch (e) {
        console.error(e);
        alert("Failed to load applications from backend.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ✅ PL Home rules (based on pl_status + sl_status)
  const pendingActions = useMemo(() => {
    return apps.filter((a) => {
      const pl = a.pl_status;
      const sl = a.sl_status;

      // 1) PL needs to assign an SL
      if (pl === "To Be Assign") return true;

      // 2) SL already decided, PL must review
      if (pl === "To Be Review" && ["Approved", "Rejected"].includes(sl)) return true;

      return false;
    });
  }, [apps]);

  const waitingOnSL = useMemo(() => {
    return apps.filter((a) => {
      const pl = a.pl_status;
      const sl = a.sl_status;

      // 3) PL assigned, waiting for SL to review
      if (pl === "Assigned" && sl === "To Be Review") return true;

      return false;
    });
  }, [apps]);



  const handleReview = (row) => {
    // your current route uses row.id in URL; keep that consistent
    navigate(`/tasks/applications/${row.id}/review`);
  };

  const handleAssign = (row) => {
    // Send PL to the application details page, where you can add an "Assign SL" UI later
    navigate(`/tasks/applications/${row.id}`);
  };

  const handleRemind = (row) => {
    if (!row.lecturer_email) {
      alert("No lecturer email found (prototype).");
      return;
    }
    window.location.href = buildMailtoForReminder(row);
  };

  if (loading) return <div className="mt-10 text-sm">Loading…</div>;

  return (
    <div className="bg-white">
      <SectionCard
        title="Your Pending Actions"
        countBadge={pendingActions.length}
        rows={pendingActions}
        getActionLabel={(row) => {
          if (row.pl_status === "To Be Assign") return "Assign SL";
          if (row.pl_status === "To Be Review") return "Review";
          return "Open";
        }}
        onActionClick={(row) => {
          if (row.pl_status === "To Be Assign") return handleAssign(row);
          if (row.pl_status === "To Be Review") return handleReview(row);
          return handleReview(row);
        }}

      />

      <SectionCard
        title="Waiting on Subject Lecturers"
        countBadge={waitingOnSL.length}
        rows={waitingOnSL}
        getActionLabel={() => "Remind"}
        onActionClick={handleRemind}
        showTip
      />

    </div>
  );
}
