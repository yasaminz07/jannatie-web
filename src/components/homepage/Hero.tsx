"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight, Flame, BellRing, MousePointer2, Swords, Zap,
  ShieldCheck, Send, Heart, MessageCircle, Share2, BadgeCheck,
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

        {/* ── Right — looping product film ──────────────────────────────────── */}
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

/* ── Looping product film ─────────────────────────────────────────────────────
   Four scenes, each opening on a full-frame kinetic title card that zooms
   through the camera to reveal the living UI beneath:
   1. Habits     — a cursor ticks off Morning Dhikr; XP rises, streak pops
   2. Battle     — the cursor answers "Bismillah"; the score ticks up
   3. Ask        — a question is asked, the AI types, a cited answer lands
   4. Community  — comments roll in live on a mosque event, the like pops   */

const ACT_MS = 6600;      // per-scene duration
const TITLE_OUT = 1.35;   // when the title card zooms away
const S = TITLE_OUT + 0.25; // scene content animations start after the reveal

const ACTS = [
  { num: "01", label: "Build habits that last",     accent: "rgba(59, 130, 246, 0.22)" },
  { num: "02", label: "Battle the Ummah live",      accent: "rgba(139, 92, 246, 0.22)" },
  { num: "03", label: "Ask with evidence",          accent: "rgba(16, 185, 129, 0.18)" },
  { num: "04", label: "Grow with your community",   accent: "rgba(245, 158, 11, 0.18)" },
];

