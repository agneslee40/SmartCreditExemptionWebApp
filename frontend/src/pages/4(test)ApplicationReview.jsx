// src/pages/ApplicationReview.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import PdfViewer from "../components/PdfViewer";

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
function IconTrash({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 11v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 11v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 7l1 14h10l1-14" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 7V4h6v3" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
function IconPlus({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
function IconUndo({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 14l-4-4 4-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 20a8 8 0 0 0-8-8H5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
function IconRedo({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 6l4 4-4 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 20a8 8 0 0 1 8-8h7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/* ------------------ small UI shells ------------------ */
function Toast({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[70]">
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

function ConfirmModal({ open, title, body, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-6">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
        <h3 className="text-xl font-extrabold text-[#0B0F2A]">{title}</h3>
        <p className="mt-3 text-sm text-[#0B0F2A]/75">{body}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} className="rounded-full bg-[#EFEFEF] px-6 py-3 font-semibold text-[#0B0F2A]">
            Cancel
          </button>
          <button onClick={onConfirm} className="rounded-full bg-[#0B0F2A] px-6 py-3 font-semibold text-white">
            Yes
          </button>
        </div>
      </div>
    </div>
  );
}

function ExitEditingModal({ open, onContinueEditing, onNotNow, onRegenerate }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-6">
      <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-xl">
        <h3 className="text-xl font-extrabold text-[#0B0F2A]">Changes detected</h3>
        <p className="mt-3 text-sm text-[#0B0F2A]/75">
          You edited the highlights. Do you want to regenerate the suggested outcome now?
        </p>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button onClick={onContinueEditing} className="rounded-full bg-[#EFEFEF] px-5 py-3 font-semibold text-[#0B0F2A]">
            Continue editing
          </button>
          <button onClick={onNotNow} className="rounded-full bg-[#EFEFEF] px-5 py-3 font-semibold text-[#0B0F2A]">
            Not now
          </button>
          <button onClick={onRegenerate} className="rounded-full bg-[#0B0F2A] px-5 py-3 font-semibold text-white">
            Regenerate now
          </button>
        </div>
      </div>
    </div>
  );
}

function RegeneratingOverlay({ open, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] bg-black/30 flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="text-lg font-extrabold text-[#0B0F2A]">Regenerating suggested outcome…</div>
        <div className="mt-2 text-sm text-[#0B0F2A]/70">
          Please wait. You can cancel if it’s taking too long.
        </div>

        <div className="mt-5 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-black/10 border-t-[#0B0F2A] animate-spin" />
          <div className="text-sm font-semibold text-[#0B0F2A]/75">Loading…</div>

          <button
            onClick={onCancel}
            className="ml-auto rounded-full bg-[#EFEFEF] px-5 py-3 text-sm font-extrabold text-[#0B0F2A]"
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

/* ------------------ helper logic ------------------ */
const REQUIREMENTS = {
  grade: "Minimum: ≥ C",
  similarity: "Requirement: ≥ 80%",
  credit: "Minimum: 3 credit hours",
};

function titleFromKey(key) {
  if (key === "credit") return "Credit Hours";
  if (key === "similarity") return "Similarity";
  return "Grade";
}
function parseGradeValue(text) {
  const m = String(text).toUpperCase().match(/\b(A\+|A-|A|B\+|B-|B|C\+|C-|C|D\+|D-|D|F)\b/);
  return m ? m[1] : "";
}
function gradeAtLeastC(grade) {
  const order = ["F", "D-", "D", "D+", "C-", "C", "C+", "B-", "B", "B+", "A-", "A", "A+"];
  const g = String(grade).toUpperCase();
  return order.indexOf(g) >= order.indexOf("C");
}
function parseNumber(text) {
  const m = String(text).match(/(\d+(\.\d+)?)/);
  return m ? Number(m[1]) : NaN;
}
function parsePercent(text) {
  const m = String(text).match(/(\d+(\.\d+)?)\s*%/);
  return m ? Number(m[1]) : NaN;
}
function computeOutcomeFromHighlights(highlights) {
  const pickBest = (arr, key) => {
    const items = arr.filter((h) => h.key === key);
    if (items.length === 0) return null;
    if (key === "similarity") {
      return items
        .slice()
        .sort((a, b) => (parsePercent(b.value || b.snippet) || 0) - (parsePercent(a.value || a.snippet) || 0))[0];
    }
    if (key === "credit") {
      return items
        .slice()
        .sort((a, b) => (parseNumber(b.value || b.snippet) || 0) - (parseNumber(a.value || a.snippet) || 0))[0];
    }
    const order = ["F", "D-", "D", "D+", "C-", "C", "C+", "B-", "B", "B+", "A-", "A", "A+"];
    return items
      .slice()
      .sort((a, b) => order.indexOf(parseGradeValue(b.value || b.snippet)) - order.indexOf(parseGradeValue(a.value || a.snippet)))[0];
  };

  const gradeH = pickBest(highlights, "grade");
  const simH = pickBest(highlights, "similarity");
  const credH = pickBest(highlights, "credit");

  if (!gradeH || !simH || !credH) return "Reject";

  const g = parseGradeValue(gradeH.value || gradeH.snippet);
  const sim = Number.isFinite(parsePercent(simH.value)) ? parsePercent(simH.value) : parsePercent(simH.snippet);
  const cred = Number.isFinite(parseNumber(credH.value)) ? parseNumber(credH.value) : parseNumber(credH.snippet);

  const ok = gradeAtLeastC(g) && Number.isFinite(sim) && sim >= 80 && Number.isFinite(cred) && cred >= 3;
  return ok ? "Approve" : "Reject";
}

/* ------------------ add-highlight popover ------------------ */
function AddHighlightPopover({ open, x, y, selectedText, category, onChangeCategory, onCancel, onConfirm }) {
  if (!open) return null;

  return (
    <div
      className="fixed z-[75]"
      style={{ left: Math.min(x, window.innerWidth - 360), top: Math.min(y + 10, window.innerHeight - 260) }}
    >
      <div className="w-[340px] rounded-3xl bg-white shadow-2xl border border-black/10 overflow-hidden">
        <div className="px-5 py-4 border-b border-black/10">
          <div className="text-sm font-extrabold text-[#0B0F2A]">Add highlight</div>
          <div className="mt-1 text-xs text-[#0B0F2A]/60">Choose which category this belongs to.</div>
        </div>

        <div className="p-5 space-y-3">
          <div className="rounded-2xl bg-[#EFEFEF] p-3 text-xs text-[#0B0F2A]/80">
            <span className="font-bold text-[#0B0F2A]">Selected:</span>{" "}
            {selectedText.length > 140 ? selectedText.slice(0, 140) + "…" : selectedText}
          </div>

          <div>
            <div className="text-xs font-bold text-[#0B0F2A]/60">Category</div>
            <select
              value={category}
              onChange={(e) => onChangeCategory(e.target.value)}
              className="mt-2 w-full appearance-none rounded-2xl bg-white border border-black/10 px-4 py-3 text-sm font-extrabold text-[#0B0F2A] outline-none"
            >
              <option value="grade">Grade</option>
              <option value="similarity">Similarity</option>
              <option value="credit">Credit Hours</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onCancel} className="rounded-full bg-[#EFEFEF] px-5 py-3 text-sm font-extrabold text-[#0B0F2A]">
              Cancel
            </button>
            <button onClick={onConfirm} className="rounded-full bg-[#0B0F2A] px-5 py-3 text-sm font-extrabold text-white">
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------ page ------------------ */
export default function ApplicationReview() {
  const navigate = useNavigate();
  const { id } = useParams(); // applications.id (numeric)

  const [loading, setLoading] = useState(true);
  const [app, setApp] = useState(null);
  const [docs, setDocs] = useState([]);
  const [ai, setAi] = useState(null);

  const [panel, setPanel] = useState("suggested"); // suggested | info | comment | decision | version

  // docs dropdown uses backend docs
  const docOptions = useMemo(() => {
    return (docs || []).map((d) => ({
      id: String(d.id),
      name: d.file_name || `Document ${d.id}`,
      pages: 10, // placeholder until you implement real PDF page count
      raw: d,
    }));
  }, [docs]);

  const [docId, setDocId] = useState("");
  const [page, setPage] = useState(1);
  const [goTo, setGoTo] = useState("");

  // highlights (still client-side prototype; later you can persist)
  const [highlights, setHighlights] = useState([]);
  const [selectedHighlightId, setSelectedHighlightId] = useState("");

  const selectedHighlight = useMemo(
    () => highlights.find((h) => h.id === selectedHighlightId),
    [highlights, selectedHighlightId]
  );

  const [systemOutcome, setSystemOutcome] = useState("Approve");
  const [userAcceptedSystem, setUserAcceptedSystem] = useState(true);

  const [editMode, setEditMode] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [toast, setToast] = useState("");
  const [confirm, setConfirm] = useState({ open: false, type: "" }); // accept | reject
  const [exitPromptOpen, setExitPromptOpen] = useState(false);

  // autosave status
  const [saveStatus, setSaveStatus] = useState("Autosaved");
  const saveTimerRef = useRef(null);

  // undo/redo stacks (highlights only)
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);

  // add-highlight flow
  const viewerRef = useRef(null);
  const [addMode, setAddMode] = useState(false);
  const [addPopover, setAddPopover] = useState({
    open: false,
    x: 0,
    y: 0,
    selectedText: "",
    category: "similarity",
  });

  // regeneration overlay (now calls backend)
  const [isRegenerating, setIsRegenerating] = useState(false);

  // comments
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  // PL decision
  const [myDecision, setMyDecision] = useState("Approved");

  // load app + docs + ai
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const [appRes, docsRes, aiRes] = await Promise.all([
          api.get(`/applications/${id}`),
          api.get(`/applications/${id}/documents`),
          api.get(`/applications/${id}/ai-analysis/latest`).catch(() => ({ data: null })),
        ]);

        setApp(appRes.data);
        setDocs(docsRes.data || []);
        setAi(aiRes.data || null);

        // init dropdown selection
        const firstDoc = (docsRes.data || [])[0];
        if (firstDoc) setDocId(String(firstDoc.id));

        // init decision dropdown from existing final_decision if any
        if (appRes.data?.final_decision) {
          const fd = String(appRes.data.final_decision).toLowerCase();
          setMyDecision(fd.includes("reject") ? "Rejected" : "Approved");
        }

        // init system outcome from ai
        if (aiRes.data?.decision) {
          setSystemOutcome(aiRes.data.decision);
        } else if (appRes.data?.ai_decision) {
          setSystemOutcome(appRes.data.ai_decision);
        }

        // build default highlights from AI reasoning if exists
        const reason = aiRes.data?.reasoning || null;
        const initH = [];
        if (reason?.grade?.value) {
          initH.push({
            id: `h-grade-${Date.now()}`,
            key: "grade",
            label: "Grade",
            docId: String(firstDoc?.id || ""),
            page: 1,
            value: String(reason.grade.value),
            requirement: REQUIREMENTS.grade,
            snippet: `Grade: ${reason.grade.value}`,
          });
        }
        if (reason?.similarity?.value != null) {
          initH.push({
            id: `h-sim-${Date.now() + 1}`,
            key: "similarity",
            label: "Similarity",
            docId: String(firstDoc?.id || ""),
            page: 1,
            value: `${Math.round(Number(reason.similarity.value) * 100)}%`,
            requirement: REQUIREMENTS.similarity,
            snippet: `Similarity source: ${reason.similarity.source || "documents"}`,
          });
        }
        if (reason?.credit_hours?.value != null) {
          initH.push({
            id: `h-cred-${Date.now() + 2}`,
            key: "credit",
            label: "Credit Hours",
            docId: String(firstDoc?.id || ""),
            page: 1,
            value: String(reason.credit_hours.value),
            requirement: REQUIREMENTS.credit,
            snippet: `Credit Hours: ${reason.credit_hours.value}`,
          });
        }

        setHighlights(initH);
        setSelectedHighlightId(initH[0]?.id || "");
        setDirty(false);
      } catch (e) {
        console.error(e);
        alert("Failed to load application review.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  // computed UI header values
  const currentDoc = useMemo(() => docOptions.find((d) => d.id === docId) || docOptions[0], [docOptions, docId]);
  const totalPages = currentDoc?.pages || 10;

  const selectedFileUrl = useMemo(() => {
    const raw = currentDoc?.raw;
    if (!raw) return null;

    // backend returns something like "/uploads/xxxx.pdf"
    // or it might store full file_path
    const p = raw.file_path || raw.filePath || raw.path || "";
    if (!p) return null;

    // If backend already stores "/uploads/..", just prefix backend host
    if (p.startsWith("/")) return `http://localhost:5000${p}`;

    // If backend stores "uploads/.."
    if (p.startsWith("uploads/")) return `http://localhost:5000/${p}`;

    // If backend stores full URL already
    if (p.startsWith("http")) return p;

    // fallback
    return `http://localhost:5000/uploads/${raw.file_name}`;
  }, [currentDoc]);


  // show similarity pill from AI, else from highlights
  const bestSimilarity = useMemo(() => {
    const sims = highlights.filter((h) => h.key === "similarity");
    if (sims.length === 0) return null;
    return sims
      .slice()
      .sort((a, b) => (parsePercent(b.value || b.snippet) || 0) - (parsePercent(a.value || a.snippet) || 0))[0];
  }, [highlights]);

  const similarityScore = useMemo(() => {
    if (ai?.similarity != null) return `${Math.round(Number(ai.similarity) * 100)}%`;
    if (app?.ai_score != null) return `${Math.round(Number(app.ai_score) * 100)}%`;
    return bestSimilarity?.value || "-";
  }, [ai, app, bestSimilarity]);

  const myHighlightComments = useMemo(
    () => comments.filter((c) => c.highlightId === selectedHighlightId),
    [comments, selectedHighlightId]
  );

  // cleanup timers
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const pushHistoryAndApply = (nextHighlights) => {
    setPast((p) => [...p, highlights]);
    setFuture([]);
    setHighlights(nextHighlights);
    setDirty(true);

    setSaveStatus("Saving…");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setSaveStatus("Autosaved"), 600);
  };

  const undo = () => {
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    setPast((p) => p.slice(0, -1));
    setFuture((f) => [highlights, ...f]);
    setHighlights(prev);
    setDirty(true);

    setSaveStatus("Saving…");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setSaveStatus("Autosaved"), 600);
  };

  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setPast((p) => [...p, highlights]);
    setHighlights(next);
    setDirty(true);

    setSaveStatus("Saving…");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setSaveStatus("Autosaved"), 600);
  };

  const jumpToHighlight = (hid) => {
    const h = highlights.find((x) => x.id === hid);
    if (!h) return;
    setSelectedHighlightId(hid);
    setDocId(h.docId);
    setPage(h.page);
    setPanel("suggested");
  };

  const removeHighlight = (hid) => {
    const next = highlights.filter((h) => h.id !== hid);
    pushHistoryAndApply(next);

    if (selectedHighlightId === hid) {
      const fallback = next[0]?.id || "";
      setSelectedHighlightId(fallback);
    }
    setToast("Highlight removed.");
  };

  const beginEditMode = () => {
    setEditMode(true);
    setSaveStatus("Autosaved");
    setPast([]);
    setFuture([]);
    setAddMode(false);
    setAddPopover((p) => ({ ...p, open: false }));
  };

  const requestExitEditMode = () => {
    setAddMode(false);
    setAddPopover((p) => ({ ...p, open: false }));

    if (!dirty) {
      setEditMode(false);
      setToast("Exited editing mode.");
      return;
    }
    setExitPromptOpen(true);
  };

  const startRegeneration = async () => {
    setIsRegenerating(true);
    try {
      // call backend to run real AI again
      const r = await api.post(`/applications/${id}/ai-analysis/run`);
      const analysis = r.data?.analysis || null;
      setAi(analysis);
      setSystemOutcome(analysis?.decision || "Reject");
      setUserAcceptedSystem(true);
      setDirty(false);

      // also refresh app snapshot values (optional, but keeps UI consistent)
      const appRes = await api.get(`/applications/${id}`);
      setApp(appRes.data);

      setToast("Suggested outcome regenerated (backend AI).");
    } catch (e) {
      console.error(e);
      setToast("Failed to regenerate suggested outcome.");
    } finally {
      setIsRegenerating(false);
    }
  };

  const cancelRegeneration = () => {
    setIsRegenerating(false);
    setToast("Regeneration cancelled.");
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
    setConfirm({ open: false, type: "" });
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

  const submitDecision = async () => {
    try {
      // Update final_decision in applications
      const final_decision = myDecision === "Approved" ? "Approved" : "Rejected";

      await api.patch(`/applications/${id}`, {
        final_decision,
        // optionally move registry status later; keep minimal
      });

      // refresh app
      const appRes = await api.get(`/applications/${id}`);
      setApp(appRes.data);

      setToast("Decision submitted.");
    } catch (e) {
      console.error(e);
      setToast("Failed to submit decision.");
    }
  };

  const goToPage = () => {
    const n = parseInt(goTo, 10);
    if (!Number.isFinite(n)) return;
    const clamped = Math.max(1, Math.min(totalPages, n));
    setPage(clamped);
    setGoTo("");
  };

  // Add Highlight
  const onDocMouseUp = (e) => {
    if (!editMode || !addMode) return;
    const sel = window.getSelection();
    if (!sel) return;
    const text = sel.toString().trim();
    if (!text) return;

    const viewer = viewerRef.current;
    if (!viewer) return;
    const anchorNode = sel.anchorNode;
    if (!anchorNode) return;
    const anchorEl = anchorNode.nodeType === 1 ? anchorNode : anchorNode.parentElement;
    if (!anchorEl || !viewer.contains(anchorEl)) return;

    setAddPopover({
      open: true,
      x: e.clientX,
      y: e.clientY,
      selectedText: text,
      category: "similarity",
    });

    setAddMode(false);
  };

  const confirmAddHighlight = () => {
    const { selectedText, category } = addPopover;

    let value = "";
    if (category === "grade") value = parseGradeValue(selectedText) || "A+";
    if (category === "similarity") {
      const p = parsePercent(selectedText);
      value = Number.isFinite(p) ? `${p}%` : "80%";
    }
    if (category === "credit") {
      const n = parseNumber(selectedText);
      value = Number.isFinite(n) ? String(n) : "3";
    }

    const newH = {
      id: `h-${category}-${Date.now()}`,
      key: category,
      label: titleFromKey(category),
      docId: docId || (docOptions[0]?.id ?? ""),
      page,
      value: value || "-",
      requirement: REQUIREMENTS[category],
      snippet: selectedText,
    };

    const next = [...highlights, newH];
    pushHistoryAndApply(next);
    setSelectedHighlightId(newH.id);

    setAddPopover((p) => ({ ...p, open: false, selectedText: "" }));
    setToast("Highlight added.");
  };

  const cancelAddHighlight = () => {
    setAddPopover((p) => ({ ...p, open: false, selectedText: "" }));
    setToast("Add highlight cancelled.");
  };

  // group highlights
  const highlightsByKey = useMemo(() => {
    const map = { similarity: [], credit: [], grade: [] };
    for (const h of highlights) {
      if (map[h.key]) map[h.key].push(h);
    }
    return map;
  }, [highlights]);

  if (loading) return <div className="mt-10 text-sm">Loading…</div>;
  if (!app) return <div className="mt-10 text-sm">Application not found.</div>;

  const applicationInfo = {
    id: app.application_id || app.id,
    createdAt: app.created_at ? new Date(app.created_at).toLocaleDateString() : (app.date_submitted ? String(app.date_submitted).slice(0, 10) : "-"),
    studentName: app.student_name,
    studentId: app.student_id,
    type: app.type,
    requestedSubject: app.requested_subject,
    academicSession: app.academic_session || `${app.intake || ""} | ${app.semester || ""}`,
    prevModule: app.prev_subject_name || app.qualification || "-",
  };

  return (
    <div className="bg-white">
      <RegeneratingOverlay open={isRegenerating} onCancel={cancelRegeneration} />

      {/* ---------- HEADER ---------- */}
      <div className="flex items-center gap-6">
        <button
          onClick={() => navigate("/tasks")}
          className="rounded-xl p-2 text-[#0B0F2A] hover:bg-black/5"
          title="Back"
        >
          <IconBack className="h-8 w-8" />
        </button>

        <div className="flex flex-1 items-center gap-6">
          <h1 className="text-5xl font-extrabold tracking-tight text-[#0B0F2A] whitespace-nowrap leading-none">
            Application Review
          </h1>

          <div className="relative">
            <select
              value={docId}
              onChange={(e) => {
                setDocId(e.target.value);
                setPage(1);
              }}
              className="appearance-none rounded-2xl bg-[#EFEFEF] px-5 py-3 pr-10 text-sm font-semibold text-[#0B0F2A] outline-none min-w-[320px] max-w-[420px]"
            >
              {docOptions.length === 0 ? (
                <option value="">No documents</option>
              ) : (
                docOptions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))
              )}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#0B0F2A]/70">
              <IconChevronDown className="h-5 w-5" />
            </span>
          </div>

          <div className="flex items-center gap-3 whitespace-nowrap">
            <span className="text-sm font-bold text-[#0B0F2A]">Similarity</span>
            <span className="rounded-xl bg-[#EFEFEF] px-3 py-2 text-sm font-extrabold text-[#0B0F2A]">
              {similarityScore}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!editMode ? (
            <>
              <button
                onClick={beginEditMode}
                className="rounded-2xl bg-[#EFEFEF] px-4 py-3 text-sm font-extrabold text-[#0B0F2A]"
              >
                <span className="inline-flex items-center gap-2">
                  <IconPencil className="h-5 w-5" />
                  Edit Highlights
                </span>
              </button>

              {dirty && (
                <button
                  onClick={startRegeneration}
                  className="rounded-2xl bg-[#FF6B2C] px-4 py-3 text-sm font-extrabold text-black shadow-sm hover:shadow-md"
                >
                  Regenerate suggested outcome
                </button>
              )}
            </>
          ) : (
            <>
              <div className="rounded-2xl bg-[#0B0F2A] px-4 py-3 text-sm font-extrabold text-white">
                <span className="inline-flex items-center gap-2">
                  <IconPencil className="h-5 w-5" />
                  Editing Highlights
                </span>
              </div>

              <div className="hidden md:block text-xs font-bold text-[#0B0F2A]/60">{saveStatus}</div>

              <button
                onClick={requestExitEditMode}
                className="rounded-2xl bg-[#EFEFEF] px-4 py-3 text-sm font-extrabold text-[#0B0F2A]"
              >
                Exit
              </button>
            </>
          )}
        </div>
      </div>

      {/* ---------- MAIN LAYOUT ---------- */}
      <div className="mt-10 flex gap-8">
        {/* LEFT: Viewer (still prototype box) */}
        <div className="relative w-[62%] rounded-3xl bg-white shadow-[0_14px_40px_rgba(0,0,0,0.08)]">
          <div ref={viewerRef} className="h-[70vh] overflow-auto rounded-3xl p-6" onMouseUp={onDocMouseUp}>
            <div className="flex items-center gap-3">
              <div className="text-sm font-semibold text-[#0B0F2A]/70">
                {currentDoc?.name || "Document"} — Page {page}
              </div>

              {editMode && (
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={() => setAddMode(true)}
                    className={[
                      "rounded-2xl px-3 py-2 text-xs font-extrabold border",
                      addMode
                        ? "bg-[#0B0F2A] text-white border-[#0B0F2A]"
                        : "bg-white text-[#0B0F2A] border-black/10 hover:bg-black/[0.03]",
                    ].join(" ")}
                    title="Add a missing highlight"
                  >
                    <span className="inline-flex items-center gap-2">
                      <IconPlus className="h-4 w-4" />
                      Add highlight
                    </span>
                  </button>

                  <button
                    onClick={undo}
                    disabled={past.length === 0}
                    className={[
                      "rounded-2xl p-2 border",
                      past.length === 0
                        ? "bg-[#EFEFEF] text-[#0B0F2A]/35 border-black/5"
                        : "bg-white text-[#0B0F2A] border-black/10 hover:bg-black/[0.03]",
                    ].join(" ")}
                    title="Undo"
                  >
                    <IconUndo className="h-5 w-5" />
                  </button>

                  <button
                    onClick={redo}
                    disabled={future.length === 0}
                    className={[
                      "rounded-2xl p-2 border",
                      future.length === 0
                        ? "bg-[#EFEFEF] text-[#0B0F2A]/35 border-black/5"
                        : "bg-white text-[#0B0F2A] border-black/10 hover:bg-black/[0.03]",
                    ].join(" ")}
                    title="Redo"
                  >
                    <IconRedo className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>

            {editMode && addMode && (
              <div className="mt-3 rounded-2xl bg-[#FFF6B8]/60 border border-black/10 px-4 py-3 text-xs text-[#0B0F2A]/70">
                Select text in the document, then choose a category to add it as a highlight.
              </div>
            )}

            <div className="mt-4 rounded-2xl border border-black/10 bg-white p-6">
              <div className="mt-4 rounded-2xl border border-black/10 bg-white p-3">
                <PdfViewer fileUrl={selectedFileUrl} />
              </div>
              <div className="mt-4 border-t border-black/10" />

              <div className="mt-6 space-y-6 text-sm text-[#0B0F2A]/85">
                {highlightsByKey.similarity.map((h) => (
                  <HighlightLine
                    key={h.id}
                    active={selectedHighlightId === h.id}
                    label={h.snippet || "—"}
                    tooltip="Evidence used for similarity"
                    editable={editMode}
                    onRemove={() => removeHighlight(h.id)}
                    onClick={() => {
                      setSelectedHighlightId(h.id);
                      setDocId(h.docId);
                      setPage(h.page);
                    }}
                  />
                ))}

                <div className="h-6" />

                {highlightsByKey.credit.map((h) => (
                  <HighlightLine
                    key={h.id}
                    active={selectedHighlightId === h.id}
                    label={h.snippet || "—"}
                    tooltip="Evidence used for credit hours"
                    editable={editMode}
                    onRemove={() => removeHighlight(h.id)}
                    onClick={() => {
                      setSelectedHighlightId(h.id);
                      setDocId(h.docId);
                      setPage(h.page);
                    }}
                  />
                ))}

                <div className="h-6" />

                {highlightsByKey.grade.map((h) => (
                  <HighlightLine
                    key={h.id}
                    active={selectedHighlightId === h.id}
                    label={h.snippet || "—"}
                    tooltip="Evidence used for grade"
                    editable={editMode}
                    onRemove={() => removeHighlight(h.id)}
                    onClick={() => {
                      setSelectedHighlightId(h.id);
                      setDocId(h.docId);
                      setPage(h.page);
                    }}
                  />
                ))}

                <div className="mt-10 text-xs text-[#0B0F2A]/45">
                  (Next step later) Replace this with real PDF rendering + highlight coordinates.
                  For now, AI data + decisions are real and stored in DB.
                </div>
              </div>
            </div>
          </div>

          {/* Page counter bottom-right */}
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

        {/* MIDDLE: icons */}
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
                      onClick={() => setConfirm({ open: true, type: "accept" })}
                      className={["rounded-full p-2", userAcceptedSystem ? "bg-black/5" : "hover:bg-black/5"].join(" ")}
                      title="Accept suggestion"
                    >
                      <IconTick className="h-5 w-5 text-[#0B0F2A]" />
                    </button>
                    <button
                      onClick={() => setConfirm({ open: true, type: "reject" })}
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
                      leftSub={REQUIREMENTS.grade}
                      rightValue={ai?.grade_detected || app.grade_detected || highlightsByKey.grade[0]?.value || "-"}
                      onClick={() => {
                        const hid = highlightsByKey.grade[0]?.id;
                        if (hid) jumpToHighlight(hid);
                      }}
                    />
                    <ReasonCard
                      index={2}
                      active={selectedHighlight?.key === "similarity"}
                      title="Similarity"
                      leftSub={REQUIREMENTS.similarity}
                      rightValue={similarityScore}
                      onClick={() => {
                        const hid = highlightsByKey.similarity[0]?.id;
                        if (hid) jumpToHighlight(hid);
                      }}
                    />
                    <ReasonCard
                      index={3}
                      active={selectedHighlight?.key === "credit"}
                      title="Credit Hours"
                      leftSub={REQUIREMENTS.credit}
                      rightValue={String(ai?.credit_hours ?? highlightsByKey.credit[0]?.value ?? "-")}
                      onClick={() => {
                        const hid = highlightsByKey.credit[0]?.id;
                        if (hid) jumpToHighlight(hid);
                      }}
                    />
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-white px-4 py-3 text-xs text-[#0B0F2A]/65">
                  Tip: Use <span className="font-bold">Edit Highlights</span> to remove incorrect evidence or add missing evidence.
                </div>
              </div>
            )}

            {panel === "info" && (
              <div className="space-y-4">
                <InfoRow label="Application ID" value={applicationInfo.id} />
                <InfoRow label="Created Date" value={applicationInfo.createdAt} />
                <InfoRow label="Type" value={applicationInfo.type || "-"} />
                <InfoRow label="Student" value={`${applicationInfo.studentName || "-"} (${applicationInfo.studentId || "-"})`} />
                <InfoRow label="Requested Subject" value={applicationInfo.requestedSubject || "-"} />
                <InfoRow label="Academic Session" value={applicationInfo.academicSession || "-"} />
                <InfoRow label="Previously Taken Module" value={applicationInfo.prevModule || "-"} />
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
                    <button onClick={addComment} className="rounded-full bg-[#0B0F2A] px-6 py-3 text-sm font-extrabold text-white">
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
                  <div className="mt-3 text-xs text-[#0B0F2A]/60">(Prototype section — wire to DB later)</div>
                </div>
              </div>
            )}

            {panel === "version" && (
              <div>
                <div className="text-sm text-[#0B0F2A]/70">Track changes made to highlights / decisions.</div>
                <div className="mt-5 rounded-2xl bg-white p-4 text-xs text-[#0B0F2A]/65">
                  (Prototype) Later store version logs into version_history table.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirm.open}
        title={confirm.type === "accept" ? "Accept system suggestion?" : "Reject system suggestion?"}
        body={
          confirm.type === "accept"
            ? "This will record that you agree with the system’s suggested outcome."
            : "This will record that you disagree with the system’s suggested outcome."
        }
        onCancel={() => setConfirm({ open: false, type: "" })}
        onConfirm={() => {
          onConfirmAction();
          setConfirm({ open: false, type: "" });
        }}
      />

      <ExitEditingModal
        open={exitPromptOpen}
        onContinueEditing={() => setExitPromptOpen(false)}
        onNotNow={() => {
          setExitPromptOpen(false);
          setEditMode(false);
          setToast("Exited editing mode. You can regenerate later.");
        }}
        onRegenerate={() => {
          setExitPromptOpen(false);
          setEditMode(false);
          // still uses client-side recompute if you want:
          const newOutcome = computeOutcomeFromHighlights(highlights);
          setSystemOutcome(newOutcome);
          setDirty(false);
          setToast("Suggested outcome regenerated (local).");
        }}
      />

      <AddHighlightPopover
        open={addPopover.open}
        x={addPopover.x}
        y={addPopover.y}
        selectedText={addPopover.selectedText}
        category={addPopover.category}
        onChangeCategory={(c) => setAddPopover((p) => ({ ...p, category: c }))}
        onCancel={cancelAddHighlight}
        onConfirm={confirmAddHighlight}
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

function HighlightLine({ active, label, tooltip, editable, onRemove, onClick }) {
  return (
    <div className="relative">
      <button type="button" onClick={onClick} className="text-left" title="Click to select this highlight">
        <span
          className={[
            "inline-flex items-center rounded-full px-3 py-1",
            active ? "bg-[#F6F2A9] text-[#0B0F2A]" : "bg-[#FFF6B8]/60 text-[#0B0F2A]",
          ].join(" ")}
        >
          <span className="font-semibold">{label}</span>

          <span className="group relative ml-2 inline-flex items-center">
            <span className="text-[#0B0F2A]/40">ⓘ</span>
            <span className="pointer-events-none absolute left-full top-1/2 ml-3 hidden -translate-y-1/2 rounded-2xl bg-[#0B0F2A] px-4 py-3 text-xs text-white shadow-lg group-hover:block w-[260px]">
              {tooltip}
            </span>
          </span>

          {editable && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove?.();
              }}
              className="ml-3 inline-flex items-center gap-2 rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-extrabold hover:bg-white"
              title="Remove highlight"
            >
              <IconTrash className="h-4 w-4" />
              Remove
            </button>
          )}
        </span>
      </button>
    </div>
  );
}
