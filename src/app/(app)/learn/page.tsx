"use client";

import { useState, useRef, useEffect } from "react";
import type { ElementType, CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, X, Check, Zap, Lock,
  Moon, Scale, Languages, Scroll, Heart, Hand, Building2,
  Flame, Star, ChevronLeft, Play, BookMarked,
  Award, Download, Crown, Sun, Sparkles, Shield, FileText, Smile, RotateCcw,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getQuestionsForLesson, UNIT_EXAM_QUESTIONS, type Question } from "./questions";
import { TOPIC_LESSONS } from "./lessonContent";
import {
  calcLevel, calcStreakUpdate, buyStreakFreeze, repairStreak,
  GEMS_PER_LESSON, GEMS_PER_EXAM, FREEZE_COST, REPAIR_COST, MAX_FREEZES, REPAIR_WINDOW_DAYS,
} from "@/lib/xpAndStreak";
import toast from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────
interface FlatLesson {
  topicId: string;
  topicName: string;
  lessonIndex: number;
  title: string;
  globalLevel: number;
}
type LessonStatus = "done" | "available" | "locked";
interface Unit {
  id: number;
  label: string;
  name: string;
  description: string;
  topics: Array<{ id: string; name: string; lessons: number }>;
  unlocked: boolean;
}
interface WrongAnswer {
  question: string;
  yourAnswer: string;
  correctAnswer: string;
}
type LearnView =
  | { kind: "home" }
  | { kind: "lesson-intro"; topicId: string; lessonIndex: number; isPractice?: boolean }
  | { kind: "quiz"; topicId: string; lessonIndex: number; questions: Question[]; isPractice?: boolean }
  | { kind: "recap"; topicId: string; lessonIndex: number; xpEarned: number; heartsLeft: number; isPractice?: boolean; wrongAnswers?: WrongAnswer[] }
  | { kind: "exam"; unitId: number }
  | { kind: "exam-results"; unitId: number; score: number; total: number; xpEarned: number };

// ─── Static config ────────────────────────────────────────────────────────────
const TOPIC_ICONS: Record<string, ElementType> = {
  quran: BookOpen,
  duas: Hand,
  manners: Heart,
  seerah: Moon,
  prophets: Building2,
  history: Scroll,
  arabic: Languages,
  arabic2: Languages,
  fiqh: Scale,
  fiqh2: Scale,
  salah: Sun,
  dhikr_ramadan: Sparkles,
  aqeedah: Shield,
  hadith: FileText,
  character: Smile,
  tafseer: BookMarked,
  ethics: Award,
  spirituality: Star,
  finance_hajj: Crown,
  review: RotateCcw,
};

const UNIT_CONFIG = [
  { id: 1,  label: "Unit 1",  name: "The Noble Quran",           description: "Discover the book of Allah ﷻ — its structure, recitation, memorisation, and how to build a lifelong relationship with the Quran.",   topics: [{ id: "quran",        name: "Quran",           lessons: 20 }] },
  { id: 2,  label: "Unit 2",  name: "Daily Duas & Adhkar",        description: "Master the essential supplications and remembrances the Prophet ﷺ taught for every moment of your day.",                                     topics: [{ id: "duas",         name: "Duas & Adhkar",   lessons: 20 }] },
  { id: 3,  label: "Unit 3",  name: "Islamic Manners",            description: "Develop the beautiful character traits that the Prophet ﷺ embodied — honesty, generosity, patience, and respect.",                             topics: [{ id: "manners",      name: "Manners",         lessons: 20 }] },
  { id: 4,  label: "Unit 4",  name: "The Prophet's Life ﷺ",      description: "Journey through the Seerah of Muhammad ﷺ — from birth to farewell sermon — and bring his example to life.",                                   topics: [{ id: "seerah",       name: "Seerah",          lessons: 20 }] },
  { id: 5,  label: "Unit 5",  name: "Stories of the Prophets",   description: "Learn from Adam (AS) to Isa (AS) and beyond — the trials, the triumphs, and the timeless lessons of every prophet.",                           topics: [{ id: "prophets",     name: "Prophets",        lessons: 20 }] },
  { id: 6,  label: "Unit 6",  name: "Islamic History",           description: "From the rightly-guided caliphs to the Golden Age to the modern Ummah — understand where we came from.",                                        topics: [{ id: "history",      name: "History",         lessons: 20 }] },
  { id: 7,  label: "Unit 7",  name: "Arabic Language I",         description: "Begin your Arabic journey with the alphabet, short vowels, essential vocabulary, and the language of Salah.",                                    topics: [{ id: "arabic",       name: "Arabic I",        lessons: 20 }] },
  { id: 8,  label: "Unit 8",  name: "Arabic Language II",        description: "Go deeper with Arabic verbs, plurals, Quranic vocabulary, and begin reading unvocalised text.",                                                  topics: [{ id: "arabic2",      name: "Arabic II",       lessons: 20 }] },
  { id: 9,  label: "Unit 9",  name: "Islamic Law I",             description: "Master the foundational fiqh of the five pillars, halal and haram, purification, and family law.",                                              topics: [{ id: "fiqh",         name: "Fiqh I",          lessons: 20 }] },
  { id: 10, label: "Unit 10", name: "Islamic Law II",            description: "Explore usul al-fiqh, the maqasid al-shariah, Islamic finance, inheritance, and contemporary fiqh issues.",                                      topics: [{ id: "fiqh2",        name: "Fiqh II",         lessons: 20 }] },
  { id: 11, label: "Unit 11", name: "The Prayer (Salah)",        description: "From conditions and pillars to khushu' and Tahajjud — become completely grounded in the five daily prayers.",                                    topics: [{ id: "salah",        name: "Salah",           lessons: 20 }] },
  { id: 12, label: "Unit 12", name: "Dhikr & Ramadan",          description: "Build a life of constant remembrance and master the rulings, spirit, and practices of fasting and Ramadan.",                                     topics: [{ id: "dhikr_ramadan",name: "Dhikr & Ramadan", lessons: 20 }] },
  { id: 13, label: "Unit 13", name: "Islamic Creed",             description: "Ground yourself in the six pillars of iman, tawheed, shirk, the unseen world, and the Day of Judgement.",                                       topics: [{ id: "aqeedah",      name: "Aqeedah",         lessons: 20 }] },
  { id: 14, label: "Unit 14", name: "Hadith Sciences",           description: "Learn to understand, cite, and apply authentic hadith — from the isnad system to the 40 Hadith of Imam al-Nawawi.",                             topics: [{ id: "hadith",       name: "Hadith",          lessons: 20 }] },
  { id: 15, label: "Unit 15", name: "Islamic Character",         description: "Cultivate the inner virtues — sidq, sabr, shukr, tawakkul, ikhlas — that make you a true servant of Allah ﷻ.",                                 topics: [{ id: "character",    name: "Character",       lessons: 20 }] },
  { id: 16, label: "Unit 16", name: "Quranic Tafseer",           description: "Explore the meaning of the Quran verse by verse — from Surah Al-Fatiha to Juz Amma — with classical scholarship.",                             topics: [{ id: "tafseer",      name: "Tafseer",         lessons: 20 }] },
  { id: 17, label: "Unit 17", name: "Islamic Ethics & Society",  description: "Apply Islamic ethical principles to the family, community, environment, media, and your role as a citizen.",                                     topics: [{ id: "ethics",       name: "Ethics",          lessons: 20 }] },
  { id: 18, label: "Unit 18", name: "Spiritual Development",     description: "Embark on the inner journey — tazkiyah al-nafs, muraqabah, the diseases of the heart, and the path to a sound heart.",                          topics: [{ id: "spirituality", name: "Spirituality",    lessons: 20 }] },
  { id: 19, label: "Unit 19", name: "Zakat, Hajj & Finance",    description: "Master the worship of giving — zakat, sadaqah, halal finance — and the pillar of Hajj and Umrah.",                                              topics: [{ id: "finance_hajj", name: "Zakat & Hajj",    lessons: 20 }] },
  { id: 20, label: "Unit 20", name: "Comprehensive Review",      description: "Bring all 19 journeys together with revision quizzes, comprehensive tests, and a final reflection on living Islam.",                             topics: [{ id: "review",       name: "Review",          lessons: 20 }] },
];

const glassCard = {
  background: "rgba(255, 255, 255, 0.65)",
  border: "1px solid rgba(255, 255, 255, 0.80)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  boxShadow: "0 4px 24px rgba(15, 23, 42, 0.07)",
} as const;

// ─── Hearts constants ─────────────────────────────────────────────────────────
const HEARTS_MAX = 5;
const HEARTS_RECHARGE_MS = 5 * 60 * 60 * 1000; // 1 heart per 5 hours
const HEARTS_REFILL_COST = 50; // gems to fully refill hearts
const LESSON_PASS_THRESHOLD = 0.6; // 60% correct required to pass

function computeCurrentHearts(storedHearts: number, rechargeAt?: string): number {
  if (storedHearts >= HEARTS_MAX) return HEARTS_MAX;
  if (!rechargeAt) return Math.max(0, storedHearts);
  const now = Date.now();
  const rechargeTime = new Date(rechargeAt).getTime();
  if (now < rechargeTime) return Math.max(0, storedHearts);
  const recharged = Math.min(HEARTS_MAX - storedHearts, Math.floor((now - rechargeTime) / HEARTS_RECHARGE_MS) + 1);
  return storedHearts + recharged;
}

