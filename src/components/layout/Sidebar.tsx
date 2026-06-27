"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  LayoutDashboard, CheckSquare, BookOpen, MessageCircle,
  Calendar, TrendingUp, Settings, Building2, LogOut, Trophy,
  UserPlus, Search, UserCheck, X, Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { levelProgress } from "@/lib/xpAndStreak";
import {
  collection, query, getDocs, doc, updateDoc,
  arrayUnion, arrayRemove, orderBy, startAt, endAt,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import NotificationBell from "./NotificationBell";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Habits", href: "/habits", icon: CheckSquare },
  { label: "Learn", href: "/learn", icon: BookOpen },
  { label: "AI Buddy", href: "/ai", icon: MessageCircle },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Progress", href: "/progress", icon: TrendingUp },
  { label: "Mosque", href: "/mosque", icon: Building2 },
  { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
];

interface SearchResult {
  uid: string;
  displayName: string | null;
  username: string;
  photoURL: string | null;
}

function UserAvatar({ name, photoURL, size = 32 }: { name: string; photoURL?: string | null; size?: number }) {
  if (photoURL) {
    // Use regular <img> to support base64 data: URLs from Firestore
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={photoURL} alt={name} width={size} height={size}
        className="rounded-full object-cover flex-shrink-0" style={{ width: size, height: size }} />
    );
  }
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div style={{ width: size, height: size }}
      className="rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold ring-1 ring-blue-200">
      {initials}
    </div>
  );
}