function ProductScene() {
  const [act, setAct] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setAct((a) => a + 1), ACT_MS);
    return () => clearInterval(t);
  }, []);

  const face = act % 4;

  return (
    <div className="relative">
      {/* Ambient colour mood — cross-fades to match the scene playing */}
      <motion.div
        className="absolute -inset-8 rounded-[3rem] blur-3xl pointer-events-none"
        animate={{ backgroundColor: ACTS[face].accent }}
        transition={{ duration: 1.4, ease: "easeInOut" }}
      />

      {/* Zoom cut between scenes — outgoing zooms toward the camera and
          dissolves; the next scene zooms up from small. Faces remount each
          cycle so every scene replays from its title card. */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={act}
          initial={{ opacity: 0, scale: 0.82, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 1.14, filter: "blur(12px)" }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          {face === 0 ? <DashboardFace /> : face === 1 ? <QuizFace /> : face === 2 ? <AIFace /> : <CommunityFace />}
        </motion.div>
      </AnimatePresence>

      {/* Scene caption + story-style progress segments */}
      <div className="flex items-center justify-between mt-6 px-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={act}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="text-sm font-semibold text-slate-500"
          >
            <span className="font-black text-slate-300 mr-2.5">{ACTS[face].num}</span>
            {ACTS[face].label}
          </motion.p>
        </AnimatePresence>

        <div className="flex gap-1.5">
          {ACTS.map((_, i) => (
            <div key={i} className="h-1 w-9 rounded-full bg-slate-200/80 overflow-hidden">
              {i < face && <div className="h-full w-full bg-slate-400 rounded-full" />}
              {i === face && (
                <motion.div
                  key={act}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: ACT_MS / 1000, ease: "linear" }}
                  className="h-full bg-slate-400 rounded-full"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* Full-frame kinetic title card — letters spring up, then the whole card
   zooms through the camera to reveal the scene */
function TitleCard({
  word, sub, gradient, serif = false,
}: { word: string; sub: string; gradient: string; serif?: boolean }) {
  return (
    <motion.div
      className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none"
      style={{ background: gradient }}
      initial={{ opacity: 1, scale: 1 }}
      animate={{ opacity: 0, scale: 1.45, filter: "blur(12px)" }}
      transition={{ delay: TITLE_OUT, duration: 0.55, ease: [0.7, 0, 0.84, 0] }}
    >
      <div className="flex overflow-hidden pb-2">
        {word.split("").map((ch, i) => (
          <motion.span
            key={i}
            initial={{ y: "120%", rotate: 8, opacity: 0 }}
            animate={{ y: "0%", rotate: 0, opacity: 1 }}
            transition={{ delay: 0.1 + i * 0.05, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className={`text-white text-6xl sm:text-7xl leading-none ${
              serif ? "font-serif italic" : "font-black tracking-tight"
            }`}
          >
            {ch}
          </motion.span>
        ))}
      </div>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.4 }}
        className="text-white/70 text-[11px] font-bold uppercase tracking-[0.35em] mt-3"
      >
        {sub}
      </motion.p>
    </motion.div>
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

/* Scene 1 — Habits: the dashboard uses itself */
const T_CLICK = S + 1.0;
const T_XP = T_CLICK + 0.3;
const T_STREAK = T_CLICK + 0.8;

function DashboardFace() {
  const habits = [
    { name: "Fajr Salah", preDone: true, xp: "+10 XP" },
    { name: "Quran · 1 page", preDone: true, xp: "+10 XP" },
    { name: "Morning Dhikr", preDone: false, xp: "+5 XP", selfChecks: true },
    { name: "Dhuhr Salah", preDone: false, xp: "" },
  ];

  return (
    <div className="glass-deep rounded-3xl overflow-hidden relative sm:h-[480px] flex flex-col">

      <TitleCard word="Habits." sub="Track your day" gradient="linear-gradient(135deg, #3b82f6, #4f46e5)" />

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
        delay={S}
        duration={2.4}
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

      {/* Dashboard body */}
      <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1 min-h-0">

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
                transition={{ duration: T_XP - S + 0.6, times: [0, 0.45, 0.75, 1], ease: "easeOut", delay: S }}
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
                    opacity: 0, y: 14, scale: 0.97,
                    backgroundColor: h.preDone ? "rgba(219,234,254,0.55)" : "rgba(255,255,255,0.40)",
                  }}
                  animate={{
                    opacity: 1, y: 0, scale: 1,
                    backgroundColor: (h.preDone || h.selfChecks) ? "rgba(219,234,254,0.55)" : "rgba(255,255,255,0.40)",
                  }}
                  transition={{
                    opacity: { delay: S - 0.2 + i * 0.09 },
                    y: { delay: S - 0.2 + i * 0.09, type: "spring", stiffness: 260, damping: 20 },
                    scale: { delay: S - 0.2 + i * 0.09 },
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
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: S - 0.1, type: "spring", stiffness: 240, damping: 20 }}
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
                transition={{ duration: 1.4, delay: S + 0.2 }}
                className="h-full bg-white/80 rounded-full"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: S, type: "spring", stiffness: 240, damping: 20 }}
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
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: S + 0.1, type: "spring", stiffness: 240, damping: 20 }}
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
    </div>
  );
}

/* Scene 2 — Battle: the cursor answers a Dual Quiz question */
const Q_CLICK = S + 1.2;

function QuizFace() {
  const options = ["Alhamdulillah", "Bismillah", "SubhanAllah", "Astaghfirullah"];
  const correct = 1;

  return (
    <div className="glass-deep rounded-3xl overflow-hidden relative sm:h-[480px] flex flex-col">

      <TitleCard word="Battle." sub="Live dual quiz" gradient="linear-gradient(135deg, #7c3aed, #4f46e5)" />

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
        delay={S + 0.1}
        duration={2.4}
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

      {/* Battle body */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-center">

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: S - 0.25 }}
          className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest text-center mb-4"
        >
          <Swords size={12} className="inline mr-1.5 -mt-0.5" />
          Live Dual Quiz
        </motion.p>

        {/* Scoreboard */}
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: S - 0.15, type: "spring", stiffness: 240, damping: 20 }}
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
            transition={{ delay: S, duration: 4.2, ease: "linear" }}
            className="h-full rounded-full bg-violet-500"
          />
        </div>

        {/* Question */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: S - 0.05 }}
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
                  opacity: 0, y: 12,
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
                  opacity: { delay: S + i * 0.08 },
                  y: { delay: S + i * 0.08 },
                  backgroundColor: { delay: Q_CLICK, duration: 0.3 },
                  borderColor: { delay: Q_CLICK, duration: 0.3 },
                  color: { delay: Q_CLICK, duration: 0.3 },
                  scale: { delay: Q_CLICK, duration: 0.4 },
                } : { opacity: { delay: S + i * 0.08 }, y: { delay: S + i * 0.08 } }}
                className="rounded-xl px-3 py-2.5 text-xs font-semibold text-center border"
              >
                {opt}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* Scene 3 — Ask: AI Buddy answers with a citation */
function AIFace() {
  return (
    <div className="glass-deep rounded-3xl overflow-hidden relative sm:h-[480px] flex flex-col">

      <TitleCard word="Ask." sub="Cited, every time" gradient="linear-gradient(135deg, #059669, #0d9488)" serif />

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

      {/* Chat body */}
      <div className="p-5 flex-1 flex flex-col justify-end gap-3 min-h-0">

        {/* User question */}
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: S, type: "spring", stiffness: 260, damping: 20 }}
          className="self-end max-w-[80%] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm text-white"
          style={{ background: "linear-gradient(135deg, #3b82f6, #4f46e5)" }}
        >
          What should I recite before going to sleep?
        </motion.div>

        {/* Typing indicator → answer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ delay: S + 0.6, duration: 1.2, times: [0, 0.15, 0.85, 1] }}
          className="self-start glass-sm rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5"
        >
          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse-dot" />
          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse-dot" style={{ animationDelay: "0.2s" }} />
          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse-dot" style={{ animationDelay: "0.4s" }} />
        </motion.div>

        {/* AI answer */}
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: S + 1.9, type: "spring", stiffness: 260, damping: 20 }}
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
            transition={{ delay: S + 2.7, type: "spring", stiffness: 300, damping: 18 }}
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
    </div>
  );
}

