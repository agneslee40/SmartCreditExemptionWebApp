// src/pages/ApplicationReview.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

/* ------------------ tiny inline icons (no library) ------------------ */
function IconBack({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconChevronDown({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconTick({ className = "" }) {
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
function IconPencil({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 20h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconComment({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconInfo({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 8h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M11 12h1v6h1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function IconBulb({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 18h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 22h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M8.5 14.5c-1.2-1.2-2-2.7-2-4.5a5.5 5.5 0 1 1 11 0c0 1.8-.8 3.3-2 4.5-.7.7-1.2 1.8-1.2 3V18h-3.6v-.5c0-1.2-.5-2.3-1.2-3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconBranch({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 9c6 0 6 8 12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 21V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" stroke="currentColor" strokeWidth="2" />
      <path d="M18 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" stroke="currentColor" strokeWidth="2" />
      <path d="M18 23a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function IconUndo({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 14 4 9l5-5" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M20 20a8 8 0 0 0-8-8H4"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconRedo({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 4l5 5-5 5" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M4 20a8 8 0 0 1 8-8h8"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconPlus({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}
function IconTrash({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
      <path d="M10 11v7M14 11v7" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
      <path
        d="M6 7l1 14h10l1-14"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 7V4h6v3" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
    </svg>
  );
}

/* ------------------ small UI shells ------------------ */
function Toast({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[80]">
      <div className="rounded-2xl bg-[#0B0F2A] px-5 py-4 text-white shadow-lg flex items-start gap-3">
        <div className="mt-0.5">
          <IconTick className="h-5 w-5" />
        </div>
        <div className="text-sm">
          <div className="font-semibold">Done</div>
          <div className="opacity-90">{message}</div>
        </div>
        <button onClick={onClose} className="ml-3 opacity-80 hover:opacity-100">
          ✕
        </button>
      </div>
    </div>
  );
}

function ConfirmModal({
  open,
  title,
  body,
  onCancel,
  onConfirm,
  cancelLabel = "Cancel",
  confirmLabel = "Yes",
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-6">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
        <h3 className="text-xl font-extrabold text-[#0B0F2A]">{title}</h3>
        <p className="mt-3 text-sm text-[#0B0F2A]/75">{body}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-full bg-[#EFEFEF] px-6 py-3 font-semibold text-[#0B0F2A]"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="rounded-full bg-[#0B0F2A] px-6 py-3 font-semibold text-white"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingOverlay({ open, title, body, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[75] bg-white/70 backdrop-blur-[2px] flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-xl border border-black/10 p-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full border-4 border-black/10 border-t-[#0B0F2A] animate-spin" />
          <div>
            <div className="text-lg font-extrabold text-[#0B0F2A]">{title}</div>
            <div className="mt-1 text-sm text-[#0B0F2A]/70">{body}</div>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onCancel}
            className="rounded-full bg-[#EFEFEF] px-6 py-3 font-semibold text-[#0B0F2A]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function SideIconButton({ active, label, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        "relative flex h-12 w-12 items-center justify-center rounded-xl border",
        active ? "bg-[#D9D9D9] border-black/25" : "bg-white border-black/15 hover:bg-black/[0.03]",
      ].join(" ")}
      title={label}
      aria-label={label}
    >
      {children}
    </button>
  );
}

/* ------------------ mock data (hook to API later) ------------------ */
const DOCS = [
  { id: "sunway", name: "CST 2309 Web Programming I", pages: 7 },
  { id: "transcript", name: "Transcript", pages: 2 },
  { id: "syllabus", name: "Applicant Syllabus", pages: 5 },
];

const mockApp = {
  id: "A001",
  studentName: "Lee Wen Xuan",
  studentId: "22115737",
  type: "Credit Exemption",
  requestedSubject: "CST 2309 Web Programming I",
  academicSession: "202301 | 1",
  prevModule: "MPU 3213 Malay Language for Communication",
};

const initialHighlights = [
  {
    id: "h-grade",
    key: "grade",
    label: "Grade",
    docId: "transcript",
    page: 1,
    value: "A+",
    requirement: "Minimum: ≥ C",
    snippet: "Grade: A+",
  },
  {
    id: "h-sim",
    key: "similarity",
    label: "Similarity",
    docId: "sunway",
    page: 1,
    value: "81%",
    requirement: "Requirement: ≥ 80%",
    snippet: "CST 2309: Introduction to Web Programming",
  },
  {
    id: "h-cred",
    key: "credit",
    label: "Credit Hours",
    docId: "sunway",
    page: 2,
    value: "4",
    requirement: "Minimum: 3 credit hours",
    snippet: "Credit Hours: 4",
  },
];

const initialVersions = [
  { id: 1, by: "System", at: "2025-11-20 10:12", action: "Generated highlights + suggested outcome (Approve)." },
  { id: 2, by: "Programme Leader", at: "2025-11-20 10:18", action: "Viewed Similarity evidence (Sunway syllabus page 1)." },
];

const otherSL = [
  { name: "Dr. Sarveshshina", role: "Subject Lecturer", avatar: "https://i.pravatar.cc/100?img=48", decision: "Approved" },
];

/* ------------------ page ------------------ */
export default function ApplicationReview() {
  const navigate = useNavigate();
  const { id } = useParams();

  const viewerRef = useRef(null);

  const [panel, setPanel] = useState("suggested"); // suggested | info | comment | decision | version
  const [docId, setDocId] = useState(DOCS[0].id);
  const [page, setPage] = useState(1);
  const [goTo, setGoTo] = useState("");

  const [highlights, setHighlights] = useState(initialHighlights);
  const highlightsRef = useRef(highlights);
  useEffect(() => {
    highlightsRef.current = highlights;
  }, [highlights]);

  const [selectedHighlightId, setSelectedHighlightId] = useState("h-sim");
  const selectedHighlight = useMemo(
    () => highlights.find((h) => h.id === selectedHighlightId),
    [highlights, selectedHighlightId]
  );

  const [systemOutcome, setSystemOutcome] = useState("Approve");
  const [userAcceptedSystem, setUserAcceptedSystem] = useState(true);

  const [editMode, setEditMode] = useState(false);
  const [dirty, setDirty] = useState(false);

  // autosave status
  const [saveStatus, setSaveStatus] = useState("Saved");
  const saveTimerRef = useRef(null);

  // undo/redo
  const [history, setHistory] = useState({ past: [], future: [] });

  // add highlight mode
  const [addMode, setAddMode] = useState(false);
  const [pendingAdd, setPendingAdd] = useState(null); // { text, rect }

  // confirm modal usage
  const [confirm, setConfirm] = useState({ open: false, type: "" }); // accept | reject | regen | exitRegen

  // regeneration overlay
  const [regenLoading, setRegenLoading] = useState(false);
  const regenTimerRef = useRef(null);

  const [toast, setToast] = useState("");

  const [comments, setComments] = useState([
    { id: 1, highlightId: "h-sim", by: "Programme Leader", at: "2025-11-20 10:20", text: "Similarity looks valid. Check if learning outcomes align." },
  ]);
  const [newComment, setNewComment] = useState("");

  const [myDecision, setMyDecision] = useState("Approved");

  const currentDoc = DOCS.find((d) => d.id === docId) || DOCS[0];
  const totalPages = currentDoc.pages;
  const similarityScore = "81%";

  /* --------- helpers --------- */
  const markDirtyAndAutosave = () => {
    setDirty(true);
    setSaveStatus("Saving…");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setSaveStatus("Saved"), 700);
  };

  const commitHighlights = (nextHighlights) => {
    setHistory((h) => ({ past: [...h.past, highlightsRef.current], future: [] }));
    setHighlights(nextHighlights);
    markDirtyAndAutosave();
  };

  const undo = () => {
    setHistory((h) => {
      if (h.past.length === 0) return h;
      const current = highlightsRef.current;
      const previous = h.past[h.past.length - 1];
      setHighlights(previous);
      setDirty(true);
      setSaveStatus("Saved");
      return { past: h.past.slice(0, -1), future: [current, ...h.future] };
    });
  };

  const redo = () => {
    setHistory((h) => {
      if (h.future.length === 0) return h;
      const current = highlightsRef.current;
      const next = h.future[0];
      setHighlights(next);
      setDirty(true);
      setSaveStatus("Saved");
      return { past: [...h.past, current], future: h.future.slice(1) };
    });
  };

  const jumpToHighlight = (hid) => {
    const h = highlights.find((x) => x.id === hid);
    if (!h) {
      setToast("Highlight not found (it may have been removed).");
      return;
    }
    setSelectedHighlightId(hid);
    setDocId(h.docId);
    setPage(h.page);
    setPanel("suggested");
  };

  const removeHighlight = (hid) => {
    const exists = highlights.find((h) => h.id === hid);
    if (!exists) return;

    const next = highlights.filter((h) => h.id !== hid);
    commitHighlights(next);

    if (selectedHighlightId === hid) {
      setSelectedHighlightId(next[0]?.id || "");
    }
    setToast("Highlight removed.");
  };

  const computeOutcome = (hls) => {
    // simple prototype rule:
    // Approve only if grade + similarity + credit highlights still exist.
    const hasGrade = !!hls.find((h) => h.key === "grade");
    const hasSim = !!hls.find((h) => h.key === "similarity");
    const hasCred = !!hls.find((h) => h.key === "credit");
    return hasGrade && hasSim && hasCred ? "Approve" : "Reject";
  };

  const startRegenerate = () => {
    setConfirm({ open: false, type: "" });
    setRegenLoading(true);

    // simulate API job
    if (regenTimerRef.current) clearTimeout(regenTimerRef.current);
    regenTimerRef.current = setTimeout(() => {
      const newOutcome = computeOutcome(highlightsRef.current);
      setSystemOutcome(newOutcome);
      setUserAcceptedSystem(true);
      setDirty(false);
      setHistory({ past: [], future: [] });
      setToast("Suggested outcome regenerated.");
      setRegenLoading(false);
    }, 1300);
  };

  const cancelRegenerate = () => {
    if (regenTimerRef.current) clearTimeout(regenTimerRef.current);
    setRegenLoading(false);
    setToast("Regeneration cancelled.");
    // keep dirty = true so button stays
  };

  const onAcceptSystem = () => setConfirm({ open: true, type: "accept" });
  const onRejectSystem = () => setConfirm({ open: true, type: "reject" });

  const onConfirmAction = () => {
    if (confirm.type === "accept") {
      setUserAcceptedSystem(true);
      setToast("You accepted the system suggestion.");
    }
    if (confirm.type === "reject") {
      setUserAcceptedSystem(false);
      setToast("You rejected the system suggestion.");
    }
    if (confirm.type === "regen") startRegenerate();
    if (confirm.type === "exitRegen") startRegenerate();
    setConfirm({ open: false, type: "" });
  };

  const exitEditMode = () => {
    setAddMode(false);
    setPendingAdd(null);
    setEditMode(false);

    if (dirty) {
      setConfirm({ open: true, type: "exitRegen" });
    }
  };

  const addComment = () => {
    const text = newComment.trim();
    if (!text || !selectedHighlightId) return;
    setComments((prev) => [
      ...prev,
      { id: Date.now(), highlightId: selectedHighlightId, by: "Programme Leader", at: "Just now", text },
    ]);
    setNewComment("");
    setToast("Comment added.");
  };

  const myHighlightComments = useMemo(
    () => comments.filter((c) => c.highlightId === selectedHighlightId),
    [comments, selectedHighlightId]
  );

  const submitDecision = () => setToast("Decision submitted.");

  const goToPage = () => {
    const n = parseInt(goTo, 10);
    if (!Number.isFinite(n)) return;
    const clamped = Math.max(1, Math.min(totalPages, n));
    setPage(clamped);
    setGoTo("");
  };

  /* --------- add highlight selection handling --------- */
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setAddMode(false);
        setPendingAdd(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleMouseUpForAdd = () => {
    if (!editMode || !addMode) return;

    const sel = window.getSelection?.();
    const text = sel?.toString?.().trim() || "";
    if (!text || text.length < 2) return;

    // must be inside viewer
    const container = viewerRef.current;
    if (!container) return;

    const anchorNode = sel?.anchorNode;
    if (!anchorNode) return;

    // anchorNode might be a text node; check parent containment
    const anchorEl = anchorNode.nodeType === 3 ? anchorNode.parentElement : anchorNode;
    if (!anchorEl || !container.contains(anchorEl)) return;

    const range = sel.getRangeAt?.(0);
    if (!range) return;

    const rect = range.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;

    setPendingAdd({
      text,
      rect: { x: rect.left, y: rect.top, w: rect.width, h: rect.height },
    });
  };

  const confirmAddHighlight = () => {
    if (!pendingAdd?.text) return;

    const newId = `h-manual-${Date.now()}`;
    const next = [
      ...highlights,
      {
        id: newId,
        key: "manual",
        label: "Manual Highlight",
        docId,
        page,
        value: "-",
        requirement: "Added by reviewer",
        snippet: pendingAdd.text,
      },
    ];

    commitHighlights(next);
    setSelectedHighlightId(newId);
    setPendingAdd(null);
    setAddMode(false);
    window.getSelection?.()?.removeAllRanges?.();
    setToast("Highlight added.");
  };

  const cancelAddHighlight = () => {
    setPendingAdd(null);
    setAddMode(false);
    window.getSelection?.()?.removeAllRanges?.();
  };

  /* --------- document content rendering (mock but tied to highlights state) --------- */
  const hlByKey = (key) => highlights.find((h) => h.key === key);
  const hlSim = hlByKey("similarity");
  const hlCred = hlByKey("credit");
  const hlGrade = hlByKey("grade");

  const manualOnThisPage = useMemo(
    () => highlights.filter((h) => h.key === "manual" && h.docId === docId && h.page === page),
    [highlights, docId, page]
  );

  const renderDocBlocks = () => {
    // Lightweight mock that matches your prototype pages
    if (docId === "sunway") {
      return (
        <>
          <div className="text-center font-bold text-[#0B0F2A]">Online Course Syllabus</div>
          <div className="mt-4 border-t border-black/10" />

          <div className="mt-6 space-y-6 text-sm text-[#0B0F2A]/85">
            {page === 1 && hlSim && (
              <HighlightPill
                highlight={hlSim}
                active={selectedHighlightId === hlSim.id}
                tooltip="Similar to Sunway syllabus: topics match (HTML, CSS, JS fundamentals)"
                editable={editMode}
                onRemove={() => removeHighlight(hlSim.id)}
                onClick={() => setSelectedHighlightId(hlSim.id)}
              />
            )}

            <div className="h-3" />
            <div className="font-semibold text-[#0B0F2A]">Instructor Information</div>
            <div className="text-[#0B0F2A]/70">
              Email Address: (hidden) <span className="select-none">—</span>{" "}
              <span className="text-[#0B0F2A]/55">
                Please contact the department if you need verification of instructor details.
              </span>
            </div>

            {page === 2 && hlCred && (
              <HighlightPill
                highlight={hlCred}
                active={selectedHighlightId === hlCred.id}
                tooltip="Minimum required: 3 credit hours"
                editable={editMode}
                onRemove={() => removeHighlight(hlCred.id)}
                onClick={() => setSelectedHighlightId(hlCred.id)}
              />
            )}

            {manualOnThisPage.length > 0 && (
              <div className="mt-2 rounded-2xl border border-black/10 bg-white p-4">
                <div className="text-xs font-extrabold text-[#0B0F2A]/70">Added highlights</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {manualOnThisPage.map((mh) => (
                    <HighlightPill
                      key={mh.id}
                      highlight={mh}
                      active={selectedHighlightId === mh.id}
                      tooltip="Added by reviewer"
                      editable={editMode}
                      onRemove={() => removeHighlight(mh.id)}
                      onClick={() => setSelectedHighlightId(mh.id)}
                      compact
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="mt-10 text-xs text-[#0B0F2A]/45">
              (Mock viewer for prototype — later replace with real PDF rendering + coordinates.)
            </div>
          </div>
        </>
      );
    }

    if (docId === "transcript") {
      return (
        <>
          <div className="text-center font-bold text-[#0B0F2A]">Academic Transcript</div>
          <div className="mt-4 border-t border-black/10" />

          <div className="mt-6 space-y-6 text-sm text-[#0B0F2A]/85">
            <div className="text-[#0B0F2A]/70">
              Student performance summary (mock). Select text to add a missing highlight.
            </div>

            {page === 1 && hlGrade && (
              <HighlightPill
                highlight={hlGrade}
                active={selectedHighlightId === hlGrade.id}
                tooltip="Minimum required: ≥ C"
                editable={editMode}
                onRemove={() => removeHighlight(hlGrade.id)}
                onClick={() => setSelectedHighlightId(hlGrade.id)}
              />
            )}

            {manualOnThisPage.length > 0 && (
              <div className="mt-2 rounded-2xl border border-black/10 bg-white p-4">
                <div className="text-xs font-extrabold text-[#0B0F2A]/70">Added highlights</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {manualOnThisPage.map((mh) => (
                    <HighlightPill
                      key={mh.id}
                      highlight={mh}
                      active={selectedHighlightId === mh.id}
                      tooltip="Added by reviewer"
                      editable={editMode}
                      onRemove={() => removeHighlight(mh.id)}
                      onClick={() => setSelectedHighlightId(mh.id)}
                      compact
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="mt-10 text-xs text-[#0B0F2A]/45">(Mock transcript viewer.)</div>
          </div>
        </>
      );
    }

    // fallback
    return (
      <>
        <div className="text-center font-bold text-[#0B0F2A]">Document Preview</div>
        <div className="mt-4 border-t border-black/10" />
        <div className="mt-6 text-sm text-[#0B0F2A]/70">
          This document has no mock highlights yet. Use <span className="font-bold">Edit Highlights</span> to add one.
        </div>

        {manualOnThisPage.length > 0 && (
          <div className="mt-6 rounded-2xl border border-black/10 bg-white p-4">
            <div className="text-xs font-extrabold text-[#0B0F2A]/70">Added highlights</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {manualOnThisPage.map((mh) => (
                <HighlightPill
                  key={mh.id}
                  highlight={mh}
                  active={selectedHighlightId === mh.id}
                  tooltip="Added by reviewer"
                  editable={editMode}
                  onRemove={() => removeHighlight(mh.id)}
                  onClick={() => setSelectedHighlightId(mh.id)}
                  compact
                />
              ))}
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="bg-white">
      {/* ---------- HEADER (single baseline) ---------- */}
      <div className="flex items-center gap-6">
        {/* Back */}
        <button
          onClick={() => navigate("/tasks")}
          className="rounded-xl p-2 text-[#0B0F2A] hover:bg-black/5"
          title="Back"
        >
          <IconBack className="h-8 w-8" />
        </button>

        {/* Center group: Title + dropdown + similarity (same baseline) */}
        <div className="flex flex-1 items-center gap-6">
          <h1 className="text-5xl font-extrabold tracking-tight text-[#0B0F2A] whitespace-nowrap leading-none">
            Application Review
          </h1>

          {/* Doc dropdown */}
          <div className="relative">
            <select
              value={docId}
              onChange={(e) => {
                setDocId(e.target.value);
                setPage(1);
              }}
              className="appearance-none rounded-2xl bg-[#EFEFEF] px-5 py-3 pr-10 text-sm font-semibold text-[#0B0F2A] outline-none
                         min-w-[320px] max-w-[420px]"
            >
              {DOCS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#0B0F2A]/70">
              <IconChevronDown className="h-5 w-5" />
            </span>
          </div>

          {/* Similarity */}
          <div className="flex items-center gap-3 whitespace-nowrap">
            <span className="text-sm font-bold text-[#0B0F2A]">Similarity</span>
            <span className="rounded-xl bg-[#EFEFEF] px-3 py-2 text-sm font-extrabold text-[#0B0F2A]">
              {similarityScore}
            </span>
          </div>
        </div>

        {/* Right side: Edit Highlights + Regenerate (top-right) */}
        <div className="flex items-center gap-3">
          {!editMode ? (
            <button
              onClick={() => {
                setEditMode(true);
                setAddMode(false);
                setPendingAdd(null);
                setSaveStatus("Saved");
              }}
              className="rounded-2xl bg-[#EFEFEF] px-4 py-3 text-sm font-extrabold text-[#0B0F2A]"
            >
              <span className="inline-flex items-center gap-2">
                <IconPencil className="h-5 w-5" />
                Edit Highlights
              </span>
            </button>
          ) : (
            <>
              <div className="rounded-2xl bg-[#0B0F2A] px-4 py-3 text-sm font-extrabold text-white">
                <span className="inline-flex items-center gap-2">
                  <IconPencil className="h-5 w-5" />
                  Editing Highlights
                </span>
              </div>

              <div className="rounded-2xl bg-[#EFEFEF] px-4 py-3 text-sm font-extrabold text-[#0B0F2A] whitespace-nowrap">
                {saveStatus}
              </div>

              <button
                onClick={undo}
                disabled={history.past.length === 0}
                className={[
                  "rounded-2xl px-3 py-3 text-sm font-extrabold border border-black/10",
                  history.past.length === 0 ? "bg-[#EFEFEF] text-[#0B0F2A]/35" : "bg-white text-[#0B0F2A] hover:bg-black/[0.03]",
                ].join(" ")}
                title="Undo"
              >
                <IconUndo className="h-5 w-5" />
              </button>

              <button
                onClick={redo}
                disabled={history.future.length === 0}
                className={[
                  "rounded-2xl px-3 py-3 text-sm font-extrabold border border-black/10",
                  history.future.length === 0 ? "bg-[#EFEFEF] text-[#0B0F2A]/35" : "bg-white text-[#0B0F2A] hover:bg-black/[0.03]",
                ].join(" ")}
                title="Redo"
              >
                <IconRedo className="h-5 w-5" />
              </button>

              <button
                onClick={exitEditMode}
                className="rounded-2xl bg-[#EFEFEF] px-4 py-3 text-sm font-extrabold text-[#0B0F2A]"
              >
                Exit
              </button>
            </>
          )}

          {dirty && !editMode && (
            <button
              onClick={() => setConfirm({ open: true, type: "regen" })}
              className="rounded-2xl bg-[#FF6B2C] px-4 py-3 text-sm font-extrabold text-black shadow-sm hover:shadow-md"
            >
              Regenerate suggested outcome
            </button>
          )}
        </div>
      </div>

      {/* ---------- MAIN LAYOUT ---------- */}
      <div className="mt-10 flex gap-8">
        {/* LEFT: Document viewer mock */}
        <div className="relative w-[62%] rounded-3xl bg-white shadow-[0_14px_40px_rgba(0,0,0,0.08)]">
          <div
            ref={viewerRef}
            className="h-[70vh] overflow-auto rounded-3xl p-6"
            onMouseUp={handleMouseUpForAdd}
          >
            <div className="text-sm font-semibold text-[#0B0F2A]/70">
              {currentDoc.name} — Page {page}
            </div>

            {/* Add highlight controls (top-right of left viewer) */}
            {editMode && (
              <div className="sticky top-0 z-30 mt-3 flex justify-end">
                <button
                  onClick={() => {
                    if (addMode) {
                      setAddMode(false);
                      setPendingAdd(null);
                      window.getSelection?.()?.removeAllRanges?.();
                    } else {
                      setAddMode(true);
                      setPendingAdd(null);
                      setToast("Select text in the document to add a highlight.");
                    }
                  }}
                  className={[
                    "rounded-2xl px-4 py-3 text-sm font-extrabold shadow-sm border border-black/10",
                    addMode ? "bg-[#0B0F2A] text-white" : "bg-white text-[#0B0F2A] hover:bg-black/[0.03]",
                  ].join(" ")}
                  title="Add highlight"
                >
                  <span className="inline-flex items-center gap-2">
                    <IconPlus className="h-5 w-5" />
                    {addMode ? "Select text…" : "Add highlight"}
                  </span>
                </button>
              </div>
            )}

            {/* Fake document page */}
            <div className="mt-4 rounded-2xl border border-black/10 bg-white p-6 select-text">
              {renderDocBlocks()}
            </div>
          </div>

          {/* Selection confirmation popover */}
          {editMode && addMode && pendingAdd && (
            <div
              className="fixed z-[90]"
              style={{
                left: Math.min(pendingAdd.rect.x, window.innerWidth - 360),
                top: Math.max(12, pendingAdd.rect.y - 90),
              }}
            >
              <div className="w-[340px] rounded-2xl bg-[#0B0F2A] p-4 text-white shadow-xl">
                <div className="text-sm font-extrabold">Add this highlight?</div>
                <div className="mt-2 text-xs opacity-90 line-clamp-3">
                  “{pendingAdd.text}”
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={cancelAddHighlight}
                    className="rounded-full bg-white/15 px-4 py-2 text-xs font-extrabold hover:bg-white/20"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmAddHighlight}
                    className="rounded-full bg-white px-4 py-2 text-xs font-extrabold text-[#0B0F2A]"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Page counter (bottom-right of LEFT viewer) */}
          <div className="absolute bottom-5 right-5">
            <div className="flex items-center gap-2 rounded-2xl bg-white/95 px-3 py-2 shadow-[0_10px_26px_rgba(0,0,0,0.12)] border border-black/10">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-xl px-3 py-2 text-sm font-bold text-[#0B0F2A] hover:bg-black/5"
                aria-label="Previous page"
              >
                ‹
              </button>

              <span className="min-w-[72px] text-center text-sm font-bold text-[#0B0F2A] whitespace-nowrap">
                {page} of {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-xl px-3 py-2 text-sm font-bold text-[#0B0F2A] hover:bg-black/5"
                aria-label="Next page"
              >
                ›
              </button>

              <div className="mx-1 h-7 w-px bg-black/10" />

              <input
                value={goTo}
                onChange={(e) => setGoTo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") goToPage();
                }}
                placeholder="Go"
                className="w-14 rounded-xl bg-[#EFEFEF] px-2 py-2 text-sm font-bold text-[#0B0F2A] outline-none"
              />
              <button
                onClick={goToPage}
                className="rounded-xl bg-[#EFEFEF] px-3 py-2 text-sm font-extrabold text-[#0B0F2A] hover:bg-black/5"
              >
                OK
              </button>
            </div>
          </div>
        </div>

        {/* MIDDLE: vertical icon buttons */}
        <div className="flex flex-col items-center gap-3 pt-6">
          <SideIconButton active={panel === "suggested"} label="Suggested outcome" onClick={() => setPanel("suggested")}>
            <IconBulb className="h-6 w-6 text-[#0B0F2A]" />
          </SideIconButton>

          <SideIconButton active={panel === "info"} label="Application info" onClick={() => setPanel("info")}>
            <IconInfo className="h-6 w-6 text-[#0B0F2A]" />
          </SideIconButton>

          <SideIconButton active={panel === "comment"} label="Comment" onClick={() => setPanel("comment")}>
            <IconComment className="h-6 w-6 text-[#0B0F2A]" />
          </SideIconButton>

          <SideIconButton active={panel === "decision"} label="Decision" onClick={() => setPanel("decision")}>
            <IconTick className="h-6 w-6 text-[#0B0F2A]" />
          </SideIconButton>

          <SideIconButton active={panel === "version"} label="Version control" onClick={() => setPanel("version")}>
            <IconBranch className="h-6 w-6 text-[#0B0F2A]" />
          </SideIconButton>
        </div>

        {/* RIGHT: panel */}
        <div className="w-[34%] rounded-3xl bg-[#F1F1F1] shadow-[0_14px_40px_rgba(0,0,0,0.08)] overflow-hidden">
          <div className="border-b border-black/10 bg-[#F1F1F1] px-6 py-5 text-center font-extrabold text-[#0B0F2A]">
            {panel === "suggested" && "Suggested Outcome"}
            {panel === "info" && "Application Info"}
            {panel === "comment" && "Comment"}
            {panel === "decision" && "Decision"}
            {panel === "version" && "Version Control"}
          </div>

          <div className="p-6">
            {panel === "suggested" && (
              <div>
                <div className="flex items-center justify-center gap-3 border-b border-black/10 pb-6">
                  <div className="text-3xl font-extrabold text-[#0B0F2A]">{systemOutcome}</div>

                  <div className="ml-auto flex items-center gap-2">
                    <button
                      onClick={onAcceptSystem}
                      className={["rounded-full p-2", userAcceptedSystem ? "bg-black/5" : "hover:bg-black/5"].join(" ")}
                      title="Accept suggestion"
                    >
                      <IconTick className="h-5 w-5 text-[#0B0F2A]" />
                    </button>
                    <button
                      onClick={onRejectSystem}
                      className={["rounded-full p-2", !userAcceptedSystem ? "bg-black/5" : "hover:bg-black/5"].join(" ")}
                      title="Reject suggestion"
                    >
                      <IconCross className="h-5 w-5 text-[#0B0F2A]" />
                    </button>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="text-sm font-extrabold text-[#0B0F2A]">Reasonings</div>
                  <div className="mt-1 text-xs text-[#0B0F2A]/60">
                    Values below are extracted by the system. Click an item to jump to the detected evidence.
                  </div>

                  <div className="mt-5 space-y-3">
                    <ReasonCard
                      index={1}
                      active={selectedHighlight?.key === "grade"}
                      title="Grade"
                      leftSub={mockLine("Minimum: ≥ C")}
                      rightValue={highlights.find((h) => h.key === "grade")?.value || "-"}
                      onClick={() => jumpToHighlight(highlights.find((h) => h.key === "grade")?.id)}
                    />
                    <ReasonCard
                      index={2}
                      active={selectedHighlight?.key === "similarity"}
                      title="Similarity"
                      leftSub={mockLine("Requirement: ≥ 80%")}
                      rightValue={highlights.find((h) => h.key === "similarity")?.value || "-"}
                      onClick={() => jumpToHighlight(highlights.find((h) => h.key === "similarity")?.id)}
                    />
                    <ReasonCard
                      index={3}
                      active={selectedHighlight?.key === "credit"}
                      title="Credit Hours"
                      leftSub={mockLine("Minimum: 3 credit hours")}
                      rightValue={highlights.find((h) => h.key === "credit")?.value || "-"}
                      onClick={() => jumpToHighlight(highlights.find((h) => h.key === "credit")?.id)}
                    />
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-white px-4 py-3 text-xs text-[#0B0F2A]/65">
                  Tip: Use <span className="font-bold">Edit Highlights</span> to remove wrong evidence or add missing highlights.
                  If you changed highlights, regenerate to refresh the suggested outcome.
                </div>
              </div>
            )}

            {panel === "info" && (
              <div className="space-y-4">
                <InfoRow label="Application ID" value={id || mockApp.id} />
                <InfoRow label="Type" value={mockApp.type} />
                <InfoRow label="Student" value={`${mockApp.studentName} (${mockApp.studentId})`} />
                <InfoRow label="Requested Subject" value={mockApp.requestedSubject} />
                <InfoRow label="Academic Session" value={mockApp.academicSession} />
                <InfoRow label="Previously Taken Module" value={mockApp.prevModule} />

                <div className="mt-2 rounded-2xl bg-white px-4 py-3 text-xs text-[#0B0F2A]/65">
                  (Prototype) Later you can fetch this from your application record API.
                </div>
              </div>
            )}

            {panel === "comment" && (
              <div>
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-xs font-bold text-[#0B0F2A]/70">Selected evidence</div>
                  <div className="mt-1 font-extrabold text-[#0B0F2A]">{selectedHighlight?.label || "—"}</div>
                  <div className="mt-2 text-xs text-[#0B0F2A]/60">
                    {selectedHighlight?.snippet || "Select a reasoning to comment on it."}
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {myHighlightComments.length === 0 ? (
                    <div className="text-sm text-[#0B0F2A]/60">No comments yet.</div>
                  ) : (
                    myHighlightComments.map((c) => (
                      <div key={c.id} className="rounded-2xl bg-white p-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-extrabold text-[#0B0F2A]">{c.by}</div>
                          <div className="text-xs text-[#0B0F2A]/50">{c.at}</div>
                        </div>
                        <div className="mt-2 text-sm text-[#0B0F2A]/80">{c.text}</div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-5 rounded-2xl bg-white p-4">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment for this evidence…"
                    className="h-24 w-full resize-none rounded-2xl border border-black/10 p-3 text-sm outline-none"
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={addComment}
                      className="rounded-full bg-[#0B0F2A] px-6 py-3 text-sm font-extrabold text-white"
                    >
                      Post
                    </button>
                  </div>
                </div>
              </div>
            )}

            {panel === "decision" && (
              <div>
                <div className="rounded-2xl bg-white p-5">
                  <div className="text-sm font-extrabold text-[#0B0F2A]">Your decision:</div>

                  <div className="mt-4 flex items-center gap-3">
                    <img src="https://i.pravatar.cc/100?img=32" alt="You" className="h-10 w-10 rounded-full" />

                    <select
                      value={myDecision}
                      onChange={(e) => setMyDecision(e.target.value)}
                      className="rounded-2xl bg-[#D9D9D9] px-4 py-2 text-sm font-extrabold text-[#0B0F2A] outline-none"
                    >
                      <option>Approved</option>
                      <option>Rejected</option>
                    </select>

                    <button
                      onClick={submitDecision}
                      className="ml-auto rounded-2xl bg-[#FF6B2C] px-5 py-2 text-sm font-extrabold text-black shadow-sm hover:shadow-md"
                    >
                      Submit
                    </button>
                  </div>

                  <div className="mt-3 text-xs text-[#0B0F2A]/60">Remark:</div>
                  <div className="mt-2 h-12 rounded-2xl bg-[#EFEFEF]" />
                </div>

                <div className="mt-6 rounded-2xl bg-white p-5">
                  <div className="text-sm font-extrabold text-[#0B0F2A]">Other subject lecturers:</div>

                  <div className="mt-4 space-y-4">
                    {otherSL.map((sl) => (
                      <div key={sl.name} className="flex items-center gap-3">
                        <img src={sl.avatar} alt={sl.name} className="h-10 w-10 rounded-full" />
                        <div className="min-w-0">
                          <div className="text-sm font-extrabold text-[#0B0F2A]">{sl.name}</div>
                          <div className="text-xs text-[#0B0F2A]/60">{sl.role}</div>
                        </div>

                        <span className="ml-auto rounded-2xl bg-[#D9D9D9] px-4 py-2 text-sm font-extrabold text-[#0B0F2A]">
                          {sl.decision}
                        </span>

                        <button
                          onClick={() => setToast(`Opening contact for ${sl.name}… (prototype)`)}
                          className="rounded-2xl bg-[#FF6B2C] px-4 py-2 text-sm font-extrabold text-black shadow-sm hover:shadow-md"
                        >
                          Contact
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {panel === "version" && (
              <div>
                <div className="text-sm text-[#0B0F2A]/70">Track changes made to highlights / decisions.</div>

                <div className="mt-5 space-y-3">
                  {initialVersions.map((v) => (
                    <div key={v.id} className="rounded-2xl bg-white p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-extrabold text-[#0B0F2A]">{v.by}</div>
                        <div className="text-xs text-[#0B0F2A]/50">{v.at}</div>
                      </div>
                      <div className="mt-2 text-sm text-[#0B0F2A]/80">{v.action}</div>
                    </div>
                  ))}

                  <div className="rounded-2xl bg-white p-4 text-xs text-[#0B0F2A]/65">
                    (Prototype) Later you can log: “added highlight”, “removed highlight”, “regenerated outcome”, etc.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm modal */}
      <ConfirmModal
        open={confirm.open}
        title={
          confirm.type === "accept"
            ? "Accept system suggestion?"
            : confirm.type === "reject"
            ? "Reject system suggestion?"
            : confirm.type === "exitRegen"
            ? "Regenerate suggested outcome?"
            : "Regenerate suggested outcome?"
        }
        body={
          confirm.type === "accept"
            ? "This will record that you agree with the system’s suggested outcome."
            : confirm.type === "reject"
            ? "This will record that you disagree with the system’s suggested outcome."
            : confirm.type === "exitRegen"
            ? "Changes were detected in highlights. Regenerate now to refresh the suggested outcome?"
            : "The system will recompute the suggested outcome based on the updated highlights."
        }
        cancelLabel={confirm.type === "exitRegen" ? "Not now" : "Cancel"}
        confirmLabel={confirm.type === "exitRegen" ? "Regenerate" : "Yes"}
        onCancel={() => setConfirm({ open: false, type: "" })}
        onConfirm={onConfirmAction}
      />

      {/* Loading overlay during regeneration */}
      <LoadingOverlay
        open={regenLoading}
        title="Regenerating suggested outcome"
        body="Please wait. You can cancel if it’s taking too long."
        onCancel={cancelRegenerate}
      />

      <Toast message={toast} onClose={() => setToast("")} />
    </div>
  );
}

/* ------------------ small components ------------------ */
function InfoRow({ label, value }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <div className="text-xs font-bold text-[#0B0F2A]/60">{label}</div>
      <div className="mt-1 text-sm font-extrabold text-[#0B0F2A]">{value}</div>
    </div>
  );
}

function ReasonCard({ index, title, leftSub, rightValue, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        "w-full rounded-2xl border border-black/10 p-4 text-left transition",
        active ? "bg-[#F6F2A9]" : "bg-white hover:bg-black/[0.03]",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#FF6B2C] text-sm font-extrabold text-black">
          {index}
        </span>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-extrabold text-[#0B0F2A]">{title}</div>
          <div className="mt-1 text-[11px] text-[#0B0F2A]/60">{leftSub}</div>
        </div>

        <div className="text-sm font-extrabold text-[#0B0F2A]">{rightValue}</div>
      </div>
    </button>
  );
}

function HighlightPill({ highlight, active, tooltip, editable, onRemove, onClick, compact = false }) {
  return (
    <div className="relative inline-flex">
      <span
        onClick={onClick}
        className={[
          "inline-flex items-center rounded-full px-3 py-1 cursor-pointer select-text",
          active ? "bg-[#F6F2A9] text-[#0B0F2A]" : "bg-[#FFF6B8]/60 text-[#0B0F2A]",
          compact ? "text-xs" : "text-sm",
        ].join(" ")}
      >
        <span className="font-semibold">{highlight.snippet}</span>

        <span className="group relative ml-2 inline-flex items-center">
          <span className="text-[#0B0F2A]/40">ⓘ</span>
          <span className="pointer-events-none absolute left-full top-1/2 ml-3 hidden -translate-y-1/2 rounded-2xl bg-[#0B0F2A] px-4 py-3 text-xs text-white shadow-lg group-hover:block w-[260px]">
            {tooltip}
          </span>
        </span>

        {editable && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            className="ml-3 inline-flex items-center gap-1 rounded-full bg-white/75 px-2 py-1 text-[11px] font-extrabold hover:bg-white"
            title="Remove this highlight"
          >
            <IconTrash className="h-4 w-4" />
            Remove
          </button>
        )}
      </span>
    </div>
  );
}

function mockLine(s) {
  return s;
}
