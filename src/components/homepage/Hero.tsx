"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight, Flame, BellRing, MousePointer2, Swords, Zap,
  ShieldCheck, Send, Trophy, Check,
} from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">

      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #cbd5e1 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          opacity: 0.22,
          maskImage: "linear-gradient(to bottom, black 0%, transparent 70%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 lg:pt-36 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-12 items-center">

        {/* ── Left — copy ──────────────────────────────────────────────────── */}
        <div className="text-center lg:text-left">

          <h1 className="text-5xl sm:text-6xl xl:text-7xl font-black text-slate-900 leading-[0.98] tracking-tight mb-7">
            <AnimatedTitle />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-slate-500 text-lg sm:text-xl leading-relaxed max-w-xl mx-auto lg:mx-0 mb-9"
          >
            Habits, knowledge and answers grounded in authentic scholarship —
            all in one place.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.62 }}
            className="flex justify-center lg:justify-start mb-10"
          >
            <Link
              href="/signup"
              className="btn-liquid group inline-flex items-center justify-center gap-2 text-white font-semibold px-9 py-4 rounded-2xl text-base transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.96]"
              style={{
                boxShadow: "0 10px 30px rgba(59,130,246,0.35), inset 0 1px 0 rgba(255,255,255,0.35)",
              }}
            >
              Start for free
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* Trust strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex items-center justify-center lg:justify-start gap-3"
          >
            <div className="flex -space-x-2.5">
              {[
                { i: "A", bg: "linear-gradient(135deg, #3b82f6, #2563eb)" },
                { i: "F", bg: "linear-gradient(135deg, #8b5cf6, #6d28d9)" },
                { i: "Y", bg: "linear-gradient(135deg, #10b981, #047857)" },
                { i: "Z", bg: "linear-gradient(135deg, #f59e0b, #d97706)" },
              ].map(({ i, bg }) => (
                <div key={i}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold ring-2 ring-white"
                  style={{ background: bg }}>
                  {i}
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-400">
              Trusted by <span className="font-bold text-slate-600">10,000+</span> Muslims worldwide
            </p>
          </motion.div>
        </div>

        {/* ── Right — looping product tour ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <ProductScene />
        </motion.div>
      </div>
    </section>
  );
}

/* Letter-cascade reveal for the hero headline */
function AnimatedTitle() {
  const letterEase: [number, number, number, number] = [0.16, 1, 0.3, 1];
  let charIndex = 0;

  const delayFor = () => 0.12 + charIndex++ * 0.028;

  const renderWord = (word: string, extraClass = "") =>
    word.split("").map((ch, i) => (
      <motion.span
        key={`${word}-${i}`}
        initial={{ opacity: 0, y: 40, rotateX: 45, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.7, delay: delayFor(), ease: letterEase }}
        className={`inline-block ${extraClass}`}
      >
        {ch}
      </motion.span>
    ));

  return (
    <span style={{ perspective: 600 }}>
      <span className="block">
        {renderWord("Grow")}
        <span className="inline-block w-[0.25em]" />
        {renderWord("closer")}
      </span>
      <span className="block">
        {renderWord("to")}
        <span className="inline-block w-[0.25em]" />
        <motion.span
          initial={{ opacity: 0, y: 40, scale: 0.92, filter: "blur(12px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.8, delay: 0.12 + (charIndex += 5) * 0.028, ease: letterEase }}
          className="inline-block italic text-indigo-500 pr-1"
        >
          Allah
        </motion.span>
        <span className="inline-block w-[0.15em]" />
        <motion.span
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.12 + charIndex * 0.028 }}
          className="arabic text-indigo-500 not-italic inline-block align-baseline"
          style={{ fontSize: "68%" }}
        >
          ﷻ
        </motion.span>
      </span>
      <span className="block">
        {renderWord("every")}
        <span className="inline-block w-[0.25em]" />
        {renderWord("day.")}
      </span>
    </span>
  );
}

/* ── Looping product tour ─────────────────────────────────────────────────────
   Three acts on a flip loop. Each act plays its UI, then the camera zooms
   into one detail (the rest of the UI dissolves), holds on a close-up,
   zooms back out, and flips to the next act:
   1. Dashboard — cursor ticks off Morning Dhikr → zoom into the streak box
   2. Dual Quiz — cursor answers "Bismillah"     → zoom into the victory
   3. AI Buddy  — a cited answer lands           → zoom into the citation   */

const ACT_MS = 7800;  // per-act duration before flipping to the next
const Z_IN = 3.5;     // camera pushes into the detail
const Z_OUT = 6.5;    // camera pulls back to the full UI

/* Timed zoom phase — true while the close-up is on screen */
function useZoomPhase() {
  const [zoom, setZoom] = useState(false);
  useEffect(() => {
    const a = setTimeout(() => setZoom(true), Z_IN * 1000);
    const b = setTimeout(() => setZoom(false), Z_OUT * 1000);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);
  return zoom;
}

/* Zoomable stage: the main UI scales up toward `origin` and dissolves while
   the close-up settles in — then the reverse on the way back out */
function ZoomStage({
  zoom, origin, main, focus,
}: {
  zoom: boolean;
  origin: string;
  main: React.ReactNode;
  focus: React.ReactNode;
}) {
  return (
    <div className="relative flex-1 min-h-0 overflow-hidden">
      <motion.div
        animate={zoom ? { scale: 2.4, opacity: 0 } : { scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.65, 0, 0.35, 1] }}
        style={{ transformOrigin: origin }}
        className="h-full"
      >
        {main}
      </motion.div>
      <motion.div
        initial={false}
        animate={zoom ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
        transition={{ duration: 0.8, ease: [0.65, 0, 0.35, 1] }}
        className="absolute inset-0 flex items-center justify-center"
        style={{ pointerEvents: "none" }}
      >
        {focus}
      </motion.div>
    </div>
  );
}

function ProductScene() {
  const [act, setAct] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setAct((a) => a + 1), ACT_MS);
    return () => clearInterval(t);
  }, []);

  const face = act % 3;

  return (
    <div className="relative" style={{ perspective: 1600 }}>
      {/* Glow behind card */}
      <div className="absolute -bottom-6 inset-x-16 h-20 bg-blue-400/20 blur-3xl rounded-full pointer-events-none" />

      {/* Floating badges — a different shape, size and corner for each act */}
      <AnimatePresence>
        {face === 0 && (
          /* Act 1 — vertical prayer mini-card, tilted, top-left */
          <motion.div
            key={`chip-a-${act}`}
            initial={{ opacity: 0, y: 14, rotate: -8, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, rotate: -4, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.25 } }}
            transition={{ delay: 1.2, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="hidden sm:block absolute -top-8 -left-6 z-10 glass-card rounded-3xl px-4 py-3.5 text-center"
          >
            <div className="w-9 h-9 mx-auto rounded-full flex items-center justify-center mb-1.5 border border-blue-200/70"
              style={{ background: "rgba(219,234,254,0.75)" }}>
              <BellRing size={15} className="text-blue-500" />
            </div>
            <p className="text-sm font-black text-slate-900 leading-none">Dhuhr</p>
            <p className="text-[10px] text-slate-400 mt-1">in 42 min</p>
          </motion.div>
        )}
        {face === 1 && (
          /* Act 2 — circular XP medallion, tilted the other way, top-right */
          <motion.div
            key={`chip-c-${act}`}
            initial={{ opacity: 0, y: 14, rotate: 14, scale: 0.7 }}
            animate={{ opacity: 1, y: 0, rotate: 6, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7, transition: { duration: 0.25 } }}
            transition={{ delay: 1.0, type: "spring", stiffness: 220, damping: 17 }}
            className="hidden sm:flex absolute -top-9 -right-6 z-10 glass-card w-[5.5rem] h-[5.5rem] rounded-full flex-col items-center justify-center"
          >
            <Zap size={17} className="text-indigo-500 mb-0.5" />
            <p className="text-sm font-black text-indigo-600 leading-none">+60 XP</p>
            <p className="text-[9px] text-slate-400 mt-0.5">to the winner</p>
          </motion.div>
        )}
        {face === 2 && (
          /* Act 3 — wide verification banner, bottom-left */
          <motion.div
            key={`chip-d-${act}`}
            initial={{ opacity: 0, y: -12, rotate: -5, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, rotate: -2, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.25 } }}
            transition={{ delay: 1.0, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="hidden sm:flex absolute -bottom-6 -left-7 z-10 glass-card items-center gap-3 rounded-full pl-2 pr-5 py-2"
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center border border-emerald-200/70 flex-shrink-0"
              style={{ background: "rgba(209,250,229,0.8)" }}>
              <ShieldCheck size={16} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 leading-tight">Every answer is cited</p>
              <p className="text-[10px] text-slate-400">Quran &amp; sahih hadith only</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flip between faces; each face remounts so its scene replays */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={act}
          initial={{ rotateY: -90, opacity: 0.4 }}
          animate={{ rotateY: 0, opacity: 1 }}
          exit={{ rotateY: 90, opacity: 0.4 }}
          transition={{ duration: 0.5, ease: [0.45, 0, 0.55, 1] }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {face === 0 ? <DashboardFace /> : face === 1 ? <QuizFace /> : <AIFace />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* Shared browser chrome bar */
function Chrome({ url }: { url: string }) {
  return (
    <div className="px-5 py-3 flex items-center gap-3 border-b border-white/60 flex-shrink-0"
      style={{ background: "rgba(255,255,255,0.35)" }}>
      <div className="flex gap-1.5">
        <div className="w-3 h-3 rounded-full bg-red-400/80" />
        <div className="w-3 h-3 rounded-full bg-amber-400/80" />
        <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
      </div>
      <div className="flex-1 mx-4">
        <div className="rounded-lg px-3 py-1 text-xs text-slate-500 text-center max-w-xs mx-auto border border-white/70"
          style={{ background: "rgba(255,255,255,0.55)" }}>
          {url}
        </div>
      </div>
    </div>
  );
}

/* Animated cursor that glides between keyframe positions and "clicks" */
function Cursor({
  path, clickAtIndex, delay, duration,
}: {
  path: { left: string; top: string }[];
  clickAtIndex: number;
  delay: number;
  duration: number;
}) {
  const lefts = path.map((p) => p.left);
  const tops = path.map((p) => p.top);
  const scales = path.map((_, i) => (i === clickAtIndex ? 0.82 : 1));
  const n = path.length;
  const times = path.map((_, i) => i / (n - 1));

  return (
    <motion.div
      className="absolute z-20 pointer-events-none hidden sm:block"
      initial={{ opacity: 0, left: lefts[0], top: tops[0] }}
      animate={{
        opacity: [0, 1, ...Array(Math.max(n - 3, 0)).fill(1), 0],
        left: lefts,
        top: tops,
        scale: scales,
      }}
      transition={{ duration, delay, times, ease: "easeInOut" }}
    >
      <MousePointer2 size={22} className="text-slate-800 fill-white drop-shadow-md" />
    </motion.div>
  );
}

/* ── Act 1 — dashboard: dhikr ticks itself, then zoom into the streak box ── */
const T_CLICK = 2.0;
const T_XP = 2.3;
const T_STREAK = 2.8;

function DashboardFace() {
  const zoom = useZoomPhase();

  const habits = [
    { name: "Fajr Salah", preDone: true, xp: "+10 XP" },
    { name: "Quran · 1 page", preDone: true, xp: "+10 XP" },
    { name: "Morning Dhikr", preDone: false, xp: "+5 XP", selfChecks: true },
    { name: "Dhuhr Salah", preDone: false, xp: "" },
  ];

  return (
    <div className="glass-deep rounded-3xl overflow-hidden relative sm:h-[480px] flex flex-col">

      <Cursor
        path={[
          { left: "58%", top: "82%" },
          { left: "58%", top: "82%" },
          { left: "17%", top: "63%" },
          { left: "17%", top: "63%" },
          { left: "17%", top: "63%" },
          { left: "17%", top: "63%" },
        ]}
        clickAtIndex={3}
        delay={1.0}
        duration={2.3}
      />

      {/* Click ripple */}
      <motion.span
        className="absolute z-10 w-10 h-10 rounded-full bg-blue-400/40 pointer-events-none hidden sm:block"
        style={{ left: "14%", top: "60%" }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 2.2], opacity: [0.6, 0] }}
        transition={{ delay: T_CLICK, duration: 0.55, ease: "easeOut" }}
      />

      <Chrome url="jannatie.com/dashboard" />

      <ZoomStage
        zoom={zoom}
        origin="85% 45%"
        focus={<StreakFocus zoom={zoom} />}
        main={
          <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 h-full">

            {/* Main area */}
            <div className="sm:col-span-2 space-y-4">

              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-xs mb-0.5">Monday, 15 June 2026</p>
                  <p className="text-slate-900 font-bold text-lg">Good morning</p>
                </div>
                <span className="inline-block text-blue-600 text-xs font-semibold px-3 py-1 rounded-full border border-blue-200/60 h-fit"
                  style={{ background: "rgba(219,234,254,0.6)" }}>Level 12</span>
              </div>

              {/* XP bar */}
              <div className="glass-sm rounded-2xl p-3.5">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-600 font-medium">2,450 XP</span>
                  <span className="text-slate-400">550 XP to Level 13</span>
                </div>
                <div className="h-2 bg-slate-200/70 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: ["0%", "70%", "70%", "82%"] }}
                    transition={{ duration: T_XP + 0.6, times: [0, 0.45, 0.75, 1], ease: "easeOut", delay: 0.6 }}
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full"
                  />
                </div>
              </div>

              {/* Habit list */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-slate-900 font-semibold text-sm">Today&apos;s habits</p>
                  <p className="text-blue-600 text-xs font-bold">3 / 4</p>
                </div>
                <div className="space-y-2">
                  {habits.map((h, i) => (
                    <motion.div
                      key={h.name}
                      initial={{
                        opacity: 0, x: -12,
                        backgroundColor: h.preDone ? "rgba(219,234,254,0.55)" : "rgba(255,255,255,0.40)",
                      }}
                      animate={{
                        opacity: 1, x: 0,
                        backgroundColor: (h.preDone || h.selfChecks) ? "rgba(219,234,254,0.55)" : "rgba(255,255,255,0.40)",
                      }}
                      transition={{
                        opacity: { delay: 0.4 + i * 0.1 },
                        x: { delay: 0.4 + i * 0.1 },
                        backgroundColor: { delay: h.selfChecks ? T_CLICK : 0, duration: 0.4 },
                      }}
                      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border"
                      style={{ borderColor: (h.preDone || h.selfChecks) ? "rgba(191,219,254,0.6)" : "rgba(255,255,255,0.65)" }}
                    >
                      <div className="relative w-5 h-5 flex-shrink-0">
                        {!h.preDone && (
                          <motion.div
                            className="absolute inset-0 rounded-md border-2 border-slate-300"
                            animate={h.selfChecks ? { opacity: 0 } : {}}
                            transition={{ delay: T_CLICK, duration: 0.2 }}
                          />
                        )}
                        {(h.preDone || h.selfChecks) && (
                          <motion.div
                            initial={h.selfChecks ? { scale: 0 } : { scale: 1 }}
                            animate={{ scale: 1 }}
                            transition={h.selfChecks ? { delay: T_CLICK, type: "spring", stiffness: 400, damping: 18 } : {}}
                            className="absolute inset-0 rounded-md bg-blue-500 flex items-center justify-center"
                          >
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                              <path d="M1 4l2.5 2.5 5.5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </motion.div>
                        )}
                      </div>

                      <span className={`text-sm font-medium flex-1 ${(h.preDone || h.selfChecks) ? "text-slate-700" : "text-slate-400"}`}>
                        {h.name}
                      </span>

                      {h.xp && (
                        h.selfChecks ? (
                          <motion.span
                            initial={{ opacity: 0, y: 6, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: T_CLICK + 0.15, type: "spring", stiffness: 300, damping: 16 }}
                            className="text-xs text-blue-500 font-semibold"
                          >
                            {h.xp}
                          </motion.span>
                        ) : (
                          <span className="text-xs text-blue-500 font-semibold">{h.xp}</span>
                        )
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-3">

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="rounded-2xl p-4 text-white"
                style={{
                  background: "linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%)",
                  boxShadow: "0 12px 32px rgba(59,130,246,0.35), inset 0 1px 0 rgba(255,255,255,0.30)",
                }}
              >
                <p className="text-blue-100 text-xs font-medium mb-1.5">Next prayer</p>
                <p className="font-black text-xl mb-0.5">Dhuhr</p>
                <p className="text-blue-100 text-sm">1:15 PM · in 42 min</p>
                <div className="mt-3 h-1 bg-white/25 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "60%" }}
                    transition={{ duration: 1.4, delay: 0.9 }}
                    className="h-full bg-white/80 rounded-full"
                  />
                </div>
              </motion.div>

              {/* Streak — the camera zooms into this box */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="glass-sm rounded-2xl p-4"
              >
                <p className="text-orange-400 text-xs font-medium mb-1">Current streak</p>
                <div className="flex items-end gap-2">
                  <motion.p
                    animate={{ scale: [1, 1.25, 1] }}
                    transition={{ delay: T_STREAK, duration: 0.45, ease: "easeOut" }}
                    className="font-black text-2xl text-slate-900 origin-left"
                  >
                    22
                  </motion.p>
                  <motion.div
                    animate={{ rotate: [0, -14, 12, 0], scale: [1, 1.25, 1] }}
                    transition={{ delay: T_STREAK, duration: 0.5 }}
                  >
                    <Flame size={20} className="text-orange-500 mb-0.5" />
                  </motion.div>
                </div>
                <p className="text-slate-500 text-xs">days in a row</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="glass-sm rounded-2xl p-3.5"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-[8px] font-bold">J</span>
                  </div>
                  <p className="text-slate-500 text-xs font-medium">AI Buddy</p>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  &ldquo;Recite Ayat al-Kursi before sleep for protection until morning (Bukhari 5010)&rdquo;
                </p>
              </motion.div>
            </div>
          </div>
        }
      />
    </div>
  );
}

/* Close-up 1 — streak: split layout, tall glass counter panel on the left,
   day rows cascading in on the right */
function StreakFocus({ zoom }: { zoom: boolean }) {
  const days = [
    { day: "Saturday", label: "Lesson completed" },
    { day: "Sunday",   label: "Lesson completed" },
    { day: "Today",    label: "Morning Dhikr logged", today: true },
  ];

  return (
    <div className="w-full px-5 sm:px-8">
      <div className="flex items-stretch gap-3 max-w-md mx-auto">

        {/* Left — tall frosted counter panel */}
        <motion.div
          initial={{ opacity: 0, x: -20, scale: 0.92 }}
          animate={zoom ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: -20, scale: 0.92 }}
          transition={zoom ? { delay: 0.45, type: "spring", stiffness: 240, damping: 20 } : { duration: 0.2 }}
          className="glass-card rounded-[1.75rem] px-6 py-7 flex flex-col items-center justify-center text-center flex-shrink-0"
        >
          <motion.div
            animate={zoom ? { rotate: [0, -12, 10, 0], scale: [1, 1.2, 1] } : {}}
            transition={{ delay: 1.6, duration: 0.6 }}
            className="inline-flex mb-2"
          >
            <Flame size={40} className="text-orange-500" style={{ filter: "drop-shadow(0 6px 14px rgba(249,115,22,0.45))" }} />
          </motion.div>

          {/* Counter ticks 21 → 22 as today's entry lands */}
          <div className="relative h-12 w-16 mb-0.5">
            <motion.p
              className="absolute inset-0 text-5xl font-black text-slate-900"
              animate={zoom ? { opacity: [1, 1, 0] } : { opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.25, times: [0, 0.6, 1] }}
            >
              21
            </motion.p>
            <motion.p
              className="absolute inset-0 text-5xl font-black text-slate-900"
              initial={{ opacity: 0, scale: 1.5 }}
              animate={zoom ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.5 }}
              transition={zoom ? { delay: 1.65, type: "spring", stiffness: 300, damping: 16 } : { duration: 0.2 }}
            >
              22
            </motion.p>
          </div>
          <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-widest">day streak</p>
        </motion.div>

        {/* Right — one lesson a day = +1 */}
        <div className="flex-1 flex flex-col justify-center gap-2">
          {days.map(({ day, label, today }, i) => (
            <motion.div
              key={day}
              initial={{ opacity: 0, x: 24 }}
              animate={zoom ? { opacity: 1, x: 0 } : { opacity: 0, x: 24 }}
              transition={zoom ? { delay: 0.65 + i * 0.32, type: "spring", stiffness: 260, damping: 20 } : { duration: 0.2 }}
              className="glass-card flex items-center gap-3 rounded-2xl px-3.5 py-2.5"
              style={today ? { border: "1px solid rgba(251,146,60,0.55)" } : undefined}
            >
              <span className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${today ? "bg-orange-500" : "bg-emerald-500"}`}>
                <Check size={12} className="text-white" strokeWidth={3} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 leading-tight">{day}</p>
                <p className="text-[11px] text-slate-400">{label}</p>
              </div>
              <span className={`text-xs font-black ${today ? "text-orange-500" : "text-emerald-600"}`}>+1</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Act 2 — Dual Quiz: answer lands, then zoom into the victory ─────────── */
const Q_CLICK = 2.2;

function QuizFace() {
  const zoom = useZoomPhase();

  const options = ["Alhamdulillah", "Bismillah", "SubhanAllah", "Astaghfirullah"];
  const correct = 1;

  return (
    <div className="glass-deep rounded-3xl overflow-hidden relative sm:h-[480px] flex flex-col">

      <Cursor
        path={[
          { left: "40%", top: "88%" },
          { left: "40%", top: "88%" },
          { left: "70%", top: "64%" },
          { left: "70%", top: "64%" },
          { left: "70%", top: "64%" },
          { left: "70%", top: "64%" },
        ]}
        clickAtIndex={3}
        delay={0.9}
        duration={2.3}
      />

      {/* Click ripple on the answer */}
      <motion.span
        className="absolute z-10 w-10 h-10 rounded-full bg-emerald-400/40 pointer-events-none hidden sm:block"
        style={{ left: "67%", top: "61%" }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 2.2], opacity: [0.6, 0] }}
        transition={{ delay: Q_CLICK, duration: 0.55, ease: "easeOut" }}
      />

      <Chrome url="jannatie.com/pvp" />

      <ZoomStage
        zoom={zoom}
        origin="30% 20%"
        focus={<VictoryFocus zoom={zoom} />}
        main={
          <div className="p-5 sm:p-6 h-full flex flex-col justify-center">

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest text-center mb-4"
            >
              <Swords size={12} className="inline mr-1.5 -mt-0.5" />
              Live Dual Quiz
            </motion.p>

            {/* Scoreboard */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="flex items-center gap-3 mb-5"
            >
              <div className="flex-1 glass-sm rounded-2xl px-4 py-2.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #3b82f6, #4f46e5)" }}>
                  You
                </div>
                {/* Score ticks 2 → 3 when the answer lands */}
                <span className="relative text-xl font-black text-blue-600 ml-auto w-4 text-center">
                  <motion.span
                    className="absolute inset-0"
                    animate={{ opacity: [1, 1, 0] }}
                    transition={{ delay: Q_CLICK + 0.2, duration: 0.25, times: [0, 0.6, 1] }}
                  >
                    2
                  </motion.span>
                  <motion.span
                    className="absolute inset-0"
                    initial={{ opacity: 0, scale: 1.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: Q_CLICK + 0.35, type: "spring", stiffness: 320, damping: 16 }}
                  >
                    3
                  </motion.span>
                </span>
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border border-white/70"
                style={{ background: "rgba(224,231,255,0.8)" }}>
                <Swords size={14} className="text-indigo-500" />
              </div>
              <div className="flex-1 glass-sm rounded-2xl px-4 py-2.5 flex items-center gap-3 flex-row-reverse">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                  A
                </div>
                <p className="text-xl font-black text-slate-500 mr-auto">2</p>
              </div>
            </motion.div>

            {/* Timer */}
            <div className="h-1.5 bg-slate-200/60 rounded-full overflow-hidden mb-5">
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "22%" }}
                transition={{ delay: 0.5, duration: 3.0, ease: "linear" }}
                className="h-full rounded-full bg-violet-500"
              />
            </div>

            {/* Question */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="text-sm font-bold text-slate-900 mb-4"
            >
              What do we say before starting to eat?
            </motion.p>

            <div className="grid grid-cols-2 gap-2">
              {options.map((opt, i) => {
                const isCorrect = i === correct;
                return (
                  <motion.div
                    key={opt}
                    initial={{
                      opacity: 0, y: 10,
                      backgroundColor: "rgba(255,255,255,0.45)",
                      borderColor: "rgba(255,255,255,0.65)",
                      color: "#475569",
                    }}
                    animate={isCorrect ? {
                      opacity: 1, y: 0,
                      backgroundColor: "rgba(209,250,229,0.85)",
                      borderColor: "rgba(52,211,153,0.6)",
                      color: "#047857",
                      scale: [1, 1.05, 1],
                    } : { opacity: 1, y: 0 }}
                    transition={isCorrect ? {
                      opacity: { delay: 0.55 + i * 0.08 },
                      y: { delay: 0.55 + i * 0.08 },
                      backgroundColor: { delay: Q_CLICK, duration: 0.3 },
                      borderColor: { delay: Q_CLICK, duration: 0.3 },
                      color: { delay: Q_CLICK, duration: 0.3 },
                      scale: { delay: Q_CLICK, duration: 0.4 },
                    } : { opacity: { delay: 0.55 + i * 0.08 }, y: { delay: 0.55 + i * 0.08 } }}
                    className="rounded-xl px-3 py-2.5 text-xs font-semibold text-center border"
                  >
                    {opt}
                  </motion.div>
                );
              })}
            </div>
          </div>
        }
      />
    </div>
  );
}

/* Close-up 2 — victory: one wide glass banner with confetti, a beaten-avatar
   scoreline through the middle and rewards along the bottom */
function VictoryFocus({ zoom }: { zoom: boolean }) {
  const confetti = [
    { left: "12%", top: "16%", color: "#f59e0b", delay: 1.0 },
    { left: "84%", top: "20%", color: "#8b5cf6", delay: 1.15 },
    { left: "22%", top: "72%", color: "#3b82f6", delay: 1.3 },
    { left: "74%", top: "78%", color: "#10b981", delay: 1.45 },
    { left: "50%", top: "10%", color: "#f43f5e", delay: 1.2 },
  ];

  return (
    <div className="w-full px-5 sm:px-10">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.9 }}
        animate={zoom ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 24, scale: 0.9 }}
        transition={zoom ? { delay: 0.45, type: "spring", stiffness: 220, damping: 20 } : { duration: 0.2 }}
        className="glass-card relative rounded-[2rem] px-6 py-7 max-w-sm mx-auto overflow-hidden"
      >
        {/* Confetti pops */}
        {confetti.map(({ left, top, color, delay }, i) => (
          <motion.span
            key={i}
            className="absolute w-2 h-2 rounded-full pointer-events-none"
            style={{ left, top, background: color }}
            initial={{ scale: 0, opacity: 0 }}
            animate={zoom ? { scale: [0, 1.4, 1], opacity: [0, 1, 0.7], y: [0, -6, 2] } : { scale: 0, opacity: 0 }}
            transition={zoom ? { delay, duration: 0.7, ease: "easeOut" } : { duration: 0.15 }}
          />
        ))}

        {/* Trophy breaks the top edge */}
        <motion.div
          animate={zoom ? { rotate: [0, -10, 8, 0], scale: [1, 1.25, 1] } : {}}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="flex justify-center -mt-1 mb-2"
        >
          <Trophy size={42} className="text-amber-500" style={{ filter: "drop-shadow(0 6px 14px rgba(245,158,11,0.45))" }} />
        </motion.div>

        <p className="text-3xl font-black text-slate-900 text-center mb-4">Victory!</p>

        {/* Scoreline */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={zoom ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          transition={zoom ? { delay: 0.8, type: "spring", stiffness: 260, damping: 20 } : { duration: 0.2 }}
          className="flex items-center justify-center gap-3 mb-5"
        >
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
            style={{ background: "linear-gradient(135deg, #3b82f6, #4f46e5)" }}>
            You
          </div>
          <span className="text-2xl font-black text-slate-900 tabular-nums">3</span>
          <span className="text-slate-300 font-bold text-sm">–</span>
          <span className="text-2xl font-black text-slate-400 tabular-nums">2</span>
          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-white text-[10px] font-bold opacity-60">
            A
          </div>
        </motion.div>

        {/* Rewards */}
        <div className="flex justify-center gap-2.5">
          {[
            { label: "+60 XP", tint: "text-indigo-600" },
            { label: "+25 💎", tint: "text-blue-600" },
          ].map(({ label, tint }, i) => (
            <motion.span
              key={label}
              initial={{ opacity: 0, y: 14, scale: 0.7 }}
              animate={zoom ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 14, scale: 0.7 }}
              transition={zoom ? { delay: 1.35 + i * 0.2, type: "spring", stiffness: 300, damping: 16 } : { duration: 0.2 }}
              className={`glass-sm text-sm font-black px-4 py-2 rounded-2xl ${tint}`}
            >
              {label}
            </motion.span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ── Act 3 — AI Buddy: cited answer lands, then zoom into the citation ───── */
function AIFace() {
  const zoom = useZoomPhase();

  return (
    <div className="glass-deep rounded-3xl overflow-hidden relative sm:h-[480px] flex flex-col">

      <Chrome url="jannatie.com/ai" />

      {/* Chat header */}
      <div className="px-5 py-3 border-b border-white/50 flex items-center gap-3 flex-shrink-0">
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">J</span>
        </div>
        <div>
          <p className="text-slate-900 text-sm font-semibold leading-tight">AI Buddy</p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
            <p className="text-slate-400 text-[11px]">Online · Scholar-reviewed</p>
          </div>
        </div>
        <ShieldCheck size={16} className="text-blue-500 ml-auto" />
      </div>

      <ZoomStage
        zoom={zoom}
        origin="30% 75%"
        focus={<CitationFocus zoom={zoom} />}
        main={
          <div className="p-5 h-full flex flex-col justify-end gap-3">

            {/* User question */}
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="self-end max-w-[80%] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm text-white"
              style={{ background: "linear-gradient(135deg, #3b82f6, #4f46e5)" }}
            >
              What should I recite before going to sleep?
            </motion.div>

            {/* Typing indicator → answer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0] }}
              transition={{ delay: 1.0, duration: 1.0, times: [0, 0.15, 0.85, 1] }}
              className="self-start glass-sm rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5"
            >
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse-dot" />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse-dot" style={{ animationDelay: "0.2s" }} />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse-dot" style={{ animationDelay: "0.4s" }} />
            </motion.div>

            {/* AI answer */}
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 2.1, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="self-start max-w-[85%] glass-sm rounded-2xl rounded-bl-sm px-4 py-3"
            >
              <p className="text-sm text-slate-700 leading-relaxed">
                Recite <span className="font-semibold">Ayat al-Kursi</span> — the Prophet ﷺ said
                whoever recites it before sleeping will have a guardian from Allah, and no
                shaytan will come near until morning.
              </p>
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 2.8, type: "spring", stiffness: 300, damping: 18 }}
                className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200"
                style={{ background: "rgba(209,250,229,0.7)" }}
              >
                <ShieldCheck size={11} />
                Sahih al-Bukhari 5010
              </motion.span>
            </motion.div>

            {/* Input bar */}
            <div className="glass-sm rounded-2xl px-4 py-2.5 flex items-center gap-3 mt-2">
              <p className="text-xs text-slate-400 flex-1">Ask anything about Islam…</p>
              <div className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #3b82f6, #4f46e5)" }}>
                <Send size={12} className="text-white" />
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
}

/* Close-up 3 — citation: a left-aligned frosted reference card, like a page
   pulled from the book, with an emerald accent spine */
function CitationFocus({ zoom }: { zoom: boolean }) {
  return (
    <div className="w-full px-6 sm:px-12">
      <motion.div
        initial={{ opacity: 0, x: 28, rotate: 2 }}
        animate={zoom ? { opacity: 1, x: 0, rotate: 0 } : { opacity: 0, x: 28, rotate: 2 }}
        transition={zoom ? { delay: 0.45, type: "spring", stiffness: 220, damping: 22 } : { duration: 0.2 }}
        className="glass-card relative rounded-2xl max-w-sm mx-auto overflow-hidden flex"
      >
        {/* Accent spine */}
        <div className="w-1.5 flex-shrink-0 bg-gradient-to-b from-emerald-400 to-teal-500" />

        <div className="p-5 flex-1 text-left relative">
          {/* Verified shield floats top-right */}
          <motion.div
            animate={zoom ? { scale: [1, 1.2, 1] } : {}}
            transition={{ delay: 1.3, duration: 0.5 }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center border border-emerald-200"
            style={{ background: "rgba(209,250,229,0.85)", boxShadow: "0 8px 22px rgba(16,185,129,0.25)" }}
          >
            <ShieldCheck size={19} className="text-emerald-600" />
          </motion.div>

          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.25em] mb-2">
            Verified source
          </p>
          <p className="font-serif italic text-2xl text-slate-900 leading-tight mb-0.5">
            Sahih al-Bukhari
          </p>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={zoom ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            transition={zoom ? { delay: 0.9, type: "spring", stiffness: 280, damping: 20 } : { duration: 0.2 }}
            className="text-emerald-600 font-black text-lg mb-3"
          >
            Hadith № 5010
          </motion.p>

          <div className="h-px bg-slate-200/80 mb-3" />

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={zoom ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={zoom ? { delay: 1.15, duration: 0.45 } : { duration: 0.2 }}
            className="text-sm text-slate-500 leading-relaxed"
          >
            Every answer cites its exact source, so you can open the book and
            verify it yourself.
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
