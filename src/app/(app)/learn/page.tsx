"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, X, Check, Zap, Lock,
  Moon, Scale, Languages, Scroll, Heart, Hand, Building2,
  Flame, Play, Star,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

// --- Types ---
interface Topic {
  id: string;
  name: string;
  lessons: number;
  completed: number;
}

interface Unit {
  id: number;
  label: string;
  name: string;
  description: string;
  topics: Topic[];
  unlocked: boolean;
}

// --- Constants ---
const TOPIC_ICONS: Record<string, React.ElementType> = {
  quran: BookOpen,
  duas: Hand,
  seerah: Moon,
  fiqh: Scale,
  arabic: Languages,
  prophets: Building2,
  history: Scroll,
  manners: Heart,
};

const UNITS: Unit[] = [
  {
    id: 1,
    label: "Unit 1",
    name: "Daily Essentials",
    description: "Master the foundations of daily Islamic practice",
    topics: [
      { id: "quran", name: "Quran", lessons: 12, completed: 0 },
      { id: "duas", name: "Duas", lessons: 20, completed: 0 },
      { id: "manners", name: "Manners", lessons: 8, completed: 0 },
    ],
    unlocked: true,
  },
  {
    id: 2,
    label: "Unit 2",
    name: "Islamic History",
    description: "Learn from the lives of the Prophets and Companions",
    topics: [
      { id: "seerah", name: "Seerah", lessons: 15, completed: 0 },
      { id: "prophets", name: "Prophets", lessons: 10, completed: 0 },
      { id: "history", name: "History", lessons: 14, completed: 0 },
    ],
    unlocked: false,
  },
  {
    id: 3,
    label: "Unit 3",
    name: "Knowledge and Law",
    description: "Dive into Fiqh and the Arabic language",
    topics: [
      { id: "fiqh", name: "Fiqh", lessons: 18, completed: 0 },
      { id: "arabic", name: "Arabic", lessons: 24, completed: 0 },
    ],
    unlocked: false,
  },
];

const SAMPLE_QUESTIONS = [
  {
    question: "The Prophet ﷺ said: 'The best of you are those who...' (Bukhari 5027). Complete the hadith.",
    options: [
      "...pray the most Sunnah prayers",
      "...learn the Quran and teach it",
      "...give the most in charity",
      "...fast the most days",
    ],
    correct: 1,
    explanation:
      "Sahih al-Bukhari 5027: 'The best of you are those who learn the Quran and teach it.' This hadith emphasises the immense value of engaging with the Book of Allah ﷻ.",
    xp: 10,
  },
  {
    question: "Which surah is known as the heart of the Quran?",
    options: ["Surah Al-Fatiha", "Surah Al-Baqarah", "Surah Ya-Sin", "Surah Al-Ikhlas"],
    correct: 2,
    explanation:
      "The Prophet ﷺ said: 'Surah Ya-Sin is the heart of the Quran.' (Abu Dawud 2891). It is recommended to recite it for the dying and on Fridays.",
    xp: 10,
  },
];

const glassCard = {
  background: "rgba(255, 255, 255, 0.65)",
  border: "1px solid rgba(255, 255, 255, 0.80)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  boxShadow: "0 4px 24px rgba(15, 23, 42, 0.07)",
} as const;

