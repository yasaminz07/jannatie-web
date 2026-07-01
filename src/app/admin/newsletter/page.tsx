"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Send, Users, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

const inputCls =
  "w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white resize-none";

export default function AdminNewsletterPage() {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [preview, setPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; total: number; message?: string } | null>(null);
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
  const [subscriberEmails, setSubscriberEmails] = useState<string[]>([]);

  // Wait for auth to resolve before querying — Firestore rules require the admin token
  useEffect(() => {
    if (!user) return;
    getDocs(collection(db, "newsletterSubscribers"))
      .then(snap => {
        setSubscriberCount(snap.size);
        setSubscriberEmails(snap.docs.map(d => d.id));
      })
      .catch(() => {
        setSubscriberCount(0);
        setSubscriberEmails([]);
      });
  }, [user]);

  async function handleSend() {
    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and body are required.");
      return;
    }
    if (!user?.email) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/send-newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, adminEmail: user.email, emails: subscriberEmails }),
      });
      const data = await res.json() as { sent?: number; failed?: number; total?: number; message?: string; error?: string };
      if (!res.ok) { toast.error(data.error ?? "Send failed."); return; }
      setResult({ sent: data.sent ?? 0, failed: data.failed ?? 0, total: data.total ?? 0, message: data.message });
      if ((data.sent ?? 0) > 0) {
        setSubject("");
        setBody("");
        setPreview(false);
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  }

  const previewHtml = body
    .split(/\n{2,}/)
    .map(p => `<p style="font-size:15px;color:#334155;line-height:1.8;margin:0 0 14px">${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Send Newsletter</h1>
          <p className="text-sm text-slate-400 mt-1">Compose and send to all subscribers</p>
        </div>
        <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 rounded-xl px-3 py-1.5">
          <Users size={14} />
          <span className="text-sm font-semibold">
            {subscriberCount === null ? "…" : subscriberCount} subscriber{subscriberCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Result banner */}
      {result && (
        <div className={`flex items-start gap-3 rounded-2xl p-4 mb-6 ${result.failed === 0 ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-200"}`}>
          {result.failed === 0
            ? <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
            : <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />}
          <div>
            {result.message
              ? <p className="text-sm font-medium text-slate-700">{result.message}</p>
              : <>
                  <p className="text-sm font-semibold text-slate-800">
                    Sent to {result.sent} of {result.total} subscriber{result.total !== 1 ? "s" : ""}
                  </p>
                  {result.failed > 0 && (
                    <p className="text-xs text-amber-700 mt-0.5">{result.failed} failed — check Gmail for bounces.</p>
                  )}
                </>
            }
          </div>
        </div>
      )}

      {/* Compose form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        {/* Subject */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Subject</label>
          <input
            className={inputCls}
            placeholder="e.g. 5 Dhikr to start your morning ☀️"
            value={subject}
            onChange={e => setSubject(e.target.value)}
          />
        </div>

        {/* Body */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Message</label>
            <button
              type="button"
              onClick={() => setPreview(p => !p)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              {preview ? <EyeOff size={12} /> : <Eye size={12} />}
              {preview ? "Edit" : "Preview"}
            </button>
          </div>

          {preview ? (
            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50 min-h-[200px]">
              {subject && <h2 className="text-lg font-bold text-slate-900 mb-4">{subject}</h2>}
              <div dangerouslySetInnerHTML={{ __html: previewHtml || '<p class="text-slate-400 text-sm">Nothing to preview yet.</p>' }} />
            </div>
          ) : (
            <textarea
              className={inputCls}
              rows={10}
              placeholder={"Assalamu Alaykum,\n\nThis week's tip: ...\n\nLeave a blank line between paragraphs."}
              value={body}
              onChange={e => setBody(e.target.value)}
            />
          )}
          <p className="text-xs text-slate-400 mt-1.5">Leave a blank line between paragraphs. Each subscriber gets a personal unsubscribe link.</p>
        </div>

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={sending || !subject.trim() || !body.trim()}
          className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl py-3 transition-colors"
        >
          <Send size={14} />
          {sending
            ? `Sending to ${subscriberCount ?? "…"} subscriber${subscriberCount !== 1 ? "s" : ""}…`
            : `Send to ${subscriberCount ?? "…"} subscriber${subscriberCount !== 1 ? "s" : ""}`}
        </button>
      </div>

      <p className="text-xs text-slate-400 text-center mt-4">
        Emails are sent via Gmail · up to ~500/day on a standard Gmail account
      </p>
    </div>
  );
}
