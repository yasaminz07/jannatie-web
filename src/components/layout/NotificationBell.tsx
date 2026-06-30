"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  collection, query, orderBy, limit, onSnapshot,
  writeBatch, doc, Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Bell, X, CalendarDays, Heart, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface Notif {
  id: string;
  fromName: string;
  fromUsername: string;
  type: "prayer" | "adhkar" | "habit" | "hifz" | "community-event" | "community-like" | "community-comment";
  label: string;
  eventId?: string;
  sentAt: Timestamp;
  read: boolean;
}

const typeLabel: Record<Exclude<Notif["type"], "community-event" | "community-like" | "community-comment">, string> = {
  prayer: "reminded you to pray",
  adhkar: "reminded you to do adhkar",
  habit: "reminded you to complete a habit",
  hifz: "reminded you to do your Hifz",
};

// Community accounts get a focused inbox: only other communities reaching out
// (likes/comments on their posts, collab activity) — not the normal-user reminder types.
const COMMUNITY_NOTIF_TYPES: Notif["type"][] = ["community-like", "community-comment"];

export default function NotificationBell({ className = "" }: { className?: string }) {
  const { user, profile } = useAuth();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const isCommunity = profile?.accountType === "community";

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "notifications", user.uid, "items"),
      orderBy("sentAt", "desc"),
      limit(20)
    );
    return onSnapshot(q, snap => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Notif));
      setNotifs(isCommunity ? all.filter(n => COMMUNITY_NOTIF_TYPES.includes(n.type)) : all);
    });
  }, [user, isCommunity]);

  const unread = notifs.filter(n => !n.read).length;

  async function markAllRead() {
    if (!user || unread === 0) return;
    const batch = writeBatch(db);
    notifs.filter(n => !n.read).forEach(n => {
      batch.update(doc(db, "notifications", user.uid, "items", n.id), { read: true });
    });
    await batch.commit();
  }

  function handleOpen() {
    setOpen(o => !o);
    if (!open) setTimeout(markAllRead, 800);
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  function timeAgo(ts: Timestamp) {
    const diff = Date.now() - ts.toMillis();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  return (
    <div className={`relative ${className}`} ref={panelRef}>
      <button
        onClick={handleOpen}
        className="relative w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-white text-[9px] font-bold leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-10 w-72 z-50 rounded-2xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.95)",
              border: "1px solid rgba(255,255,255,0.95)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              boxShadow: "0 8px 32px rgba(15,23,42,0.12)",
            }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <p className="text-sm font-bold text-slate-800">Notifications</p>
              <button onClick={() => setOpen(false)} className="text-slate-300 hover:text-slate-500">
                <X size={14} />
              </button>
            </div>
            {notifs.length === 0 ? (
              <div className="py-8 text-center">
                <Bell size={24} className="text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No notifications yet</p>
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                {notifs.map(n => n.type === "community-event" ? (
                  <Link
                    key={n.id}
                    href={n.eventId ? `/community?event=${n.eventId}` : "/community"}
                    onClick={() => setOpen(false)}
                    className={`block px-4 py-3 hover:bg-slate-50 transition-colors ${!n.read ? "bg-blue-50/60" : ""}`}
                  >
                    <p className="text-xs text-slate-800 leading-relaxed flex items-start gap-1.5">
                      <CalendarDays size={12} className="text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>
                        <span className="font-semibold">{n.fromName}</span> posted a new event —{" "}
                        <span className="font-medium text-blue-600">{n.label}</span>
                      </span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 ml-[18px]">{timeAgo(n.sentAt)}</p>
                  </Link>
                ) : n.type === "community-like" || n.type === "community-comment" ? (
                  <Link
                    key={n.id}
                    href={n.eventId ? `/community-hub/events` : "/community-hub"}
                    onClick={() => setOpen(false)}
                    className={`block px-4 py-3 hover:bg-slate-50 transition-colors ${!n.read ? "bg-blue-50/60" : ""}`}
                  >
                    <p className="text-xs text-slate-800 leading-relaxed flex items-start gap-1.5">
                      {n.type === "community-like" ? (
                        <Heart size={12} className="text-rose-500 mt-0.5 flex-shrink-0 fill-rose-500" />
                      ) : (
                        <MessageCircle size={12} className="text-blue-500 mt-0.5 flex-shrink-0" />
                      )}
                      <span>
                        <span className="font-semibold">{n.fromName}</span>{" "}
                        {n.type === "community-like" ? "liked" : "commented on"} your post —{" "}
                        <span className="font-medium text-blue-600">{n.label}</span>
                      </span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 ml-[18px]">{timeAgo(n.sentAt)}</p>
                  </Link>
                ) : (
                  <div key={n.id} className={`px-4 py-3 ${!n.read ? "bg-blue-50/60" : ""}`}>
                    <p className="text-xs text-slate-800 leading-relaxed">
                      <span className="font-semibold">@{n.fromUsername}</span>{" "}
                      {typeLabel[n.type]}
                      {n.label && n.type === "prayer" && (
                        <> — <span className="font-medium text-blue-600">{n.label}</span></>
                      )}
                      {n.label && n.type === "habit" && (
                        <> ({n.label})</>
                      )}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{timeAgo(n.sentAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
