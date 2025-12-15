// frontend/src/components/AssignSLModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";

export default function AssignSLModal({ open, onClose, application, onAssigned }) {
  const [slUsers, setSlUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    const loadSLs = async () => {
      try {
        setLoadingUsers(true);
        // ✅ assumes you already have this endpoint from Part b1:
        // GET /api/users?role=SL
        const res = await api.get("/users", { params: { role: "SL" } });
        setSlUsers(res.data || []);
      } catch (e) {
        console.error(e);
        alert("Failed to load Subject Lecturers.");
      } finally {
        setLoadingUsers(false);
      }
    };

    // reset state whenever opened
    setQuery("");
    setSelectedId("");
    loadSLs();
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return slUsers;
    return slUsers.filter((u) => {
      const name = (u.name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [slUsers, query]);

  const handleAssign = async () => {
    if (!application?.id) return;
    if (!selectedId) {
      alert("Please select a Subject Lecturer first.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.patch(`/applications/${application.id}/assign`, {
        sl_user_id: Number(selectedId),
      });

      // tell Dashboard to refresh UI
      onAssigned?.(res.data);
      onClose?.();
    } catch (e) {
      console.error(e);
      alert("Failed to assign Subject Lecturer.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-[28px] bg-white shadow-xl overflow-hidden">
          <div className="px-6 py-5 border-b flex items-center justify-between">
            <div>
              <div className="text-lg font-extrabold text-[#050827]">
                Assign Subject Lecturer
              </div>
              <div className="text-xs text-[#0B0F2A]/60 mt-1">
                Application: <span className="font-semibold">{application?.application_id}</span> —{" "}
                {application?.student_name}
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-sm"
            >
              ✕
            </button>
          </div>

          <div className="px-6 py-5">
            <label className="text-sm font-semibold text-[#050827]">
              Search lecturer (name or email)
            </label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. sl@sunway.edu.my"
              className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#FF6B2C]/40"
            />

            <div className="mt-4">
              <label className="text-sm font-semibold text-[#050827]">
                Select Subject Lecturer
              </label>

              <div className="mt-2 rounded-2xl border p-3 max-h-56 overflow-auto">
                {loadingUsers ? (
                  <div className="text-sm text-gray-500">Loading lecturers…</div>
                ) : filtered.length === 0 ? (
                  <div className="text-sm text-gray-500">No matching lecturers found.</div>
                ) : (
                  <div className="space-y-2">
                    {filtered.map((u) => (
                      <label
                        key={u.id}
                        className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="sl"
                          value={u.id}
                          checked={String(selectedId) === String(u.id)}
                          onChange={() => setSelectedId(String(u.id))}
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">{u.name}</span>
                          <span className="text-xs text-gray-500">{u.email}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="px-6 py-5 border-t flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-sm font-semibold"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              className="px-5 py-2 rounded-full bg-[#FF6B2C] text-white text-sm font-semibold shadow-sm hover:shadow-md transition disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? "Assigning…" : "Assign"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
