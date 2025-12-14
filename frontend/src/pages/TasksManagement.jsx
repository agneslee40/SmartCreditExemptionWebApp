// src/pages/TasksManagement.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const TABS = ["All", "In Progress", "Credit Exemption", "Credit Transfer", "Completed"];

const initialApps = [
  {
    id: "A001",
    date: "7th January 2025",
    studentId: "22115737",
    studentName: "Lee Wen Xuan",
    academicSession: "202301 | 1",
    prevQual: "Bahasa Melayu",
    formerInstitution: "Wesley Methodist School Kuala Lumpur (INTERNATIONAL)",
    requestedSubject: "MPU 3213 Malay Language for Communication",
    type: "Credit Exemption",
    progress: "In Progress",
    team: {
      name: "Computer Science",
      members: [
        { name: "Programme Leader", email: "pl@sunway.edu.my", avatar: "https://i.pravatar.cc/100?img=32" },
        { name: "Subject Lecturer 1", email: "sl1@sunway.edu.my", avatar: "https://i.pravatar.cc/100?img=12" },
        { name: "Subject Lecturer 2", email: "sl2@sunway.edu.my", avatar: "https://i.pravatar.cc/100?img=15" },
      ],
    },
    stageStatus: {
      subjectLecturer: "Approved",
      programmeLeader: "Approved",
      registry: "Pending",
      registryReminderSent: false,
    },
    remarks: [
      { by: "Subject Lecturer", text: "Content similarity acceptable." },
      { by: "Programme Leader", text: "Proceed based on hours + grade." },
    ],
  },
  {
    id: "A002",
    date: "7th January 2025",
    studentId: "22115738",
    studentName: "Lim Jia Hui",
    academicSession: "202301 | 1",
    prevQual: "Bahasa Melayu",
    formerInstitution: "Wesley Methodist School Kuala Lumpur (INTERNATIONAL)",
    requestedSubject: "MPU 3213 Malay Language for Communication",
    type: "Credit Transfer",
    progress: "In Progress",
    team: {
      name: "Computer Science",
      members: [
        { name: "Programme Leader", email: "pl@sunway.edu.my", avatar: "https://i.pravatar.cc/100?img=18" },
        { name: "Subject Lecturer", email: "sl@sunway.edu.my", avatar: "https://i.pravatar.cc/100?img=22" },
      ],
    },
    stageStatus: {
      subjectLecturer: "Approved",
      programmeLeader: "Approved",
      registry: "Pending",
      registryReminderSent: false,
    },
    remarks: [],
  },
  {
    id: "A003",
    date: "7th January 2025",
    studentId: "22115739",
    studentName: "Ng Chee Han",
    academicSession: "202301 | 1",
    prevQual: "Bahasa Melayu",
    formerInstitution: "Wesley Methodist School Kuala Lumpur (INTERNATIONAL)",
    requestedSubject: "MPU 3213 Malay Language for Communication",
    type: "Credit Exemption",
    progress: "Completed",
    team: {
      name: "Computer Science",
      members: [
        { name: "Programme Leader", email: "pl@sunway.edu.my", avatar: "https://i.pravatar.cc/100?img=41" },
        { name: "Subject Lecturer", email: "sl@sunway.edu.my", avatar: "https://i.pravatar.cc/100?img=45" },
      ],
    },
    stageStatus: {
      subjectLecturer: "Approved",
      programmeLeader: "Approved",
      registry: "Approved",
      registryReminderSent: true,
    },
    remarks: [{ by: "Registry", text: "Processed in system." }],
  },
];