function FindFriends() {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
    else { setSearch(""); setResults([]); }
  }, [open]);

  useEffect(() => {
    if (!profile?.following) return;
    const map: Record<string, boolean> = {};
    profile.following.forEach(uid => { map[uid] = true; });
    setFollowingMap(map);
  }, [profile?.following]);

  const runSearch = useCallback(async (term: string) => {
    const t = term.toLowerCase().trim();
    if (!t) { setResults([]); return; }
    setSearching(true);
    try {
      const snap = await getDocs(
        query(collection(db, "users"), orderBy("username"), startAt(t), endAt(t + ""))
      );
      setResults(
        snap.docs
          .map(d => { const data = d.data(); return { uid: data.uid, displayName: data.displayName ?? null, username: data.username ?? "", photoURL: data.photoURL ?? null }; })
          .filter(r => r.uid !== user?.uid)
          .slice(0, 6)
      );
    } finally { setSearching(false); }
  }, [user?.uid]);

  useEffect(() => {
    const t = setTimeout(() => runSearch(search), 300);
    return () => clearTimeout(t);
  }, [search, runSearch]);

  async function toggleFollow(target: SearchResult) {
    if (!user) return;
    const isFollowing = !!followingMap[target.uid];
    setFollowingMap(prev => ({ ...prev, [target.uid]: !isFollowing }));
    // Only write to own document to avoid Firestore security rule errors
    if (isFollowing) {
      await updateDoc(doc(db, "users", user.uid), { following: arrayRemove(target.uid) });
    } else {
      await updateDoc(doc(db, "users", user.uid), { following: arrayUnion(target.uid) });
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all border text-slate-500 hover:text-slate-900 hover:bg-slate-900/5 border-transparent"
      >
        <UserPlus size={15} />
        Add Friends
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-[60] bg-black/25"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[61] w-[340px] rounded-3xl overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.98)",
                border: "1px solid rgba(226,232,240,0.80)",
                backdropFilter: "blur(32px)",
                WebkitBackdropFilter: "blur(32px)",
                boxShadow: "0 24px 60px rgba(15,23,42,0.18), 0 4px 16px rgba(15,23,42,0.08)",
              }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-blue-600 flex items-center justify-center">
                    <UserPlus size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 leading-tight">Add Friends</p>
                    <p className="text-[11px] text-slate-400">Search by username</p>
                  </div>
                </div>
                <button onClick={() => setOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                  <X size={13} className="text-slate-500" />
                </button>
              </div>

              <div className="px-4 pt-3 pb-2">
                <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
                  style={{ background: "rgba(248,250,252,1)", border: "1px solid rgba(226,232,240,0.80)" }}>
                  <Search size={14} className="text-slate-400 flex-shrink-0" />
                  <input ref={inputRef} value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Type a username..."
                    className="flex-1 text-sm bg-transparent outline-none text-slate-800 placeholder-slate-400" />
                  {search && (
                    <button onClick={() => setSearch("")} className="text-slate-300 hover:text-slate-500 transition-colors">
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>

              <div className="px-2 pb-2 min-h-[60px] max-h-64 overflow-y-auto">
                {searching && <p className="text-xs text-slate-400 text-center py-6">Searching...</p>}
                {!searching && !search && <p className="text-xs text-slate-400 text-center py-6">Type a username to find friends</p>}
                {!searching && search && results.length === 0 && <p className="text-xs text-slate-400 text-center py-6">No users found for &ldquo;{search}&rdquo;</p>}
                {results.map(r => (
                  <div key={r.uid} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-slate-50 transition-colors">
                    <Link href={`/profile/${r.username}`} onClick={() => setOpen(false)} className="flex items-center gap-3 flex-1 min-w-0">
                      <UserAvatar name={r.displayName ?? r.username} photoURL={r.photoURL} size={36} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{r.displayName ?? r.username}</p>
                        <p className="text-xs text-slate-400">@{r.username}</p>
                      </div>
                    </Link>
                    <button onClick={() => toggleFollow(r)}
                      className={cn(
                        "flex-shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all border",
                        followingMap[r.uid]
                          ? "bg-white border-slate-200 text-slate-600 hover:border-red-300 hover:text-red-400"
                          : "bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
                      )}>
                      {followingMap[r.uid]
                        ? <span className="flex items-center gap-1"><UserCheck size={12} /> Following</span>
                        : "+ Follow"
                      }
                    </button>
                  </div>
                ))}
              </div>

              <div className="px-5 py-3 border-t border-slate-100">
                <p className="text-[11px] text-slate-400 text-center">Friends can see your daily progress and send reminders</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { profile, logOut } = useAuth();
  const name = profile?.displayName ?? "User";

  return (
    <aside
      className="hidden md:flex flex-col w-60 h-screen fixed left-0 top-0 z-30"
      style={{
        background: "rgba(255, 255, 255, 0.55)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRight: "1px solid rgba(255, 255, 255, 0.80)",
        boxShadow: "4px 0 24px rgba(15, 23, 42, 0.06)",
      }}
    >
      {/* Logo */}
      <div className="px-5 py-3 border-b border-slate-200/60 flex items-center justify-between flex-shrink-0">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/images/logo-white.PNG" alt="Jannatie" width={18} height={18}
            className="object-contain" style={{ filter: "brightness(0)" }} />
          <span className="text-sm font-bold text-slate-900 tracking-tight">Jannatie</span>
        </Link>
        <NotificationBell />
      </div>

      {/* User profile */}
      {profile && (
        <div className="px-4 py-3 border-b border-slate-200/60 flex-shrink-0">
          <Link href={`/profile/${profile.username}`} className="flex items-center gap-2.5 mb-2 hover:opacity-80 transition-opacity">
            <UserAvatar name={name} photoURL={profile.photoURL} size={32} />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate leading-tight">{name}</p>
              {profile.username && (
                <p className="text-[11px] text-slate-400 truncate">@{profile.username}</p>
              )}
            </div>
          </Link>
          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
            <span>Level {profile.level}</span>
            <span>{profile.xp} XP</span>
          </div>
          <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${levelProgress(profile.xp)}%` }} />
          </div>
        </div>
      )}

      {/* Nav — flex-1, no scroll */}
      <nav className="flex-1 px-3 py-2 flex flex-col justify-between overflow-hidden">
        <div className="space-y-0.5">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link key={href} href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                  active
                    ? "bg-blue-600/10 text-blue-700 border border-blue-200"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-900/5 border border-transparent"
                )}
              >
                <Icon size={15} />
                {label}
              </Link>
            );
          })}

          {/* Social */}
          <div className="pt-1">
            <p className="px-3 text-[10px] font-semibold text-slate-300 uppercase tracking-widest mb-0.5">Social</p>
            <FindFriends />
          </div>
        </div>

        {/* Bottom links — inside the nav flex column, pinned to bottom */}
        <div className="border-t border-slate-200/60 pt-2 space-y-0.5">
          <Link href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-900/5 transition-all border border-transparent">
            <Home size={15} />
            Home
          </Link>
          <Link href="/settings"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all border",
              pathname === "/settings"
                ? "bg-blue-600/10 text-blue-700 border-blue-200"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-900/5 border-transparent"
            )}>
            <Settings size={15} />
            Settings
          </Link>
          <button onClick={logOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all border border-transparent">
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </nav>
    </aside>
  );
}