function getNextHeartCountdown(storedHearts: number, rechargeAt?: string): string | null {
  if (storedHearts >= HEARTS_MAX || !rechargeAt) return null;
  const diff = new Date(rechargeAt).getTime() - Date.now();
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ─── Helper functions ─────────────────────────────────────────────────────────
function flatLessonsForUnit(unitId: number): FlatLesson[] {
  const unit = UNIT_CONFIG.find((u) => u.id === unitId)!;
  const topic = unit.topics[0];
  const tLessons = TOPIC_LESSONS[topic.id] ?? [];
  return Array.from({ length: topic.lessons }, (_, i): FlatLesson => ({
    topicId: topic.id,
    topicName: topic.name,
    lessonIndex: i,
    title: tLessons[i]?.title ?? `Lesson ${i + 1}`,
    globalLevel: (unitId - 1) * 20 + i + 1,
  }));
}

function getLessonStatus(
  lesson: FlatLesson,
  flatLessons: FlatLesson[],
  flatIdx: number,
  learnProgress: Record<string, number>,
  unitLocked = false
): LessonStatus {
  if (unitLocked) return "locked";
  const progress = learnProgress[lesson.topicId] ?? 0;
  if (lesson.lessonIndex < progress) return "done";
  if (lesson.lessonIndex !== progress) return "locked";
  // Every lesson before this one in the flat sequence must be done
  const prevAllDone = flatLessons
    .slice(0, flatIdx)
    .every((l) => (learnProgress[l.topicId] ?? 0) > l.lessonIndex);
  return prevAllDone ? "available" : "locked";
}

function buildUnits(learnProgress: Record<string, number>): Unit[] {
  const allDone = (id: number) =>
    UNIT_CONFIG.find((u) => u.id === id)!.topics.every(
      (t) => (learnProgress[t.id] ?? 0) >= t.lessons
    );
  return UNIT_CONFIG.map((cfg, i) => ({
    ...cfg,
    topics: cfg.topics.map((t) => ({ ...t })),
    unlocked: i === 0 || allDone(UNIT_CONFIG[i - 1].id),
  }));
}

function findNextLesson(topicId: string, lessonIndex: number) {
  for (const unit of UNIT_CONFIG) {
    if (!unit.topics.some((t) => t.id === topicId)) continue;
    const flat = flatLessonsForUnit(unit.id);
    const idx = flat.findIndex((l) => l.topicId === topicId && l.lessonIndex === lessonIndex);
    if (idx !== -1 && idx + 1 < flat.length)
      return { topicId: flat[idx + 1].topicId, lessonIndex: flat[idx + 1].lessonIndex };
    return null;
  }
  return null;
}

function downloadContent(topicId: string, lessonIndex: number) {
  const lesson = TOPIC_LESSONS[topicId]?.[lessonIndex];
  const qs = getQuestionsForLesson(topicId, lessonIndex);
  const topicName =
    UNIT_CONFIG.flatMap((u) => u.topics).find((t) => t.id === topicId)?.name ?? topicId;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${lesson?.title ?? "Lesson"} — Jannatie</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;color:#1e293b;max-width:680px;margin:0 auto;padding:40px 20px}
.header{border-bottom:3px solid #3b82f6;padding-bottom:16px;margin-bottom:24px}
.badge{font-size:11px;font-weight:700;color:#3b82f6;text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px}
h1{font-size:24px;margin-bottom:8px}
.obj{color:#64748b;font-style:italic;font-size:14px;line-height:1.6}
.card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin:14px 0}
.num{font-size:11px;color:#94a3b8;font-weight:700;text-transform:uppercase;margin-bottom:6px}
.q{font-weight:700;font-size:15px;margin-bottom:10px;line-height:1.5}
.ans{background:#dcfce7;border:1px solid #86efac;border-radius:6px;padding:8px 12px;font-weight:600;color:#15803d;font-size:14px;margin-bottom:8px}
.exp{font-size:13px;color:#475569;line-height:1.65}
.footer{margin-top:40px;text-align:center;color:#94a3b8;font-size:12px;border-top:1px solid #e2e8f0;padding-top:16px}
</style>
</head>
<body>
<div class="header">
<div class="badge">${topicName} — Lesson ${lessonIndex + 1}</div>
<h1>${lesson?.title ?? "Lesson"}</h1>
<p class="obj">${lesson?.objective ?? ""}</p>
</div>
${qs
  .map(
    (q, i) =>
      `<div class="card"><div class="num">Key Point ${i + 1}</div><div class="q">${q.question}</div><div class="ans">&#10003; ${q.options[q.correct]}</div><div class="exp">${q.explanation}</div></div>`
  )
  .join("")}
<div class="footer">Jannatie Islamic Learning · jannatie.com<br><small>May Allah bless your learning journey. Ameen.</small></div>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 400);
  }
}

// ─── Content Modal — scrollable narrative ─────────────────────────────────────
function ContentModal({
  topicId,
  lessonIndex,
  isPremium,
  onClose,
}: {
  topicId: string;
  lessonIndex: number;
  isPremium: boolean;
  onClose: () => void;
}) {
  const lesson = TOPIC_LESSONS[topicId]?.[lessonIndex];
  const questions = getQuestionsForLesson(topicId, lessonIndex);
  const topicName =
    UNIT_CONFIG.flatMap((u) => u.topics).find((t) => t.id === topicId)?.name ?? topicId;
  const Icon = TOPIC_ICONS[topicId] ?? BookOpen;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        className="w-full max-w-lg rounded-3xl overflow-hidden flex flex-col"
        style={{ background: "#ffffff", border: "1px solid rgba(226,232,240,0.80)", boxShadow: "0 24px 64px rgba(15,23,42,0.18)", maxHeight: "92vh" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 pt-5 pb-4 flex-shrink-0"
          style={{ borderBottom: "1px solid #f1f5f9" }}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(219,234,254,0.70)", border: "1px solid rgba(147,197,253,0.45)" }}>
              <Icon size={17} className="text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                {topicName} · Lesson {lessonIndex + 1}
              </p>
              <h2 className="text-sm font-bold text-slate-900 leading-tight truncate">{lesson?.title}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            <button
              onClick={() => (isPremium ? downloadContent(topicId, lessonIndex) : undefined)}
              title={isPremium ? "Download as PDF" : "Premium only"}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                isPremium
                  ? "border-amber-200 text-amber-600 hover:bg-amber-50"
                  : "border-slate-200 text-slate-300 cursor-not-allowed"
              }`}
            >
              {isPremium ? <Download size={12} /> : <Crown size={12} />} PDF
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable lesson content */}
        <div className="flex-1 overflow-y-auto">
          {/* Intro section */}
          <div className="px-6 pt-5 pb-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
            <p className="text-sm text-slate-600 leading-relaxed">{lesson?.objective}</p>
          </div>

          {/* Narrative key points */}
          <div className="px-6 py-5 space-y-6">
            {questions.map((q, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                {/* Point number + question as heading */}
                <div className="flex items-start gap-3 mb-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-[11px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{q.question}</h3>
                </div>

                {/* Answer highlight */}
                <div
                  className="ml-9 rounded-xl px-4 py-2.5 mb-3 flex items-center gap-2"
                  style={{ background: "rgba(219,234,254,0.55)", border: "1px solid rgba(147,197,253,0.40)" }}
                >
                  <Check size={13} className="text-blue-500 flex-shrink-0" />
                  <p className="text-sm font-semibold text-blue-800">{q.options[q.correct]}</p>
                </div>

                {/* Story / explanation */}
                <p className="ml-9 text-sm text-slate-600 leading-relaxed">{q.explanation}</p>

                {/* Divider except last */}
                {i < questions.length - 1 && (
                  <div className="ml-9 mt-6 h-px bg-slate-100" />
                )}
              </motion.div>
            ))}

            {/* Closing note */}
            <div
              className="rounded-xl px-4 py-3 text-center"
              style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
            >
              <p className="text-xs text-slate-400 italic">
                Jannatie Islamic Learning · All content sourced from authenticated texts with references cited.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 flex-shrink-0"
          style={{ borderTop: "1px solid #f1f5f9" }}
        >
          <button
            onClick={onClose}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-sm transition-colors"
          >
            Got it — close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── HOME VIEW — Duolingo lesson path ─────────────────────────────────────────
function HomeView({
  units,
  learnProgress,
  xp,
  streak,
  gems,
  hearts,
  heartsRechargeAt,
  isPremium,
  streakFreezes,
  streakBrokenAt,
  isChild = false,
  setView,
  onShowContent,
  onBuyFreeze,
  onRepairStreak,
  onRefillHearts,
}: {
  units: Unit[];
  learnProgress: Record<string, number>;
  xp: number;
  streak: number;
  gems: number;
  hearts: number;
  heartsRechargeAt?: string;
  isPremium: boolean;
  streakFreezes: number;
  streakBrokenAt?: string;
  isChild?: boolean;
  setView: (v: LearnView) => void;
  onShowContent: (topicId: string, lessonIndex: number) => void;
  onBuyFreeze: () => void;
  onRepairStreak: () => void;
  onRefillHearts: () => void;
}) {
  const unitLabel = (s: string) => isChild ? s.replace(/Unit/g, "Journey") : s;
  const [expanded, setExpanded] = useState<Record<number, boolean>>(
    () => Object.fromEntries(UNIT_CONFIG.map((u, i) => [u.id, i === 0]))
  );
  const toggle = (id: number) => setExpanded((p) => ({ ...p, [id]: !p[id] }));
  const [desktopActiveUnit, setDesktopActiveUnit] = useState(1);
  const lessonScrollRef = useRef<HTMLDivElement>(null);
  const [showShop, setShowShop] = useState(false);

  const canRepair = !!streakBrokenAt && (() => {
    const broken = new Date(streakBrokenAt + "T00:00:00");
    const diff = (Date.now() - broken.getTime()) / 86400000;
    return diff <= REPAIR_WINDOW_DAYS;
  })();

  useEffect(() => {
    const el = lessonScrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      // Let purely horizontal trackpad gestures pass through naturally
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [desktopActiveUnit]);

  return (
    <div className="min-h-screen">
      <div className="px-5 py-6 md:px-8 max-w-sm md:max-w-full mx-auto">
        {/* Stats header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Islamic Learning</h1>
            <p className="text-xs text-slate-400 mt-0.5">Bismillah — let us begin</p>
          </div>
          {/* Stats pill */}
          <div className="flex items-center bg-white border border-slate-100 shadow-sm rounded-full overflow-hidden">
            {/* Hearts */}
            {isPremium ? (
              <div className="flex items-center gap-1 px-3 py-1.5" title="Premium — unlimited hearts">
                <Heart size={13} className="text-red-400 fill-red-400" />
                <Crown size={10} className="text-amber-400" />
              </div>
            ) : (
              <button onClick={() => setShowShop(true)} className="flex items-center gap-1 px-3 py-1.5 hover:bg-slate-50 transition-colors" title="Hearts — tap to refill">
                <Heart size={13} className={hearts > 0 ? "text-red-400 fill-red-400" : "text-slate-300 fill-slate-300"} />
                <span className={`text-xs font-semibold ${hearts === 0 ? "text-red-500" : "text-slate-600"}`}>{hearts}/{HEARTS_MAX}</span>
              </button>
            )}
            <div className="w-px h-4 bg-slate-100 flex-shrink-0" />
            {/* Streak */}
            <button onClick={() => setShowShop(true)} className="flex items-center gap-1 px-3 py-1.5 hover:bg-slate-50 transition-colors" title="Streak — tap to open shop">
              <Flame size={13} className={streak > 0 ? "text-amber-400" : "text-slate-300"} />
              <span className="text-xs font-semibold text-slate-600">{streak}</span>
              {streakFreezes > 0 && <span className="text-[9px] font-bold text-blue-400 ml-0.5">❄{streakFreezes}</span>}
            </button>
            <div className="w-px h-4 bg-slate-100 flex-shrink-0" />
            {/* Gems */}
            <button onClick={() => setShowShop(true)} className="flex items-center gap-1 px-3 py-1.5 hover:bg-slate-50 transition-colors" title="Gems — tap to open shop">
              <span className="text-[13px] leading-none">💎</span>
              <span className="text-xs font-semibold text-slate-600">{gems}</span>
            </button>
            <div className="w-px h-4 bg-slate-100 flex-shrink-0" />
            {/* XP */}
            <div className="flex items-center gap-1 px-3 py-1.5">
              <Zap size={13} className="text-blue-500 fill-blue-400" />
              <span className="text-xs font-semibold text-slate-600">{xp}</span>
            </div>
          </div>
        </div>

        {/* Streak shop modal */}
        {showShop && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowShop(false)}>
            <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900">Streak Shop</h2>
                <button onClick={() => setShowShop(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-4 py-2.5 mb-5">
                <span className="text-base">💎</span>
                <span className="text-sm font-semibold text-slate-700">{gems} gems</span>
                <span className="text-xs text-slate-400 ml-1">· Earn 5 per lesson, 20 per exam</span>
              </div>

              {/* Streak Freeze */}
              <div className="rounded-2xl border border-slate-100 p-4 mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">❄️</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Streak Freeze</p>
                      <p className="text-xs text-slate-400">Auto-protects 1 missed day · max {MAX_FREEZES}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { onBuyFreeze(); setShowShop(false); }}
                    disabled={streakFreezes >= MAX_FREEZES || gems < FREEZE_COST}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl px-3 py-1.5 transition-colors"
                  >
                    <span>💎 {FREEZE_COST}</span>
                  </button>
                </div>
                {streakFreezes > 0 && (
                  <p className="text-xs text-blue-600 font-medium mt-2">You have {streakFreezes} freeze{streakFreezes > 1 ? "s" : ""} stored</p>
                )}
              </div>

              {/* Streak Repair */}
              <div className={`rounded-2xl border p-4 mb-3 ${canRepair ? "border-amber-200 bg-amber-50" : "border-slate-100 opacity-50"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔧</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Streak Repair</p>
                      <p className="text-xs text-slate-400">Restore a broken streak · 2-day window</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { onRepairStreak(); setShowShop(false); }}
                    disabled={!canRepair || gems < REPAIR_COST}
                    className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-xs font-bold rounded-xl px-3 py-1.5 transition-colors"
                  >
                    <span>💎 {REPAIR_COST}</span>
                  </button>
                </div>
                {!canRepair && <p className="text-xs text-slate-400 mt-2">Only available within {REPAIR_WINDOW_DAYS} days of losing your streak</p>}
              </div>

              {/* Hearts Refill */}
              <div className={`rounded-2xl border p-4 ${hearts < HEARTS_MAX ? "border-red-200 bg-red-50" : "border-slate-100 opacity-50"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">❤️</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Hearts Refill</p>
                      <p className="text-xs text-slate-400">
                        {hearts < HEARTS_MAX
                          ? (() => { const cd = getNextHeartCountdown(hearts, heartsRechargeAt); return `${hearts}/${HEARTS_MAX} · ${cd ? `next in ${cd}` : "recharging"}`; })()
                          : "Hearts are full"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { onRefillHearts(); setShowShop(false); }}
                    disabled={hearts >= HEARTS_MAX || gems < HEARTS_REFILL_COST}
                    className="flex items-center gap-1 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white text-xs font-bold rounded-xl px-3 py-1.5 transition-colors"
                  >
                    <span>💎 {HEARTS_REFILL_COST}</span>
                  </button>
                </div>
                {hearts < HEARTS_MAX && (
                  <p className="text-xs text-blue-600 font-medium mt-2">Tip: complete a practice lesson to earn +1 heart free</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* DESKTOP: left unit circles + right lesson grid */}
        <div className="hidden md:flex gap-6" style={{ height: "calc(100vh - 168px)" }}>

          {/* Left: unit selector circles with hover tooltips */}
          <div className="flex flex-col gap-4 items-center w-14 flex-shrink-0 pt-1">
            {units.map((unit, unitIdx) => (
              <div key={unit.id} className="relative group">
                <button
                  onClick={() => setDesktopActiveUnit(unit.id)}
                  className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                    desktopActiveUnit === unit.id
                      ? "border-blue-600 shadow-xl shadow-blue-200/70"
                      : unit.unlocked
                      ? "bg-white border-blue-200 hover:border-blue-400 hover:shadow-md"
                      : "bg-slate-50 border-slate-200 hover:border-slate-300 hover:shadow-sm"
                  }`}
                  style={
                    desktopActiveUnit === unit.id
                      ? { background: "linear-gradient(135deg, #2563eb 0%, #4338ca 100%)" }
                      : {}
                  }
                >
                  {desktopActiveUnit === unit.id ? (
                    <span className="text-base font-black text-white">{unitIdx + 1}</span>
                  ) : unit.unlocked ? (
                    <span className="text-base font-black text-blue-500">{unitIdx + 1}</span>
                  ) : (
                    <Lock size={14} className="text-slate-300" />
                  )}
                </button>

                {/* Hover tooltip */}
                <div className="absolute left-[68px] top-1/2 -translate-y-1/2 z-50 pointer-events-none">
                  <div className="flex items-center opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-200 ease-out">
                    {/* Caret pointing left */}
                    <div style={{ width: 0, height: 0, borderTop: "7px solid transparent", borderBottom: "7px solid transparent", borderRight: "8px solid white", filter: "drop-shadow(-1px 0 1px rgba(15,23,42,0.06))" }} />
                    {/* Card */}
                    <div className="bg-white rounded-2xl px-4 py-3 whitespace-nowrap" style={{ border: "1px solid rgba(226,232,240,0.9)", boxShadow: "0 8px 28px rgba(15,23,42,0.10), 0 2px 8px rgba(15,23,42,0.05)" }}>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-blue-500 leading-none mb-1">{unitLabel(unit.label)}</p>
                      <p className="text-[13px] font-bold text-slate-900 leading-tight">{unit.name}</p>
                      {!unit.unlocked && (
                        <p className="text-[9px] text-slate-400 mt-1.5 flex items-center gap-1">
                          <Lock size={8} className="text-slate-300" /> Complete previous unit first
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right: lesson panel for the selected unit */}
          {(() => {
            const activeUnit = units.find((u) => u.id === desktopActiveUnit);
            if (!activeUnit) return null;
            const flatLessons = flatLessonsForUnit(activeUnit.id);
            const totalDone = flatLessons.filter((l) => (learnProgress[l.topicId] ?? 0) > l.lessonIndex).length;
            const totalLessons = flatLessons.length;
            const unitAllDone = totalDone === totalLessons;

            return (
              <div className="flex-1 min-w-0 flex flex-col min-h-0">
                {/* Unit header */}
                <div className="flex items-center justify-between mb-3 flex-shrink-0">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-0.5">{unitLabel(activeUnit.label)}</p>
                    <h2 className="text-lg font-bold text-slate-900 leading-tight">{activeUnit.name}</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-base font-black text-slate-900">
                      {totalDone}<span className="text-sm font-medium text-slate-400">/{totalLessons}</span>
                    </p>
                    <div className="w-24 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-700"
                        style={{ width: `${totalLessons > 0 ? (totalDone / totalLessons) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Lesson grid — 4 rows, columns flow right, scroll horizontally */}
                <div ref={lessonScrollRef} className="flex-1 min-h-0 overflow-x-auto scrollbar-hide overflow-y-hidden">
                  <div
                    style={{
                      display: "grid",
                      gridAutoFlow: "column",
                      gridTemplateRows: "repeat(4, 1fr)",
                      gridAutoColumns: "176px",
                      gap: "10px",
                      height: "100%",
                      minWidth: "max-content",
                    }}
                  >
                    {flatLessons.map((lesson, lessonIdx) => {
                      const status = getLessonStatus(lesson, flatLessons, lessonIdx, learnProgress, !activeUnit.unlocked);
                      const Icon = TOPIC_ICONS[lesson.topicId] ?? BookOpen;
                      const isDone = status === "done";
                      const isAvail = status === "available";

                      return (
                        <div key={`${lesson.topicId}-${lesson.lessonIndex}`} className="relative group/card">
                          {isAvail && (
                            <motion.div
                              className="absolute inset-0 rounded-2xl pointer-events-none z-10"
                              style={{ border: "2px solid rgba(59,130,246,0.40)" }}
                              animate={{ scale: [1, 1.05, 1], opacity: [0.8, 0, 0.8] }}
                              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                            />
                          )}
                          <button
                            onClick={() => {
                              if (status === "locked") return;
                              if (status === "available" && hearts === 0 && !isPremium) {
                                toast.error("No hearts left! Wait for recharge or refill in the shop.");
                                return;
                              }
                              setView({ kind: "lesson-intro", topicId: lesson.topicId, lessonIndex: lesson.lessonIndex, isPractice: isDone });
                            }}
                            disabled={status === "locked"}
                            className={`relative w-full h-full flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 p-2 text-center transition-all group/tile ${
                              isDone
                                ? "bg-emerald-50 border-emerald-200"
                                : isAvail && hearts === 0 && !isPremium
                                ? "bg-red-50 border-red-200 opacity-70"
                                : isAvail
                                ? "bg-white border-blue-400 shadow-md shadow-blue-100/60"
                                : "bg-white/60 border-slate-200/70 cursor-not-allowed"
                            }`}
                          >
                            {/* Practice hover overlay for done tiles */}
                            {isDone && (
                              <div className="absolute inset-0 rounded-2xl bg-emerald-500/0 group-hover/tile:bg-emerald-500/8 flex items-center justify-center opacity-0 group-hover/tile:opacity-100 transition-all duration-200 pointer-events-none z-10">
                                <div className="flex items-center gap-1 bg-white rounded-full px-2 py-1 shadow-sm border border-emerald-200">
                                  <RotateCcw size={9} className="text-emerald-600" />
                                  <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide">Practice</span>
                                </div>
                              </div>
                            )}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isDone ? "bg-emerald-100" : isAvail ? "bg-blue-100" : "bg-slate-100"}`}>
                              {isDone ? (
                                <Check size={17} className="text-emerald-500" />
                              ) : status === "locked" ? (
                                <Lock size={13} className="text-slate-300" />
                              ) : (
                                <Icon size={17} className="text-blue-500" />
                              )}
                            </div>
                            <div className="w-full">
                              <p className={`text-[8px] font-bold uppercase tracking-widest mb-0.5 truncate ${isDone ? "text-emerald-500" : isAvail ? "text-blue-500" : "text-slate-300"}`}>
                                Lvl {lesson.globalLevel}
                              </p>
                              <p className={`text-[11px] font-semibold leading-tight line-clamp-2 ${status === "locked" ? "text-slate-300" : "text-slate-700"}`}>
                                {lesson.title}
                              </p>
                            </div>
                          </button>

                          {status !== "locked" && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onShowContent(lesson.topicId, lesson.lessonIndex); }}
                              title="View lesson content"
                              className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity shadow-sm z-20"
                            >
                              <BookMarked size={8} className="text-slate-400" />
                            </button>
                          )}
                        </div>
                      );
                    })}

                    {/* Unit exam card */}
                    {unitAllDone && (
                      <div className="relative">
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setView({ kind: "exam", unitId: activeUnit.id })}
                          className="w-full h-full flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-amber-300 bg-amber-50 hover:bg-amber-100 transition-all p-2 text-center cursor-pointer"
                        >
                          <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                            <Award size={15} className="text-amber-500" />
                          </div>
                          <div>
                            <p className="text-[7px] font-bold uppercase tracking-widest text-amber-500 mb-0.5">{unitLabel("Unit Exam")}</p>
                            <p className="text-[9px] font-semibold text-amber-700 leading-tight">Take the challenge!</p>
                          </div>
                        </motion.button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* MOBILE: vertical stack */}
        <div className="md:hidden">
        {/* Unit sections */}
        {units.map((unit, unitIdx) => {
          const flatLessons = flatLessonsForUnit(unit.id);
          const totalDone = flatLessons.filter(
            (l) => (learnProgress[l.topicId] ?? 0) > l.lessonIndex
          ).length;
          const totalLessons = flatLessons.length;
          const unitAllDone = totalDone === totalLessons;
          const isExpanded = expanded[unit.id] ?? false;

          return (
            <div key={unit.id} className="mb-4">
              {/* Unit banner — clickable to collapse/expand */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: unitIdx * 0.08 }}
                className={`rounded-2xl px-4 py-3.5 cursor-pointer select-none ${isExpanded ? "mb-4" : "mb-0"}`}
                style={
                  unit.unlocked
                    ? {
                        background: "linear-gradient(135deg, rgba(37,99,235,0.88) 0%, rgba(67,56,202,0.88) 100%)",
                        border: "1px solid rgba(255,255,255,0.22)",
                        boxShadow: "0 6px 24px rgba(37,99,235,0.18)",
                      }
                    : {
                        background: "rgba(148,163,184,0.20)",
                        border: "1px solid rgba(226,232,240,0.60)",
                      }
                }
                onClick={() => unit.unlocked && toggle(unit.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${unit.unlocked ? "text-white/65" : "text-slate-400"}`}>
                      {unitLabel(unit.label)}
                    </p>
                    <h2 className={`text-sm font-bold leading-tight ${unit.unlocked ? "text-white" : "text-slate-400"}`}>
                      {unit.name}
                    </h2>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {unit.unlocked ? (
                      <div className="text-right">
                        <p className="text-base font-black text-white leading-none">{totalDone}/{totalLessons}</p>
                        <p className="text-[9px] text-white/55 mt-0.5">lessons</p>
                      </div>
                    ) : (
                      <Lock size={18} className="text-slate-300" />
                    )}
                    {unit.unlocked && (
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.22 }}
                        className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ background: "rgba(255,255,255,0.18)" }}
                      >
                        <ChevronLeft size={14} className="text-white rotate-[-90deg]" />
                      </motion.div>
                    )}
                  </div>
                </div>
                {unit.unlocked && totalLessons > 0 && (
                  <div className="mt-2.5 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.18)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${(totalDone / totalLessons) * 100}%`, background: "rgba(255,255,255,0.75)" }}
                    />
                  </div>
                )}
              </motion.div>

              {/* Collapsible content */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: "easeInOut" }}
                    style={{ overflow: "hidden" }}
                  >
                    {/* Locked unit message */}
                    {!unit.unlocked && (
                      <div className="flex flex-col items-center py-8 text-center">
                        <Lock size={22} className="text-slate-300 mb-2" />
                        <p className="text-sm font-semibold text-slate-400">
                          Complete {UNIT_CONFIG[unitIdx - 1]?.name} to unlock
                        </p>
                        <p className="text-xs text-slate-300 mt-1">{totalLessons} lessons waiting</p>
                      </div>
                    )}

                    {/* ── Horizontal lesson scroll track ── */}
                    {unit.unlocked && (
                      <div className="relative -mx-5">
                        {/* Fade edges */}
                        <div className="absolute left-0 top-0 bottom-0 w-5 z-10 pointer-events-none" style={{ background: "linear-gradient(to right, rgba(255,255,255,0.9), transparent)" }} />
                        <div className="absolute right-0 top-0 bottom-0 w-5 z-10 pointer-events-none" style={{ background: "linear-gradient(to left, rgba(255,255,255,0.9), transparent)" }} />

                        <div className="overflow-x-auto scrollbar-hide px-5 py-3">
                          <div className="flex items-center" style={{ width: "max-content" }}>
                            {flatLessons.map((lesson, i) => {
                              const status = getLessonStatus(lesson, flatLessons, i, learnProgress, !unit.unlocked);
                              const prevDone = i > 0 && getLessonStatus(flatLessons[i - 1], flatLessons, i - 1, learnProgress, !unit.unlocked) === "done";
                              const Icon = TOPIC_ICONS[lesson.topicId] ?? BookOpen;
                              const isDone = status === "done";
                              const isAvail = status === "available";

                              return (
                                <div key={`${lesson.topicId}-${lesson.lessonIndex}`} className="flex items-center">
                                  {/* Connector line */}
                                  {i > 0 && (
                                    <div className="w-4 h-0.5 flex-shrink-0 rounded-full" style={{ background: prevDone ? "#6ee7b7" : "#e2e8f0" }} />
                                  )}

                                  {/* Card */}
                                  <div className="relative">
                                    {isAvail && (
                                      <motion.div
                                        className="absolute inset-0 rounded-2xl pointer-events-none"
                                        style={{ border: "2px solid rgba(59,130,246,0.40)" }}
                                        animate={{ scale: [1, 1.07, 1], opacity: [0.9, 0, 0.9] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                      />
                                    )}

                                    <motion.button
                                      initial={{ opacity: 0, scale: 0.85 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ delay: Math.min(i * 0.015, 0.25) }}
                                      whileHover={status !== "locked" ? { y: -3, scale: 1.05 } : {}}
                                      whileTap={status !== "locked" ? { scale: 0.94 } : {}}
                                      onClick={() => {
                                        if (status === "locked") return;
                                        if (status === "available" && hearts === 0 && !isPremium) {
                                          toast.error("No hearts left! Wait for recharge or refill in the shop.");
                                          return;
                                        }
                                        setView({ kind: "lesson-intro", topicId: lesson.topicId, lessonIndex: lesson.lessonIndex, isPractice: isDone });
                                      }}
                                      disabled={status === "locked"}
                                      className={`relative z-10 w-[84px] flex flex-col items-center pt-3 pb-2.5 px-2 rounded-2xl border-2 transition-all ${
                                        isDone
                                          ? "bg-emerald-50 border-emerald-300 shadow-sm"
                                          : isAvail && hearts === 0 && !isPremium
                                          ? "bg-red-50 border-red-200 opacity-70"
                                          : isAvail
                                          ? "bg-white border-blue-400 shadow-lg shadow-blue-100/60"
                                          : "bg-white/60 border-slate-200/70 cursor-not-allowed"
                                      }`}
                                    >
                                      <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-1.5 ${isDone ? "bg-emerald-100" : isAvail ? "bg-blue-100" : "bg-slate-100"}`}>
                                        {isDone ? (
                                          <Check size={16} className="text-emerald-500" />
                                        ) : status === "locked" ? (
                                          <Lock size={12} className="text-slate-300" />
                                        ) : (
                                          <Icon size={16} className="text-blue-500" />
                                        )}
                                      </div>
                                      <p className={`text-[7px] font-bold uppercase tracking-widest mb-0.5 w-full text-center truncate ${isDone ? "text-emerald-500" : isAvail ? "text-blue-500" : "text-slate-300"}`}>
                                        Lvl {lesson.globalLevel}
                                      </p>
                                      <p className={`text-[9px] font-semibold text-center leading-tight line-clamp-2 ${status === "locked" ? "text-slate-300" : "text-slate-600"}`}>
                                        {lesson.title}
                                      </p>
                                    </motion.button>

                                    {/* Book badge */}
                                    {status !== "locked" && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); onShowContent(lesson.topicId, lesson.lessonIndex); }}
                                        title="View lesson content"
                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm hover:bg-blue-50 hover:border-blue-300 transition-colors z-20"
                                      >
                                        <BookMarked size={8} className="text-slate-400" />
                                      </button>
                                    )}
                                    {/* Practice badge on done tiles */}
                                    {isDone && (
                                      <div
                                        title="Tap to practice"
                                        className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 border border-white flex items-center justify-center shadow-sm z-20"
                                      >
                                        <RotateCcw size={9} className="text-white" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}

                            {/* Unit exam card */}
                            {unitAllDone && (
                              <>
                                <div className="w-4 h-0.5 flex-shrink-0 rounded-full" style={{ background: "#6ee7b7" }} />
                                <motion.button
                                  initial={{ opacity: 0, scale: 0.85 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  whileHover={{ y: -3, scale: 1.05 }}
                                  whileTap={{ scale: 0.94 }}
                                  onClick={() => setView({ kind: "exam", unitId: unit.id })}
                                  className="w-[84px] flex flex-col items-center pt-3 pb-2.5 px-2 rounded-2xl border-2 border-amber-300 bg-amber-50 shadow-sm hover:bg-amber-100 transition-all cursor-pointer"
                                >
                                  <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center mb-1.5">
                                    <Award size={16} className="text-amber-500" />
                                  </div>
                                  <p className="text-[7px] font-bold uppercase tracking-widest text-amber-500 mb-0.5">{unitLabel("Unit Exam")}</p>
                                  <p className="text-[9px] font-semibold text-center text-amber-700 leading-tight">Take the challenge!</p>
                                </motion.button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
        </div>{/* end md:hidden */}
      </div>
    </div>
  );
}

// ─── LESSON INTRO VIEW ────────────────────────────────────────────────────────
function LessonIntroView({
  topicId,
  lessonIndex,
  isPractice = false,
  hearts,
  isPremium,
  onShowContent,
  setView,
}: {
  topicId: string;
  lessonIndex: number;
  isPractice?: boolean;
  hearts: number;
  isPremium: boolean;
  onShowContent: (topicId: string, lessonIndex: number) => void;
  setView: (v: LearnView) => void;
}) {
  const lesson = TOPIC_LESSONS[topicId]?.[lessonIndex];
  const questions = getQuestionsForLesson(topicId, lessonIndex);
  const Icon = TOPIC_ICONS[topicId] ?? BookOpen;
  const topicCfg = UNIT_CONFIG.flatMap((u) => u.topics).find((t) => t.id === topicId);

  return (
    <div className="min-h-screen">
      <div className="max-w-xl mx-auto px-5 py-8">
        <button
          onClick={() => setView({ kind: "home" })}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700 transition-colors mb-8 text-sm font-medium"
        >
          <ChevronLeft size={16} /> Back to lessons
        </button>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{
                background: "rgba(219,234,254,0.70)",
                border: "1px solid rgba(147,197,253,0.50)",
              }}
            >
              <Icon size={20} className="text-blue-500" />
            </div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-widest">
              {topicCfg?.name} · Lesson {lessonIndex + 1} of {topicCfg?.lessons}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-3 leading-tight">{lesson?.title}</h1>
          {isPractice && (
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full mb-3">
              <Check size={11} /> Practice Mode — no hearts cost · complete to earn +1 heart
            </div>
          )}
          <p className="text-slate-500 text-sm leading-relaxed mb-8">{lesson?.objective}</p>

          <div className="rounded-2xl p-5 mb-6" style={glassCard}>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
              What you will learn
            </p>
            <div className="space-y-3">
              {questions.slice(0, 3).map((q, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[9px] font-bold text-blue-600">{i + 1}</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-snug">
                    {q.question.replace(/\(.*?\)/g, "").trim()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-5 mb-8 px-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <BookOpen size={13} /> {questions.length} questions
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Zap size={13} className="text-blue-400" /> +{questions.reduce((s, q) => s + q.xp, 0)} XP
            </div>
            {isPractice ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                <Heart size={13} className="text-emerald-500" /> No heart cost
              </div>
            ) : isPremium ? (
              <div className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold">
                <Heart size={13} className="text-red-400 fill-red-400" /> Unlimited hearts
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Heart size={13} className="text-red-400" /> {hearts}/{HEARTS_MAX} hearts
              </div>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => onShowContent(topicId, lessonIndex)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-blue-200 text-blue-600 font-bold text-sm hover:bg-blue-50 transition-colors"
            >
              <BookMarked size={16} /> Study material first
            </button>
            <button
              onClick={() => setView({ kind: "quiz", topicId, lessonIndex, questions, isPractice })}
              className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-sm transition-colors"
            >
              <Play size={15} className="fill-white" /> {isPractice ? "Start practice" : "Start lesson"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── QUIZ VIEW ────────────────────────────────────────────────────────────────
function QuizView({
  topicId,
  lessonIndex,
  questions,
  initialHearts,
  isPractice = false,
  isPremium = false,
  onClose,
  onComplete,
  onFailed,
  onHeartsEmpty,
}: {
  topicId: string;
  lessonIndex: number;
  questions: Question[];
  initialHearts: number;
  isPractice?: boolean;
  isPremium?: boolean;
  onClose: () => void;
  onComplete: (xpEarned: number, heartsLeft: number, wrongAnswers: WrongAnswer[]) => void;
  onFailed: (heartsLeft: number) => void;
  onHeartsEmpty: (heartsLeft: number) => void;
}) {
  // Shuffle answer options once on mount so the correct answer isn't predictable
  const [shuffledQuestions] = useState(() =>
    questions.map((q) => {
      const perm = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
      return {
        ...q,
        options: perm.map((i) => q.options[i]),
        correct: perm.indexOf(q.correct),
        optionsArabic: q.optionsArabic?.length ? perm.map((i) => q.optionsArabic![i]) : undefined,
        optionsPhonetic: q.optionsPhonetic?.length ? perm.map((i) => q.optionsPhonetic![i]) : undefined,
        optionsMeaning: q.optionsMeaning?.length ? perm.map((i) => q.optionsMeaning![i]) : undefined,
      };
    })
  );

  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showExp, setShowExp] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [hearts, setHearts] = useState(isPractice ? HEARTS_MAX : initialHearts);
  const [showXpPop, setShowXpPop] = useState(false);
  const [shake, setShake] = useState(false);
  const [showPhonetics, setShowPhonetics] = useState(false);
  const [heartsEmpty, setHeartsEmpty] = useState(false);
  const [failedLesson, setFailedLesson] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const hasStarted = qIndex > 0 || selected !== null;

  // Warn on browser navigation (back button, refresh, closing tab) while mid-lesson
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const lesson = TOPIC_LESSONS[topicId]?.[lessonIndex];
  const topicCfg = UNIT_CONFIG.flatMap((u) => u.topics).find((t) => t.id === topicId);
  const q = shuffledQuestions[qIndex];

  // Hearts-empty screen — force quit mid-lesson
  if (heartsEmpty) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <div className="max-w-sm w-full text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: "spring", stiffness: 220 }}>
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
              <div className="flex gap-0.5">
                {Array.from({ length: HEARTS_MAX }).map((_, i) => (
                  <Heart key={i} size={14} className="text-slate-200 fill-slate-200" />
                ))}
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Hearts Empty!</h2>
            <p className="text-slate-400 text-sm mb-2 leading-relaxed">
              You have run out of hearts. Come back later to refill them, or do a practice session on a completed lesson.
            </p>
            <p className="text-xs text-slate-300 mb-8">Hearts refill 1 per 5 hours, or spend 💎 {HEARTS_REFILL_COST} gems to refill now.</p>
            <button
              onClick={() => onHeartsEmpty(0)}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-sm transition-colors"
            >
              Back to lessons
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Failed mastery screen — shown after all questions if score < 60%
  if (failedLesson) {
    const pct = Math.round((correctCount / shuffledQuestions.length) * 100);
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <div className="max-w-sm w-full text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: "spring", stiffness: 220 }}>
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
              <X size={36} className="text-red-400" />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Keep Studying!</h2>
            <p className="text-slate-400 text-sm mb-3 leading-relaxed">
              You need at least 60% correct to master this lesson. Study the material and try again.
            </p>
            <p className="text-lg font-bold text-slate-700 mb-8">
              Your score: {correctCount}/{shuffledQuestions.length} ({pct}%)
            </p>
            <div className="space-y-2.5">
              <button
                onClick={() => onFailed(hearts)}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-sm transition-colors"
              >
                Try again
              </button>
              <button
                onClick={onClose}
                className="w-full py-3.5 border border-slate-200 text-slate-600 font-bold rounded-2xl text-sm hover:bg-slate-50 transition-colors"
              >
                Back to lessons
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!q) return null;

  function handleAnswer(idx: number) {
    if (selected !== null) return;
    setSelected(idx);
    setShowExp(true);
    if (idx === q.correct) {
      setCorrectCount((c) => c + 1);
      setXpEarned((x) => x + q.xp);
      setShowXpPop(true);
      setTimeout(() => setShowXpPop(false), 850);
    } else {
      setWrongAnswers((prev) => [...prev, {
        question: q.question,
        yourAnswer: q.options[idx],
        correctAnswer: q.options[q.correct],
      }]);
      if (!isPractice && !isPremium) {
        const newHearts = Math.max(0, hearts - 1);
        setHearts(newHearts);
        if (newHearts === 0) setHeartsEmpty(true);
      }
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  }

  function next() {
    if (qIndex + 1 < shuffledQuestions.length) {
      setQIndex((i) => i + 1);
      setSelected(null);
      setShowExp(false);
    } else {
      const passed = isPractice || correctCount >= Math.ceil(shuffledQuestions.length * LESSON_PASS_THRESHOLD);
      if (passed) {
        onComplete(xpEarned, hearts, wrongAnswers);
      } else {
        setFailedLesson(true);
      }
    }
  }

  const isCorrect = selected === q.correct;

  return (
    <div className="min-h-screen">
      {/* Exit warning modal */}
      {showExitWarning && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-xs p-6 shadow-2xl text-center"
          >
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <X size={24} className="text-amber-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Leave lesson?</h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Any progress in this lesson will be lost, including any hearts you have used.
            </p>
            <div className="space-y-2.5">
              <button
                onClick={() => { setShowExitWarning(false); onClose(); }}
                className="w-full py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors"
              >
                Yes, leave lesson
              </button>
              <button
                onClick={() => setShowExitWarning(false)}
                className="w-full py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
              >
                Continue lesson
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-5 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => hasStarted ? setShowExitWarning(true) : onClose()}
            className="text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex-1">
            <div className="h-2.5 rounded-full overflow-hidden bg-slate-200">
              <motion.div
                className="h-full bg-blue-500 rounded-full"
                animate={{ width: `${((qIndex + 1) / shuffledQuestions.length) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-blue-600">
            <Zap size={13} /> {xpEarned}
          </div>
          <button
            onClick={() => setShowPhonetics((p) => !p)}
            title={showPhonetics ? "Hide pronunciation guide" : "Show pronunciation guide"}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
              showPhonetics
                ? "bg-slate-800 text-white border-slate-800"
                : "bg-white text-slate-400 border-slate-200 hover:border-slate-400 hover:text-slate-600"
            }`}
          >
            Phonetics
          </button>
          {isPractice ? (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">Practice</span>
          ) : isPremium ? (
            <div className="flex items-center gap-1">
              <Heart size={14} className="text-red-400 fill-red-400" />
              <Crown size={11} className="text-amber-400" />
            </div>
          ) : (
            <div className="flex gap-0.5">
              {Array.from({ length: HEARTS_MAX }).map((_, i) => (
                <Heart
                  key={i}
                  size={15}
                  className={i < hearts ? "text-red-400 fill-red-400" : "text-slate-200 fill-slate-200"}
                />
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-slate-400 mb-6 pl-8">
          {topicCfg?.name} · {lesson?.title} · Q{qIndex + 1} of {shuffledQuestions.length}
        </p>

        <motion.div
          key={qIndex}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.22 }}
        >
          <div className="mb-8">
            <p className="text-xl font-bold text-slate-900 leading-relaxed">{q.question}</p>
            {q.arabic && selected !== null && (
              <div className="mt-3 rounded-xl p-4" style={{ background: "rgba(240,245,255,0.80)", border: "1px solid rgba(147,197,253,0.50)" }}>
                <p className="text-4xl text-right text-slate-800 leading-loose" dir="rtl" style={{ fontFamily: "'Noto Naskh Arabic', 'Traditional Arabic', 'Arial Unicode MS', serif" }}>
                  {q.arabic}
                </p>
                {showPhonetics && q.phonetic && (
                  <p className="text-xs text-slate-500 italic text-center mt-2 leading-relaxed border-t border-blue-100 pt-2">
                    {q.phonetic}
                  </p>
                )}
              </div>
            )}
          </div>

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

              let style: CSSProperties = {
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
                  animate={shake && isThisSelected ? { x: [-5, 5, -5, 5, -3, 3, 0] } : {}}
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
                  <span className="flex-1">
                    {opt}
                    {q.optionsArabic?.[i] && (
                      <span className="block text-right mt-1 leading-relaxed opacity-80" dir="rtl" style={{ fontFamily: "'Noto Naskh Arabic', 'Traditional Arabic', 'Arial Unicode MS', serif", fontSize: "1.3rem" }}>
                        {q.optionsArabic[i]}
                      </span>
                    )}
                    {showPhonetics && q.optionsPhonetic?.[i] && (
                      <span className="block text-xs italic text-slate-400 mt-0.5 text-right">
                        {q.optionsPhonetic[i]}
                      </span>
                    )}
                    {q.optionsMeaning?.[i] && (
                      <span className="block text-xs text-slate-500 mt-0.5 text-left">
                        — {q.optionsMeaning[i]}
                      </span>
                    )}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {showExp && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-5 mb-6"
              style={
                isCorrect
                  ? {
                      background: "rgba(209,250,229,0.65)",
                      border: "1px solid rgba(110,231,183,0.55)",
                    }
                  : {
                      background: "rgba(254,226,226,0.65)",
                      border: "1px solid rgba(252,165,165,0.55)",
                    }
              }
            >
              <p
                className={`text-sm font-bold mb-1.5 ${
                  isCorrect ? "text-emerald-700" : "text-red-600"
                }`}
              >
                {isCorrect ? "Correct! Masha'Allah!" : "Not quite — here is the explanation:"}
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
              {qIndex + 1 < shuffledQuestions.length ? "Next question →" : "See results →"}
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// ─── RECAP VIEW ───────────────────────────────────────────────────────────────
function RecapView({
  topicId,
  lessonIndex,
  xpEarned,
  heartsLeft,
  isPractice = false,
  isPremium = false,
  wrongAnswers = [],
  setView,
}: {
  topicId: string;
  lessonIndex: number;
  xpEarned: number;
  heartsLeft: number;
  isPractice?: boolean;
  isPremium?: boolean;
  wrongAnswers?: WrongAnswer[];
  setView: (v: LearnView) => void;
}) {
  const lesson = TOPIC_LESSONS[topicId]?.[lessonIndex];
  const questions = getQuestionsForLesson(topicId, lessonIndex);
  const next = findNextLesson(topicId, lessonIndex);
  const isPerfect = wrongAnswers.length === 0;
  // Premium users must achieve full marks before proceeding to next lesson
  const canProceedToNext = !isPremium || isPractice || isPerfect;

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10">
      <div className="max-w-sm w-full text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 220 }}
        >
          <Star size={60} className={`mx-auto mb-5 ${isPractice ? "text-emerald-400 fill-emerald-400" : isPerfect ? "text-amber-400 fill-amber-400" : "text-blue-400 fill-blue-400"}`} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            {isPractice ? "Practice Complete!" : isPerfect ? "Perfect Score! 🎉" : "Lesson Complete!"}
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            Masha&apos;Allah — {lesson?.title}
          </p>

          <div className="flex gap-3 justify-center mb-6">
            <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl" style={glassCard}>
              <Zap size={15} className="text-blue-500" />
              <span className="font-bold text-slate-800 text-sm">+{xpEarned} XP</span>
            </div>
            <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl" style={glassCard}>
              {isPractice ? (
                <span className="text-sm font-semibold text-emerald-600">+1 ❤️ earned</span>
              ) : (
                Array.from({ length: HEARTS_MAX }).map((_, i) => (
                  <Heart
                    key={i}
                    size={13}
                    className={i < heartsLeft ? "text-red-400 fill-red-400" : "text-slate-200 fill-slate-200"}
                  />
                ))
              )}
            </div>
          </div>

          {/* Premium: wrong answer review */}
          {isPremium && !isPractice && wrongAnswers.length > 0 && (
            <div className="rounded-2xl p-5 mb-5 text-left" style={{ background: "rgba(254,226,226,0.50)", border: "1px solid rgba(252,165,165,0.55)" }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-red-500 uppercase tracking-widest">
                  Review — {wrongAnswers.length} incorrect
                </p>
                <span className="text-[10px] font-bold text-red-400 bg-red-100 px-2 py-0.5 rounded-full">
                  {questions.length - wrongAnswers.length}/{questions.length} correct
                </span>
              </div>
              <div className="space-y-4">
                {wrongAnswers.map((wa, i) => (
                  <div key={i} className="text-sm">
                    <p className="font-semibold text-slate-700 mb-1 leading-snug">{wa.question}</p>
                    <div className="flex items-start gap-1.5 mb-0.5">
                      <X size={12} className="text-red-400 flex-shrink-0 mt-0.5" />
                      <span className="text-red-600 text-xs leading-snug">Your answer: {wa.yourAnswer}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Check size={12} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-emerald-700 text-xs leading-snug">Correct: {wa.correctAnswer}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Premium: full marks required notice */}
          {isPremium && !isPractice && !isPerfect && (
            <div className="rounded-2xl p-4 mb-5 text-center" style={{ background: "rgba(239,246,255,0.80)", border: "1px solid rgba(147,197,253,0.60)" }}>
              <Crown size={14} className="text-amber-400 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-blue-700 mb-0.5">Premium — Full marks required</p>
              <p className="text-xs text-slate-500 leading-snug">Study the material and retake this lesson to get 100% before moving on.</p>
            </div>
          )}

          {/* Premium: perfect score badge */}
          {isPremium && !isPractice && isPerfect && (
            <div className="rounded-2xl p-4 mb-5 text-center" style={{ background: "rgba(209,250,229,0.60)", border: "1px solid rgba(110,231,183,0.55)" }}>
              <Crown size={14} className="text-amber-400 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-emerald-700">Perfect score — you may proceed!</p>
            </div>
          )}

          {/* Key takeaways — show when premium has wrongs (replacing next lesson btn) */}
          {(!isPremium || isPractice || isPerfect) && (
            <div className="rounded-2xl p-5 mb-6 text-left" style={glassCard}>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                Key takeaways
              </p>
              <div className="space-y-3">
                {questions.slice(0, 3).map((q, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <Check size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-600 leading-snug">{q.options[q.correct]}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2.5">
            {!isPractice && next && canProceedToNext && (
              <button
                onClick={() =>
                  setView({
                    kind: "lesson-intro",
                    topicId: next.topicId,
                    lessonIndex: next.lessonIndex,
                  })
                }
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-sm transition-colors"
              >
                Next lesson →
              </button>
            )}
            {!isPractice && next && !canProceedToNext && (
              <button
                onClick={() => setView({ kind: "lesson-intro", topicId, lessonIndex })}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-sm transition-colors"
              >
                Retake lesson
              </button>
            )}
            <button
              onClick={() => setView({ kind: "home" })}
              className={`w-full py-3.5 font-bold rounded-2xl text-sm transition-colors border ${
                (!isPractice && next)
                  ? "border-slate-200 text-slate-600 hover:bg-slate-50"
                  : "bg-blue-600 hover:bg-blue-500 text-white border-transparent"
              }`}
            >
              Back to lessons
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── EXAM VIEW ────────────────────────────────────────────────────────────────
function ExamView({
  unitId,
  onClose,
  onComplete,
}: {
  unitId: number;
  onClose: () => void;
  onComplete: (score: number, total: number, xpEarned: number) => void;
}) {
  const questions = UNIT_EXAM_QUESTIONS[unitId] ?? [];
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showExp, setShowExp] = useState(false);
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [showXpPop, setShowXpPop] = useState(false);
  const [shake, setShake] = useState(false);
  const [showPhonetics, setShowPhonetics] = useState(false);

  const unitCfg = UNIT_CONFIG.find((u) => u.id === unitId)!;
  const q = questions[qIndex];
  if (!q) return null;

  function handleAnswer(idx: number) {
    if (selected !== null) return;
    setSelected(idx);
    setShowExp(true);
    if (idx === q.correct) {
      setScore((s) => s + 1);
      setXpEarned((x) => x + 15);
      setShowXpPop(true);
      setTimeout(() => setShowXpPop(false), 850);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  }

  function next() {
    const finalScore = score + (selected === q.correct ? 1 : 0);
    const finalXp = xpEarned + (selected === q.correct ? 15 : 0);
    if (qIndex + 1 < questions.length) {
      setQIndex((i) => i + 1);
      setSelected(null);
      setShowExp(false);
    } else {
      onComplete(finalScore, questions.length, finalXp);
    }
  }

  const isCorrect = selected === q.correct;

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-5 py-6">
        <div className="flex items-center gap-4 mb-2">
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X size={20} />
          </button>
          <div className="flex-1 h-2.5 rounded-full overflow-hidden bg-slate-200">
            <motion.div
              className="h-full bg-amber-400 rounded-full"
              animate={{ width: `${((qIndex + 1) / questions.length) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
            <Award size={13} /> {score}/{qIndex}
          </div>
          <button
            onClick={() => setShowPhonetics((p) => !p)}
            title={showPhonetics ? "Hide pronunciation guide" : "Show pronunciation guide"}
            className={`text-xs font-semibold px-2 py-1 rounded-lg border transition-all ${
              showPhonetics
                ? "bg-amber-500 text-white border-amber-500"
                : "bg-white/70 text-slate-500 border-slate-200 hover:border-amber-400 hover:text-amber-600"
            }`}
          >
            <span className="inline-flex items-center gap-1">
              <Languages size={12} /> Phonetics
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 mb-6 pl-8">
          <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2.5 py-1 rounded-full">
            Unit {unitId} Exam
          </span>
          <span className="text-xs text-slate-400">
            {unitCfg.name} · Q{qIndex + 1} of {questions.length}
          </span>
        </div>

        <motion.div key={qIndex} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.22 }}>
          <div className="mb-8">
            <p className="text-xl font-bold text-slate-900 leading-relaxed">{q.question}</p>
            {q.arabic && selected !== null && (
              <div className="mt-3 rounded-xl p-4" style={{ background: "rgba(240,245,255,0.80)", border: "1px solid rgba(147,197,253,0.50)" }}>
                <p className="text-4xl text-right text-slate-800 leading-loose" dir="rtl" style={{ fontFamily: "'Noto Naskh Arabic', 'Traditional Arabic', 'Arial Unicode MS', serif" }}>
                  {q.arabic}
                </p>
                {showPhonetics && q.phonetic && (
                  <p className="text-xs text-slate-500 italic text-center mt-2 leading-relaxed border-t border-blue-100 pt-2">
                    {q.phonetic}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3 mb-6 relative">
            <AnimatePresence>
              {showXpPop && (
                <motion.div
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 0, y: -44 }}
                  transition={{ duration: 0.75 }}
                  className="absolute -top-6 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-sm font-bold px-3 py-1 rounded-full z-10 flex items-center gap-1 pointer-events-none"
                >
                  <Star size={11} className="fill-white" /> +15 XP
                </motion.div>
              )}
            </AnimatePresence>

            {q.options.map((opt, i) => {
              const showResult = selected !== null;
              const isThisCorrect = i === q.correct;
              const isThisSelected = i === selected;

              let style: CSSProperties = {
                background: "rgba(255,255,255,0.65)",
                border: "2px solid rgba(255,255,255,0.80)",
              };
              let textClass = "text-slate-700";
              if (showResult) {
                if (isThisCorrect) {
                  style = { background: "rgba(209,250,229,0.80)", border: "2px solid rgba(110,231,183,0.65)" };
                  textClass = "text-emerald-700";
                } else if (isThisSelected) {
                  style = { background: "rgba(254,226,226,0.80)", border: "2px solid rgba(252,165,165,0.65)" };
                  textClass = "text-red-700";
                } else {
                  style = { background: "rgba(248,250,252,0.55)", border: "2px solid rgba(226,232,240,0.55)" };
                  textClass = "text-slate-400";
                }
              }

              return (
                <motion.button
                  key={i}
                  animate={shake && isThisSelected ? { x: [-5, 5, -5, 5, 0] } : {}}
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
                  {showResult && isThisCorrect && <Check size={17} className="text-emerald-500 flex-shrink-0" />}
                  {showResult && isThisSelected && !isThisCorrect && <X size={17} className="text-red-400 flex-shrink-0" />}
                  <span className="flex-1">
                    {opt}
                    {q.optionsArabic?.[i] && (
                      <span className="block text-right mt-1 leading-relaxed opacity-80" dir="rtl" style={{ fontFamily: "'Noto Naskh Arabic', 'Traditional Arabic', 'Arial Unicode MS', serif", fontSize: "1.3rem" }}>
                        {q.optionsArabic[i]}
                      </span>
                    )}
                    {showPhonetics && q.optionsPhonetic?.[i] && (
                      <span className="block text-xs italic text-slate-400 mt-0.5 text-right">
                        {q.optionsPhonetic[i]}
                      </span>
                    )}
                    {q.optionsMeaning?.[i] && (
                      <span className="block text-xs text-slate-500 mt-0.5 text-left">
                        — {q.optionsMeaning[i]}
                      </span>
                    )}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {showExp && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-5 mb-6"
              style={
                isCorrect
                  ? { background: "rgba(209,250,229,0.65)", border: "1px solid rgba(110,231,183,0.55)" }
                  : { background: "rgba(254,226,226,0.65)", border: "1px solid rgba(252,165,165,0.55)" }
              }
            >
              <p className={`text-sm font-bold mb-1.5 ${isCorrect ? "text-emerald-700" : "text-red-600"}`}>
                {isCorrect ? "Correct! Masha'Allah!" : "Not quite — here is the explanation:"}
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">{q.explanation}</p>
            </motion.div>
          )}

          {selected !== null && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={next}
              className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-2xl transition-colors text-sm"
            >
              {qIndex + 1 < questions.length ? "Next question →" : "See results →"}
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// ─── EXAM RESULTS VIEW ────────────────────────────────────────────────────────
function ExamResultsView({
  unitId,
  score,
  total,
  xpEarned,
  isChild = false,
  setView,
}: {
  unitId: number;
  score: number;
  total: number;
  xpEarned: number;
  isChild?: boolean;
  setView: (v: LearnView) => void;
}) {
  const pct = Math.round((score / total) * 100);
  const passed = pct >= 70;
  const unitCfg = UNIT_CONFIG.find((u) => u.id === unitId)!;

  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="max-w-sm w-full text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 220 }}
        >
          <Award
            size={60}
            className={`mx-auto mb-5 ${passed ? "text-amber-400 fill-amber-400" : "text-slate-300 fill-slate-300"}`}
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            {passed ? "Exam Passed! Masha'Allah!" : "Keep Studying!"}
          </h2>
          <p className="text-slate-400 text-sm mb-6">{unitCfg.name} {isChild ? "Journey Exam" : "Unit Exam"}</p>

          <div className="w-28 h-28 mx-auto mb-6 relative">
            <svg viewBox="0 0 100 100" className="w-full h-full" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(226,232,240,0.9)" strokeWidth="10" />
              <circle
                cx="50" cy="50" r="40" fill="none"
                stroke={passed ? "#f59e0b" : "#94a3b8"}
                strokeWidth="10"
                strokeDasharray={2 * Math.PI * 40}
                strokeDashoffset={2 * Math.PI * 40 * (1 - pct / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-900">{pct}%</span>
              <span className="text-[10px] text-slate-400">{score}/{total}</span>
            </div>
          </div>

          <div className="flex gap-3 justify-center mb-7">
            <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl" style={glassCard}>
              <Zap size={15} className="text-blue-500" />
              <span className="font-bold text-slate-800 text-sm">+{xpEarned} XP</span>
            </div>
            <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl" style={glassCard}>
              <span className="text-sm font-semibold text-slate-600">{score} correct</span>
            </div>
          </div>

          <button
            onClick={() => setView({ kind: "home" })}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-sm transition-colors"
          >
            Back to lessons
          </button>
        </motion.div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function LearnPage() {
  const { profile, user } = useAuth();
  const isChild = profile?.accountType === "child";
  const [view, setView] = useState<LearnView>({ kind: "home" });
  const [saving, setSaving] = useState(false);
  const [contentModal, setContentModal] = useState<{
    topicId: string;
    lessonIndex: number;
  } | null>(null);

  const learnProgress: Record<string, number> =
    (profile as unknown as { learnProgress?: Record<string, number> })?.learnProgress ?? {};
  const isPremium = (profile as unknown as { plan?: string })?.plan === "premium";
  const streak = profile?.streak ?? 0;
  const xp = profile?.xp ?? 0;
  const gems = profile?.gems ?? 0;
  const streakFreezes = profile?.streakFreezes ?? 0;
  const streakBrokenAt = profile?.streakBrokenAt;
  const profileHearts: number = (profile as unknown as { hearts?: number })?.hearts ?? HEARTS_MAX;
  const heartsRechargeAt: string | undefined = (profile as unknown as { heartsRechargeAt?: string })?.heartsRechargeAt;
  const currentHearts = computeCurrentHearts(profileHearts, heartsRechargeAt);
  const units = buildUnits(learnProgress);

  function openContent(topicId: string, lessonIndex: number) {
    setContentModal({ topicId, lessonIndex });
  }

  // Save hearts changes to Firestore (called when quiz ends without full lesson save)
  async function handleHeartsUpdate(heartsLeft: number) {
    if (!user?.uid || heartsLeft === currentHearts) return;
    const updates: Record<string, unknown> = { hearts: heartsLeft };
    if (heartsLeft >= HEARTS_MAX) {
      updates.heartsRechargeAt = null;
    } else if (currentHearts >= HEARTS_MAX) {
      updates.heartsRechargeAt = new Date(Date.now() + HEARTS_RECHARGE_MS).toISOString();
    }
    await updateDoc(doc(db, "users", user.uid), updates).catch(() => {});
  }

  async function handleRefillHearts() {
    if (!user?.uid || gems < HEARTS_REFILL_COST) {
      toast.error("Not enough gems!");
      return;
    }
    await updateDoc(doc(db, "users", user.uid), {
      hearts: HEARTS_MAX,
      heartsRechargeAt: null,
      gems: gems - HEARTS_REFILL_COST,
    });
    toast.success("❤️ Hearts fully refilled!");
  }

  async function handleLessonComplete(topicId: string, xpEarned: number, heartsLeft: number, isPractice: boolean) {
    if (!user?.uid || saving) return;
    setSaving(true);
    try {
      const updates: Record<string, unknown> = {};

      // Hearts: save any heart changes; practice earns +1 heart back
      const newHearts = isPractice ? Math.min(HEARTS_MAX, heartsLeft + 1) : heartsLeft;
      updates.hearts = newHearts;
      if (newHearts >= HEARTS_MAX) {
        updates.heartsRechargeAt = null;
      } else if (currentHearts >= HEARTS_MAX && newHearts < HEARTS_MAX) {
        updates.heartsRechargeAt = new Date(Date.now() + HEARTS_RECHARGE_MS).toISOString();
      }

      if (isPractice) {
        // Practice session: no progress update, no gems, just heart refill + XP
        const newXp = (profile?.xp ?? 0) + xpEarned;
        updates.xp = newXp;
        updates.level = calcLevel(newXp);
      } else {
        // Normal lesson: advance progress + full rewards
        const currentProgress = learnProgress[topicId] ?? 0;
        const topicMeta = UNIT_CONFIG.flatMap((u) => u.topics).find((t) => t.id === topicId);
        const max = topicMeta?.lessons ?? 1;
        updates[`learnProgress.${topicId}`] = Math.min(currentProgress + 1, max);

        const newXp = (profile?.xp ?? 0) + xpEarned;
        const newLevel = calcLevel(newXp);
        const newGems = (profile?.gems ?? 0) + GEMS_PER_LESSON;
        updates.xp = newXp;
        updates.level = newLevel;
        updates.gems = newGems;

        const todayStr = new Date().toLocaleDateString("en-CA");
        const streakResult = calcStreakUpdate({
          streak: profile?.streak ?? 0,
          lastActiveDate: profile?.lastActiveDate,
          streakFreezes: profile?.streakFreezes ?? 0,
        });
        updates.streak = streakResult.newStreak;
        updates.lastActiveDate = streakResult.newLastActive;
        updates.streakFreezes = streakResult.newFreezes;

        if (streakResult.streakBroken) {
          updates.streakBrokenAt = profile?.lastActiveDate ?? null;
          updates.streakBeforeBreak = profile?.streak ?? 0;
        }
        if (streakResult.clearBrokenAt) {
          updates.streakBrokenAt = null;
          updates.streakBeforeBreak = null;
        }

        const userHabits = profile?.habits as string[] | undefined;
        if (userHabits?.includes("Learn an Islamic topic daily")) {
          updates[`habitLog.${todayStr}.Learn an Islamic topic daily`] = true;
        }

        if (streakResult.freezeUsed) toast("❄️ Streak freeze used — keep going!");
        else if (streakResult.streakBroken) toast("🔥 Streak reset — start a new one today!");
      }

      await updateDoc(doc(db, "users", user.uid), updates);
    } finally {
      setSaving(false);
    }
  }

  async function handleExamComplete(unitId: number, xpEarned: number) {
    if (!user?.uid || saving) return;
    setSaving(true);
    try {
      const newXp = (profile?.xp ?? 0) + xpEarned;
      const newLevel = calcLevel(newXp);
      const newGems = (profile?.gems ?? 0) + GEMS_PER_EXAM;

      const streakResult = calcStreakUpdate({
        streak: profile?.streak ?? 0,
        lastActiveDate: profile?.lastActiveDate,
        streakFreezes: profile?.streakFreezes ?? 0,
      });

      const updates: Record<string, unknown> = {
        xp: newXp,
        level: newLevel,
        gems: newGems,
        streak: streakResult.newStreak,
        lastActiveDate: streakResult.newLastActive,
        streakFreezes: streakResult.newFreezes,
      };
      if (streakResult.streakBroken) {
        updates.streakBrokenAt = profile?.lastActiveDate ?? null;
        updates.streakBeforeBreak = profile?.streak ?? 0;
      }
      if (streakResult.clearBrokenAt) {
        updates.streakBrokenAt = null;
        updates.streakBeforeBreak = null;
      }

      await updateDoc(doc(db, "users", user.uid), updates);
    } finally {
      setSaving(false);
    }
  }

  async function handleBuyFreeze() {
    if (!user?.uid) return;
    const result = await buyStreakFreeze(user.uid);
    if (!result.ok) toast.error(result.reason ?? "Couldn't purchase freeze.");
    else toast.success("❄️ Streak freeze purchased!");
  }

  async function handleRepairStreak() {
    if (!user?.uid) return;
    const result = await repairStreak(user.uid);
    if (!result.ok) toast.error(result.reason ?? "Couldn't repair streak.");
    else toast.success("🔥 Streak repaired — keep it going!");
  }

  // Content modal overlay (renders on top of any view)
  const modal = contentModal && (
    <AnimatePresence>
      <ContentModal
        topicId={contentModal.topicId}
        lessonIndex={contentModal.lessonIndex}
        isPremium={isPremium}
        onClose={() => setContentModal(null)}
      />
    </AnimatePresence>
  );

  if (view.kind === "home") {
    return (
      <>
        <HomeView
          units={units}
          learnProgress={learnProgress}
          xp={xp}
          streak={streak}
          gems={gems}
          hearts={currentHearts}
          heartsRechargeAt={heartsRechargeAt}
          isChild={isChild}
          isPremium={isPremium}
          streakFreezes={streakFreezes}
          streakBrokenAt={streakBrokenAt}
          setView={setView}
          onShowContent={openContent}
          onBuyFreeze={handleBuyFreeze}
          onRepairStreak={handleRepairStreak}
          onRefillHearts={handleRefillHearts}
        />
        {modal}
      </>
    );
  }

  if (view.kind === "lesson-intro") {
    return (
      <>
        <LessonIntroView
          topicId={view.topicId}
          lessonIndex={view.lessonIndex}
          isPractice={view.isPractice ?? false}
          hearts={currentHearts}
          isPremium={isPremium}
          onShowContent={openContent}
          setView={setView}
        />
        {modal}
      </>
    );
  }

  if (view.kind === "quiz") {
    return (
      <>
        <QuizView
          topicId={view.topicId}
          lessonIndex={view.lessonIndex}
          questions={view.questions}
          initialHearts={currentHearts}
          isPractice={view.isPractice ?? false}
          isPremium={isPremium}
          onClose={() => setView({ kind: "home" })}
          onComplete={(xpEarned, heartsLeft, wrongAnswers) => {
            handleLessonComplete(view.topicId, xpEarned, heartsLeft, view.isPractice ?? false);
            setView({
              kind: "recap",
              topicId: view.topicId,
              lessonIndex: view.lessonIndex,
              xpEarned,
              heartsLeft,
              isPractice: view.isPractice,
              wrongAnswers,
            });
          }}
          onFailed={(heartsLeft) => {
            handleHeartsUpdate(heartsLeft);
            setView({ kind: "lesson-intro", topicId: view.topicId, lessonIndex: view.lessonIndex, isPractice: false });
          }}
          onHeartsEmpty={(heartsLeft) => {
            handleHeartsUpdate(heartsLeft);
            setView({ kind: "home" });
          }}
        />
        {modal}
      </>
    );
  }

  if (view.kind === "recap") {
    return (
      <>
        <RecapView
          topicId={view.topicId}
          lessonIndex={view.lessonIndex}
          xpEarned={view.xpEarned}
          heartsLeft={view.heartsLeft}
          isPractice={view.isPractice ?? false}
          isPremium={isPremium}
          wrongAnswers={view.wrongAnswers}
          setView={setView}
        />
        {modal}
      </>
    );
  }

  if (view.kind === "exam") {
    return (
      <>
        <ExamView
          unitId={view.unitId}
          onClose={() => setView({ kind: "home" })}
          onComplete={(score, total, xpEarned) => {
            handleExamComplete(view.unitId, xpEarned);
            setView({
              kind: "exam-results",
              unitId: view.unitId,
              score,
              total,
              xpEarned,
            });
          }}
        />
        {modal}
      </>
    );
  }

  if (view.kind === "exam-results") {
    return (
      <>
        <ExamResultsView
          unitId={view.unitId}
          score={view.score}
          total={view.total}
          xpEarned={view.xpEarned}
          isChild={isChild}
          setView={setView}
        />
        {modal}
      </>
    );
  }

  return null;
}
