// src/pages/TasksManagement.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

const TABS = ["All", "In Progress", "Credit Exemption", "Credit Transfer", "Completed"];

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
    orange: "bg-[#FF7A2F] text-black",   // Approved
    red: "bg-[#FF3B30] text-white",      // Rejected
    gray: "bg-[#D9D9D9] text-[#0B0F2A]", // Pending / To Be Review / etc.
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

function mapDbAppToUi(a) {
  // convert ISO date -> yyyy-mm-dd (same style you used in Dashboard)
  const dateStr = a.date_submitted ? String(a.date_submitted).slice(0, 10) : "-";

  return {
    // keep DB primary key for routing
    dbId: a.id,

    // UI currently shows application code like "A001"
    id: a.application_id,

    date: dateStr,
    studentId: a.student_id || "-",
    studentName: a.student_name || "-",
    academicSession: a.academic_session || "-",

    // you named this column "Previously Take Qualification" in UI
    // but DB column is "qualification" (current programme). For now, map it here.
    // Later we can add a dedicated "previous_qualification" column if you want.
    prevQual: a.qualification || "-",

    formerInstitution: a.former_institution || "-",
    requestedSubject: a.requested_subject || "-",
    type: a.type || "-",

    // We'll compute progress later properly; for now keep everything In Progress
    progress: "In Progress",

    // backend returns these now (because your GET SELECT includes them)
    stageStatus: {
      subjectLecturer: a.sl_status || "Pending",
      programmeLeader: a.pl_status || "Pending",
      registry: a.registry_status || "Pending",
      registryReminderSent: false, // UI-only
    },

    // team/remarks are not coming from backend yet
    team: { name: "—", members: [] },
    remarks: a.remarks ? [{ by: "Programme Leader", text: a.remarks }] : [],
  };
}

const isFinalDecision = (s) => ["Approved", "Rejected"].includes(String(s || "").trim());

const computeProgress = (app) => {
  const done =
    isFinalDecision(app.pl_status) &&
    isFinalDecision(app.sl_status) &&
    isFinalDecision(app.registry_status);

  return done ? "Completed" : "In Progress";
};

const formatDateNice = (iso) => {
  if (!iso) return "-";
  // show yyyy-mm-dd like your dashboard
  return String(iso).slice(0, 10);
};

function toneForStatus(status) {
  if (status === "Approved") return "orange";
  if (status === "Rejected") return "red";
  return "gray";
}


