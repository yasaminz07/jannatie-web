"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  CheckSquare, BookOpen, MessageCircle, Flame, Zap,
  Plus, ArrowRight, ChevronRight, Calendar,
  Sparkles, CheckCircle2, TrendingUp, BookMarked, Bell, Check,
} from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface HifzPlan {
  preset: string;
  amount?: number;
  unit?: string;
  days?: number[];
  time?: string;
  log?: Record<string, boolean>;
}

function getGreeting(name: string) {
  const hour = new Date().getHours();
  if (hour < 12) return `Good morning, ${name}`;
  if (hour < 17) return `Good afternoon, ${name}`;
  return `Good evening, ${name}`;
}

const ONBOARDING_STEPS = [
  {
    Icon: Sparkles,
    title: "Bismillah — welcome to Jannatie",
    body: "This is your personal Islamic growth space. Here is a quick look at what you can do.",
  },
  {
    Icon: CheckCircle2,
    title: "Build daily habits",
    body: "Track your Islamic habits every day. Salah, Quran, Dhikr and more. Complete them to earn XP and grow your streak.",
  },
  {
    Icon: MessageCircle,
    title: "Ask your AI Buddy",
    body: "Ask anything about Islam, duas, Seerah or Fiqh. Every answer cites the hadith so you always know the source.",
  },
  {
    Icon: TrendingUp,
    title: "Learn and level up",
    body: "Complete daily lessons, earn badges and track your progress alongside your mosque community.",
  },
];

const LEVEL_NAMES = ["Mubtadi", "Mujahid", "Talib", "Hafidh", "Wali"];
const AI_PROMPTS = [
  "What is the Sunnah of sleeping?",
  "How do I make up missed Salah?",
];

const glassCard = {
  background: "rgba(255, 255, 255, 0.65)",
  border: "1px solid rgba(255, 255, 255, 0.80)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  boxShadow: "0 4px 24px rgba(15, 23, 42, 0.07)",
} as const;

function OnboardingModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const current = ONBOARDING_STEPS[step];
  const CurrentIcon = current.Icon;
  const isLast = step === ONBOARDING_STEPS.length - 1;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="rounded-3xl p-8 w-full max-w-sm shadow-2xl"
        style={{
          background: "rgba(255,255,255,0.93)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          border: "1px solid rgba(255,255,255,0.95)",
          boxShadow: "0 20px 60px rgba(15,23,42,0.14)",
        }}
      >
        <div className="flex justify-center mb-6">
          <CurrentIcon size={40} className="text-blue-500" />
        </div>

        <div className="flex justify-center gap-1.5 mb-6">
          {ONBOARDING_STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-6 bg-blue-500" : "w-1.5 bg-slate-200"}`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-xl font-bold text-slate-900 text-center mb-3">{current.title}</h2>
            <p className="text-slate-500 text-sm text-center leading-relaxed">{current.body}</p>
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="flex-1 py-3 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors">
            Skip
          </button>
          <button
            onClick={() => (isLast ? onClose() : setStep((s) => s + 1))}
            className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            {isLast ? "Get started" : "Next"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export default function DashboardPage() {
  const { profile, user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hifzDoneLocal, setHifzDoneLocal] = useState(false);

  const name = profile?.displayName?.split(" ")[0] ?? "there";
  const habits = profile?.habits as string[] | undefined;
  const hasHabits = habits && habits.length > 0;
  const streak = profile?.streak ?? 0;
  const xp = profile?.xp ?? 0;
  const level = profile?.level ?? 1;
  const levelName = LEVEL_NAMES[Math.min(level - 1, 4)];
  const xpProgress = xp % 100;

  const hifzPlan = profile?.hifzPlan as HifzPlan | undefined;
  const todayStr = new Date().toISOString().split("T")[0];
  const todayDayIndex = (new Date().getDay() + 6) % 7; // 0=Mon
  const isTodayHifzScheduled = hifzPlan
    ? (hifzPlan.days ? hifzPlan.days.includes(todayDayIndex) : true)
    : false;
  const isDoneHifzToday = hifzDoneLocal || !!(hifzPlan?.log?.[todayStr]);
  const showHifzReminder = !!hifzPlan && isTodayHifzScheduled;

  // Onboarding
  useEffect(() => {
    const done = localStorage.getItem("jannatie_onboarded");
    if (!done) {
      const timer = setTimeout(() => setShowOnboarding(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  // Schedule browser notification at the user's chosen time
  useEffect(() => {
    const plan = profile?.hifzPlan as HifzPlan | undefined;
    if (!plan?.time || !plan.days) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const todayIdx = (new Date().getDay() + 6) % 7;
    if (!plan.days.includes(todayIdx)) return;

    const today = new Date().toISOString().split("T")[0];
    if (plan.log?.[today]) return;

    const [h, m] = plan.time.split(":").map(Number);
    const notifAt = new Date();
    notifAt.setHours(h, m, 0, 0);
    const delay = notifAt.getTime() - Date.now();
    if (delay <= 0) return;

    const timer = setTimeout(() => {
      new Notification("Quran memorisation reminder", {
        body: `Your daily target is ${plan.amount} ${plan.unit}. Open Jannatie to mark it done.`,
      });
    }, delay);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.hifzPlan?.time]);

  async function markHifzDone() {
    setHifzDoneLocal(true);
    if (!user?.uid) return;
    await updateDoc(doc(db, "users", user.uid), {
      [`hifzPlan.log.${todayStr}`]: true,
    });
  }

  function closeOnboarding() {
    localStorage.setItem("jannatie_onboarded", "1");
    setShowOnboarding(false);
  }

  return (
    <div className="min-h-screen">
      <AnimatePresence>
        {showOnboarding && <OnboardingModal onClose={closeOnboarding} />}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto px-5 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-7">
          <h1 className="text-2xl font-bold text-slate-900">{getGreeting(name)}</h1>
          <p className="text-slate-500 text-sm mt-1">
            {hasHabits ? "Keep up your daily practice." : "Welcome. Start by setting up your daily habits."}
          </p>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          <div className="rounded-2xl px-4 py-4 flex items-center gap-3" style={glassCard}>
            <Flame size={20} className="text-amber-400 flex-shrink-0" />
            <div>
              <p className="text-xl font-bold text-slate-900 leading-none">{streak}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">day streak</p>
            </div>
          </div>

          <div className="rounded-2xl px-4 py-4 flex items-center gap-3" style={glassCard}>
            <Zap size={20} className="text-blue-500 flex-shrink-0" />
            <div>
              <p className="text-xl font-bold text-slate-900 leading-none">{xp}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">total XP</p>
            </div>
          </div>

          <div className="rounded-2xl px-4 py-4" style={glassCard}>
            <p className="text-sm font-bold text-slate-800 leading-tight">{levelName}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Level {level}</p>
            <div className="mt-2.5 h-1 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${xpProgress}%` }} />
            </div>
          </div>
        </motion.div>

        {/* Hifz Reminder Banner */}
        <AnimatePresence>
          {showHifzReminder && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl p-5 mb-5 flex items-center justify-between gap-4"
              style={glassCard}
            >
              <div className="flex items-center gap-3">
                {isDoneHifzToday ? (
                  <Check size={18} className="text-blue-500 flex-shrink-0" />
                ) : (
                  <BookMarked size={18} className="text-slate-400 flex-shrink-0" />
                )}
                <div>
                  {isDoneHifzToday ? (
                    <>
                      <p className="text-sm font-bold text-slate-800">
                        Hifz done today! Masha&apos;Allah
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {hifzPlan?.amount} {hifzPlan?.unit} memorised
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-slate-800">
                        {hifzPlan?.amount} {hifzPlan?.unit} to memorise today
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        {hifzPlan?.time && (
                          <>
                            <Bell size={10} /> Reminder at {formatTime(hifzPlan.time)}
                          </>
                        )}
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {!isDoneHifzToday && (
                  <button
                    onClick={markHifzDone}
                    className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold px-3 py-2 rounded-xl transition-colors"
                  >
                    Mark done
                  </button>
                )}
                <Link href="/habits" className="text-xs text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-0.5">
                  Track <ChevronRight size={12} />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Habits */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3"
          >
            <div className="rounded-2xl p-6" style={glassCard}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <CheckSquare size={17} className="text-blue-600" />
                  <h2 className="font-semibold text-slate-800">Today&apos;s habits</h2>
                </div>
                <Link href="/habits" className="flex items-center gap-0.5 text-xs text-slate-400 hover:text-blue-600 transition-colors">
                  View all <ChevronRight size={12} />
                </Link>
              </div>

              {hasHabits ? (
                <div className="space-y-2">
                  {(habits as string[]).map((h) => (
                    <div
                      key={h}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-100"
                    >
                      <div className="w-5 h-5 rounded-md border-2 border-slate-300 flex-shrink-0" />
                      <span className="text-sm text-slate-700">{h}</span>
                    </div>
                  ))}
                  <Link
                    href="/habits"
                    className="flex items-center justify-center gap-1.5 mt-2 py-2.5 rounded-xl border border-dashed border-slate-300 text-xs text-slate-400 hover:border-blue-400 hover:text-blue-600 transition-colors"
                  >
                    <Plus size={12} /> Add or manage habits
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <CheckSquare size={36} className="text-slate-300 mb-4" />
                  <p className="text-sm font-semibold text-slate-700 mb-1">No habits set up yet</p>
                  <p className="text-xs text-slate-400 mb-5 leading-relaxed max-w-[200px]">
                    Add your first habit to start tracking your progress and building your streak.
                  </p>
                  <Link
                    href="/habits"
                    className="inline-flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl transition-colors font-medium"
                  >
                    <Plus size={14} /> Set up habits
                  </Link>
                </div>
              )}
            </div>
          </motion.div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Today's lesson */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <div className="rounded-2xl p-5" style={glassCard}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BookOpen size={15} className="text-blue-600" />
                    <h2 className="font-semibold text-slate-800 text-sm">Today&apos;s lesson</h2>
                  </div>
                  <Link href="/learn" className="text-xs text-slate-400 hover:text-blue-600 transition-colors">
                    All lessons
                  </Link>
                </div>
                <div className="bg-blue-50 rounded-xl px-4 py-4 text-center mb-4 border border-blue-100">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">Hadith of the Day</p>
                  <p className="text-xs text-slate-600 leading-relaxed mb-2">
                    &ldquo;The best of you are those who learn the Quran and teach it.&rdquo;
                  </p>
                  <p className="text-[10px] text-slate-400">Sahih al-Bukhari 5027</p>
                </div>
                <Link
                  href="/learn"
                  className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors"
                >
                  Start lesson <ArrowRight size={13} />
                </Link>
              </div>
            </motion.div>

            {/* AI Buddy */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="rounded-2xl p-5" style={glassCard}>
                <div className="flex items-center gap-2 mb-3">
                  <MessageCircle size={15} className="text-blue-600" />
                  <h2 className="font-semibold text-slate-800 text-sm">AI Buddy</h2>
                </div>
                <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                  Ask anything about Islam. Every answer cites the hadith.
                </p>
                <div className="space-y-1.5 mb-3">
                  {AI_PROMPTS.map((q) => (
                    <Link
                      key={q}
                      href={`/ai?q=${encodeURIComponent(q)}`}
                      className="block text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 text-slate-600 transition-colors leading-snug"
                    >
                      {q}
                    </Link>
                  ))}
                </div>
                <Link
                  href="/ai"
                  className="flex items-center justify-center gap-1.5 border border-blue-200 text-blue-600 font-semibold py-2.5 rounded-xl text-xs hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors"
                >
                  Open AI Buddy <ArrowRight size={13} />
                </Link>
              </div>
            </motion.div>

            {/* Calendar nudge */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Link
                href="/calendar"
                className="flex items-center gap-3 rounded-2xl p-4 hover:bg-white/80 transition-all group"
                style={glassCard}
              >
                <Calendar size={18} className="text-slate-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">Calendar</p>
                  <p className="text-xs text-slate-400">View events and prayer times</p>
                </div>
                <ChevronRight size={15} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
