"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { deleteEventComment } from "@/lib/community-utils";
import toast from "react-hot-toast";
import { Flag, MessageSquareOff, CheckCircle2, Clock, ShieldOff } from "lucide-react";

interface Report {
  id: string;
  eventId: string;
  eventTitle: string;
  commentId: string;
  commentText: string;
  reporterUid: string;
  reporterName: string;
  reporterType: "user" | "community";
  targetAuthorUid: string;
  targetAuthorName: string;
  reason: string;
  status: "pending" | "reviewed" | "dismissed";
  createdAt: Timestamp | null;
}

const TABS = ["pending", "reviewed", "dismissed"] as const;

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<(typeof TABS)[number]>("pending");
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, snap => {
      setReports(snap.docs.map(d => ({ id: d.id, ...d.data() } as Report)));
      setLoading(false);
    });
    return unsub;
  }, []);

  async function setStatus(id: string, status: Report["status"]) {
    setActingId(id);
    try {
      await updateDoc(doc(db, "reports", id), { status });
      toast.success(status === "reviewed" ? "Marked as reviewed" : "Report dismissed");
    } catch {
      toast.error("Failed to update. Make sure firestore.rules has been pasted into Firebase Console.");
    } finally {
      setActingId(null);
    }
  }

  async function removeComment(report: Report) {
    setActingId(report.id);
    try {
      await deleteEventComment(report.eventId, report.commentId);
      await updateDoc(doc(db, "reports", report.id), { status: "reviewed" });
      toast.success("Comment removed and report marked as reviewed.");
    } catch {
      toast.error("Couldn't remove comment.");
    } finally {
      setActingId(null);
    }
  }

  function timeAgo(ts: Timestamp | null) {
    if (!ts) return "";
    const diff = Date.now() - ts.toMillis();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  const filtered = reports.filter(r => r.status === tab);
  const pendingCount = reports.filter(r => r.status === "pending").length;

  return (
    <div className="px-4 md:px-8 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-1">
          <Flag size={20} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        </div>
        <p className="text-slate-500 text-sm mb-6">Comments reported on community event posts, by users or communities.</p>

        <div className="flex gap-2 mb-5">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
                tab === t ? "bg-blue-600 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}>
              {t}{t === "pending" && pendingCount > 0 ? ` (${pendingCount})` : ""}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-slate-400">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <ShieldOff size={26} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No {tab} reports.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(r => (
              <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400 mb-1">
                      Reported by <span className="font-semibold text-slate-600">{r.reporterName}</span>{" "}
                      <span className="capitalize bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full text-[10px] ml-1">{r.reporterType}</span>
                    </p>
                    <p className="text-xs text-slate-400">On event: <span className="font-medium text-slate-600">{r.eventTitle}</span></p>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] text-slate-400 flex-shrink-0">
                    <Clock size={11} /> {timeAgo(r.createdAt)}
                  </span>
                </div>

                <div className="bg-slate-50 rounded-xl px-3.5 py-2.5 mb-2">
                  <p className="text-xs text-slate-400 mb-0.5">Comment by {r.targetAuthorName}</p>
                  <p className="text-sm text-slate-700">{r.commentText}</p>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-xl px-3.5 py-2.5 mb-3">
                  <p className="text-xs text-amber-700"><span className="font-semibold">Reason:</span> {r.reason}</p>
                </div>

                {tab === "pending" && (
                  <div className="flex gap-2">
                    <button onClick={() => removeComment(r)} disabled={actingId === r.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50">
                      <MessageSquareOff size={14} /> Remove comment
                    </button>
                    <button onClick={() => setStatus(r.id, "dismissed")} disabled={actingId === r.id}
                      className="flex-1 py-2 text-sm font-semibold bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50">
                      Dismiss
                    </button>
                    <button onClick={() => setStatus(r.id, "reviewed")} disabled={actingId === r.id}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors disabled:opacity-50">
                      <CheckCircle2 size={14} /> OK
                    </button>
                  </div>
                )}
                {tab !== "pending" && (
                  <button onClick={() => setStatus(r.id, "pending")} disabled={actingId === r.id}
                    className="text-xs font-semibold text-blue-600 hover:underline">
                    Reopen as pending
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
