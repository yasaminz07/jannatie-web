"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, CalendarDays, Handshake, Users, MoreHorizontal,
  BarChart2, Home, Settings, LogOut, Bell, Heart, MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import {
  collection, query, orderBy, limit, onSnapshot, writeBatch, doc, Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";

const coreTabs = [
  { label: "Dashboard", href: "/community-hub", icon: LayoutDashboard },
  { label: "Events", href: "/community-hub/events", icon: CalendarDays },
  { label: "Community", href: "/community-hub/community", icon: Users },
  { label: "Collabs", href: "/community-hub/collabs", icon: Handshake },
];

interface Notif {
  id: string;
  fromName: string;
  type: string;
  label: string;
  eventId?: string;
  sentAt: Timestamp;
  read: boolean;
}

const COMMUNITY_NOTIF_TYPES = ["community-like", "community-comment"];

function SmallAvatar({ name, photoURL }: { name: string; photoURL?: string | null }) {
  if (photoURL) return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={photoURL} alt={name} width={36} height={36}
      className="rounded-full object-cover flex-shrink-0" style={{ width: 36, height: 36 }} />
  );
  const initials = (name || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
      {initials}
    </div>
  );
}

function tsAgo(ts: Timestamp) {
  const diff = Date.now() - ts.toMillis();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function CommunityBottomNav() {
  const pathname = usePathname();
  const { user, profile, logOut } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "notifications", user.uid, "items"),
      orderBy("sentAt", "desc"),
      limit(20)
    );
    return onSnapshot(q, snap => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Notif));
      setNotifs(all.filter(n => COMMUNITY_NOTIF_TYPES.includes(n.type)));
    });
  }, [user]);

  const unread = notifs.filter(n => !n.read).length;

  async function markAllRead() {
    if (!user || unread === 0) return;
    const batch = writeBatch(db);
    notifs.filter(n => !n.read).forEach(n => {
      batch.update(doc(db, "notifications", user.uid, "items", n.id), { read: true });
    });
    await batch.commit();
  }

  useEffect(() => {
    if (!moreOpen) return;
    const timer = setTimeout(markAllRead, 800);
    function onClickOutside(e: MouseEvent) {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) setMoreOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => { clearTimeout(timer); document.removeEventListener("mousedown", onClickOutside); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moreOpen]);

  const activeInMore = pathname.startsWith("/community-hub/insights") || pathname === "/community-hub/settings";

  return (
    <>
      {/* Slide-up more sheet */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-40 bg-black/20"
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              ref={sheetRef}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 34 }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl"
              style={{
                background: "rgba(255,255,255,0.97)",
                backdropFilter: "blur(32px)",
                WebkitBackdropFilter: "blur(32px)",
                border: "1px solid rgba(255,255,255,0.95)",
                boxShadow: "0 -8px 40px rgba(15,23,42,0.12)",
              }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-8 h-1 bg-slate-200 rounded-full" />
              </div>

              <div className="px-5 pb-8 max-h-[80vh] overflow-y-auto">
                {/* Profile */}
                {profile && (
                  <div className="flex items-center gap-3 py-3 mb-3 border-b border-slate-100">
                    <SmallAvatar name={profile.displayName ?? profile.username} photoURL={profile.photoURL} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 truncate">{profile.displayName ?? profile.username}</p>
                      <p className="text-xs text-slate-400 truncate">@{profile.username} · Community account</p>
                    </div>
                  </div>
                )}

                {/* Notifications */}
                <div className="mb-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Bell size={12} className="text-slate-400" />
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Notifications</p>
                    {unread > 0 && (
                      <span className="text-[9px] font-bold text-white bg-blue-600 rounded-full px-1.5 py-0.5 leading-none">{unread}</span>
                    )}
                  </div>
                  {notifs.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No notifications yet</p>
                  ) : (
                    <div className="space-y-1.5 max-h-52 overflow-y-auto">
                      {notifs.map(n => (
                        <Link
                          key={n.id}
                          href={n.eventId ? "/community-hub/events" : "/community-hub"}
                          onClick={() => setMoreOpen(false)}
                          className={cn(
                            "flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-xs transition-colors",
                            !n.read ? "bg-blue-50" : "bg-slate-50 hover:bg-slate-100"
                          )}
                        >
                          {n.type === "community-like"
                            ? <Heart size={12} className="text-rose-500 fill-rose-500 flex-shrink-0 mt-0.5" />
                            : <MessageCircle size={12} className="text-blue-500 flex-shrink-0 mt-0.5" />
                          }
                          <div className="min-w-0 flex-1">
                            <p className="text-slate-800 leading-snug">
                              <span className="font-semibold">{n.fromName}</span>{" "}
                              {n.type === "community-like" ? "liked" : "commented on"} your post
                              {n.label && <> — <span className="text-blue-600 font-medium truncate">{n.label}</span></>}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{tsAgo(n.sentAt)}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Extra nav */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <Link href="/community-hub/insights" onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold transition-all border",
                      pathname.startsWith("/community-hub/insights")
                        ? "bg-blue-600/10 text-blue-700 border-blue-200"
                        : "text-slate-600 border-slate-100 bg-slate-50"
                    )}>
                    <BarChart2 size={16} /> Insights
                  </Link>
                </div>

                {/* Account actions */}
                <div className="border-t border-slate-100 pt-3 space-y-1">
                  <Link href="/" onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:bg-slate-100 transition-colors">
                    <Home size={16} /> Home
                  </Link>
                  <Link href="/community-hub/settings" onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors",
                      pathname === "/community-hub/settings" ? "text-blue-700 bg-blue-50" : "text-slate-500 hover:bg-slate-100"
                    )}>
                    <Settings size={16} /> Settings
                  </Link>
                  <button onClick={() => { logOut(); setMoreOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-slate-100 transition-colors">
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom tab bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30"
        style={{
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.90)",
          boxShadow: "0 -4px 24px rgba(15,23,42,0.06)",
        }}
      >
        <div className="flex items-center justify-around px-1 py-2">
          {coreTabs.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || (href !== "/community-hub" && pathname.startsWith(href + "/"));
            return (
              <Link key={href} href={href} className="flex flex-col items-center gap-1 px-3 py-1 min-w-0">
                <Icon size={22} className={cn("transition-colors", active ? "text-blue-600" : "text-slate-400")} />
                <span className={cn("text-[10px] font-medium transition-colors", active ? "text-blue-600" : "text-slate-400")}>
                  {label}
                </span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(o => !o)}
            className="flex flex-col items-center gap-1 px-3 py-1 relative"
          >
            <div className="relative">
              <MoreHorizontal size={22} className={cn("transition-colors", (moreOpen || activeInMore) ? "text-blue-600" : "text-slate-400")} />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-600 rounded-full flex items-center justify-center text-white text-[8px] font-bold leading-none">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </div>
            <span className={cn("text-[10px] font-medium", (moreOpen || activeInMore) ? "text-blue-600" : "text-slate-400")}>
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
