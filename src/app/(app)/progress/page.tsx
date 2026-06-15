"use client";

import { motion } from "framer-motion";
import { Flame, Zap, Trophy, Star } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Card from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";

const LEVELS = ["Mubtadi", "Mujahid", "Talib", "Hafidh", "Wali"];
const LEVEL_DESCS = ["Beginner", "Striving", "Student", "Memoriser", "Friend of Allah"];

const BADGES = [
  { id: "first_habit", name: "First Step", icon: "✅", desc: "Completed your first habit", earned: true },
  { id: "week_streak", name: "7-Day Warrior", icon: "🔥", desc: "7-day streak", earned: true },
  { id: "quran_reader", name: "Quran Reader", icon: "📖", desc: "Read Quran for 10 days", earned: true },
  { id: "early_riser", name: "Fajr Champion", icon: "🌅", desc: "Fajr on time for 21 days", earned: false },
  { id: "learner", name: "Knowledge Seeker", icon: "🎓", desc: "Complete 10 lessons", earned: false },
  { id: "century", name: "Century Streak", icon: "💎", desc: "100-day streak", earned: false },
];

const LEADERBOARD = [
  { name: "Green Lane Mosque", xp: 12450, members: 234 },
  { name: "Birmingham Central Mosque", xp: 9870, members: 189 },
  { name: "East London Mosque", xp: 8650, members: 167 },
  { name: "North Manchester Jami", xp: 6340, members: 98 },
  { name: "Your Mosque", xp: 4210, members: 45, isUser: true },
];

export default function ProgressPage() {
  const { profile } = useAuth();
  const level = Math.min((profile?.level ?? 1) - 1, 4);
  const xp = profile?.xp ?? 0;
  const xpToNext = 100 - (xp % 100);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">Progress & Achievements</h1>

      {/* Level badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-foreground text-white rounded-2xl p-6 mb-6"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 border-2 border-accent rounded-full flex items-center justify-center">
              <span className="text-2xl">🌟</span>
            </div>
            <div>
              <p className="text-sm text-gray-400">Current level</p>
              <p className="text-2xl font-bold text-accent">{LEVELS[level]}</p>
              <p className="text-xs text-gray-500">{LEVEL_DESCS[level]}</p>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="mono text-3xl font-bold text-white">{profile?.streak ?? 0}</p>
              <p className="text-xs text-gray-400">day streak</p>
            </div>
            <div className="text-center">
              <p className="mono text-3xl font-bold text-white">{xp}</p>
              <p className="text-xs text-gray-400">total XP</p>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>Level {level + 1}</span>
            <span>{xpToNext} XP to next level</span>
          </div>
          <ProgressBar value={xp % 100} max={100} color="orange" />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* XP breakdown */}
        <Card className="p-6">
          <h2 className="font-semibold text-foreground mb-5 flex items-center gap-2">
            <Zap size={16} className="text-primary-500" /> XP Breakdown
          </h2>
          <div className="space-y-4">
            {[
              { label: "Habits", xp: 620, color: "blue" as const },
              { label: "Learning", xp: 280, color: "orange" as const },
              { label: "Community", xp: 100, color: "blue" as const },
            ].map(({ label, xp: itemXp, color }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-foreground font-medium">{label}</span>
                  <span className="mono text-muted">{itemXp} XP</span>
                </div>
                <ProgressBar value={itemXp} max={1000} color={color} />
              </div>
            ))}
          </div>
        </Card>

        {/* Streak stats */}
        <Card className="p-6">
          <h2 className="font-semibold text-foreground mb-5 flex items-center gap-2">
            <Flame size={16} className="text-accent" /> Streak Stats
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Current streak", value: profile?.streak ?? 0, icon: "🔥" },
              { label: "Longest ever", value: 31, icon: "🏆" },
              { label: "Total habits done", value: 284, icon: "✅" },
              { label: "Streak Shield", value: "1 remaining", icon: "🛡️", isText: true },
            ].map(({ label, value, icon, isText }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-2xl mb-1">{icon}</p>
                <p className={`font-bold text-foreground ${isText ? "text-base" : "mono text-2xl"}`}>{value}</p>
                <p className="text-xs text-muted">{label}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Badges */}
      <Card className="p-6 mb-6">
        <h2 className="font-semibold text-foreground mb-5 flex items-center gap-2">
          <Trophy size={16} className="text-accent" /> Badge Collection
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
          {BADGES.map(({ name, icon, desc, earned }) => (
            <motion.div
              key={name}
              whileHover={{ scale: 1.05 }}
              className={`text-center p-3 rounded-xl border transition-all ${earned ? "border-accent/30 bg-accent/5" : "border-border opacity-50 grayscale"}`}
              title={desc}
            >
              <p className="text-3xl mb-1">{icon}</p>
              <p className="text-xs font-medium text-foreground leading-tight">{name}</p>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Mosque leaderboard */}
      <Card className="p-6">
        <h2 className="font-semibold text-foreground mb-5 flex items-center gap-2">
          <Star size={16} className="text-primary-500" /> Mosque Leaderboard
        </h2>
        <p className="text-xs text-muted mb-4">Collective XP earned by mosque communities. Growing together.</p>
        <div className="space-y-3">
          {LEADERBOARD.map(({ name, xp: mxp, members, isUser }, i) => (
            <div
              key={name}
              className={`flex items-center gap-4 p-3 rounded-xl ${isUser ? "bg-primary-50 border border-primary-500/20" : "bg-gray-50"}`}
            >
              <span className="mono text-sm font-bold text-muted w-5 text-center">{i + 1}</span>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${isUser ? "text-primary-500" : "text-foreground"}`}>{name}</p>
                <p className="text-xs text-muted">{members} members</p>
              </div>
              <span className="mono text-sm font-bold text-foreground">{mxp.toLocaleString()} XP</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
