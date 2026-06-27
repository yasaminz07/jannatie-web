"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Flame, CheckSquare, X, BookOpen, Hand, Sun, Heart, Moon,
  BookMarked, GraduationCap, Building2, ArrowLeft, ChevronRight,
  Bell, Check,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { awardXP } from "@/lib/xpAndStreak";

interface Habit {
  id: string;
  name: string;
  category: string;
  streak: number;
}

interface HifzPlan {
  preset: string;
  amount?: number;
  unit?: string;
  days?: number[];
  time?: string;
  log?: Record<string, boolean>;
}

const PRESET_HABITS = [
  { name: "Pray all 5 Salah on time", category: "Salah", Icon: Building2 },
  { name: "Read Quran daily", category: "Quran", Icon: BookOpen },
  { name: "Morning and evening Adhkar", category: "Dhikr", Icon: Hand },
  { name: "Fast Mondays and Thursdays", category: "Fasting", Icon: Sun },
  { name: "Give Sadaqah weekly", category: "Charity", Icon: Heart },
  { name: "Pray Tahajjud", category: "Salah", Icon: Moon },
  { name: "Memorise Quran (Hifz)", category: "Quran", Icon: BookMarked },
  { name: "Learn an Islamic topic daily", category: "Study", Icon: GraduationCap },
];

const HIFZ_PRESETS = [
  { id: "gentle",    name: "Gentle",    subtitle: "5 ayat per day",    detail: "~3.5 years to complete Hifz", recommended: false, amount: 5,    unit: "ayat"  },
  { id: "steady",    name: "Steady",    subtitle: "10 ayat per day",   detail: "~1.7 years to complete Hifz", recommended: true,  amount: 10,   unit: "ayat"  },
  { id: "committed", name: "Committed", subtitle: "1 page per day",    detail: "~20 months to complete Hifz", recommended: false, amount: 1,    unit: "pages" },
  { id: "intensive", name: "Intensive", subtitle: "2 pages per day",   detail: "~10 months to complete Hifz", recommended: false, amount: 2,    unit: "pages" },
  { id: "custom",    name: "Custom",    subtitle: "Set your own pace", detail: "Choose the amount that suits you", recommended: false, amount: null, unit: null },
];

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

function inferCategory(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("salah") || n.includes("prayer") || n.includes("fajr") || n.includes("tahajjud")) return "Salah";
  if (n.includes("quran") || n.includes("hifz") || n.includes("memoris")) return "Quran";
  if (n.includes("dhikr") || n.includes("adhkar") || n.includes("zikr")) return "Dhikr";
  if (n.includes("fast")) return "Fasting";
  if (n.includes("charity") || n.includes("sadaqah")) return "Charity";
  if (n.includes("learn") || n.includes("topic") || n.includes("study")) return "Study";
  return "Custom";
}

