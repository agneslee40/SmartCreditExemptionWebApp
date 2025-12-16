// src/pages/ApplicationReview.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";

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

function safeDate(d) {
  if (!d) return "-";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString();
}
function asPercent01ToText(x) {
  if (x == null) return "-";
  const n = Number(x);
  if (!Number.isFinite(n)) return "-";
  return `${Math.round(n * 100)}%`;
}

export default function ApplicationReview() {
  const navigate = useNavigate();
  const { id } = useParams(); // applications.id (numeric)

  const [panel, setPanel] = useState("suggested"); // suggested | info | comment | decision | version

  const [app, setApp] = useState(null);
  const [docs, setDocs] = useState([]);
  const [ai, setAi] = useState(null);

  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [confirm, setConfirm] = useState({ open: false, type: "" }); // accept | reject

  const [docId, setDocId] = useState(null);
  const [page, setPage] = useState(1);
  const [goTo, setGoTo] = useState("");

  const [systemOutcome, setSystemOutcome] = useState("Approve");
  const [userAcceptedSystem, setUserAcceptedSystem] = useState(true);

  // editing/highlights are still “prototype local” for now (your PDF highlight system is not stored in DB yet)
  const [editMode, setEditMode] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Autosaved");
  const saveTimerRef = useRef(null);
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);

  const [isRegenerating, setIsRegenerating] = useState(false);

  // comments (still local prototype; later you can persist in comments table)
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  // decision
  const [myDecision, setMyDecision] = useState("Approved");

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

        // default doc selection
        const firstDoc = (docsRes.data || [])[0];
        setDocId(firstDoc ? String(firstDoc.id) : null);

        // derive system outcome
        const decision = (aiRes.data?.decision || appRes.data?.ai_decision || "Approve");
        setSystemOutcome(decision);
        setUserAcceptedSystem(true);

        // default PL decision from DB if exists
        if (appRes.data?.final_decision) {
          setMyDecision(String(appRes.data.final_decision).toLowerCase().includes("reject") ? "Rejected" : "Approved");
        }
      } catch (e) {
        console.error(e);
        alert("Failed to load application review data.");
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [id]);

  const selectedDoc = useMemo(() => docs.find((d) => String(d.id) === String(docId)) || null, [docs, docId]);

  const totalPages = 7; // still prototype (real PDF paging comes later)

  const similarityScore = useMemo(() => {
    // prefer ai.similarity (0..1), else app.ai_score
    const s = ai?.similarity ?? app?.ai_score;
    return asPercent01ToText(s);
  }, [ai, app]);

  const infoVM = useMemo(() => {
    if (!app) return null;
    return {
      applicationId: app.application_id || app.id,
      createdDate: safeDate(app.created_at || app.date_submitted),
      type: app.type || "-",
      student: `${app.student_name || "-"} (${app.student_id || "-"})`,
      requestedSubject: app.requested_subject || "-",
      academicSession: app.academic_session || `${app.intake || "-"} | ${app.semester || "-"}`,
      prevModule: app.prev_subject_name || app.qualification || "-",
    };
  }, [app]);

  const reasoningVM = useMemo(() => {
    // Prefer ai_analysis values, fallback to applications columns
    const grade = ai?.grade_detected ?? app?.grade_detected ?? "-";
    const mark = app?.mark_detected ?? "-";
    const credit = ai?.credit_hours ?? "-";
    const sim = asPercent01ToText(ai?.similarity ?? app?.ai_score);

    return {
      grade,
      mark,
      credit,
      similarity: sim,
      raw: ai?.reasoning || null,
    };
  }, [ai, app]);

  const beginEditMode = () => {
    setEditMode(true);
    setSaveStatus("Autosaved");
    setPast([]);
    setFuture([]);
  };
  const exitEditMode = () => {
    setEditMode(false);
    setDirty(false);
    setToast("Exited editing mode.");
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

  const submitDecision = async () => {
    try {
      const final_decision = myDecision === "Approved" ? "Approved" : "Rejected";

      await api.patch(`/applications/${id}`, {
        final_decision,
        // optional status update example:
        // pl_status: "Approved",
      });

      setToast("Decision submitted.");
    } catch (e) {
      console.error(e);
      alert("Failed to submit decision.");
    }
  };

  const startRegeneration = async () => {
    try {
      setIsRegenerating(true);
      // triggers backend AI generation + updates DB
      await api.post(`/applications/${id}/ai-analysis/run`);

      // reload latest AI + application (so UI stays consistent)
      const [appRes, aiRes] = await Promise.all([
        api.get(`/applications/${id}`),
        api.get(`/applications/${id}/ai-analysis/latest`).catch(() => ({ data: null })),
      ]);

      setApp(appRes.data);
      setAi(aiRes.data || null);

      const decision = (aiRes.data?.decision || appRes.data?.ai_decision || "Approve");
      setSystemOutcome(decision);
      setUserAcceptedSystem(true);

      setDirty(false);
      setToast("Suggested outcome regenerated.");
    } catch (e) {
      console.error(e);
      alert("Failed to regenerate suggested outcome.");
    } finally {
      setIsRegenerating(false);
    }
  };

  const cancelRegeneration = () => {
    // Frontend cancel only (backend call already done or not started)
    setIsRegenerating(false);
    setToast("Regeneration cancelled.");
  };

  const addComment = () => {
    const text = newComment.trim();
    if (!text) return;
    setComments((prev) => [
      ...prev,
      { id: Date.now(), by: "Programme Leader", at: "Just now", text },
    ]);
    setNewComment("");
    setToast("Comment added.");
  };

  const goToPage = () => {
    const n = parseInt(goTo, 10);
    if (!Number.isFinite(n)) return;
    const clamped = Math.max(1, Math.min(totalPages, n));
    setPage(clamped);
    setGoTo("");
  };

  if (loading) return <div className="mt-10 text-sm">Loading…</div>;
  if (!app) return <div className="mt-10 text-sm">Application not found.</div>;

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
              value={docId || ""}
              onChange={(e) => {
                setDocId(e.target.value);
                setPage(1);
              }}
              className="appearance-none rounded-2xl bg-[#EFEFEF] px-5 py-3 pr-10 text-sm font-semibold text-[#0B0F2A] outline-none min-w-[320px] max-w-[420px]"
            >
              {docs.length === 0 ? (
                <option value="">No documents</option>
              ) : (
                docs.map((d) => (
                  <option key={d.id} value={String(d.id)}>
                    {d.file_name}
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

              {/* always allow regenerate (manual) */}
              {!dirty && (
                <button
                  onClick={startRegeneration}
                  className="rounded-2xl bg-[#FF6B2C] px-4 py-3 text-sm font-extrabold text-black shadow-sm hover:shadow-md"
                >
                  Generate / Refresh AI
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
                onClick={exitEditMode}
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
        {/* LEFT: Viewer (prototype) */}
        <div className="relative w-[62%] rounded-3xl bg-white shadow-[0_14px_40px_rgba(0,0,0,0.08)]">
          <div className="h-[70vh] overflow-auto rounded-3xl p-6">
            <div className="flex items-center gap-3">
              <div className="text-sm font-semibold text-[#0B0F2A]/70">
                {selectedDoc ? `${selectedDoc.file_name} — Page ${page}` : "No document selected"}
              </div>

              {selectedDoc && (
                <button
                  onClick={() => window.open(`http://localhost:5000/api/applications/documents/${selectedDoc.id}/view`, "_blank")}
                  className="ml-auto rounded-2xl bg-[#EFEFEF] px-4 py-2 text-sm font-extrabold text-[#0B0F2A] hover:bg-black/5"
                >
                  Open PDF
                </button>
              )}
            </div>

            <div className="mt-4 rounded-2xl border border-black/10 bg-white p-6">
              <div className="text-center font-bold text-[#0B0F2A]">PDF Viewer Placeholder</div>
              <div className="mt-4 border-t border-black/10" />
              <div className="mt-6 text-sm text-[#0B0F2A]/75">
                You already have working <b>View</b> endpoints.  
                Next step (later) is embedding a real PDF viewer (pdf.js/react-pdf) + highlight coords storage.
              </div>

              <div className="mt-6 rounded-2xl bg-[#FFF6B8]/60 border border-black/10 px-4 py-3 text-xs text-[#0B0F2A]/70">
                Current AI values (from DB): Grade <b>{reasoningVM.grade}</b>, Similarity <b>{reasoningVM.similarity}</b>, Credit Hours <b>{String(reasoningVM.credit)}</b>.
              </div>

              {reasoningVM.raw && (
                <pre className="mt-6 text-xs bg-[#EFEFEF] rounded-2xl p-4 overflow-auto">
                  {JSON.stringify(reasoningVM.raw, null, 2)}
                </pre>
              )}
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
                    Values below are loaded from DB (ai_analysis + applications).
                  </div>

                  <div className="mt-5 space-y-3">
                    <ReasonCard index={1} title="Grade" leftSub={REQUIREMENTS.grade} rightValue={reasoningVM.grade} />
                    <ReasonCard index={2} title="Similarity" leftSub={REQUIREMENTS.similarity} rightValue={reasoningVM.similarity} />
                    <ReasonCard index={3} title="Credit Hours" leftSub={REQUIREMENTS.credit} rightValue={String(reasoningVM.credit)} />
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-white px-4 py-3 text-xs text-[#0B0F2A]/65">
                  Tip: Click <span className="font-bold">Generate / Refresh AI</span> if documents changed.
                </div>
              </div>
            )}

            {panel === "info" && infoVM && (
              <div className="space-y-4">
                <InfoRow label="Application ID" value={infoVM.applicationId} />
                <InfoRow label="Created Date" value={infoVM.createdDate} />
                <InfoRow label="Type" value={infoVM.type} />
                <InfoRow label="Student" value={infoVM.student} />
                <InfoRow label="Requested Subject" value={infoVM.requestedSubject} />
                <InfoRow label="Academic Session" value={infoVM.academicSession} />
                <InfoRow label="Previously Taken Module" value={infoVM.prevModule} />
              </div>
            )}

            {panel === "comment" && (
              <div>
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-xs font-bold text-[#0B0F2A]/70">Comments</div>
                  <div className="mt-2 text-xs text-[#0B0F2A]/60">
                    (Prototype) Later you can store this using your <b>comments</b> table.
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {comments.length === 0 ? (
                    <div className="text-sm text-[#0B0F2A]/60">No comments yet.</div>
                  ) : (
                    comments.map((c) => (
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
                    placeholder="Add a comment…"
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
                  <div className="mt-2 text-xs text-[#0B0F2A]/60">
                    (Hook this to applications.remarks later if you want it editable here.)
                  </div>
                </div>
              </div>
            )}

            {panel === "version" && (
              <div className="rounded-2xl bg-white p-4 text-sm text-[#0B0F2A]/70">
                (Prototype) Later you can log events into <b>version_history</b>.
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
        onConfirm={onConfirmAction}
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

function ReasonCard({ index, title, leftSub, rightValue }) {
  return (
    <div className="w-full rounded-2xl border border-black/10 p-4 text-left bg-white">
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
    </div>
  );
}
