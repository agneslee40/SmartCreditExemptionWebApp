// src/pages/ReferenceCases.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

/* ------------------ tiny inline icons (no library) ------------------ */
function IconSearch({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
      <path d="M14 3h7v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 14 21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M21 14v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ------------------ modal (FIXED SCROLL) ------------------ */
function ModalShell({ title, children, onClose, wide = false }) {
  // lock background scroll only while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[80] bg-black/40 px-6 py-8">
      <div className="mx-auto flex w-full max-w-6xl items-start justify-center">
        <div
          className={[
            "w-full rounded-3xl bg-white shadow-2xl border border-black/10 overflow-hidden",
            wide ? "max-w-5xl" : "max-w-3xl",
            "max-h-[88vh]",
          ].join(" ")}
        >
          <div className="flex items-center justify-between border-b border-black/10 px-6 py-5">
            <h3 className="text-xl font-extrabold text-[#0B0F2A]">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-full px-3 py-2 text-[#0B0F2A]/70 hover:bg-black/5"
              aria-label="Close"
              title="Close"
            >
              ✕
            </button>
          </div>

          <div className="max-h-[calc(88vh-76px)] overflow-y-auto p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------ pills/tabs ------------------ */
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
      {active && <span className="absolute left-0 -bottom-1 h-[3px] w-8 rounded-full bg-[#0B0F2A]" />}
    </button>
  );
}
function Pill({ children, className = "" }) {
  return (
    <span className={`inline-flex items-center rounded-full px-4 py-2 text-xs font-extrabold ${className}`}>
      {children}
    </span>
  );
}

/* ------------------ mock reference cases ------------------ */
const CASES = [
  {
    id: "RC-1203",
    outcome: "Approved",
    decidedBy: "Programme Leader",
    decidedAt: "10th January 2025",
    submittedAt: "7th January 2025",
    studentName: "Ng Chee Han",
    studentId: "22115739",
    type: "Credit Exemption",
    faculty: "School of Computing & AI",
    requestedSubject: "MPU 3213 Malay Language for Communication",
    formerInstitution: "Wesley Methodist School Kuala Lumpur (INTERNATIONAL)",
    academicSession: "202301 | 1",
    evidence: {
      similarity: { value: 88, note: "Topics match: communication skills, oral assessment, written components." },
      creditHours: { value: 3, note: "Meets minimum credit hours requirement (≥ 3)." },
      grade: { value: "A+", note: "Grade meets requirement (≥ C)." },
    },
    reasoning:
      "Approved because similarity exceeded threshold and both credit hours + grade met the minimum requirements. Minor syllabus differences were not critical.",
  },
  {
    id: "RC-1189",
    outcome: "Rejected",
    decidedBy: "Subject Lecturer",
    decidedAt: "5th January 2025",
    submittedAt: "2nd January 2025",
    studentName: "Lim Jia Hui",
    studentId: "22115738",
    type: "Credit Transfer",
    faculty: "School of Computing & AI",
    requestedSubject: "CST 2309 Web Programming I",
    formerInstitution: "Some College (OVERSEAS)",
    academicSession: "202301 | 1",
    evidence: {
      similarity: { value: 62, note: "Key outcomes missing: DOM events, server-client basics, assessment coverage." },
      creditHours: { value: 3, note: "Credit hours ok (≥ 3)." },
      grade: { value: "B", note: "Grade ok (≥ C)." },
    },
    reasoning:
      "Rejected because similarity was below the minimum threshold. Even though credit hours and grade met requirements, core learning outcomes were not covered.",
  },
];

/* ------------------ similarity scoring (prototype) ------------------ */
function normalizeText(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// prototype scoring:
// subject overlap + type match + faculty match + institution overlap
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

  const qTokens = new Set(qSub.split(" ").filter(Boolean));
  const cTokens = new Set(cSub.split(" ").filter(Boolean));
  const overlap = [...qTokens].filter((t) => cTokens.has(t));
  if (overlap.length >= 4) score += 40;
  else if (overlap.length >= 2) score += 25;
  else if (overlap.length >= 1) score += 15;

  if (qType && cType === qType) score += 25;
  if (qFac && cFac === qFac) score += 20;

  const qi = new Set(qInst.split(" ").filter(Boolean));
  const ci = new Set(cInst.split(" ").filter(Boolean));
  const instOverlap = [...qi].filter((t) => ci.has(t));
  if (instOverlap.length >= 3) score += 15;
  else if (instOverlap.length >= 1) score += 8;

  return Math.min(100, score);
}

/* ------------------ main page ------------------ */
export default function ReferenceCases() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("All"); // All | Approved | Rejected

  // keep your current search bar behaviour
  const [queryText, setQueryText] = useState("");

  // ✅ bring back old filter panel behaviour
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState("All"); // All | Credit Exemption | Credit Transfer
  const [filterFaculty, setFilterFaculty] = useState("All");
  const [sortBy, setSortBy] = useState("Most Similar"); // Most Similar | Newest | Oldest

  // ✅ bring back old “find similar past cases” card inputs (prototype)
  const [similarQuery, setSimilarQuery] = useState({
    requestedSubject: "MPU 3213 Malay Language for Communication",
    type: "Credit Exemption",
    faculty: "School of Computing & AI",
    formerInstitution: "Wesley Methodist School Kuala Lumpur (INTERNATIONAL)",
  });

  const [selectedCase, setSelectedCase] = useState(null);

  const faculties = useMemo(() => {
    const unique = Array.from(new Set(CASES.map((c) => c.faculty)));
    return ["All", ...unique];
  }, []);

  const filtered = useMemo(() => {
    let list = [...CASES];

    // tabs
    if (tab === "Approved") list = list.filter((c) => c.outcome === "Approved");
    if (tab === "Rejected") list = list.filter((c) => c.outcome === "Rejected");

    // filters
    if (filterType !== "All") list = list.filter((c) => c.type === filterType);
    if (filterFaculty !== "All") list = list.filter((c) => c.faculty === filterFaculty);

    // search
    const q = queryText.trim().toLowerCase();
    if (q) {
      list = list.filter((c) => {
        return (
          c.id.toLowerCase().includes(q) ||
          c.requestedSubject.toLowerCase().includes(q) ||
          c.formerInstitution.toLowerCase().includes(q) ||
          c.studentId.toLowerCase().includes(q) ||
          c.studentName.toLowerCase().includes(q) ||
          c.type.toLowerCase().includes(q)
        );
      });
    }

    // attach similarity score (based on the “Find similar past cases” card)
    const withScore = list.map((c) => ({
      ...c,
      similarityScore: computeSimilarity(c, similarQuery),
    }));

    // sorting
    if (sortBy === "Most Similar") withScore.sort((a, b) => b.similarityScore - a.similarityScore);
    if (sortBy === "Newest") withScore.sort((a, b) => new Date(b.decidedAt) - new Date(a.decidedAt));
    if (sortBy === "Oldest") withScore.sort((a, b) => new Date(a.decidedAt) - new Date(b.decidedAt));

    return withScore;
  }, [tab, queryText, filterType, filterFaculty, sortBy, similarQuery]);

  const openInReview = (caseItem) => {
    const fallbackAppId = "A001";
    navigate(`/tasks/applications/${fallbackAppId}/review`);
  };

  return (
    <div className="bg-white">
      <h1 className="text-5xl font-extrabold tracking-tight text-[#0B0F2A]">Reference Cases</h1>
      <div className="mt-3 text-sm text-[#0B0F2A]/65">
        Find similar past approved/rejected cases to support your decision-making.
      </div>

      {/* Search + filter */}
      <div className="mt-8 flex items-center gap-4">
        <div className="relative w-[520px] max-w-full">
          <input
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="Search by subject, institution, student ID, type…"
            className="w-full rounded-full bg-[#F1F1F1] px-12 py-3 text-sm outline-none placeholder:text-[#0B0F2A]/45"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0B0F2A]/45">
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
      <div className="mt-8 flex items-center gap-14">
        {["All", "Approved", "Rejected"].map((t) => (
          <TabButton key={t} label={t} active={tab === t} onClick={() => setTab(t)} />
        ))}
      </div>

      {/* ✅ (RESTORED) Find similar past cases card (like your old pic1) */}
      <div className="mt-8 rounded-3xl bg-white shadow-[0_14px_40px_rgba(0,0,0,0.08)] p-6">
        <div className="flex items-center gap-3">
          <div className="text-lg font-extrabold text-[#0B0F2A]">Find similar past cases</div>
          <span className="text-xs font-bold text-[#0B0F2A]/60">
            (Prototype — later auto-fill from current application)
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <BigField
            label="Requested Subject"
            value={similarQuery.requestedSubject}
            onChange={(v) => setSimilarQuery((q) => ({ ...q, requestedSubject: v }))}
          />
          <BigField
            label="Former Institution"
            value={similarQuery.formerInstitution}
            onChange={(v) => setSimilarQuery((q) => ({ ...q, formerInstitution: v }))}
          />
          <BigField
            label="Type"
            value={similarQuery.type}
            onChange={(v) => setSimilarQuery((q) => ({ ...q, type: v }))}
          />
          <BigField
            label="Faculty"
            value={similarQuery.faculty}
            onChange={(v) => setSimilarQuery((q) => ({ ...q, faculty: v }))}
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-[#EFEFEF] px-5 py-3 text-sm font-semibold text-[#0B0F2A]">
            Sorted by: {sortBy}
          </span>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-2xl bg-[#EFEFEF] px-5 py-3 text-sm font-semibold text-[#0B0F2A] outline-none"
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

      {/* Results container (unchanged) */}
      <div className="mt-8 rounded-3xl bg-white shadow-[0_14px_40px_rgba(0,0,0,0.08)]">
        <div className="overflow-x-auto rounded-3xl">
          <table className="min-w-[1200px] w-full text-left">
            <thead className="text-[#0B0F2A]/70">
              <tr className="border-b border-black/10">
                <th className="px-8 py-6 text-sm font-semibold">Case</th>
                <th className="px-6 py-6 text-sm font-semibold">Outcome</th>
                <th className="px-6 py-6 text-sm font-semibold">Requested Subject</th>
                <th className="px-6 py-6 text-sm font-semibold">Former Institution</th>
                <th className="px-6 py-6 text-sm font-semibold">Type</th>
                <th className="px-6 py-6 text-sm font-semibold">Similarity</th>
                <th className="px-6 py-6 text-sm font-semibold">Decided</th>
                <th className="px-6 py-6 text-sm font-semibold"></th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-black/10">
                  <td className="px-8 py-6 text-sm font-extrabold text-[#0B0F2A]">{c.id}</td>

                  <td className="px-6 py-6">
                    <Pill className={c.outcome === "Approved" ? "bg-[#FF7A2F] text-black" : "bg-[#D9D9D9] text-[#0B0F2A]"}>
                      {c.outcome}
                    </Pill>
                  </td>

                  <td className="px-6 py-6 text-sm">{c.requestedSubject}</td>
                  <td className="px-6 py-6 text-sm">{c.formerInstitution}</td>
                  <td className="px-6 py-6 text-sm">{c.type}</td>

                  {/* show similarity score to query */}
                  <td className="px-6 py-6 text-sm font-extrabold text-[#0B0F2A]">
                    {Math.round(c.similarityScore)}%
                  </td>

                  <td className="px-6 py-6 text-sm text-[#0B0F2A]/75">
                    {c.decidedAt}
                    <div className="text-xs text-[#0B0F2A]/50">{c.decidedBy}</div>
                  </td>

                  <td className="px-6 py-6">
                    <button
                      onClick={() => setSelectedCase(c)}
                      className="rounded-full bg-[#EFEFEF] px-6 py-3 text-sm font-semibold text-[#0B0F2A] hover:bg-[#E7E7E7]"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-8 py-12 text-center text-[#0B0F2A]/55">
                    No cases found for this filter/search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-8 py-5 text-xs text-[#0B0F2A]/55">
          (Prototype) Later, this will query Sunway’s database and compute similarity ranking.
        </div>
      </div>

      {/* ✅ (RESTORED) Filters modal (like your old pic2) */}
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

      {/* View modal (unchanged) */}
      {selectedCase && (
        <ModalShell title={`Case Details — ${selectedCase.id}`} onClose={() => setSelectedCase(null)} wide>
          <div className="flex flex-wrap items-center gap-3">
            <Pill className={selectedCase.outcome === "Approved" ? "bg-[#FF7A2F] text-black" : "bg-[#D9D9D9] text-[#0B0F2A]"}>
              {selectedCase.outcome}
            </Pill>
            <Pill className="bg-[#EFEFEF] text-[#0B0F2A]">Similarity ≥ 80%</Pill>
            <Pill className="bg-[#EFEFEF] text-[#0B0F2A]">Grade ≥ C</Pill>
            <Pill className="bg-[#EFEFEF] text-[#0B0F2A]">Credit Hours ≥ 3</Pill>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-black/10 bg-white p-6">
              <div className="text-lg font-extrabold text-[#0B0F2A]">Application details</div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <InfoCard label="Faculty" value={selectedCase.faculty} />
                <InfoCard label="Requested Subject" value={selectedCase.requestedSubject} />
                <InfoCard label="Former Institution" value={selectedCase.formerInstitution} />
                <InfoCard label="Academic Session" value={selectedCase.academicSession} />
                <InfoCard label="Student" value={`${selectedCase.studentName} (${selectedCase.studentId})`} />
                <InfoCard label="Submitted" value={selectedCase.submittedAt} />
                <InfoCard label="Decided At" value={selectedCase.decidedAt} />
                <InfoCard label="Decided By" value={selectedCase.decidedBy} />
              </div>
            </div>

            <div className="rounded-3xl border border-black/10 bg-white p-6">
              <div className="text-lg font-extrabold text-[#0B0F2A]">Evidence used</div>

              <div className="mt-4 space-y-4">
                <EvidenceRow
                  title="Similarity"
                  right={`${selectedCase.evidence.similarity.value}%`}
                  note={selectedCase.evidence.similarity.note}
                />
                <EvidenceRow
                  title="Credit Hours"
                  right={`${selectedCase.evidence.creditHours.value}`}
                  note={selectedCase.evidence.creditHours.note}
                />
                <EvidenceRow
                  title="Grade"
                  right={`${selectedCase.evidence.grade.value}`}
                  note={selectedCase.evidence.grade.note}
                />
              </div>

              <div className="mt-6 rounded-2xl bg-[#F5F5F5] p-4">
                <div className="text-sm font-extrabold text-[#0B0F2A]">Reason</div>
                <div className="mt-2 text-sm text-[#0B0F2A]/75">{selectedCase.reasoning}</div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => openInReview(selectedCase)}
                  className="rounded-full bg-[#FF6B2C] px-6 py-3 text-sm font-extrabold text-black shadow-sm hover:shadow-md inline-flex items-center gap-2"
                >
                  <IconExternal className="h-5 w-5" />
                  Open in Review
                </button>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="rounded-full bg-[#EFEFEF] px-8 py-3 text-sm font-semibold text-[#0B0F2A] hover:bg-[#E7E7E7]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>

          <div className="h-2" />
        </ModalShell>
      )}
    </div>
  );
}

/* ------------------ small UI pieces ------------------ */
function BigField({ label, value, onChange }) {
  return (
    <div>
      <div className="text-xs font-bold text-[#0B0F2A]/60">{label}</div>
      {/* look like your pic1 (pill-like field) */}
      <div className="mt-2 rounded-2xl bg-[#EFEFEF] px-5 py-4">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-sm font-extrabold text-[#0B0F2A] outline-none"
        />
      </div>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#F1F1F1] p-4">
      <div className="text-xs font-bold text-[#0B0F2A]/60">{label}</div>
      <div className="mt-1 text-sm font-extrabold text-[#0B0F2A]">{value}</div>
    </div>
  );
}

function EvidenceRow({ title, right, note }) {
  return (
    <div className="rounded-3xl bg-[#F1F1F1] p-5">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-[#0B0F2A] px-5 py-2 text-xs font-extrabold text-white">{title}</span>
        <span className="text-sm font-extrabold text-[#0B0F2A]">{right}</span>
      </div>
      <div className="mt-3 text-sm text-[#0B0F2A]/75">{note}</div>
    </div>
  );
}