// ---------- tiny inline icons (no extra library needed) ----------
function IconFilter({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 5h16l-6.5 7.2v5.1l-3 1.7v-6.8L4 5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconPencil({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 20h9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconBell({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 7H3s3 0 3-7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M10 19a2 2 0 0 0 4 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
function IconPlus({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconCheckTiny({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ---------- UI helpers ----------
function TabButton({ active, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        "relative pb-2 font-bold text-lg",
        active ? "text-[#0B0F2A]" : "text-[#0B0F2A]/70 hover:text-[#0B0F2A]",
      ].join(" ")}
    >
      {label}
      {active && (
        <span className="absolute left-0 -bottom-1 h-[3px] w-8 rounded-full bg-[#0B0F2A]" />
      )}
    </button>
  );
}

function Pill({ children, className = "" }) {
  return (
    <span className={`inline-flex items-center rounded-full px-5 py-2 text-sm font-semibold ${className}`}>
      {children}
    </span>
  );
}

function StatusBadge({ label, tone, rightSlot }) {
  const toneMap = {
    orange: "bg-[#FF7A2F] text-black",
    gray: "bg-[#D9D9D9] text-[#0B0F2A]",
  };
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold ${toneMap[tone]}`}>
        {label}
      </span>
      {rightSlot}
    </div>
  );
}

function Toast({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="rounded-2xl bg-[#0B0F2A] px-5 py-4 text-white shadow-lg flex items-start gap-3">
        <div className="mt-0.5">
          <IconCheckTiny className="h-5 w-5" />
        </div>
        <div className="text-sm">
          <div className="font-semibold">Done</div>
          <div className="opacity-90">{message}</div>
        </div>
        <button onClick={onClose} className="ml-3 opacity-80 hover:opacity-100">✕</button>
      </div>
    </div>
  );
}

function ModalShell({ title, children, onClose, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
      <div className={`w-full ${wide ? "max-w-3xl" : "max-w-xl"} rounded-3xl bg-white p-6 shadow-xl`}>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-extrabold text-[#0B0F2A]">{title}</h3>
          <button onClick={onClose} className="rounded-full px-3 py-2 text-[#0B0F2A]/70 hover:bg-black/5">
            ✕
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

// ---------- main page ----------
export default function TasksManagement() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");
  const [apps, setApps] = useState(initialApps);

  const [toast, setToast] = useState("");

  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [teamModalAppId, setTeamModalAppId] = useState(null);

  const [editRemarkAppId, setEditRemarkAppId] = useState(null);
  const [editRemarkText, setEditRemarkText] = useState("");

  const filteredApps = useMemo(() => {
    let list = [...apps];

    // quick tabs
    if (tab === "In Progress") list = list.filter((a) => a.progress === "In Progress");
    if (tab === "Completed") list = list.filter((a) => a.progress === "Completed");
    if (tab === "Credit Exemption") list = list.filter((a) => a.type === "Credit Exemption");
    if (tab === "Credit Transfer") list = list.filter((a) => a.type === "Credit Transfer");

    // search
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((a) => {
        return (
          a.id.toLowerCase().includes(q) ||
          a.studentId.toLowerCase().includes(q) ||
          a.studentName.toLowerCase().includes(q) ||
          a.requestedSubject.toLowerCase().includes(q) ||
          a.formerInstitution.toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [apps, tab, search]);

  const openTeamModal = (appId) => setTeamModalAppId(appId);

  const sendRegistryReminder = (appId) => {
    setApps((prev) =>
      prev.map((a) =>
        a.id === appId
          ? {
              ...a,
              stageStatus: { ...a.stageStatus, registryReminderSent: true },
            }
          : a
      )
    );
    setToast(`Reminder sent to Registry for application ${appId}.`);
  };

  const openEditRemarks = (appId) => {
    const app = apps.find((a) => a.id === appId);
    const combined = (app?.remarks || [])
      .map((r) => `${r.text} (${r.by})`)
      .join("\n");
    setEditRemarkText(combined);
    setEditRemarkAppId(appId);
  };

  const saveRemarks = () => {
    const appId = editRemarkAppId;
    if (!appId) return;

    // store as a single remark for now (static version)
    setApps((prev) =>
      prev.map((a) =>
        a.id === appId
          ? {
              ...a,
              remarks: editRemarkText
                .trim()
                ? [{ by: "Programme Leader", text: editRemarkText.trim() }]
                : [],
            }
          : a
      )
    );
    setToast(`Remarks updated for application ${appId}.`);
    setEditRemarkAppId(null);
  };

  const teamModalApp = teamModalAppId ? apps.find((a) => a.id === teamModalAppId) : null;

  return (
    <div className="bg-white">
      {/* Title */}
      <h1 className="text-5xl font-extrabold tracking-tight text-[#0B0F2A]">
        Tasks Management
      </h1>

      {/* Search (left, under title) */}
      <div className="mt-6 flex items-center justify-between">
        <div className="relative w-[260px]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="w-full rounded-full bg-[#F1F1F1] px-10 py-3 text-sm outline-none placeholder:text-[#0B0F2A]/45"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0B0F2A]/40">⌕</span>
        </div>
      </div>

      {/* Quick filter tabs + filter icon (same row) */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-14">
          {TABS.map((t) => (
            <TabButton key={t} label={t} active={tab === t} onClick={() => setTab(t)} />
          ))}
        </div>

        <button
          onClick={() => setShowFilterPanel(true)}
          className="rounded-xl p-3 text-[#0B0F2A] hover:bg-black/5"
          title="Filters"
        >
          <IconFilter className="h-7 w-7" />
        </button>
      </div>

      {/* Table container (internal vertical scroll + horizontal scroll like your figma) */}
      <div className="mt-8 rounded-3xl bg-white shadow-[0_14px_40px_rgba(0,0,0,0.08)]">
        <div className="max-h-[62vh] overflow-y-auto rounded-3xl">
          <div className="overflow-x-auto">
            <table className="min-w-[1750px] w-full text-left">
              <thead className="text-[#0B0F2A]/70">
                <tr className="border-b border-black/10">
                  <th className="px-8 py-6 text-sm font-semibold">ID</th>
                  <th className="px-6 py-6 text-sm font-semibold">Date</th>
                  <th className="px-6 py-6 text-sm font-semibold">Student ID, Name</th>
                  <th className="px-6 py-6 text-sm font-semibold">Academic Session</th>
                  <th className="px-6 py-6 text-sm font-semibold">Previously Take Qualification</th>
                  <th className="px-6 py-6 text-sm font-semibold">Former Institution</th>
                  <th className="px-6 py-6 text-sm font-semibold">Requested Subject</th>
                  <th className="px-6 py-6 text-sm font-semibold">Type</th>
                  <th className="px-6 py-6 text-sm font-semibold">Status</th>
                  <th className="px-6 py-6 text-sm font-semibold">Remarks</th>
                </tr>
              </thead>

              <tbody>
                {filteredApps.map((a) => {
                  const remarksPreview = a.remarks?.length
                    ? `${a.remarks[0].text} (${a.remarks[0].by})`
                    : "-";

                  return (
                    <React.Fragment key={a.id}>
                      {/* Row 1: data */}
                      <tr className="border-b border-black/10 align-top">
                        <td className="px-8 py-6 text-sm">{a.id}</td>
                        <td className="px-6 py-6 text-sm">{a.date}</td>
                        <td className="px-6 py-6 text-sm">
                          <div>{a.studentId}</div>
                          <div className="text-[#0B0F2A]/60">{a.studentName}</div>
                        </td>
                        <td className="px-6 py-6 text-sm">{a.academicSession}</td>
                        <td className="px-6 py-6 text-sm">{a.prevQual}</td>
                        <td className="px-6 py-6 text-sm">{a.formerInstitution}</td>
                        <td className="px-6 py-6 text-sm">{a.requestedSubject}</td>
                        <td className="px-6 py-6 text-sm">{a.type}</td>

                        {/* Status column */}
                        <td className="px-6 py-6 text-sm">
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-[110px] text-[#0B0F2A]/70">Subject Lecturer</div>
                              <StatusBadge
                                label={a.stageStatus.subjectLecturer}
                                tone={a.stageStatus.subjectLecturer === "Approved" ? "orange" : "gray"}
                              />
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-[110px] text-[#0B0F2A]/70">Programme Leader</div>
                              <StatusBadge
                                label={a.stageStatus.programmeLeader}
                                tone={a.stageStatus.programmeLeader === "Approved" ? "orange" : "gray"}
                              />
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-[110px] text-[#0B0F2A]/70">Registry</div>
                              <StatusBadge
                                label={a.stageStatus.registry}
                                tone={a.stageStatus.registry === "Approved" ? "orange" : "gray"}
                                rightSlot={
                                  a.stageStatus.registry === "Pending" ? (
                                    <button
                                      onClick={() => sendRegistryReminder(a.id)}
                                      className="relative ml-2 rounded-full p-2 text-[#0B0F2A] hover:bg-black/5"
                                      title="Send reminder"
                                    >
                                      <IconBell className="h-5 w-5" />
                                      {a.stageStatus.registryReminderSent && (
                                        <span className="absolute -right-1 -top-1 rounded-full bg-white p-[2px] shadow">
                                          <IconCheckTiny className="h-3 w-3 text-green-600" />
                                        </span>
                                      )}
                                    </button>
                                  ) : null
                                }
                              />
                            </div>
                          </div>
                        </td>

                        {/* Remarks column */}
                        <td className="px-6 py-6 text-sm">
                          <div className="flex items-start justify-between gap-4">
                            <div className="text-[#0B0F2A]/80">{remarksPreview}</div>
                            <button
                              onClick={() => openEditRemarks(a.id)}
                              className="rounded-lg p-2 text-[#0B0F2A] hover:bg-black/5"
                              title="Edit remarks"
                            >
                              <IconPencil className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Row 2: action strip (matches your figma “pills + buttons”) */}
                      <tr className="border-b border-black/10">
                        <td colSpan={10} className="px-8 py-6">
                          <div className="flex items-center gap-6">
                            {/* In Progress pill (not clickable) */}
                            <Pill className="bg-[#E9E2B2] text-[#0B0F2A]">
                              {a.progress}
                            </Pill>

                            {/* Team pill (clickable) */}
                            <button
                              onClick={() => openTeamModal(a.id)}
                              className="flex items-center gap-4 rounded-full bg-[#EFEFEF] px-5 py-3 text-sm font-semibold text-[#0B0F2A] hover:bg-[#E7E7E7]"
                              title="View team details"
                            >
                              <span>Team: {a.team.name}</span>

                              {/* avatars */}
                              <div className="flex -space-x-2">
                                {a.team.members.slice(0, 3).map((m) => (
                                  <img
                                    key={m.email}
                                    src={m.avatar}
                                    alt={m.name}
                                    className="h-7 w-7 rounded-full border-2 border-white"
                                  />
                                ))}
                              </div>

                              {/* plus (quick add SL) */}
                              <span className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#0B0F2A] shadow">
                                <IconPlus className="h-4 w-4" />
                              </span>
                            </button>

                            <div className="flex-1" />

                            {/* View details */}
                            <button
                              onClick={() => navigate(`/applications/${a.id}`)}
                              className="rounded-full bg-[#EFEFEF] px-8 py-3 text-sm font-semibold text-[#0B0F2A] hover:bg-[#E7E7E7]"
                            >
                              View Details
                            </button>

                            {/* Review */}
                            <button
                              onClick={() => navigate(`/applications/${a.id}/review`)}
                              className="rounded-full bg-[#EFEFEF] px-8 py-3 text-sm font-semibold text-[#0B0F2A] hover:bg-[#E7E7E7]"
                            >
                              Review
                            </button>
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}

                {filteredApps.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-8 py-12 text-center text-[#0B0F2A]/55">
                      No results for this filter/search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* (optional) small bottom padding so scrollbar doesn’t feel “cut” */}
          <div className="h-4" />
        </div>
      </div>

      {/* Filter panel placeholder (for later: date, subject, programme, team, sort, etc.) */}
      {showFilterPanel && (
        <ModalShell title="Filters (Coming next)" onClose={() => setShowFilterPanel(false)}>
          <div className="space-y-4 text-sm text-[#0B0F2A]/80">
            <div className="rounded-2xl bg-[#F5F5F5] p-4">
              Put your advanced filters here later (date range, subject, programme, team, sort, etc.)
            </div>
            <button
              onClick={() => setShowFilterPanel(false)}
              className="rounded-full bg-[#0B0F2A] px-6 py-3 font-semibold text-white"
            >
              Close
            </button>
          </div>
        </ModalShell>
      )}

      {/* Team details modal */}
      {teamModalApp && (
        <ModalShell
          title={`Team Details — ${teamModalApp.team.name}`}
          onClose={() => setTeamModalAppId(null)}
          wide
        >
          <div className="space-y-4">
            <div className="rounded-2xl bg-[#F5F5F5] p-4 text-sm text-[#0B0F2A]/80">
              (Static now) Later you can allow “Add SL” and manage members here.
            </div>

            <div className="grid grid-cols-2 gap-4">
              {teamModalApp.team.members.map((m) => (
                <div key={m.email} className="flex items-center gap-3 rounded-2xl border border-black/10 p-4">
                  <img src={m.avatar} alt={m.name} className="h-10 w-10 rounded-full" />
                  <div className="min-w-0">
                    <div className="font-bold text-[#0B0F2A]">{m.name}</div>
                    <div className="text-sm text-[#0B0F2A]/70 truncate">{m.email}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setTeamModalAppId(null)}
                className="rounded-full bg-[#0B0F2A] px-6 py-3 font-semibold text-white"
              >
                Done
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Edit remarks modal */}
      {editRemarkAppId && (
        <ModalShell title={`Edit Remarks — ${editRemarkAppId}`} onClose={() => setEditRemarkAppId(null)} wide>
          <div className="space-y-4">
            <textarea
              value={editRemarkText}
              onChange={(e) => setEditRemarkText(e.target.value)}
              className="h-40 w-full resize-none rounded-2xl border border-black/10 p-4 text-sm outline-none"
              placeholder="Type remarks here… (Static now)"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditRemarkAppId(null)}
                className="rounded-full bg-[#EFEFEF] px-6 py-3 font-semibold text-[#0B0F2A]"
              >
                Cancel
              </button>
              <button
                onClick={saveRemarks}
                className="rounded-full bg-[#0B0F2A] px-6 py-3 font-semibold text-white"
              >
                Save
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      <Toast message={toast} onClose={() => setToast("")} />
    </div>
  );
}