// ---------- main page ----------
export default function TasksManagement() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  
  const [toast, setToast] = useState("");

  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [sortBy, setSortBy] = useState("latest"); // latest | oldest | az | za

  const [fType, setFType] = useState("All"); // All | Credit Exemption | Credit Transfer
  const [fPl, setFPl] = useState("All"); // All | To Be Assign | Assigned | To Be Review | Approved | Rejected
  const [fSl, setFSl] = useState("All"); // All | Pending | To Be Review | Approved | Rejected
  const [fReg, setFReg] = useState("All"); // All | Pending | Approved | Rejected

  const [fAssignedTo, setFAssignedTo] = useState("All"); 
  // All | (later: actual SL names/emails)

  

  const [editRemarkAppId, setEditRemarkAppId] = useState(null);
  const [editRemarkText, setEditRemarkText] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get("/applications");

        // map backend rows → UI rows used by your table
        const mapped = (res.data || []).map((r) => {
          const progress = computeProgress(r);

          return {
            id: r.application_id,                 // your UI uses A001 style
            dbId: r.id,                           // keep DB id for navigation
            date: formatDateNice(r.date_submitted),
            studentId: r.student_id || "-",
            studentName: r.student_name || "-",
            academicSession: r.academic_session || "-",
            prevQual: r.qualification || "-",     // you used "Previously Take Qualification"
            formerInstitution: r.former_institution || "-",
            requestedSubject: r.requested_subject || "-",
            type: r.type || "-",
            progress,

            // stage statuses (use your real DB fields)
            stageStatus: {
              subjectLecturer: r.sl_status || "Pending",
              programmeLeader: r.pl_status || "To Be Assign",
              registry: r.registry_status || "Pending",
              registryReminderSent: false,
            },

            // remarks: for now DB has single text field
            remarks: r.remarks ? [{ by: "Programme Leader", text: r.remarks }] : [],

            // “team” pill: simple prototype
            team: {
              name: "Computer Science", // keep static for now
              members: [
                { name: "Programme Leader", email: "pl@sunway.edu.my", avatar: "https://i.pravatar.cc/100?img=32" },
                ...(r.sl_email
                  ? [{ name: r.sl_name || "Subject Lecturer", email: r.sl_email, avatar: "https://i.pravatar.cc/100?img=22" }]
                  : []),
              ],
            },
          };
        });

        setApps(mapped);
      } catch (e) {
        console.error(e);
        alert("Failed to load tasks from backend.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);


  const filteredApps = useMemo(() => {
    let list = [...apps];

    // -------- Tabs --------
    if (tab === "In Progress") list = list.filter((a) => a.progress === "In Progress");
    if (tab === "Completed") list = list.filter((a) => a.progress === "Completed");
    if (tab === "Credit Exemption") list = list.filter((a) => a.type === "Credit Exemption");
    if (tab === "Credit Transfer") list = list.filter((a) => a.type === "Credit Transfer");

    // -------- Search --------
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((a) => {
        return (
          String(a.id).toLowerCase().includes(q) ||
          String(a.studentId || "").toLowerCase().includes(q) ||
          String(a.studentName || "").toLowerCase().includes(q) ||
          String(a.requestedSubject || "").toLowerCase().includes(q) ||
          String(a.formerInstitution || "").toLowerCase().includes(q)
        );
      });
    }

    // -------- New Filters --------
    if (fType !== "All") list = list.filter((a) => a.type === fType);

    // These assume you already mapped DB -> stageStatus like:
    // stageStatus.subjectLecturer, programmeLeader, registry
    if (fPl !== "All") list = list.filter((a) => a.stageStatus?.programmeLeader === fPl);
    if (fSl !== "All") list = list.filter((a) => a.stageStatus?.subjectLecturer === fSl);
    if (fReg !== "All") list = list.filter((a) => a.stageStatus?.registry === fReg);

    // Team filter (temporary): treat Assigned SL as “team”
    // If your app object has something like a.team.members, we can filter by SL name/email later.
    if (fAssignedTo !== "All") {
      list = list.filter((a) => {
        const members = a.team?.members || [];
        return members.some((m) => (m.email || "").toLowerCase() === fAssignedTo.toLowerCase());
      });
    }

    // -------- Sorting --------
    const getDateValue = (a) => {
      // supports both: "2025-12-14" OR "7th January 2025"
      const d = new Date(a.date);
      if (!isNaN(d.getTime())) return d.getTime();
      return 0;
    };

    if (sortBy === "latest") list.sort((a, b) => getDateValue(b) - getDateValue(a));
    if (sortBy === "oldest") list.sort((a, b) => getDateValue(a) - getDateValue(b));
    if (sortBy === "az") list.sort((a, b) => String(a.studentName || "").localeCompare(String(b.studentName || "")));
    if (sortBy === "za") list.sort((a, b) => String(b.studentName || "").localeCompare(String(a.studentName || "")));

    return list;
  }, [apps, tab, search, sortBy, fType, fPl, fSl, fReg, fAssignedTo]);


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



  if (loading) {
    return <div className="mt-10 text-sm text-[#0B0F2A]">Loading…</div>;
  }

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
                                tone={toneForStatus(a.stageStatus.subjectLecturer)}
                              />
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-[110px] text-[#0B0F2A]/70">Programme Leader</div>
                              <StatusBadge
                                label={a.stageStatus.programmeLeader}
                                tone={toneForStatus(a.stageStatus.programmeLeader)}
                              />
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-[110px] text-[#0B0F2A]/70">Registry</div>
                              <StatusBadge
                                label={a.stageStatus.registry}
                                tone={toneForStatus(a.stageStatus.registry)}
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

                            
                            <div className="flex-1" />

                            {/* View details */}
                            <button
                              onClick={() => navigate(`/tasks/applications/${a.dbId}`)}
                              className="rounded-full bg-[#EFEFEF] px-8 py-3 text-sm font-semibold text-[#0B0F2A] hover:bg-[#E7E7E7]"
                            >
                              View Details
                            </button>

                            {/* Review */}
                            <button
                              onClick={() => navigate(`/tasks/applications/${a.dbId}/review`)}
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
        <ModalShell title="Filters" onClose={() => setShowFilterPanel(false)} wide>
          <div className="grid grid-cols-2 gap-4 text-sm text-[#0B0F2A]">

            {/* Sort */}
            <div className="rounded-2xl bg-[#F5F5F5] p-4">
              <div className="font-bold mb-2">Sort</div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 outline-none"
              >
                <option value="latest">Latest</option>
                <option value="oldest">Oldest</option>
                <option value="az">Student Name (A–Z)</option>
                <option value="za">Student Name (Z–A)</option>
              </select>
            </div>

            {/* Type */}
            <div className="rounded-2xl bg-[#F5F5F5] p-4">
              <div className="font-bold mb-2">Type</div>
              <select
                value={fType}
                onChange={(e) => setFType(e.target.value)}
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 outline-none"
              >
                <option value="All">All</option>
                <option value="Credit Exemption">Credit Exemption</option>
                <option value="Credit Transfer">Credit Transfer</option>
              </select>
            </div>

            {/* SL Status */}
            <div className="rounded-2xl bg-[#F5F5F5] p-4">
              <div className="font-bold mb-2">Subject Lecturer Status</div>
              <select
                value={fSl}
                onChange={(e) => setFSl(e.target.value)}
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 outline-none"
              >
                <option value="All">All</option>
                <option value="Pending">Pending</option>
                <option value="To Be Review">To Be Review</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {/* PL Status */}
            <div className="rounded-2xl bg-[#F5F5F5] p-4">
              <div className="font-bold mb-2">Programme Leader Status</div>
              <select
                value={fPl}
                onChange={(e) => setFPl(e.target.value)}
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 outline-none"
              >
                <option value="All">All</option>
                <option value="To Be Assign">To Be Assign</option>
                <option value="Assigned">Assigned</option>
                <option value="To Be Review">To Be Review</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {/* Registry Status */}
            <div className="rounded-2xl bg-[#F5F5F5] p-4">
              <div className="font-bold mb-2">Registry Status</div>
              <select
                value={fReg}
                onChange={(e) => setFReg(e.target.value)}
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 outline-none"
              >
                <option value="All">All</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {/* Team filter (temporary) */}
            <div className="rounded-2xl bg-[#F5F5F5] p-4">
              <div className="font-bold mb-2">Assigned SL (Team)</div>
              <input
                value={fAssignedTo === "All" ? "" : fAssignedTo}
                onChange={(e) => setFAssignedTo(e.target.value || "All")}
                placeholder="Type SL email (optional)"
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 outline-none"
              />
              <div className="mt-2 text-xs text-[#0B0F2A]/60">
                (For now, filter by SL email. Later we’ll replace this with a dropdown from real users.)
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => {
                setSortBy("latest");
                setFType("All");
                setFPl("All");
                setFSl("All");
                setFReg("All");
                setFAssignedTo("All");
              }}
              className="rounded-full bg-[#EFEFEF] px-6 py-3 font-semibold text-[#0B0F2A]"
            >
              Reset
            </button>

            <button
              onClick={() => setShowFilterPanel(false)}
              className="rounded-full bg-[#0B0F2A] px-6 py-3 font-semibold text-white"
            >
              Apply
            </button>
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