// SVG progress ring (no colored box — just the ring around the icon circle)
function ProgressRing({ percent, size }: { percent: number; size: number }) {
  const sw = 3.5;
  const r = (size - sw * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - percent / 100);
  return (
    <svg
      width={size}
      height={size}
      className="absolute inset-0"
      style={{ transform: "rotate(-90deg)" }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(226,232,240,0.9)"
        strokeWidth={sw}
      />
      {percent > 0 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={percent === 100 ? "#10b981" : "#3b82f6"}
          strokeWidth={sw}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

function TopicNode({
  topic,
  isCurrent,
  isLocked,
  onStart,
}: {
  topic: Topic;
  isCurrent: boolean;
  isLocked: boolean;
  onStart: (id: string) => void;
}) {
  const Icon = TOPIC_ICONS[topic.id] ?? BookOpen;
  const pct = topic.lessons > 0 ? Math.round((topic.completed / topic.lessons) * 100) : 0;
  const done = pct === 100;

  return (
    <motion.button
      whileHover={!isLocked ? { y: -3 } : {}}
      whileTap={!isLocked ? { scale: 0.95 } : {}}
      onClick={() => !isLocked && onStart(topic.id)}
      disabled={isLocked}
      className="flex flex-col items-center gap-2 min-w-[72px]"
    >
      <div className="relative w-[70px] h-[70px]">
        <ProgressRing percent={pct} size={70} />

        {/* Pulse ring for current topic */}
        {isCurrent && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-blue-400 pointer-events-none"
            animate={{ scale: [1, 1.18, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        {/* Inner circle — white, no color tint */}
        <div
          className="absolute rounded-full flex items-center justify-center"
          style={{
            inset: "6px",
            background: isLocked ? "rgba(241,245,249,0.90)" : "rgba(255,255,255,0.90)",
            boxShadow: isCurrent
              ? "0 4px 16px rgba(59,130,246,0.18)"
              : "0 2px 8px rgba(15,23,42,0.07)",
          }}
        >
          {isLocked ? (
            <Lock size={18} className="text-slate-300" />
          ) : done ? (
            <Check size={20} className="text-emerald-500" />
          ) : (
            <Icon
              size={20}
              className={isCurrent ? "text-blue-500" : "text-slate-500"}
            />
          )}
        </div>
      </div>

      <p
        className={`text-[11px] font-semibold text-center leading-tight ${
          isLocked ? "text-slate-300" : "text-slate-700"
        }`}
      >
        {topic.name}
      </p>
      <p className={`text-[10px] ${isLocked ? "text-slate-200" : "text-slate-400"}`}>
        {topic.completed}/{topic.lessons}
      </p>
    </motion.button>
  );
}

// Quiz screen
function QuizView({
  topicId,
  onClose,
}: {
  topicId: string;
  onClose: () => void;
}) {
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showExp, setShowExp] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [hearts, setHearts] = useState(5);
  const [showXpPop, setShowXpPop] = useState(false);
  const [shake, setShake] = useState(false);
  const [finished, setFinished] = useState(false);

  const q = SAMPLE_QUESTIONS[qIndex];

  if (finished || !q) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm w-full"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <Star size={56} className="text-amber-400 mx-auto mb-5 fill-amber-400" />
          </motion.div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Lesson complete!</h2>
          <p className="text-slate-500 mb-6">
            Masha&apos;Allah! You earned {xpEarned} XP.
          </p>
          <div className="flex gap-3 justify-center mb-6">
            <div
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl"
              style={glassCard}
            >
              <Zap size={15} className="text-blue-500" />
              <span className="font-bold text-slate-800 text-sm">+{xpEarned} XP</span>
            </div>
            <div
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl"
              style={glassCard}
            >
              {Array.from({ length: hearts }).map((_, i) => (
                <Heart key={i} size={13} className="text-red-400 fill-red-400" />
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-colors text-sm"
          >
            Back to lessons
          </button>
        </motion.div>
      </div>
    );
  }

  function handleAnswer(idx: number) {
    if (selected !== null) return;
    setSelected(idx);
    setShowExp(true);
    if (idx === q.correct) {
      setXpEarned((x) => x + q.xp);
      setShowXpPop(true);
      setTimeout(() => setShowXpPop(false), 800);
    } else {
      setHearts((h) => Math.max(0, h - 1));
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  }

  function next() {
    if (qIndex + 1 < SAMPLE_QUESTIONS.length) {
      setQIndex((i) => i + 1);
      setSelected(null);
      setShowExp(false);
    } else {
      setFinished(true);
    }
  }

  const isCorrect = selected === q.correct;

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-5 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X size={20} />
          </button>

          <div className="flex-1 h-2.5 rounded-full overflow-hidden bg-slate-200">
            <motion.div
              className="h-full bg-blue-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(qIndex / SAMPLE_QUESTIONS.length) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-blue-600">
            <Zap size={13} />
            {xpEarned}
          </div>

          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Heart
                key={i}
                size={15}
                className={
                  i < hearts
                    ? "text-red-400 fill-red-400"
                    : "text-slate-200 fill-slate-200"
                }
              />
            ))}
          </div>
        </div>

        <motion.div
          key={qIndex}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.22 }}
        >
          <p className="text-xl font-bold text-slate-900 mb-8 leading-relaxed">
            {q.question}
          </p>

          <div className="space-y-3 mb-6 relative">
            <AnimatePresence>
              {showXpPop && (
                <motion.div
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 0, y: -44 }}
                  transition={{ duration: 0.75 }}
                  className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-full z-10 flex items-center gap-1 pointer-events-none"
                >
                  <Star size={11} className="fill-white" /> +{q.xp} XP
                </motion.div>
              )}
            </AnimatePresence>

            {q.options.map((opt, i) => {
              const showResult = selected !== null;
              const isThisCorrect = i === q.correct;
              const isThisSelected = i === selected;

              let style: React.CSSProperties = {
                background: "rgba(255,255,255,0.65)",
                border: "2px solid rgba(255,255,255,0.80)",
              };
              let textClass = "text-slate-700";

              if (showResult) {
                if (isThisCorrect) {
                  style = {
                    background: "rgba(209,250,229,0.80)",
                    border: "2px solid rgba(110,231,183,0.65)",
                  };
                  textClass = "text-emerald-700";
                } else if (isThisSelected) {
                  style = {
                    background: "rgba(254,226,226,0.80)",
                    border: "2px solid rgba(252,165,165,0.65)",
                  };
                  textClass = "text-red-700";
                } else {
                  style = {
                    background: "rgba(248,250,252,0.55)",
                    border: "2px solid rgba(226,232,240,0.55)",
                  };
                  textClass = "text-slate-400";
                }
              }

              return (
                <motion.button
                  key={i}
                  animate={
                    shake && isThisSelected
                      ? { x: [-5, 5, -5, 5, -3, 3, 0] }
                      : {}
                  }
                  transition={{ duration: 0.4 }}
                  onClick={() => handleAnswer(i)}
                  disabled={showResult}
                  className={`w-full text-left rounded-2xl px-5 py-4 text-sm font-semibold transition-all flex items-center gap-3 ${textClass} ${
                    !showResult ? "hover:scale-[1.01] active:scale-[0.98]" : ""
                  }`}
                  style={style}
                >
                  {!showResult && (
                    <span className="w-6 h-6 rounded-lg border-2 border-slate-200 flex items-center justify-center text-[11px] font-bold text-slate-300 flex-shrink-0">
                      {String.fromCharCode(65 + i)}
                    </span>
                  )}
                  {showResult && isThisCorrect && (
                    <Check size={17} className="text-emerald-500 flex-shrink-0" />
                  )}
                  {showResult && isThisSelected && !isThisCorrect && (
                    <X size={17} className="text-red-400 flex-shrink-0" />
                  )}
                  {opt}
                </motion.button>
              );
            })}
          </div>

          {/* Explanation */}
          {showExp && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-5 mb-6"
              style={{
                background: isCorrect
                  ? "rgba(209,250,229,0.65)"
                  : "rgba(254,226,226,0.65)",
                border: isCorrect
                  ? "1px solid rgba(110,231,183,0.55)"
                  : "1px solid rgba(252,165,165,0.55)",
              }}
            >
              <p
                className={`text-sm font-bold mb-1.5 ${
                  isCorrect ? "text-emerald-700" : "text-red-600"
                }`}
              >
                {isCorrect ? "Correct! Masha’Allah!" : "Not quite — the correct answer is:"}
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">{q.explanation}</p>
            </motion.div>
          )}

          {selected !== null && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={next}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-colors text-sm"
            >
              {qIndex + 1 < SAMPLE_QUESTIONS.length
                ? "Next question"
                : `Finish · +${xpEarned} XP earned`}
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// Main component
export default function LearnPage() {
  const { profile } = useAuth();
  const [activeLesson, setActiveLesson] = useState<string | null>(null);

  const streak = profile?.streak ?? 0;
  const xp = profile?.xp ?? 0;

  if (activeLesson) {
    return <QuizView topicId={activeLesson} onClose={() => setActiveLesson(null)} />;
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-5 py-8">
        {/* Header */}
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-slate-900">Islamic Learning</h1>
          <p className="text-slate-500 text-sm mt-1">
            All content sourced from authenticated texts with references cited.
          </p>
        </div>

        {/* Stats row — plain icons, no boxes */}
        <div className="flex items-center gap-6 mb-8 px-1">
          <div className="flex items-center gap-2">
            <Flame size={18} className="text-amber-400" />
            <span className="text-sm font-bold text-slate-700">{streak}</span>
            <span className="text-xs text-slate-400">day streak</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap size={17} className="text-blue-500" />
            <span className="text-sm font-bold text-slate-700">{xp}</span>
            <span className="text-xs text-slate-400">total XP</span>
          </div>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Heart key={i} size={13} className="text-red-400 fill-red-400" />
            ))}
          </div>
        </div>

        {/* Units */}
        <div className="space-y-5">
          {UNITS.map((unit, unitIdx) => {
            const totalLessons = unit.topics.reduce((s, t) => s + t.lessons, 0);
            const completedLessons = unit.topics.reduce((s, t) => s + t.completed, 0);
            const firstIncomplete = unit.topics.find((t) => t.completed < t.lessons);
            const unitDone = completedLessons === totalLessons;

            return (
              <motion.div
                key={unit.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: unitIdx * 0.1 }}
                className="rounded-3xl overflow-hidden"
                style={
                  unit.unlocked
                    ? glassCard
                    : {
                        ...glassCard,
                        background: "rgba(248,250,252,0.55)",
                        border: "1px solid rgba(226,232,240,0.55)",
                      }
                }
              >
                {/* Unit header */}
                <div className="px-6 pt-6 pb-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg ${
                          unit.unlocked
                            ? "bg-slate-100 text-slate-500"
                            : "bg-slate-100 text-slate-300"
                        }`}
                      >
                        {unit.label}
                      </span>
                      <div>
                        <h3
                          className={`font-bold text-base leading-none ${
                            unit.unlocked ? "text-slate-900" : "text-slate-400"
                          }`}
                        >
                          {unit.name}
                        </h3>
                        <p
                          className={`text-xs mt-0.5 ${
                            unit.unlocked ? "text-slate-500" : "text-slate-300"
                          }`}
                        >
                          {unit.description}
                        </p>
                      </div>
                    </div>
                    {!unit.unlocked ? (
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Lock size={13} />
                        <span className="text-xs font-semibold">Locked</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">
                        {completedLessons}/{totalLessons} lessons
                      </span>
                    )}
                  </div>
                </div>

                {/* Topic path — nodes connected by dashed line */}
                <div className="px-6 pb-4">
                  <div className="flex items-center gap-1 overflow-x-auto pb-1">
                    {unit.topics.map((topic, topicIdx) => {
                      const isCurrent =
                        unit.unlocked && topic.id === firstIncomplete?.id;
                      const isLocked = !unit.unlocked;
                      return (
                        <div
                          key={topic.id}
                          className="flex items-center gap-1 flex-shrink-0"
                        >
                          <TopicNode
                            topic={topic}
                            isCurrent={isCurrent}
                            isLocked={isLocked}
                            onStart={setActiveLesson}
                          />
                          {topicIdx < unit.topics.length - 1 && (
                            <div className="w-8 h-0 border-t-2 border-dashed border-slate-200 mb-8 flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* CTA */}
                {unit.unlocked && !unitDone && firstIncomplete && (
                  <div className="px-6 pb-6">
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setActiveLesson(firstIncomplete.id)}
                      className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <Play size={15} fill="white" />
                      {completedLessons === 0 ? "Start" : "Continue"} ·{" "}
                      {firstIncomplete.name}
                    </motion.button>
                  </div>
                )}
                {unit.unlocked && unitDone && (
                  <div className="px-6 pb-6">
                    <div className="w-full py-3 rounded-2xl text-sm font-bold text-emerald-700 text-center flex items-center justify-center gap-2 border border-emerald-100"
                      style={{ background: "rgba(209,250,229,0.50)" }}>
                      <Check size={15} /> Unit complete! Masha&apos;Allah
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Scholar note */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 rounded-2xl p-5 flex items-start gap-4"
          style={glassCard}
        >
          <BookOpen size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-slate-800 text-sm mb-0.5">
              Scholar-verified content
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every lesson cites its source — Quran surah and verse or hadith
              collection and number. Content reviewed by qualified Sunni scholars.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
