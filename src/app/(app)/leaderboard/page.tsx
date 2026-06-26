"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { Trophy, Flame, Zap, Users, Globe, RefreshCw } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface LBUser {
  uid: string;
  displayName: string | null;
  username: string;
  photoURL: string | null;
  xp: number;
  level: number;
  streak: number;
}

const glass = {
  background: "rgba(255,255,255,0.65)",
  border: "1px solid rgba(255,255,255,0.80)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  boxShadow: "0 4px 24px rgba(15,23,42,0.07)",
} as const;

function Avatar({ name, photoURL, size = 36 }: { name: string; photoURL?: string | null; size?: number }) {
  if (photoURL) {
    return (
      <Image src={photoURL} alt={name} width={size} height={size}
        className="rounded-full object-cover flex-shrink-0" />
    );
  }
  const initials = (name || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div style={{ width: size, height: size }}
      className="rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
      {initials || "?"}
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0 shadow-sm">
      <Trophy size={14} className="text-yellow-800" />
    </div>
  );
  if (rank === 2) return (
    <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center flex-shrink-0 shadow-sm">
      <span className="text-xs font-black text-slate-600">2</span>
    </div>
  );
  if (rank === 3) return (
    <div className="w-8 h-8 rounded-full bg-amber-300 flex items-center justify-center flex-shrink-0 shadow-sm">
      <span className="text-xs font-black text-amber-800">3</span>
    </div>
  );
  return (
    <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
      <span className="text-sm font-bold text-slate-400">{rank}</span>
    </div>
  );
}

export default function LeaderboardPage() {
  const { profile, user } = useAuth();
  const [tab, setTab] = useState<"global" | "friends">("global");
  const [allUsers, setAllUsers] = useState<LBUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const q = query(collection(db, "users"), orderBy("xp", "desc"), limit(100));
      const snap = await getDocs(q);
      setAllUsers(snap.docs.map(d => {
        const data = d.data();
        return {
          uid: data.uid,
          displayName: data.displayName ?? null,
          username: data.username ?? "",
          photoURL: data.photoURL ?? null,
          xp: data.xp ?? 0,
          level: data.level ?? 1,
          streak: data.streak ?? 0,
        };
      }));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const following = profile?.following ?? [];

  const displayList = (() => {
    if (tab === "friends") {
      return allUsers
        .filter(u => u.uid === user?.uid || following.includes(u.uid))
        .sort((a, b) => b.xp - a.xp)
        .map((u, i) => ({ ...u, rank: i + 1 }));
    }
    return allUsers.map((u, i) => ({ ...u, rank: i + 1 }));
  })();

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-5 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-7">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Leaderboard</h1>
              <p className="text-slate-500 text-sm mt-1">Compete with the Ummah</p>
            </div>
            <button
              onClick={load}
              disabled={refreshing}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
              style={glass}
            >
              <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
          <div className="inline-flex rounded-2xl p-1 gap-1" style={glass}>
            <button
              onClick={() => setTab("global")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === "global" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Globe size={14} /> Global
            </button>
            <button
              onClick={() => setTab("friends")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === "friends" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Users size={14} /> Friends
            </button>
          </div>
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.40)" }} />
            ))}
          </div>
        ) : tab === "friends" && following.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl p-10 text-center"
            style={glass}
          >
            <Users size={36} className="text-slate-300 mx-auto mb-4" />
            <p className="text-sm font-semibold text-slate-700 mb-1">No friends yet</p>
            <p className="text-xs text-slate-400 mb-5 max-w-[200px] mx-auto leading-relaxed">
              Follow other users from the global leaderboard to see how you compare
            </p>
            <button
              onClick={() => setTab("global")}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              Browse global leaderboard
            </button>
          </motion.div>
        ) : displayList.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl p-10 text-center" style={glass}>
            <p className="text-sm text-slate-400">No users found</p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {displayList.map((u, i) => {
              const isMe = u.uid === user?.uid;
              return (
                <motion.div
                  key={u.uid}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                >
                  <Link
                    href={`/profile/${u.username}`}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-150 hover:scale-[1.01] active:scale-[0.99] ${
                      isMe ? "ring-2 ring-blue-500/60 ring-offset-1" : ""
                    }`}
                    style={{
                      ...glass,
                      background: isMe
                        ? "rgba(239,246,255,0.85)"
                        : u.rank === 1
                        ? "rgba(254,252,232,0.85)"
                        : "rgba(255,255,255,0.65)",
                    }}
                  >
                    <RankBadge rank={u.rank} />
                    <Avatar name={u.displayName ?? u.username} photoURL={u.photoURL} size={38} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate leading-tight">
                        {u.displayName ?? u.username}
                        {isMe && (
                          <span className="ml-1.5 text-[11px] text-blue-500 font-medium">(you)</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-400">@{u.username}</p>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-[11px] text-slate-400">Lv</p>
                        <p className="text-sm font-bold text-slate-700">{u.level}</p>
                      </div>
                      <div className="text-right hidden sm:block">
                        <Flame size={11} className="text-amber-400 ml-auto" />
                        <p className="text-sm font-bold text-slate-700">{u.streak}</p>
                      </div>
                      <div className="text-right">
                        <Zap size={11} className="text-blue-400 ml-auto" />
                        <p className="text-sm font-bold text-blue-600">{u.xp}</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
