// src/pages/ReferenceCases.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

/* ------------------ tiny inline icons (no library) ------------------ */
function IconSearch({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10.5 18.5a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M16.5 16.5 21 21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

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

function IconExternal({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M14 4h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 14 20 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCheck({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconCross({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/* ------------------ UI helpers (consistent with your other pages) ------------------ */
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

function Badge({ tone = "gray", children }) {
  const map = {
    orange: "bg-[#FF7A2F] text-black",
    gray: "bg-[#D9D9D9] text-[#0B0F2A]",
    dark: "bg-[#0B0F2A] text-white",
    pale: "bg-[#EFEFEF] text-[#0B0F2A]",
    approved: "bg-[#E9E2B2] text-[#0B0F2A]",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold ${map[tone]}`}>
      {children}
    </span>
  );
}

function ModalShell({ title, children, onClose, wide = false }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-6">
      <div className={`w-full ${wide ? "max-w-4xl" : "max-w-xl"} rounded-3xl bg-white p-6 shadow-xl`}>
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

/* ------------------ Mock reference cases (replace with API later) ------------------ */
const REFERENCE_CASES = [
  {
    caseId: "RC-2025-001",
    applicationId: "A003",
    decision: "Approved", // Approved | Rejected
    type: "Credit Exemption",
    faculty: "School of Computing & AI",
    createdAt: "7th January 2025",
    decidedAt: "10th January 2025",
    decidedBy: { role: "Programme Leader", name: "Programme Leader", email: "pl@sunway.edu.my" },
    subjectLecturer: { name: "Subject Lecturer", email: "sl@sunway.edu.my" },
    student: { id: "22115739", name: "Ng Chee Han" },
    academicSession: "202301 | 1",
    formerInstitution: "Wesley Methodist School Kuala Lumpur (INTERNATIONAL)",
    requestedSubject: "MPU 3213 Malay Language for Communication",
    prevQualification: "Bahasa Melayu",
    evidence: [
      { category: "Similarity", value: "88%", snippet: "Topics match: communication skills, oral assessment, written components." },
      { category: "Credit Hours", value: "3", snippet: "Credit Hours: 3" },
      { category: "Grade", value: "A", snippet: "Grade: A" },
    ],
    reasonSummary:
      "Meets minimum grade and credit hours; similarity above threshold. Learning outcomes sufficiently aligned.",
    tags: ["Similarity ≥ 80%", "Grade ≥ C", "Credit Hours ≥ 3"],
  },
  {
    caseId: "RC-2025-002",
    applicationId: "A021",
    decision: "Rejected",
    type: "Credit Transfer",
    faculty: "School of Computing & AI",
    createdAt: "3rd February 2025",
    decidedAt: "6th February 2025",
    decidedBy: { role: "Subject Lecturer", name: "Dr. Example", email: "dr.example@sunway.edu.my" },
    subjectLecturer: { name: "Dr. Example", email: "dr.example@sunway.edu.my" },
    student: { id: "22114001", name: "Lim Jia Hui" },
    academicSession: "202301 | 1",
    formerInstitution: "Some College (Overseas)",
    requestedSubject: "CST 2309 Web Programming I",
    prevQualification: "Diploma in IT",
    evidence: [
      { category: "Similarity", value: "62%", snippet: "Missing: DOM manipulation + client-side validation; limited JS coverage." },
      { category: "Credit Hours", value: "2", snippet: "Credit Hours: 2" },
      { category: "Grade", value: "B+", snippet: "Grade: B+" },
    ],
    reasonSummary:
      "Similarity below requirement and credit hours do not meet minimum. Recommendation: take bridging module.",
    tags: ["Similarity < 80%", "Credit Hours < 3"],
  },
  {
    caseId: "RC-2025-003",
    applicationId: "A045",
    decision: "Approved",
    type: "Credit Transfer",
    faculty: "School of Business",
    createdAt: "19th March 2025",
    decidedAt: "24th March 2025",
    decidedBy: { role: "Programme Leader", name: "PL (Business)", email: "pl.business@sunway.edu.my" },
    subjectLecturer: { name: "SL (Business)", email: "sl.business@sunway.edu.my" },
    student: { id: "22109991", name: "Tan Wei Jian" },
    academicSession: "202401 | 1",
    formerInstitution: "Taylor's University",
    requestedSubject: "BUS 2201 Marketing Principles",
    prevQualification: "Foundation in Business",
    evidence: [
      { category: "Similarity", value: "83%", snippet: "Covers 4Ps, segmentation, branding, basic market research." },
      { category: "Credit Hours", value: "3", snippet: "Credit Hours: 3" },
      { category: "Grade", value: "B", snippet: "Grade: B" },
    ],
    reasonSummary:
      "Meets similarity threshold and minimum requirements. Approved based on mapping of course outline and assessments.",
    tags: ["Similarity ≥ 80%", "Credit Hours ≥ 3"],
  },
];

/* ------------------ Similarity scoring (prototype, for “find similar cases”) ------------------ */
function normalizeText(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Very simple similarity for prototype:
// +40 if same requestedSubject contains a common keyword overlap
// +25 if same type
// +20 if same faculty
// +15 if formerInstitution contains overlap
function computeSimilarity(caseRow, query) {
  const qSub = normalizeText(query.requestedSubject);
  const qType = normalizeText(query.type);
  const qFac = normalizeText(query.faculty);
  const qInst = normalizeText(query.formerInstitution);

  const cSub = normalizeText(caseRow.requestedSubject);
  const cType = normalizeText(caseRow.type);
  const cFac = normalizeText(caseRow.faculty);
  const cInst = normalizeText(caseRow.formerInstitution);

  let score = 0;

  // subject overlap
  const qTokens = new Set(qSub.split(" ").filter(Boolean));
  const cTokens = new Set(cSub.split(" ").filter(Boolean));
  const overlap = [...qTokens].filter((t) => cTokens.has(t));
  if (overlap.length >= 4) score += 40;
  else if (overlap.length >= 2) score += 25;
  else if (overlap.length >= 1) score += 15;

  // type
  if (qType && cType === qType) score += 25;

  // faculty
  if (qFac && cFac === qFac) score += 20;

  // institution overlap
  const qi = new Set(qInst.split(" ").filter(Boolean));
  const ci = new Set(cInst.split(" ").filter(Boolean));
  const instOverlap = [...qi].filter((t) => ci.has(t));
  if (instOverlap.length >= 3) score += 15;
  else if (instOverlap.length >= 1) score += 8;

  return Math.min(100, score);
}

/* ------------------ Page ------------------ */
export default function ReferenceCases() {
  const navigate = useNavigate();

  // quick tabs
  const [tab, setTab] = useState("All"); // All | Approved | Rejected

  // search + filters
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [filterType, setFilterType] = useState("All"); // All | Credit Exemption | Credit Transfer
  const [filterFaculty, setFilterFaculty] = useState("All");
  const [sortBy, setSortBy] = useState("Most Similar"); // Most Similar | Newest | Oldest

  // “I am unsure about this case” query (prototype inputs)
  // Later: you can auto-fill this from the current application page.
  const [query, setQuery] = useState({
    requestedSubject: "MPU 3213 Malay Language for Communication",
    type: "Credit Exemption",
    faculty: "School of Computing & AI",
    formerInstitution: "Wesley Methodist School Kuala Lumpur (INTERNATIONAL)",
  });

  // details modal
  const [openCaseId, setOpenCaseId] = useState(null);
  const openCase = openCaseId ? REFERENCE_CASES.find((c) => c.caseId === openCaseId) : null;

  const faculties = useMemo(() => {
    const unique = Array.from(new Set(REFERENCE_CASES.map((c) => c.faculty)));
    return ["All", ...unique];
  }, []);

  const filtered = useMemo(() => {
    let list = [...REFERENCE_CASES];

    // tab
    if (tab === "Approved") list = list.filter((c) => c.decision === "Approved");
    if (tab === "Rejected") list = list.filter((c) => c.decision === "Rejected");

    // filters
    if (filterType !== "All") list = list.filter((c) => c.type === filterType);
    if (filterFaculty !== "All") list = list.filter((c) => c.faculty === filterFaculty);

    // search (caseId, applicationId, subject, institution)
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((c) => {
        return (
          c.caseId.toLowerCase().includes(q) ||
          c.applicationId.toLowerCase().includes(q) ||
          c.requestedSubject.toLowerCase().includes(q) ||
          c.formerInstitution.toLowerCase().includes(q) ||
          c.student.name.toLowerCase().includes(q)
        );
      });
    }

    // attach similarity score
    const withScore = list.map((c) => ({
      ...c,
      similarityScore: computeSimilarity(c, query),
    }));

    // sort
    if (sortBy === "Most Similar") withScore.sort((a, b) => b.similarityScore - a.similarityScore);
    if (sortBy === "Newest") withScore.sort((a, b) => new Date(b.decidedAt) - new Date(a.decidedAt));
    if (sortBy === "Oldest") withScore.sort((a, b) => new Date(a.decidedAt) - new Date(b.decidedAt));

    return withScore;
  }, [tab, filterType, filterFaculty, search, sortBy, query]);

  return (
    <div className="bg-white">
      {/* Title */}
      <h1 className="text-5xl font-extrabold tracking-tight text-[#0B0F2A]">
        Reference Cases
      </h1>

      {/* Search + Filter button */}
      <div className="mt-6 flex items-center justify-between">
        <div className="relative w-[320px]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by subject, institution, student, application ID…"
            className="w-full rounded-full bg-[#F1F1F1] pl-11 pr-4 py-3 text-sm outline-none placeholder:text-[#0B0F2A]/45"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0B0F2A]/40">
            <IconSearch className="h-5 w-5" />
          </span>
        </div>

        <button
          onClick={() => setShowFilters(true)}
          className="rounded-xl p-3 text-[#0B0F2A] hover:bg-black/5"
          title="Filters"
        >
          <IconFilter className="h-7 w-7" />
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex items-center gap-14">
        {["All", "Approved", "Rejected"].map((t) => (
          <TabButton key={t} label={t} active={tab === t} onClick={() => setTab(t)} />
        ))}
      </div>

      {/* Query card (what user is comparing against) */}
      <div className="mt-8 rounded-3xl bg-white shadow-[0_14px_40px_rgba(0,0,0,0.08)] p-6">
        <div className="flex items-center gap-3">
          <div className="text-lg font-extrabold text-[#0B0F2A]">Find similar past cases</div>
          <span className="text-xs font-bold text-[#0B0F2A]/60">
            (Prototype — later auto-fill from current application)
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Requested Subject"
            value={query.requestedSubject}
            onChange={(v) => setQuery((q) => ({ ...q, requestedSubject: v }))}
          />
          <Field
            label="Former Institution"
            value={query.formerInstitution}
            onChange={(v) => setQuery((q) => ({ ...q, formerInstitution: v }))}
          />
          <Field
            label="Type"
            value={query.type}
            onChange={(v) => setQuery((q) => ({ ...q, type: v }))}
          />
          <Field
            label="Faculty"
            value={query.faculty}
            onChange={(v) => setQuery((q) => ({ ...q, faculty: v }))}
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Badge tone="pale">Sorted by: {sortBy}</Badge>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-2xl bg-[#EFEFEF] px-4 py-2 text-sm font-semibold text-[#0B0F2A] outline-none"
          >
            <option>Most Similar</option>
            <option>Newest</option>
            <option>Oldest</option>
          </select>

          <div className="flex-1" />

          <div className="text-xs font-bold text-[#0B0F2A]/60">
            Showing <span className="text-[#0B0F2A]">{filtered.length}</span> cases
          </div>
        </div>
      </div>

      {/* Cases table */}
      <div className="mt-8 rounded-3xl bg-white shadow-[0_14px_40px_rgba(0,0,0,0.08)]">
        <div className="max-h-[62vh] overflow-y-auto rounded-3xl">
          <div className="overflow-x-auto">
            <table className="min-w-[1750px] w-full text-left">
              <thead className="text-[#0B0F2A]/70">
                <tr className="border-b border-black/10">
                  <th className="px-8 py-6 text-sm font-semibold">Action</th>
                  <th className="px-6 py-6 text-sm font-semibold">Similarity</th>
                  <th className="px-6 py-6 text-sm font-semibold">Decision</th>
                  <th className="px-6 py-6 text-sm font-semibold">Case ID</th>
                  <th className="px-6 py-6 text-sm font-semibold">Application ID</th>
                  <th className="px-6 py-6 text-sm font-semibold">Requested Subject</th>
                  <th className="px-6 py-6 text-sm font-semibold">Type</th>
                  <th className="px-6 py-6 text-sm font-semibold">Faculty</th>
                  <th className="px-6 py-6 text-sm font-semibold">Former Institution</th>
                  <th className="px-6 py-6 text-sm font-semibold">Decided By</th>
                  <th className="px-6 py-6 text-sm font-semibold">Decision Date</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((c) => (
                  <tr key={c.caseId} className="border-b border-black/10 align-top">
                    <td className="px-8 py-6">
                      <button
                        onClick={() => setOpenCaseId(c.caseId)}
                        className="rounded-full bg-[#EFEFEF] px-6 py-2 text-sm font-semibold text-[#0B0F2A] hover:bg-[#E7E7E7]"
                      >
                        View
                      </button>
                    </td>

                    <td className="px-6 py-6">
                      <SimilarityPill score={c.similarityScore} />
                    </td>

                    <td className="px-6 py-6">
                      {c.decision === "Approved" ? (
                        <div className="inline-flex items-center gap-2">
                          <IconCheck className="h-5 w-5 text-[#0B0F2A]" />
                          <Badge tone="orange">Approved</Badge>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2">
                          <IconCross className="h-5 w-5 text-[#0B0F2A]" />
                          <Badge tone="gray">Rejected</Badge>
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-6 text-sm font-semibold text-[#0B0F2A]">{c.caseId}</td>
                    <td className="px-6 py-6 text-sm">{c.applicationId}</td>
                    <td className="px-6 py-6 text-sm">{c.requestedSubject}</td>
                    <td className="px-6 py-6 text-sm">{c.type}</td>
                    <td className="px-6 py-6 text-sm">{c.faculty}</td>
                    <td className="px-6 py-6 text-sm">{c.formerInstitution}</td>
                    <td className="px-6 py-6 text-sm">
                      <div className="font-semibold text-[#0B0F2A]">{c.decidedBy.name}</div>
                      <div className="text-[#0B0F2A]/60 text-xs">{c.decidedBy.role}</div>
                    </td>
                    <td className="px-6 py-6 text-sm">{c.decidedAt}</td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-8 py-12 text-center text-[#0B0F2A]/55">
                      No reference cases match your search/filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="h-4" />
        </div>
      </div>

      {/* Filters modal */}
      {showFilters && (
        <ModalShell title="Filters" onClose={() => setShowFilters(false)}>
          <div className="space-y-4 text-sm text-[#0B0F2A]/80">
            <div className="rounded-2xl bg-[#F5F5F5] p-4 space-y-4">
              <div>
                <div className="text-xs font-bold text-[#0B0F2A]/60">Type</div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="mt-2 w-full rounded-2xl bg-white border border-black/10 px-4 py-3 text-sm font-semibold text-[#0B0F2A] outline-none"
                >
                  <option>All</option>
                  <option>Credit Exemption</option>
                  <option>Credit Transfer</option>
                </select>
              </div>

              <div>
                <div className="text-xs font-bold text-[#0B0F2A]/60">Faculty</div>
                <select
                  value={filterFaculty}
                  onChange={(e) => setFilterFaculty(e.target.value)}
                  className="mt-2 w-full rounded-2xl bg-white border border-black/10 px-4 py-3 text-sm font-semibold text-[#0B0F2A] outline-none"
                >
                  {faculties.map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="text-xs font-bold text-[#0B0F2A]/60">Sort</div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="mt-2 w-full rounded-2xl bg-white border border-black/10 px-4 py-3 text-sm font-semibold text-[#0B0F2A] outline-none"
                >
                  <option>Most Similar</option>
                  <option>Newest</option>
                  <option>Oldest</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setFilterType("All");
                  setFilterFaculty("All");
                  setSortBy("Most Similar");
                }}
                className="rounded-full bg-[#EFEFEF] px-6 py-3 font-semibold text-[#0B0F2A]"
              >
                Reset
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="rounded-full bg-[#0B0F2A] px-6 py-3 font-semibold text-white"
              >
                Done
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Case details modal */}
      {openCase && (
        <ModalShell title={`Case Details — ${openCase.caseId}`} onClose={() => setOpenCaseId(null)} wide>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: decision + reason */}
            <div className="rounded-3xl bg-[#F5F5F5] p-5">
              <div className="flex items-center gap-3">
                {openCase.decision === "Approved" ? (
                  <>
                    <IconCheck className="h-6 w-6 text-[#0B0F2A]" />
                    <div className="text-2xl font-extrabold text-[#0B0F2A]">Approved</div>
                    <Badge tone="orange">Final</Badge>
                  </>
                ) : (
                  <>
                    <IconCross className="h-6 w-6 text-[#0B0F2A]" />
                    <div className="text-2xl font-extrabold text-[#0B0F2A]">Rejected</div>
                    <Badge tone="gray">Final</Badge>
                  </>
                )}
                <div className="ml-auto">
                  <SimilarityPill score={computeSimilarity(openCase, query)} />
                </div>
              </div>

              <div className="mt-4 text-xs font-bold text-[#0B0F2A]/60">Reason summary</div>
              <div className="mt-2 rounded-2xl bg-white border border-black/10 p-4 text-sm text-[#0B0F2A]/80">
                {openCase.reasonSummary}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {openCase.tags.map((t) => (
                  <Badge key={t} tone="pale">{t}</Badge>
                ))}
              </div>

              <div className="mt-5 flex items-center gap-3">
                <button
                  onClick={() => navigate(`/tasks/applications/${openCase.applicationId}/review`)}
                  className="rounded-full bg-[#FF6B2C] px-6 py-3 text-sm font-extrabold text-black shadow-sm hover:shadow-md inline-flex items-center gap-2"
                >
                  <IconExternal className="h-5 w-5" />
                  Open in Review
                </button>

                <button
                  onClick={() => setOpenCaseId(null)}
                  className="rounded-full bg-[#EFEFEF] px-6 py-3 text-sm font-semibold text-[#0B0F2A]"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Right: application details + evidence */}
            <div className="space-y-4">
              <div className="rounded-3xl bg-white border border-black/10 p-5">
                <div className="text-lg font-extrabold text-[#0B0F2A]">Application details</div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Info label="Application ID" value={openCase.applicationId} />
                  <Info label="Type" value={openCase.type} />
                  <Info label="Faculty" value={openCase.faculty} />
                  <Info label="Requested Subject" value={openCase.requestedSubject} />
                  <Info label="Former Institution" value={openCase.formerInstitution} />
                  <Info label="Academic Session" value={openCase.academicSession} />
                  <Info label="Student" value={`${openCase.student.name} (${openCase.student.id})`} />
                  <Info label="Submitted" value={openCase.createdAt} />
                  <Info label="Decided At" value={openCase.decidedAt} />
                  <Info label="Decided By" value={`${openCase.decidedBy.name} (${openCase.decidedBy.role})`} />
                </div>
              </div>

              <div className="rounded-3xl bg-white border border-black/10 p-5">
                <div className="text-lg font-extrabold text-[#0B0F2A]">Evidence used</div>
                <div className="mt-4 space-y-3">
                  {openCase.evidence.map((e, idx) => (
                    <div key={idx} className="rounded-2xl bg-[#F5F5F5] p-4">
                      <div className="flex items-center gap-3">
                        <Badge tone="dark">{e.category}</Badge>
                        <div className="ml-auto text-sm font-extrabold text-[#0B0F2A]">{e.value}</div>
                      </div>
                      <div className="mt-2 text-sm text-[#0B0F2A]/80">{e.snippet}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 text-xs text-[#0B0F2A]/55">
                  (Prototype) Later you can show exact PDF highlight coordinates and attach the original documents.
                </div>
              </div>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

/* ------------------ small subcomponents ------------------ */
function Field({ label, value, onChange }) {
  return (
    <div>
      <div className="text-xs font-bold text-[#0B0F2A]/60">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-2xl bg-[#F1F1F1] px-4 py-3 text-sm font-semibold text-[#0B0F2A] outline-none placeholder:text-[#0B0F2A]/45"
        placeholder={`Enter ${label.toLowerCase()}…`}
      />
    </div>
  );
}

function SimilarityPill({ score }) {
  const s = Math.round(Number(score || 0));
  let tone = "bg-[#EFEFEF] text-[#0B0F2A]";
  if (s >= 75) tone = "bg-[#E9E2B2] text-[#0B0F2A]";
  if (s >= 90) tone = "bg-[#FF7A2F] text-black";

  return (
    <span className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-extrabold ${tone}`}>
      {s}% Similar
    </span>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#EFEFEF] p-4">
      <div className="text-xs font-bold text-[#0B0F2A]/60">{label}</div>
      <div className="mt-1 text-sm font-extrabold text-[#0B0F2A]">{value}</div>
    </div>
  );
}
