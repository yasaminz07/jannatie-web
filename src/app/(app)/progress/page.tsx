"use client";

import { motion } from "framer-motion";
import {
  Flame, Zap, Trophy, Star, Lock,
  CheckCircle2, BookOpen, Sunrise, GraduationCap, Gem, Building2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const LEVELS = ["Mubtadi", "Mujahid", "Talib", "Hafidh", "Wali"];
const LEVEL_DESCS = ["Beginner", "Striving", "Student", "Memoriser", "Friend of Allah"];

const BADGES = [
  { id: "first_habit", name: "First Step", Icon: CheckCircle2, desc: "Complete your first habit", earned: false },
  { id: "week_streak", name: "7-Day Warrior", Icon: Flame, desc: "Keep a 7-day streak", earned: false },
  { id: "quran_reader", name: "Quran Reader", Icon: BookOpen, desc: "Read Quran for 10 days", earned: false },
  { id: "early_riser", name: "Fajr Champion", Icon: Sunrise, desc: "Fajr on time for 21 days", earned: false },
  { id: "learner", name: "Knowledge Seeker", Icon: GraduationCap, desc: "Complete 10 lessons", earned: false },
  { id: "century", name: "Century Streak", Icon: Gem, desc: "100-day streak", earned: false },
];

const glassCard = {
  background: "rgba(255, 255, 255, 0.65)",
  border: "1px solid rgba(255, 255, 255, 0.80)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  boxShadow: "0 4px 24px rgba(15, 23, 42, 0.07)",
} as const;

export default function ProgressPage() {
  const { profile } = useAuth();
  const levelIndex = Math.min((profile?.level ?? 1) - 1, 4);
  const xp = profile?.xp ?? 0;
  const streak = profile?.streak ?? 0;
  const xpProgress = xp % 100;
  const xpToNext = 100 - xpProgress;

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-5 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Progress and Achievements</h1>

        {/* Level banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 mb-6"
          style={{
            background: "linear-gradient(135deg, rgba(219, 234, 254, 0.80) 0%, rgba(221, 214, 254, 0.50) 100%)",
            border: "1px solid rgba(191, 219, 254, 0.80)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow: "0 4px 24px rgba(15, 23, 42, 0.07)",
          }}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Star size={32} className="text-blue-500" />
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Current level</p>
                <p className="text-2xl font-bold text-blue-700">{LEVELS[levelIndex]}</p>
                <p className="text-xs text-slate-500">{LEVEL_DESCS[levelIndex]}</p>
              </div>
            </div>
            <div className="flex gap-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-900">{streak}</p>
                <p className="text-xs text-slate-400 mt-0.5">day streak</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-900">{xp}</p>
                <p className="text-xs text-slate-400 mt-0.5">total XP</p>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>Level {levelIndex + 1}</span>
              <span>{xpToNext} XP to next level</span>
            </div>
            <div className="h-2 bg-white/60 rounded-full overflow-hidden border border-blue-100">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-700"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          {/* XP breakdown */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="rounded-2xl p-6" style={glassCard}>
              <h2 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
                <Zap size={16} className="text-blue-600" /> XP Breakdown
              </h2>
              {xp === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-slate-400">Complete habits and lessons to earn XP.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {[
                    { label: "Habits", xp: Math.round(xp * 0.62) },
                    { label: "Learning", xp: Math.round(xp * 0.28) },
                    { label: "Community", xp: Math.round(xp * 0.10) },
                  ].map(({ label, xp: itemXp }) => (
                    <div key={label}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-slate-700 font-medium">{label}</span>
                        <span className="text-slate-400 text-xs">{itemXp} XP</span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${Math.min((itemXp / 1000) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Streak stats */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="rounded-2xl p-6" style={glassCard}>
              <h2 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
                <Flame size={16} className="text-amber-500" /> Streak Stats
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Current streak", value: streak, Icon: Flame, color: "text-amber-400" },
                  { label: "Longest ever", value: streak, Icon: Trophy, color: "text-slate-400" },
                  { label: "Habits done", value: xp > 0 ? Math.round(xp / 10) : 0, Icon: CheckCircle2, color: "text-slate-400" },
                  { label: "Level", value: levelIndex + 1, Icon: Star, color: "text-blue-500" },
                ].map(({ label, value, Icon, color }) => (
                  <div key={label} className="rounded-xl p-4 text-center border border-slate-100 bg-white/60">
                    <Icon size={18} className={`${color} mx-auto mb-2`} />
                    <p className="text-2xl font-bold text-slate-900">{value}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Badges */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="rounded-2xl p-6 mb-5" style={glassCard}>
            <h2 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
              <Trophy size={16} className="text-blue-600" /> Badge Collection
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {BADGES.map(({ name, Icon, desc, earned }) => (
                <motion.div
                  key={name}
                  whileHover={{ scale: 1.04 }}
                  className="text-center p-3 rounded-xl border transition-all relative"
                  style={{
                    background: earned ? "rgba(219, 234, 254, 0.70)" : "rgba(248, 250, 252, 0.80)",
                    borderColor: earned ? "rgba(147, 197, 253, 0.60)" : "rgba(226, 232, 240, 0.80)",
                  }}
                  title={desc}
                >
                  {!earned && (
                    <div className="absolute top-2 right-2">
                      <Lock size={9} className="text-slate-300" />
                    </div>
                  )}
                  <Icon size={22} className={`mx-auto mb-2 ${earned ? "text-blue-500" : "text-slate-200"}`} />
                  <p className={`text-[10px] font-medium leading-tight ${earned ? "text-blue-700" : "text-slate-400"}`}>{name}</p>
                </motion.div>
              ))}
            </div>
            <p className="text-xs text-slate-400 text-center mt-4">Complete habits and lessons to unlock badges.</p>
          </div>
        </motion.div>

        {/* Mosque leaderboard */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className="rounded-2xl p-6" style={glassCard}>
            <h2 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <Star size={16} className="text-blue-600" /> Mosque Leaderboard
            </h2>
            <p className="text-xs text-slate-400 mb-5">Collective XP earned by mosque communities. Join a mosque to appear here.</p>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Building2 size={32} className="text-slate-200 mb-4" />
              <p className="text-sm font-medium text-slate-500 mb-1">Not connected to a mosque yet</p>
              <p className="text-xs text-slate-400">Head to the Mosque page to join your local community and track collective progress.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
