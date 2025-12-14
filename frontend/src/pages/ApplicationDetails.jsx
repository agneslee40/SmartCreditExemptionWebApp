// src/pages/ApplicationDetails.jsx
import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

/* ---------- tiny inline icons ---------- */
function IconBack({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 18 9 12l6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconSort({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 7h10M7 12h7M7 17h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0" atl="currentColor"
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
      <path d="M8 10l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 20h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ---------- small UI helpers ---------- */
function StatusPill({ label, tone = "gray" }) {
  const toneMap = {
    orange: "bg-[#FF7A2F] text-black",
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
    <div className="rounded-[28px] bg-[#EFEFEF] px-10 py-8">
      <div className="text-xl font-extrabold text-[#0B0F2A]">{title}</div>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function InfoItem({ label, value, linkish = false }) {
  return (
    <div>
      <div className="text-sm font-semibold text-[#0B0F2A]/80">{label}</div>
      <div className={`mt-2 text-sm ${linkish ? "underline" : ""} text-[#0B0F2A]`}>
        {value}
      </div>
    </div>
  );
}

export default function ApplicationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // --- mock data to match your figma fields ---
  const application = {
    applicationId: id || "A001",
    type: "Credit Exemption",
    date: "7th January 2025",

    // Personal & programme particulars
    name: "Lee Wen Xuan",
    programme: "BSc (Hons) in Computer Science",
    studentId: "22115737",
    nric: "020325-15-1560",
    intake: "202301",
    semester: "1",

    // Status (right side)
    stageStatus: {
      subjectLecturer: "Approved",
      programmeLeader: "Approved",
      registry: "Pending",
    },

    // Supporting documents table
    docs: [
      { name: "LWX_SPM.pdf", type: "Transcript", details: "1 page", size: "7 MB" },
      { name: "LWX_SPM.pdf", type: "Transcript", details: "1 page", size: "7 MB" },
      // later: add "Sunway course syllabus pdf" row too
    ],

    // Academic particulars (the overflow section you showed)
    academic: {
      yearCompletion: "2021",
      qualification: "Sijil Pelajaran Malaysia (SPM)",
      institution: "Wesley Methodist School Kuala Lumpur (INTERNATIONAL)",
      sunwaySubjectCode: "MPU 3213",
      sunwaySubjectName: "Malay Language for Communication",
      previousSubject: "Bahasa Melayu",
      mark: "91%",
      grade: "A+",
    },
  };

  const [sortBy, setSortBy] = useState({ key: null, dir: "asc" });

  const sortedDocs = useMemo(() => {
    const list = [...application.docs];
    if (!sortBy.key) return list;

    const dir = sortBy.dir === "asc" ? 1 : -1;
    return list.sort((a, b) => {
      const av = String(a[sortBy.key] ?? "");
      const bv = String(b[sortBy.key] ?? "");
      return av.localeCompare(bv) * dir;
    });
  }, [application.docs, sortBy]);

  const toggleSort = (key) => {
    setSortBy((prev) => {
      if (prev.key !== key) return { key, dir: "asc" };
      return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
    });
  };

  const goBack = () => {
    // goes back to Tasks page like figma, even if user opened in new tab
    if (window.history.length > 1) navigate(-1);
    else navigate("/tasks");
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
          <div className="mt-6 flex items-center gap-6">
            <span className="inline-flex items-center rounded-full bg-[#EFEFEF] px-5 py-2 text-sm font-semibold text-[#0B0F2A]">
              {application.type}
            </span>
            <div className="text-sm font-semibold text-[#0B0F2A]/85">
              {application.applicationId} | {application.date}
            </div>
          </div>
        </div>

        {/* Right status stack */}
        <div className="mt-24 space-y-5 text-sm">
          <div className="flex items-center justify-end gap-4">
            <div className="text-[#0B0F2A]/80">Subject Lecturer</div>
            <StatusPill
              label={application.stageStatus.subjectLecturer}
              tone={application.stageStatus.subjectLecturer === "Approved" ? "orange" : "gray"}
            />
          </div>

          <div className="flex items-center justify-end gap-4">
            <div className="text-[#0B0F2A]/80">Programme Leader</div>
            <StatusPill
              label={application.stageStatus.programmeLeader}
              tone={application.stageStatus.programmeLeader === "Approved" ? "orange" : "gray"}
            />
          </div>

          <div className="flex items-center justify-end gap-4">
            <div className="text-[#0B0F2A]/80">Registry</div>
            <StatusPill
              label={application.stageStatus.registry}
              tone={application.stageStatus.registry === "Approved" ? "orange" : "gray"}
            />
          </div>
        </div>
      </div>

      {/* Two cards row */}
      <div className="mt-10 grid grid-cols-2 gap-10">
        {/* Personal & Programme */}
        <CardShell title="Personal and Programme Particulars">
          <div className="grid grid-cols-2 gap-x-16 gap-y-8">
            <InfoItem label="Name (as in NRIC / Passport)" value={application.name} linkish />
            <InfoItem label="Programme" value={application.programme} linkish />

            <InfoItem label="NRIC / Passport No." value={application.nric} linkish />
            <InfoItem label="Student ID (for enrolled student)" value={application.studentId} linkish />

            <InfoItem label="Intake" value={application.intake} linkish />
            <InfoItem label="Semester" value={application.semester} />
          </div>
        </CardShell>

        {/* Supporting Documents */}
        <CardShell title="Supporting Documents">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[#0B0F2A]/75">
                <tr>
                  <th className="pb-4 font-semibold">
                    <button
                      onClick={() => toggleSort("name")}
                      className="inline-flex items-center gap-2 hover:text-[#0B0F2A]"
                    >
                      Name <IconSort className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="pb-4 font-semibold">Type</th>
                  <th className="pb-4 font-semibold">Details</th>
                  <th className="pb-4 font-semibold">
                    <button
                      onClick={() => toggleSort("size")}
                      className="inline-flex items-center gap-2 hover:text-[#0B0F2A]"
                    >
                      File Size <IconSort className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="pb-4" />
                  <th className="pb-4" />
                </tr>
              </thead>

              <tbody className="text-[#0B0F2A]">
                {sortedDocs.map((d, idx) => (
                  <tr key={idx} className="border-t border-black/10">
                    <td className="py-5 underline">{d.name}</td>
                    <td className="py-5">{d.type}</td>
                    <td className="py-5">{d.details}</td>
                    <td className="py-5">{d.size}</td>
                    <td className="py-5">
                      <button
                        className="rounded-lg p-2 text-[#0B0F2A] hover:bg-black/5"
                        title="View"
                        onClick={() => alert("View PDF (wire later)")}
                      >
                        <IconEye className="h-5 w-5" />
                      </button>
                    </td>
                    <td className="py-5">
                      <button
                        className="rounded-lg p-2 text-[#0B0F2A] hover:bg-black/5"
                        title="Download"
                        onClick={() => alert("Download (wire later)")}
                      >
                        <IconDownload className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardShell>
      </div>

      {/* Academic Particulars (full width, lower section like your pic 2) */}
      <div className="mt-10">
        <CardShell title="Academic Particulars">
          <div className="grid grid-cols-3 gap-x-16 gap-y-10">
            <InfoItem label="Year of Completion" value={application.academic.yearCompletion} linkish />
            <InfoItem label="Qualification Obtained/ Programmed Studied" value={application.academic.qualification} linkish />
            <InfoItem label="Name of Institution" value={application.academic.institution} linkish />

            <div className="col-span-3">
              <div className="mt-2 grid grid-cols-5 gap-x-16 gap-y-8">
                <div>
                  <div className="text-sm font-semibold text-[#0B0F2A]/80">Sunway Subject Code, Name</div>
                  <div className="mt-2 flex gap-4">
                    <span className="underline text-sm">{application.academic.sunwaySubjectCode}</span>
                    <span className="underline text-sm">{application.academic.sunwaySubjectName}</span>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold text-[#0B0F2A]/80">Subject Name (previously taken)</div>
                  <div className="mt-2 underline text-sm">{application.academic.previousSubject}</div>
                </div>

                <div>
                  <div className="text-sm font-semibold text-[#0B0F2A]/80">Mark Obtained</div>
                  <div className="mt-2 underline text-sm">{application.academic.mark}</div>
                </div>

                <div>
                  <div className="text-sm font-semibold text-[#0B0F2A]/80">Grade</div>
                  <div className="mt-2 text-sm">{application.academic.grade}</div>
                </div>

                <div />
              </div>
            </div>
          </div>
        </CardShell>
      </div>

      <div className="h-10" />
    </div>
  );
}
