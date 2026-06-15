"use client";

import { useAuth } from "@/lib/auth-context";
import { getGreeting } from "@/lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";
import { CheckSquare, BookOpen, Calendar, MessageCircle, Flame, Zap } from "lucide-react";
import Card from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";

const todayHabits = [
  { name: "Fajr Salah", done: true },
  { name: "Quran (1 page)", done: true },
  { name: "Morning Dhikr", done: false },
  { name: "Dhuhr Salah", done: false },
];

const upcomingEvents = [
  { title: "Friday Jumu'ah", date: "Fri 17 Jan", time: "1:00pm", location: "Central Mosque" },
  { title: "Quran Study Circle", date: "Sat 18 Jan", time: "10:00am", location: "Online" },
];

export default function DashboardPage() {
  const { profile } = useAuth();
  const name = profile?.displayName?.split(" ")[0] ?? "there";
  const donCount = todayHabits.filter((h) => h.done).length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {getGreeting(name)}
            </h1>
            <p className="text-muted text-sm mt-1">
              You&apos;ve completed {donCount} of {todayHabits.length} habits today.
              {donCount === todayHabits.length && " Masha&apos;Allah! 🌟"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted">Next prayer</p>
            <p className="text-accent font-bold text-sm">Asr · 3:45pm</p>
          </div>
        </div>

        {/* XP / Streak bar */}
        <div className="mt-4 flex items-center gap-6 bg-card border border-border rounded-xl px-5 py-4">
          <div className="flex items-center gap-2">
            <Flame size={20} className="text-accent" />
            <div>
              <p className="mono text-2xl font-bold text-foreground">{profile?.streak ?? 0}</p>
              <p className="text-xs text-muted">day streak</p>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-xs text-muted mb-1">
              <span>Level {profile?.level ?? 1}</span>
              <span className="mono">{profile?.xp ?? 0} XP</span>
            </div>
            <ProgressBar value={(profile?.xp ?? 0) % 100} max={100} />
          </div>
          <div className="flex items-center gap-2">
            <Zap size={20} className="text-primary-500" />
            <div>
              <p className="text-xs font-semibold text-foreground">
                {["Mubtadi", "Mujahid", "Talib", "Hafidh", "Wali"][Math.min((profile?.level ?? 1) - 1, 4)]}
              </p>
              <p className="text-xs text-muted">current level</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 4 widgets grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Today's Habits */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-6 h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckSquare size={18} className="text-primary-500" />
                <h2 className="font-semibold text-foreground">Today&apos;s Habits</h2>
              </div>
              <Link href="/habits" className="text-xs text-primary-500 hover:underline">View all →</Link>
            </div>

            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted">{donCount} of {todayHabits.length} completed</span>
            </div>
            <ProgressBar value={donCount} max={todayHabits.length} className="mb-4" />

            <div className="space-y-2">
              {todayHabits.map((h) => (
                <div key={h.name} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${h.done ? "bg-primary-500 border-primary-500" : "border-gray-300"}`}>
                    {h.done && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className={`text-sm ${h.done ? "line-through text-muted" : "text-foreground"}`}>
                    {h.name}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Today's Lesson */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="p-6 h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-accent" />
                <h2 className="font-semibold text-foreground">Today&apos;s Lesson</h2>
              </div>
              <Link href="/learn" className="text-xs text-primary-500 hover:underline">All lessons →</Link>
            </div>

            <div className="bg-primary-50 rounded-xl p-5 text-center mb-4">
              <p className="text-xs font-semibold text-primary-500 uppercase tracking-wide mb-3">Hadith of the Day</p>
              <p className="text-sm text-foreground leading-relaxed mb-3">
                &ldquo;The best of you are those who learn the Quran and teach it.&rdquo;
              </p>
              <p className="text-xs text-muted">— Sahih al-Bukhari 5027</p>
            </div>

            <Link href="/learn" className="block text-center bg-primary-500 text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-primary-600 transition-colors">
              Start today&apos;s lesson →
            </Link>
          </Card>
        </motion.div>

        {/* Upcoming Events */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-primary-500" />
                <h2 className="font-semibold text-foreground">Upcoming Events</h2>
              </div>
              <Link href="/calendar" className="text-xs text-primary-500 hover:underline">Calendar →</Link>
            </div>
            <div className="space-y-3">
              {upcomingEvents.map((ev) => (
                <div key={ev.title} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="bg-primary-50 rounded-lg p-2 flex-shrink-0 text-center min-w-[44px]">
                    <p className="text-[10px] text-primary-500 font-semibold">{ev.date.split(" ")[0]}</p>
                    <p className="text-sm font-bold text-primary-500">{ev.date.split(" ")[1]}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{ev.title}</p>
                    <p className="text-xs text-muted">{ev.time} · {ev.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* AI Buddy prompt */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle size={18} className="text-accent" />
              <h2 className="font-semibold text-foreground">AI Buddy</h2>
            </div>
            <p className="text-sm text-muted mb-5 leading-relaxed">
              Ask me anything about Islam — prayers, duas, Seerah, Fiqh. I&apos;ll always cite the hadith.
            </p>
            <div className="flex flex-col gap-2 mb-4">
              {[
                "What is the Sunnah of sleeping?",
                "How do I make up missed Salah?",
                "What are the pillars of Iman?",
              ].map((prompt) => (
                <Link
                  key={prompt}
                  href={`/ai?q=${encodeURIComponent(prompt)}`}
                  className="text-sm text-left px-3 py-2 rounded-lg border border-border hover:border-primary-500 hover:text-primary-500 transition-colors text-foreground"
                >
                  {prompt}
                </Link>
              ))}
            </div>
            <Link href="/ai" className="block text-center border border-primary-500 text-primary-500 font-semibold py-2.5 rounded-xl text-sm hover:bg-primary-500 hover:text-white transition-colors">
              Open AI Buddy →
            </Link>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
