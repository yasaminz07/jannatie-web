"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, CheckSquare, BookOpen, MessageCircle,
  MoreHorizontal, Trophy, Calendar, TrendingUp, Building2,
  Home, Settings, LogOut, X, UserPlus, Search, UserCheck, Users, BookMarked,
  ShieldCheck, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, getChildAge } from "@/lib/auth-context";
import {
  collection, query, orderBy, limit, onSnapshot,
  getDocs, where, doc, updateDoc, arrayUnion, arrayRemove, startAt, endAt,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const coreTabsNormal = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Habits", href: "/habits", icon: CheckSquare },
  { label: "Learn", href: "/learn", icon: BookOpen },
  { label: "AI", href: "/ai", icon: MessageCircle },
];

const coreTabsChild = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Habits", href: "/habits", icon: CheckSquare },
  { label: "Journeys", href: "/learn", icon: BookOpen },
  { label: "AI", href: "/ai", icon: MessageCircle },
];

const moreItemsNormal = [
  { label: "Hifz Tracker", href: "/hifz", icon: BookMarked },
  { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Progress", href: "/progress", icon: TrendingUp },
  { label: "Community", href: "/community", icon: Users },
  { label: "Mosque", href: "/mosque", icon: Building2 },
];

const moreItemsChild = [
  { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Progress", href: "/progress", icon: TrendingUp },
  { label: "Mosque", href: "/mosque", icon: Building2 },
  { label: "Parental", href: "/parental", icon: ShieldCheck },
];

interface SearchResult {
  uid: string;
  displayName: string | null;
  username: string;
  photoURL: string | null;
}

function SmallAvatar({ name, photoURL }: { name: string; photoURL?: string | null }) {
  if (photoURL) return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={photoURL} alt={name} width={28} height={28} className="rounded-full object-cover flex-shrink-0" style={{ width: 28, height: 28 }} />
  );
  const initials = (name || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
      {initials}
    </div>
  );
}

function AddFriendsSearch() {
  const { user, profile } = useAuth();
  const isChild = profile?.accountType === "child";
  const childAge = isChild && profile?.childDateOfBirth ? getChildAge(profile.childDateOfBirth) : null;
  const isChildUnder13 = isChild && childAge !== null && childAge < 13;

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [pendingMap, setPendingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fm: Record<string, boolean> = {};
    (profile?.following ?? []).forEach(uid => { fm[uid] = true; });
    setFollowingMap(fm);
    const pm: Record<string, boolean> = {};
    (profile?.pendingFriends ?? []).forEach(uid => { pm[uid] = true; });
    setPendingMap(pm);
  }, [profile?.following, profile?.pendingFriends]);

  useEffect(() => {
    const t = setTimeout(async () => {
      const term = search.toLowerCase().trim();
      if (!term) { setResults([]); return; }
      setSearching(true);
      try {
        const snap = await getDocs(
          query(collection(db, "users"), orderBy("username"), startAt(term), endAt(term + ""))
        );
        setResults(
          snap.docs
            .map(d => { const data = d.data(); return { uid: data.uid, displayName: data.displayName ?? null, username: data.username ?? "", photoURL: data.photoURL ?? null }; })
            .filter(r => r.uid !== user?.uid)
            .slice(0, 5)
        );
      } finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [search, user?.uid]);

  async function toggleFollow(target: SearchResult) {
    if (!user) return;
    const isFollowing = !!followingMap[target.uid];
    const isPending = !!pendingMap[target.uid];

    if (isFollowing) {
      setFollowingMap(prev => ({ ...prev, [target.uid]: false }));
      await updateDoc(doc(db, "users", user.uid), { following: arrayRemove(target.uid) });
    } else if (isPending) {
      setPendingMap(prev => ({ ...prev, [target.uid]: false }));
      await updateDoc(doc(db, "users", user.uid), { pendingFriends: arrayRemove(target.uid) });
    } else if (isChildUnder13) {
      setPendingMap(prev => ({ ...prev, [target.uid]: true }));
      await updateDoc(doc(db, "users", user.uid), { pendingFriends: arrayUnion(target.uid) });
    } else {
      setFollowingMap(prev => ({ ...prev, [target.uid]: true }));
      await updateDoc(doc(db, "users", user.uid), { following: arrayUnion(target.uid) });
    }
  }

  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
        {isChildUnder13 ? "Add Friends (needs parent approval)" : "Add Friends"}
      </p>
      <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-2" style={{ background: "rgba(248,250,252,0.90)", border: "1px solid rgba(226,232,240,0.60)" }}>
        <Search size={13} className="text-slate-400 flex-shrink-0" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search username..."
          className="flex-1 text-xs bg-transparent outline-none text-slate-800 placeholder-slate-400"
        />
        {search && <button onClick={() => setSearch("")} className="text-slate-300"><X size={11} /></button>}
      </div>
      {searching && <p className="text-[11px] text-slate-400 text-center py-2">Searching...</p>}
      {!searching && search && results.length === 0 && <p className="text-[11px] text-slate-400 text-center py-2">No users found</p>}
      {results.map(r => (
        <div key={r.uid} className="flex items-center gap-2 py-1.5">
          <Link href={`/profile/${r.username}`} className="flex items-center gap-2 flex-1 min-w-0">
            <SmallAvatar name={r.displayName ?? r.username} photoURL={r.photoURL} />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{r.displayName ?? r.username}</p>
              <p className="text-[10px] text-slate-400">@{r.username}</p>
            </div>
          </Link>
          <button
            onClick={() => toggleFollow(r)}
            className={cn(
              "flex-shrink-0 rounded-lg px-2 py-1 text-[10px] font-semibold border transition-all",
              followingMap[r.uid]
                ? "bg-white border-slate-200 text-slate-500"
                : pendingMap[r.uid]
                ? "bg-amber-50 border-amber-200 text-amber-700"
                : "bg-blue-600 border-blue-600 text-white"
            )}
          >
            {followingMap[r.uid]
              ? <UserCheck size={11} />
              : pendingMap[r.uid]
              ? <span className="flex items-center gap-0.5"><Clock size={10} /> Pending</span>
              : <><UserPlus size={11} className="inline mr-0.5" />Follow</>
            }
          </button>
        </div>
      ))}
    </div>
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  const { profile, logOut, user } = useAuth();
  const isChild = profile?.accountType === "child";
  const moreItems = isChild ? moreItemsChild : moreItemsNormal;
  const coreTabs = isChild ? coreTabsChild : coreTabsNormal;
  const [moreOpen, setMoreOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "notifications", user.uid, "items"),
      where("read", "==", false),
      limit(20)
    );
    return onSnapshot(q, snap => setUnread(snap.size));
  }, [user]);

  useEffect(() => {
    if (!moreOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) setMoreOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [moreOpen]);

  const activeInMore = moreItems.some(i => pathname === i.href || (i.href !== "/dashboard" && pathname.startsWith(i.href + "/")));

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
              className="md:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl pb-safe"
              style={{
                background: "rgba(255,255,255,0.96)",
                backdropFilter: "blur(32px)",
                WebkitBackdropFilter: "blur(32px)",
                border: "1px solid rgba(255,255,255,0.95)",
                boxShadow: "0 -8px 40px rgba(15,23,42,0.12)",
              }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-8 h-1 bg-slate-200 rounded-full" />
              </div>

              <div className="px-5 pb-6 max-h-[80vh] overflow-y-auto">
                {/* Nav links */}
                <div className="grid grid-cols-2 gap-2 mb-5">
                  {moreItems.map(({ label, href, icon: Icon }) => {
                    const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setMoreOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all border",
                          active
                            ? "bg-blue-600/10 text-blue-700 border-blue-200"
                            : "text-slate-600 border-slate-100 bg-slate-50"
                        )}
                      >
                        <Icon size={16} /> {label}
                      </Link>
                    );
                  })}
                </div>

                {/* Add Friends search */}
                <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(248,250,252,0.80)", border: "1px solid rgba(226,232,240,0.60)" }}>
                  <AddFriendsSearch />
                </div>

                {/* Account section */}
                <div className="border-t border-slate-100 pt-4 space-y-1">
                  {profile && (
                    <Link href={`/profile/${profile.username}`} onClick={() => setMoreOpen(false)}
                      className="flex items-center gap-3 px-2 pb-3 hover:opacity-80 transition-opacity">
                      <SmallAvatar name={profile.displayName ?? profile.username} photoURL={profile.photoURL} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 truncate">{profile.displayName ?? profile.username}</p>
                        <p className="text-xs text-slate-400 truncate">@{profile.username}</p>
                      </div>
                    </Link>
                  )}
                  <Link href="/" onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:bg-slate-100 transition-colors">
                    <Home size={16} /> Home
                  </Link>
                  <Link href="/settings" onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors",
                      pathname === "/settings" ? "text-blue-700 bg-blue-50" : "text-slate-500 hover:bg-slate-100"
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
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));
            return (
              <Link key={href} href={href}
                className="flex flex-col items-center gap-1 px-3 py-1 min-w-0">
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
              {(unread > 0) && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-600 rounded-full flex items-center justify-center text-white text-[8px] font-bold">
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