function categoryBadge(_cat: string) {
  return "bg-slate-100 text-slate-500 border-slate-200";
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function getThisWeekDate(dayIndex: number): Date {
  const today = new Date();
  const todayIdx = (today.getDay() + 6) % 7;
  const d = new Date(today);
  d.setDate(today.getDate() + (dayIndex - todayIdx));
  d.setHours(0, 0, 0, 0);
  return d;
}

const todayStr = new Date().toISOString().split("T")[0];
const todayDayIndex = (new Date().getDay() + 6) % 7;

const glassCard = {
  background: "rgba(255, 255, 255, 0.65)",
  border: "1px solid rgba(255, 255, 255, 0.80)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  boxShadow: "0 4px 24px rgba(15, 23, 42, 0.07)",
} as const;

const glassModal = {
  background: "rgba(255, 255, 255, 0.93)",
  backdropFilter: "blur(32px)",
  WebkitBackdropFilter: "blur(32px)",
  border: "1px solid rgba(255, 255, 255, 0.95)",
  boxShadow: "0 20px 60px rgba(15, 23, 42, 0.14)",
} as const;

export default function HabitsPage() {
  const { profile, user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalStep, setModalStep] = useState<"select" | "hifz" | "schedule">("select");
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);
  const [hifzPresetId, setHifzPresetId] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [customUnit, setCustomUnit] = useState<"ayat" | "pages">("ayat");
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [notifTime, setNotifTime] = useState("07:30");

  useEffect(() => {
    if (profile && !profileLoaded) {
      const saved = profile.habits as string[] | undefined;
      if (saved && saved.length > 0) {
        setHabits(
          saved.map((name, i) => ({
            id: String(i),
            name,
            category: inferCategory(name),
            streak: 0,
          }))
        );
      }
      setProfileLoaded(true);
    }
  }, [profile, profileLoaded]);

  // Derive today's completion state from Firestore (real-time via onSnapshot)
  const todayHabitLog = profile?.habitLog?.[todayStr] ?? {};
  const todayAdhkarLog = profile?.adhkarLog?.[todayStr] ?? {};
  const isDone = (name: string) => todayHabitLog[name] === true;
  const morningDone = todayAdhkarLog.morning === true;
  const eveningDone = todayAdhkarLog.evening === true;

  const hifzPlan = profile?.hifzPlan as HifzPlan | undefined;
  const isTodayHifzScheduled = hifzPlan
    ? (hifzPlan.days ? hifzPlan.days.includes(todayDayIndex) : true)
    : false;
  const isDoneHifzToday = !!(hifzPlan?.log?.[todayStr]);

  const hifzSubtitle = (() => {
    if (!hifzPlan) return "";
    if (hifzPlan.amount && hifzPlan.unit) return `${hifzPlan.amount} ${hifzPlan.unit}/day`;
    return HIFZ_PRESETS.find(p => p.id === hifzPlan.preset)?.subtitle ?? "";
  })();

  const doneCount = habits.filter((h) => isDone(h.name)).length;
  const total = habits.length;
  const allDone = total > 0 && doneCount === total;
  const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const hasHifz = selectedPresets.includes("Memorise Quran (Hifz)");

  async function toggle(id: string) {
    const habit = habits.find((h) => h.id === id);
    if (!habit || !user?.uid) return;
    const wasNotDone = !isDone(habit.name);
    await updateDoc(doc(db, "users", user.uid), {
      [`habitLog.${todayStr}.${habit.name}`]: wasNotDone,
    });
    if (wasNotDone) awardXP(user.uid, 10);
  }

  async function markAdhkar(session: "morning" | "evening") {
    if (!user?.uid) return;
    const current = session === "morning" ? morningDone : eveningDone;
    const newVal = !current;
    const bothDone = session === "morning" ? (newVal && eveningDone) : (morningDone && newVal);
    const adhkarHabit = habits.find((h) => h.name === "Morning and evening Adhkar");
    await updateDoc(doc(db, "users", user.uid), {
      [`adhkarLog.${todayStr}.${session}`]: newVal,
      ...(adhkarHabit ? { [`habitLog.${todayStr}.${adhkarHabit.name}`]: bothDone } : {}),
    });
    if (newVal) awardXP(user.uid, 5);
  }

  async function markHifzDone() {
    if (!user?.uid) return;
    const updates: Record<string, unknown> = {
      [`hifzPlan.log.${todayStr}`]: true,
    };
    if (habits.some((h) => h.name === "Read Quran daily")) {
      updates[`habitLog.${todayStr}.Read Quran daily`] = true;
    }
    await updateDoc(doc(db, "users", user.uid), updates);
    awardXP(user.uid, 15);
  }

  async function saveFinal() {
    const toAdd = selectedPresets.filter((n) => !habits.some((h) => h.name === n));
    const newHabits = [
      ...habits,
      ...toAdd.map((name, i) => ({
        id: `${Date.now()}-${i}`,
        name,
        category: inferCategory(name),
        streak: 0,
      })),
    ];
    setHabits(newHabits);

    let newHifzPlan: HifzPlan | undefined;
    if (hasHifz && hifzPresetId) {
      const preset = HIFZ_PRESETS.find((p) => p.id === hifzPresetId);
      newHifzPlan = {
        preset: hifzPresetId,
        amount: hifzPresetId === "custom" ? (Number(customAmount) || undefined) : (preset?.amount ?? undefined),
        unit: hifzPresetId === "custom" ? customUnit : (preset?.unit ?? undefined),
        days: selectedDays,
        time: notifTime,
        log: hifzPlan?.log ?? {},
      };
    }

    if (user?.uid) {
      const updates: Record<string, unknown> = { habits: newHabits.map((h) => h.name) };
      if (newHifzPlan) updates.hifzPlan = newHifzPlan;
      await updateDoc(doc(db, "users", user.uid), updates);
    }

    if (newHifzPlan?.time && typeof window !== "undefined" && "Notification" in window) {
      await Notification.requestPermission();
    }

    setShowAddModal(false);
    setSelectedPresets([]);
    setModalStep("select");
    setHifzPresetId(null);
    setCustomAmount("");
    setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
    setNotifTime("07:30");
  }

  async function removeHabit(id: string) {
    const updated = habits.filter((h) => h.id !== id);
    setHabits(updated);
    if (user?.uid) {
      await updateDoc(doc(db, "users", user.uid), { habits: updated.map((h) => h.name) });
    }
  }

  function openModal() {
    setSelectedPresets([]);
    setModalStep("select");
    setHifzPresetId(null);
    setCustomAmount("");
    setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
    setNotifTime("07:30");
    setShowAddModal(true);
  }

  function togglePreset(name: string) {
    setSelectedPresets((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  }

  function toggleDay(i: number) {
    setSelectedDays((prev) =>
      prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i].sort((a, b) => a - b)
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-5 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Habit Tracker</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {total === 0
                ? "Add your first habit to get started."
                : allDone
                ? "Masha'Allah! All habits done for today."
                : `${doneCount} of ${total} completed today`}
            </p>
          </div>
          <button
            onClick={openModal}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus size={15} /> Add habit
          </button>
        </div>

        {/* Hifz Tracker Card */}
        {hifzPlan && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-5 mb-5"
            style={glassCard}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <BookMarked size={16} className="text-slate-500" />
                <span className="font-semibold text-slate-800 text-sm">Hifz Tracker</span>
                <span className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 font-semibold">
                  {hifzSubtitle}
                </span>
              </div>
              {hifzPlan.time && (
                <span className="text-xs text-slate-500 flex items-center gap-1 flex-shrink-0">
                  <Bell size={11} /> {formatTime(hifzPlan.time)}
                </span>
              )}
            </div>

            {/* Today status */}
            <div className="flex items-center justify-between mb-4 p-3 rounded-xl bg-white/65 border border-white/80">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {isTodayHifzScheduled
                    ? `${hifzPlan.amount} ${hifzPlan.unit} to memorise today`
                    : "Rest day — no memorisation scheduled"}
                </p>
                {isDoneHifzToday && (
                  <p className="text-xs text-blue-600 font-semibold mt-0.5">
                    Done! Masha&apos;Allah
                  </p>
                )}
                {!isDoneHifzToday && isTodayHifzScheduled && (
                  <p className="text-xs text-slate-400 mt-0.5">Mark it done when you finish</p>
                )}
              </div>
              {isTodayHifzScheduled && !isDoneHifzToday && (
                <button
                  onClick={markHifzDone}
                  className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold px-3 py-2 rounded-xl transition-colors flex-shrink-0 ml-3"
                >
                  <Check size={13} /> Mark done
                </button>
              )}
              {isDoneHifzToday && (
                <Check size={18} className="text-emerald-500 flex-shrink-0 ml-3" />
              )}
            </div>

            {/* Weekly grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {DAY_LABELS.map((label, i) => {
                const date = getThisWeekDate(i);
                const ds = date.toISOString().split("T")[0];
                const done = !!(hifzPlan.log?.[ds]);
                const isToday = i === todayDayIndex;
                const scheduled = hifzPlan.days ? hifzPlan.days.includes(i) : true;
                const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

                return (
                  <div key={label} className="flex flex-col items-center gap-1">
                    <span className={`text-[9px] font-semibold ${isToday ? "text-blue-600" : "text-slate-400"}`}>
                      {label}
                    </span>
                    <div
                      className={`w-full aspect-square rounded-lg flex items-center justify-center transition-all ${
                        done
                          ? "bg-blue-600 border border-blue-500"
                          : isToday && scheduled
                          ? "bg-white border-2 border-blue-400"
                          : scheduled && isPast
                          ? "bg-slate-100 border border-slate-200"
                          : scheduled
                          ? "bg-white/60 border border-slate-100"
                          : "bg-slate-50 border border-slate-100"
                      }`}
                    >
                      {done && <Check size={11} className="text-white" />}
                      {isToday && !done && scheduled && (
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {hifzPlan.days && (
              <p className="text-[10px] text-slate-400 mt-3 text-center">
                Scheduled: {hifzPlan.days.map((d) => DAY_LABELS[d]).join(", ")}
              </p>
            )}
          </motion.div>
        )}

        {/* Progress card */}
        {total > 0 && (
          <div className="rounded-2xl p-5 mb-6" style={glassCard}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckSquare size={15} className="text-blue-600" />
                <span className="text-sm font-semibold text-slate-700">Today&apos;s progress</span>
              </div>
              <span className="text-sm font-bold text-blue-600">{doneCount}/{total}</span>
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            {allDone && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-blue-600 font-medium mt-3 text-center"
              >
                Masha&apos;Allah! You&apos;ve completed all your habits today.
              </motion.p>
            )}
          </div>
        )}

        {/* Habit list */}
        {habits.length === 0 && !hifzPlan ? (
          <div className="rounded-2xl p-10 text-center" style={glassCard}>
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
              <CheckSquare size={28} className="text-blue-400" />
            </div>
            <h2 className="text-base font-semibold text-slate-700 mb-2">No habits yet</h2>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed max-w-xs mx-auto">
              Start tracking your Islamic habits daily to build consistency and grow your streak.
            </p>
            <button
              onClick={openModal}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors"
            >
              <Plus size={15} /> Add your first habit
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {habits.map((habit) => (
                <motion.div
                  key={habit.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <div
                    className="rounded-2xl px-4 py-4 transition-all"
                    style={
                      isDone(habit.name)
                        ? {
                            background: "rgba(219, 234, 254, 0.70)",
                            border: "1px solid rgba(147, 197, 253, 0.60)",
                            backdropFilter: "blur(20px)",
                            WebkitBackdropFilter: "blur(20px)",
                          }
                        : glassCard
                    }
                  >
                    <div className="flex items-center gap-3">
                      {habit.name === "Morning and evening Adhkar" ? (
                        // Read-only indicator — completion set by morning/evening buttons below
                        <div className={`w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center ${
                          isDone(habit.name) ? "bg-blue-600 border-blue-600" : "border-slate-300"
                        }`}>
                          {isDone(habit.name) && (
                            <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                              <path d="M1 4.5l3 3 6-7" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => toggle(habit.id)}
                          className={`w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                            isDone(habit.name) ? "bg-blue-600 border-blue-600" : "border-slate-300 hover:border-blue-400"
                          }`}
                        >
                          {isDone(habit.name) && (
                            <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                              <path d="M1 4.5l3 3 6-7" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm font-medium ${isDone(habit.name) ? "line-through text-slate-400" : "text-slate-800"}`}>
                            {habit.name}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${categoryBadge(habit.category)}`}>
                            {habit.category}
                          </span>
                        </div>
                        {habit.name === "Morning and evening Adhkar" ? (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => markAdhkar("morning")}
                              className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                                morningDone
                                  ? "bg-blue-600 border-blue-600 text-white"
                                  : "border-slate-200 text-slate-500 hover:border-blue-400 hover:text-blue-600"
                              }`}
                            >
                              <Sun size={11} /> Morning
                            </button>
                            <button
                              onClick={() => markAdhkar("evening")}
                              className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                                eveningDone
                                  ? "bg-blue-600 border-blue-600 text-white"
                                  : "border-slate-200 text-slate-500 hover:border-blue-400 hover:text-blue-600"
                              }`}
                            >
                              <Moon size={11} /> Evening
                            </button>
                          </div>
                        ) : (
                        <div className="flex gap-1 mt-2">
                          {DAYS.map((day, i) => (
                            <div key={day + i} className="flex flex-col items-center gap-0.5">
                              <div className={`w-3.5 h-3.5 rounded-sm ${i === 6 && isDone(habit.name) ? "bg-blue-500" : "bg-slate-200"}`} />
                              <span className="text-[8px] text-slate-400">{day}</span>
                            </div>
                          ))}
                        </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {habit.streak > 0 && (
                          <div className="flex items-center gap-1">
                            <Flame size={13} className="text-amber-500" />
                            <span className="text-xs font-bold text-slate-600">{habit.streak}</span>
                          </div>
                        )}
                        <button
                          onClick={() => removeHabit(habit.id)}
                          className="text-slate-300 hover:text-red-400 transition-colors p-1"
                          aria-label="Remove habit"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {habits.length > 0 && (
              <button
                onClick={openModal}
                className="w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl border border-dashed border-slate-300 text-xs text-slate-400 hover:border-blue-400 hover:text-blue-600 transition-colors mt-1"
              >
                <Plus size={13} /> Add another habit
              </button>
            )}
          </div>
        )}

        {/* ---- MODAL ---- */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
              onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 24, scale: 0.97 }}
                className="rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
                style={glassModal}
              >
                {/* ---- STEP 1: Select habits ---- */}
                {modalStep === "select" && (
                  <>
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">Choose your habits</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Select the practices you want to track.</p>
                      </div>
                      <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                        <X size={18} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 mb-6">
                      {PRESET_HABITS.map(({ name, category, Icon }) => {
                        const active = selectedPresets.includes(name);
                        const alreadyAdded = habits.some((h) => h.name === name);
                        return (
                          <button
                            key={name}
                            onClick={() => !alreadyAdded && togglePreset(name)}
                            disabled={alreadyAdded}
                            className={`text-left rounded-2xl p-3.5 transition-all ${alreadyAdded ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                            style={
                              active
                                ? { background: "rgba(37,99,235,0.08)", border: "1.5px solid rgba(59,130,246,0.45)" }
                                : { background: "rgba(248,250,252,0.80)", border: "1.5px solid rgba(226,232,240,0.80)" }
                            }
                          >
                            <Icon size={20} className={`mb-2.5 ${active ? "text-blue-500" : "text-slate-400"}`} />
                            <p className={`text-xs font-semibold leading-tight ${active ? "text-blue-700" : "text-slate-700"}`}>{name}</p>
                            <p className={`text-[10px] mt-0.5 ${active ? "text-blue-500" : "text-slate-400"}`}>{category}</p>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowAddModal(false)}
                        className="flex-1 border border-slate-200 text-slate-500 font-semibold py-3 rounded-xl text-sm hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => hasHifz ? setModalStep("hifz") : saveFinal()}
                        disabled={selectedPresets.length === 0}
                        className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
                      >
                        {hasHifz ? <>Set up Hifz plan <ChevronRight size={15} /></> : `Add ${selectedPresets.length > 0 ? selectedPresets.length + " " : ""}habit${selectedPresets.length !== 1 ? "s" : ""}`}
                      </button>
                    </div>
                  </>
                )}

                {/* ---- STEP 2: Hifz plan ---- */}
                {modalStep === "hifz" && (
                  <>
                    <div className="flex items-center gap-3 mb-5">
                      <button
                        onClick={() => setModalStep("select")}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0"
                      >
                        <ArrowLeft size={16} />
                      </button>
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">Choose your Hifz plan</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Pick a pace that works for your life.</p>
                      </div>
                    </div>

                    <div className="space-y-2.5 mb-6">
                      {HIFZ_PRESETS.map((preset) => {
                        const active = hifzPresetId === preset.id;
                        return (
                          <button
                            key={preset.id}
                            onClick={() => setHifzPresetId(preset.id)}
                            className="w-full text-left rounded-2xl p-4 transition-all relative"
                            style={
                              active
                                ? { background: "rgba(37,99,235,0.08)", border: "1.5px solid rgba(59,130,246,0.40)" }
                                : { background: "rgba(248,250,252,0.80)", border: "1.5px solid rgba(226,232,240,0.80)" }
                            }
                          >
                            {preset.recommended && (
                              <span className="absolute top-3 right-3 text-[9px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                                Recommended
                              </span>
                            )}
                            <p className={`text-sm font-bold ${active ? "text-blue-700" : "text-slate-800"}`}>{preset.name}</p>
                            <p className={`text-xs mt-0.5 ${active ? "text-blue-600" : "text-slate-500"}`}>{preset.subtitle}</p>
                            <p className={`text-[10px] mt-0.5 ${active ? "text-blue-400" : "text-slate-400"}`}>{preset.detail}</p>
                          </button>
                        );
                      })}

                      {hifzPresetId === "custom" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="rounded-2xl p-4"
                          style={{ background: "rgba(248,250,252,0.80)", border: "1px solid rgba(226,232,240,0.80)" }}
                        >
                          <p className="text-xs font-semibold text-slate-600 mb-3">Set your custom target</p>
                          <div className="flex gap-3">
                            <input
                              type="number"
                              placeholder="Amount"
                              value={customAmount}
                              onChange={(e) => setCustomAmount(e.target.value)}
                              className="flex-1 rounded-xl px-3 py-2.5 text-sm text-slate-800 border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            />
                            <select
                              value={customUnit}
                              onChange={(e) => setCustomUnit(e.target.value as "ayat" | "pages")}
                              className="rounded-xl px-3 py-2.5 text-sm text-slate-700 border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            >
                              <option value="ayat">Ayat per day</option>
                              <option value="pages">Pages per day</option>
                            </select>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => setModalStep("select")} className="flex-1 border border-slate-200 text-slate-500 font-semibold py-3 rounded-xl text-sm hover:bg-slate-50 transition-colors">
                        Back
                      </button>
                      <button
                        onClick={() => setModalStep("schedule")}
                        disabled={!hifzPresetId || (hifzPresetId === "custom" && !customAmount)}
                        className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
                      >
                        Next: Set schedule <ChevronRight size={15} />
                      </button>
                    </div>
                  </>
                )}

                {/* ---- STEP 3: Schedule ---- */}
                {modalStep === "schedule" && (
                  <>
                    <div className="flex items-center gap-3 mb-5">
                      <button
                        onClick={() => setModalStep("hifz")}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0"
                      >
                        <ArrowLeft size={16} />
                      </button>
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">Set your schedule</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Choose when you will memorise and get reminded.</p>
                      </div>
                    </div>

                    {/* Day selection */}
                    <div className="mb-5">
                      <p className="text-sm font-semibold text-slate-700 mb-3">Which days will you memorise?</p>
                      <div className="grid grid-cols-7 gap-1.5">
                        {DAY_LABELS.map((label, i) => {
                          const active = selectedDays.includes(i);
                          return (
                            <button
                              key={label}
                              onClick={() => toggleDay(i)}
                              className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                                active
                                  ? "bg-blue-600 text-white shadow-sm"
                                  : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                              }`}
                            >
                              {label.slice(0, 2)}
                            </button>
                          );
                        })}
                      </div>
                      {selectedDays.length === 0 && (
                        <p className="text-xs text-red-500 mt-2">Select at least one day.</p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-2">
                        {selectedDays.length === 7
                          ? "Every day"
                          : `${selectedDays.length} day${selectedDays.length !== 1 ? "s" : ""} per week`}
                      </p>
                    </div>

                    {/* Time selection */}
                    <div className="mb-6">
                      <p className="text-sm font-semibold text-slate-700 mb-1.5">
                        <Bell size={14} className="inline mr-1.5 text-blue-600" />
                        Reminder time
                      </p>
                      <p className="text-xs text-slate-400 mb-3">
                        We will notify you at this time on your chosen days if you have not yet memorised.
                      </p>
                      <input
                        type="time"
                        value={notifTime}
                        onChange={(e) => setNotifTime(e.target.value)}
                        className="w-full rounded-xl px-4 py-3 text-sm text-slate-800 border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                      {notifTime && (
                        <p className="text-xs text-slate-400 mt-1.5">
                          You will be reminded at {formatTime(notifTime)}.
                        </p>
                      )}
                    </div>

                    {/* Summary */}
                    <div
                      className="rounded-2xl p-4 mb-6"
                      style={{ background: "rgba(219,234,254,0.50)", border: "1px solid rgba(147,197,253,0.50)" }}
                    >
                      <p className="text-xs font-semibold text-blue-700 mb-1">Your plan</p>
                      <p className="text-sm text-slate-700">
                        <span className="font-bold">
                          {HIFZ_PRESETS.find(p => p.id === hifzPresetId)?.subtitle ??
                            (customAmount ? `${customAmount} ${customUnit} per day` : "")}
                        </span>
                        {" on "}
                        {selectedDays.length === 7
                          ? "every day"
                          : selectedDays.map(d => DAY_LABELS[d]).join(", ")}
                        {notifTime && ` · Reminder at ${formatTime(notifTime)}`}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => setModalStep("hifz")} className="flex-1 border border-slate-200 text-slate-500 font-semibold py-3 rounded-xl text-sm hover:bg-slate-50 transition-colors">
                        Back
                      </button>
                      <button
                        onClick={saveFinal}
                        disabled={selectedDays.length === 0}
                        className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-40"
                      >
                        Save my plan
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
