"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Flame, Shield, CheckSquare } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";

interface Habit {
  id: string;
  name: string;
  category: string;
  streak: number;
  done: boolean;
  weekDone: boolean[];
}

const INITIAL_HABITS: Habit[] = [
  { id: "1", name: "Fajr Salah", category: "Salah", streak: 14, done: true, weekDone: [true, true, true, true, true, true, false] },
  { id: "2", name: "Quran (1 page)", category: "Quran", streak: 8, done: true, weekDone: [true, false, true, true, true, false, false] },
  { id: "3", name: "Morning Dhikr", category: "Dhikr", streak: 22, done: true, weekDone: [true, true, true, true, true, true, false] },
  { id: "4", name: "Dhuhr Salah", category: "Salah", streak: 6, done: false, weekDone: [true, true, false, true, true, false, false] },
  { id: "5", name: "Fast (Monday)", category: "Fasting", streak: 3, done: false, weekDone: [false, false, false, false, false, false, false] },
  { id: "6", name: "Evening Dhikr", category: "Dhikr", streak: 7, done: false, weekDone: [true, true, true, true, true, true, false] },
];

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const CATEGORIES = ["Salah", "Quran", "Dhikr", "Fasting", "Charity", "Study", "Good Deeds", "Custom"];

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>(INITIAL_HABITS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitCategory, setNewHabitCategory] = useState("Salah");
  const [xpPopup, setXpPopup] = useState<string | null>(null);

  const doneCount = habits.filter((h) => h.done).length;
  const allDone = doneCount === habits.length;

  function toggleHabit(id: string) {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        const newDone = !h.done;
        if (newDone) setXpPopup(id);
        setTimeout(() => setXpPopup(null), 700);
        return { ...h, done: newDone, streak: newDone ? h.streak : Math.max(0, h.streak - 1) };
      })
    );
  }

  function addHabit() {
    if (!newHabitName.trim()) return;
    setHabits((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: newHabitName.trim(),
        category: newHabitCategory,
        streak: 0,
        done: false,
        weekDone: [false, false, false, false, false, false, false],
      },
    ]);
    setNewHabitName("");
    setShowAddModal(false);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Habit Tracker</h1>
          <p className="text-muted text-sm mt-0.5">
            {allDone
              ? "Masha'Allah! All done for today 🌟"
              : `${doneCount} of ${habits.length} habits completed today`}
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} size="sm" className="gap-1">
          <Plus size={14} /> Add habit
        </Button>
      </div>

      {/* Daily summary */}
      <Card className="p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckSquare size={16} className="text-primary-500" />
            <span className="text-sm font-semibold text-foreground">Today&apos;s progress</span>
          </div>
          <span className="mono text-sm font-bold text-primary-500">
            {doneCount}/{habits.length}
          </span>
        </div>
        <ProgressBar value={doneCount} max={habits.length} />
        {allDone && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-primary-500 font-medium mt-3 text-center"
          >
            ✨ Masha&apos;Allah! You&apos;ve completed all your habits today!
          </motion.p>
        )}
      </Card>

      {/* Habits list */}
      <div className="space-y-3">
        {habits.map((habit) => (
          <motion.div
            key={habit.id}
            layout
            className="relative"
          >
            {/* XP popup */}
            <AnimatePresence>
              {xpPopup === habit.id && (
                <motion.div
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.6 }}
                  className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-bold px-2 py-0.5 rounded-full z-10 pointer-events-none"
                >
                  +10 XP
                </motion.div>
              )}
            </AnimatePresence>

            <Card className="p-4" hover>
              <div className="flex items-center gap-3">
                {/* Checkbox */}
                <button
                  onClick={() => toggleHabit(habit.id)}
                  className={`w-6 h-6 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
                    habit.done
                      ? "bg-primary-500 border-primary-500 scale-110"
                      : "border-gray-300 hover:border-primary-500"
                  }`}
                >
                  {habit.done && (
                    <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                      <path d="M1 5l3.5 3.5 6.5-8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${habit.done ? "line-through text-muted" : "text-foreground"}`}>
                      {habit.name}
                    </span>
                    <span className="text-[10px] bg-gray-100 text-muted px-1.5 py-0.5 rounded-full flex-shrink-0">
                      {habit.category}
                    </span>
                  </div>

                  {/* Mini week bar */}
                  <div className="flex gap-1 mt-2">
                    {DAYS.map((day, i) => (
                      <div key={day + i} className="flex flex-col items-center gap-0.5">
                        <div className={`w-4 h-4 rounded-sm ${habit.weekDone[i] ? "bg-primary-500" : "bg-gray-100"}`} />
                        <span className="text-[8px] text-muted">{day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Streak */}
                <div className="flex-shrink-0 flex flex-col items-center">
                  <div className={`flex items-center gap-1 ${habit.streak >= 7 ? "text-accent" : "text-muted"}`}>
                    <Flame size={14} className={habit.streak >= 7 ? "text-accent" : "text-gray-400"} />
                    <span className="mono text-sm font-bold">{habit.streak}</span>
                  </div>
                  {habit.streak >= 7 && (
                    <Shield size={12} className="text-accent mt-0.5" aria-label="Streak Shield active" />
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Add habit modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-card rounded-2xl p-6 w-full max-w-md"
            >
              <h2 className="text-lg font-bold text-foreground mb-5">Add new habit</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Habit name</label>
                  <input
                    type="text"
                    placeholder="e.g. Tahajjud, Charity"
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-500"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setNewHabitCategory(cat)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${newHabitCategory === cat ? "bg-primary-500 text-white border-primary-500" : "border-border text-muted hover:border-primary-500"}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setShowAddModal(false)} className="flex-1">Cancel</Button>
                <Button onClick={addHabit} className="flex-1" disabled={!newHabitName.trim()}>Add habit</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