/* Scene 4 — Community: comments roll in live on a mosque event */
const COMMENTS = [
  { user: "umm_khalid",    color: "#8b5cf6", text: "Can't wait! Bringing the kids 🧁" },
  { user: "brotherali_uk", color: "#10b981", text: "JazakAllah khair for organising 🤲" },
  { user: "sister_fatimah", color: "#f59e0b", text: "See you all there insha'Allah!" },
];

const C_HEART = S + 3.4;

function CommunityFace() {
  return (
    <div className="glass-deep rounded-3xl overflow-hidden relative sm:h-[480px] flex flex-col">

      <TitleCard word="Community." sub="Real local events" gradient="linear-gradient(135deg, #f59e0b, #ef4444)" />

      <Chrome url="jannatie.com/community" />

      {/* Event post */}
      <div className="p-5 flex-1 flex flex-col min-h-0">

        {/* Event header */}
        <motion.div
          initial={{ opacity: 0, y: 14, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: S - 0.15, type: "spring", stiffness: 240, damping: 20 }}
          className="flex items-center gap-3 mb-3"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            CM
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-sm font-bold text-slate-900 truncate">Central Mosque Youth</p>
              <BadgeCheck size={14} className="text-blue-500 flex-shrink-0" />
            </div>
            <p className="text-[11px] text-slate-400">@centralmosqueyouth · 842 followers</p>
          </div>
        </motion.div>

        {/* Event card */}
        <motion.div
          initial={{ opacity: 0, y: 14, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: S, type: "spring", stiffness: 240, damping: 20 }}
          className="glass-sm rounded-2xl p-4 mb-3"
        >
          <p className="text-sm font-bold text-slate-900 mb-0.5">🧁 Charity Bake Sale</p>
          <p className="text-xs text-slate-400 mb-3">Sat 14 March · 12–4 PM · Community Hall, Birmingham</p>
          <div className="flex items-center gap-5 text-xs text-slate-400">
            {/* Heart pops and the count ticks 95 → 96 */}
            <span className="flex items-center gap-1.5">
              <motion.span
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ delay: C_HEART, duration: 0.45, ease: "easeOut" }}
                className="inline-flex"
              >
                <motion.span
                  initial={{ color: "#94a3b8" }}
                  animate={{ color: "#f43f5e" }}
                  transition={{ delay: C_HEART, duration: 0.2 }}
                  className="inline-flex"
                >
                  <Heart size={13} fill="currentColor" />
                </motion.span>
              </motion.span>
              <span className="relative w-6 text-left">
                <motion.span
                  className="absolute inset-0"
                  animate={{ opacity: [1, 1, 0] }}
                  transition={{ delay: C_HEART, duration: 0.25, times: [0, 0.6, 1] }}
                >
                  95
                </motion.span>
                <motion.span
                  className="absolute inset-0 font-bold text-rose-500"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: C_HEART + 0.15, type: "spring", stiffness: 300, damping: 18 }}
                >
                  96
                </motion.span>
              </span>
            </span>
            <span className="flex items-center gap-1.5"><MessageCircle size={13} /> 14</span>
            <span className="flex items-center gap-1.5"><Share2 size={13} /> 8</span>
          </div>
        </motion.div>

        {/* Live comments rolling in */}
        <div className="flex-1 flex flex-col justify-end gap-2 min-h-0">
          {COMMENTS.map(({ user, color, text }, i) => (
            <motion.div
              key={user}
              initial={{ opacity: 0, y: 18, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: S + 0.9 + i * 0.85, type: "spring", stiffness: 260, damping: 20 }}
              className="flex items-start gap-2.5"
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                style={{ background: color }}
              >
                {user[0].toUpperCase()}
              </div>
              <div className="glass-sm rounded-2xl rounded-tl-sm px-3.5 py-2 min-w-0">
                <p className="text-[11px] font-bold text-slate-500 leading-tight">@{user}</p>
                <p className="text-xs text-slate-700 leading-relaxed">{text}</p>
              </div>
            </motion.div>
          ))}

          {/* Comment input */}
          <div className="glass-sm rounded-2xl px-4 py-2.5 flex items-center gap-3 mt-1.5">
            <p className="text-xs text-slate-400 flex-1">Add a comment…</p>
            <Send size={13} className="text-blue-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
