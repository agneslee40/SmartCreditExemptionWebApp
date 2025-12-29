// src/pages/ApplicationDetails.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";

/* ---------- tiny inline icons ---------- */
function IconBack({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15 18 9 12l6-6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconEye({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}
function IconDownload({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M8 10l4 4 4-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M5 20h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ---------- small UI helpers ---------- */
function StatusPill({ label, tone = "gray" }) {
  const toneMap = {
    orange: "bg-[#FF7A2F] text-black",
    red: "bg-red-500 text-white",
    gray: "bg-[#D9D9D9] text-[#0B0F2A]",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold ${toneMap[tone]}`}>
      {label}
    </span>
  );
}

function CardShell({ title, children }) {
  return (
    <div className="rounded-[28px] bg-[#EFEFEF] px-8 py-6">
      <div className="text-xl font-extrabold text-[#0B0F2A]">{title}</div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function InfoItem({ label, value, linkish = false }) {
  return (
    <div>
      <div className="text-sm font-semibold text-[#0B0F2A]/80">{label}</div>
      <div className={`mt-2 text-sm ${linkish ? "underline" : ""} text-[#0B0F2A]`}>
        {value ?? "-"}
      </div>
    </div>
  );
}

function statusTone(status) {
  if (!status) return "gray";
  const s = String(status).toLowerCase();
  if (s === "approved") return "orange";
  if (s === "rejected") return "red";
  return "gray";
}

function safeDate(d) {
  if (!d) return "-";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString();
}

export default function ApplicationDetails() {
  const { id } = useParams(); // this is applications.id (numeric)
  const navigate = useNavigate();

  const [app, setApp] = useState(null);
  const [docs, setDocs] = useState([]);
  const [ai, setAi] = useState(null); // optional
  const [loading, setLoading] = useState(true);

  // sorting for documents
  const [docSort, setDocSort] = useState({ key: "file_name", dir: "asc" });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const [appRes, docsRes] = await Promise.all([
          api.get(`/applications/${id}`),
          api.get(`/applications/${id}/documents`),
        ]);

        setApp(appRes.data);
        setDocs(docsRes.data || []);

        // OPTIONAL: only if implement this route in backend (Part 2)
        // If not implemented yet, it will fail silently.
        try {
          const aiRes = await api.get(`/applications/${id}/ai-analysis/latest`);
          setAi(aiRes.data || null);
        } catch {
          setAi(null);
        }
      } catch (e) {
        console.error(e);
        alert("Failed to load application details.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const toggleSort = (key) => {
    setDocSort((prev) => {
      if (prev.key !== key) return { key, dir: "asc" };
      return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
    });
  };

  const formatBytes = (bytes) => {
    if (bytes == null) return "-";
    const units = ["B", "KB", "MB", "GB"];
    let b = bytes;
    let i = 0;
    while (b >= 1024 && i < units.length - 1) {
      b /= 1024;
      i++;
    }
    return `${b.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  };

  const sortedDocs = useMemo(() => {
    const list = [...docs];
    const { key, dir } = docSort;

    list.sort((a, b) => {
      const av = a?.[key];
      const bv = b?.[key];

      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;

      if (typeof av === "number" && typeof bv === "number") {
        return dir === "asc" ? av - bv : bv - av;
      }

      if (key === "uploaded_at") {
        const ad = new Date(av).getTime();
        const bd = new Date(bv).getTime();
        return dir === "asc" ? ad - bd : bd - ad;
      }

      const as = String(av).toLowerCase();
      const bs = String(bv).toLowerCase();
      if (as < bs) return dir === "asc" ? -1 : 1;
      if (as > bs) return dir === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [docs, docSort]);

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/tasks");
  };

  if (loading) return <div className="mt-10 text-sm">Loading…</div>;
  if (!app) return <div className="mt-10 text-sm">Application not found.</div>;

// ---- requested subjects from new table (preferred) ----
  const reqList = Array.isArray(app.requested_subjects) ? app.requested_subjects : [];

  const subjectNames = reqList
    .map((x) => x?.subject_name)
    .filter(Boolean)
    .join(", ");

  const subjectCodes = reqList
    .map((x) => x?.subject_code)
    .filter(Boolean)
    .join(", ");

  const vm = {
    header: {
      type: app.type || "-",
      displayId: app.application_id || app.id,
      date: safeDate(app.created_at || app.date_submitted),
    },
    status: {
      sl: app.sl_status || "Pending",
      pl: app.pl_status || "Pending",
      reg: app.registry_status || "Pending",
    },
    personal: {
      name: app.student_name || "-",
      programme: app.programme || "-",
      nric: app.nric_passport || "-",
      studentId: app.student_id || "-",
      intake: app.intake || "-",
      semester: app.semester || "-",
    },
    academic: {
      yearCompletion: app.prev_year_completion || "-", 
      qualification: app.qualification || "-",
      institution: app.former_institution || "-",
      sunwaySubjectCode: subjectCodes || "-",
      sunwaySubjectName: subjectNames || (app.requested_subject || "-"), // fallback if old column still used
      previousSubject: app.prev_subject_name || "-", 
      mark: (ai?.mark_detected ?? app.mark_detected) || "-", 
      grade: (ai?.grade_detected ?? app.grade_detected) || "-", 
    },
  };

  return (
    <div className="bg-white">
      {/* Top row: back + title block + right statuses */}
      <div className="flex items-start justify-between">
        {/* Left */}
        <div>
          <button
            onClick={goBack}
            className="inline-flex items-center justify-center rounded-xl p-2 text-[#0B0F2A] hover:bg-black/5"
            title="Back"
          >
            <IconBack className="h-8 w-8" />
          </button>

          <h1 className="mt-4 text-6xl font-extrabold tracking-tight text-[#0B0F2A]">
            Application Details
          </h1>

          {/* Type pill + id/date */}
          <div className="flex items-center gap-4 mt-4">
            <span className="rounded-full bg-[#EFEFEF] px-5 py-2 text-sm font-semibold text-[#0B0F2A]">
              {vm.header.type}
            </span>

            <span className="text-sm font-semibold text-[#0B0F2A]/80">
              {vm.header.displayId} | {vm.header.date}
            </span>
          </div>
        </div>

        {/* Right status stack */}
        <div className="mt-14 space-y-4 text-sm">
          <div className="flex items-center justify-end gap-4">
            <div className="text-[#0B0F2A]/80">Subject Lecturer</div>
            <StatusPill label={vm.status.sl} tone={statusTone(vm.status.sl)} />
          </div>

          <div className="flex items-center justify-end gap-4">
            <div className="text-[#0B0F2A]/80">Programme Leader</div>
            <StatusPill label={vm.status.pl} tone={statusTone(vm.status.pl)} />
          </div>

          <div className="flex items-center justify-end gap-4">
            <div className="text-[#0B0F2A]/80">Registry</div>
            <StatusPill label={vm.status.reg} tone={statusTone(vm.status.reg)} />
          </div>
        </div>
      </div>

      {/* Two cards row */}
      <div className="mt-10 grid grid-cols-2 gap-10">
        {/* Personal & Programme */}
        <CardShell title="Personal and Programme Particulars">
          <div className="grid grid-cols-2 gap-x-16 gap-y-8">
            <InfoItem label="Name (as in NRIC / Passport)" value={vm.personal.name} linkish />
            <InfoItem label="Programme" value={vm.personal.programme} linkish />

            <InfoItem label="NRIC / Passport No." value={vm.personal.nric} linkish />
            <InfoItem label="Student ID (for enrolled student)" value={vm.personal.studentId} linkish />

            <InfoItem label="Intake" value={vm.personal.intake} linkish />
            <InfoItem label="Semester" value={vm.personal.semester} />
          </div>
        </CardShell>

        {/* Supporting Documents */}
        <CardShell title="Supporting Documents">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-[#0B0F2A]/70">
                <tr className="border-b border-black/10">
                  <th className="py-4 pr-4 text-sm font-semibold">
                    <button onClick={() => toggleSort("file_name")} className="inline-flex items-center gap-2">
                      Name <span className="opacity-50">≡</span>
                    </button>
                  </th>
                  <th className="py-4 px-4 text-sm font-semibold">Type</th>
                  <th className="py-4 px-4 text-sm font-semibold">Details</th>
                  <th className="py-4 px-4 text-sm font-semibold">
                    <button onClick={() => toggleSort("file_size")} className="inline-flex items-center gap-2">
                      File Size <span className="opacity-50">≡</span>
                    </button>
                  </th>
                  <th className="py-4 pl-4 text-sm font-semibold text-right"></th>
                </tr>
              </thead>

              <tbody>
                {sortedDocs.map((d) => (
                  <tr key={d.id} className="border-b border-black/10 last:border-0">
                    <td className="py-4 pr-4 text-sm">
                      <span className="underline underline-offset-4">{d.file_name}</span>
                    </td>
                    <td className="py-4 px-4 text-sm">{d.file_type || "-"}</td>
                    <td className="py-4 px-4 text-sm">{d.uploaded_at ? String(d.uploaded_at).slice(0, 10) : "-"}</td>
                    <td className="py-4 px-4 text-sm">{formatBytes(d.file_size)}</td>

                    <td className="py-4 pl-4">
                      <div className="flex items-center justify-end gap-4">
                        <button
                          onClick={() =>
                            window.open(`http://localhost:5000/api/applications/documents/${d.id}/view`, "_blank")
                          }
                          className="rounded-lg p-2 hover:bg-black/5"
                          title="View"
                        >
                          <IconEye className="h-5 w-5" />
                        </button>

                        <button
                          onClick={() =>
                            window.open(`http://localhost:5000/api/applications/documents/${d.id}/download`, "_blank")
                          }
                          className="rounded-lg p-2 hover:bg-black/5"
                          title="Download"
                        >
                          <IconDownload className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {sortedDocs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-sm text-[#0B0F2A]/55">
                      No documents uploaded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardShell>
      </div>

      {/* Academic Particulars */}
      <div className="mt-10">
        <CardShell title="Academic Particulars">
          <div className="grid grid-cols-8 gap-x-10">
            <InfoItem
              label="Year of Completion"
              value={vm.academic.yearCompletion}
              linkish
            />

            <InfoItem
              label="Qualification Obtained"
              value={vm.academic.qualification}
              linkish
            />

            <InfoItem
              label="Institution"
              value={vm.academic.institution}
              linkish
            />

            <InfoItem
              label="Sunway Subject Code"
              value={vm.academic.sunwaySubjectCode}
              linkish
            />

            <InfoItem
              label="Sunway Subject Name"
              value={vm.academic.sunwaySubjectName}
              linkish
            />

            <InfoItem
              label="Previous Subject"
              value={vm.academic.previousSubject}
              linkish
            />

            <InfoItem
              label="Mark"
              value={vm.academic.mark}
            />

            <InfoItem
              label="Grade"
              value={vm.academic.grade}
            />
          </div>


        </CardShell>
      </div>

      <div className="h-10" />
    </div>
  );
}
