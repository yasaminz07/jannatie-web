"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Flame, BellRing } from "lucide-react";

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
            Build Islamic habits that last, deepen your knowledge of the deen and get
            answers grounded in authentic scholarship — all in one place.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.62 }}
            className="flex justify-center lg:justify-start mb-9"
          >
            <Link
              href="/signup"
              className="group relative inline-flex items-center justify-center gap-2 text-white font-semibold px-9 py-4 rounded-2xl text-base transition-all duration-300 hover:-translate-y-0.5 overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%)",
                boxShadow: "0 10px 30px rgba(59,130,246,0.35), inset 0 1px 0 rgba(255,255,255,0.35)",
              }}
            >
              {/* Frosted glass light that settles over the button on hover */}
              <span
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.08) 45%, transparent 100%)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6), inset 0 0 24px rgba(255,255,255,0.15)",
                }}
              />
              Start for free
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* Checkmarks */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.75 }}
            className="flex flex-col items-center lg:items-start gap-2 mb-8"
          >
            {[
              "Free to start, no card needed",
              "Every hadith is cited and verified",
              "Authentic Sunni scholarship only",
            ].map((t) => (
              <span key={t} className="flex items-center gap-2 text-slate-400 text-sm">
                <CheckCircle2 size={14} className="text-blue-500 flex-shrink-0" />
                {t}
              </span>
            ))}
          </motion.div>

          {/* Trust strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.9 }}
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
              Trusted by <span className="font-bold text-slate-600">10,000+</span> Muslims across the UK, UAE &amp; Malaysia
            </p>
          </motion.div>
        </div>

        {/* ── Right — self-playing dashboard scene ──────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <DashboardScene />
        </motion.div>
      </div>
    </section>
  );
}

/* Letter-cascade reveal for the hero headline; "Allah" shimmers as one word */
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
        {/* "Allah" animates in as one word, then shimmers forever */}
        <motion.span
          initial={{ opacity: 0, y: 40, scale: 0.92, filter: "blur(12px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.8, delay: 0.12 + (charIndex += 5) * 0.028, ease: letterEase }}
          className="inline-block italic text-gradient-animated pr-1"
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

/* One-shot animated scene: the dashboard "uses itself" once after loading —
   Morning Dhikr ticks itself off, XP rises, the streak pops, chips settle in.
   Nothing loops and nothing follows the cursor. */

// Scene timeline (seconds)
const T_CHECK = 1.9;   // Morning Dhikr checks itself
const T_XP = 2.2;      // XP bar extends
const T_STREAK = 2.7;  // streak pops
const T_CHIPS = 3.0;   // corner chips settle in

function DashboardScene() {
  const habits = [
    { name: "Fajr Salah", preDone: true, xp: "+10 XP" },
    { name: "Quran · 1 page", preDone: true, xp: "+10 XP" },
    { name: "Morning Dhikr", preDone: false, xp: "+5 XP", selfChecks: true },
    { name: "Dhuhr Salah", preDone: false, xp: "" },
  ];

  return (
    <div className="relative">
      {/* Glow behind card */}
      <div className="absolute -bottom-6 inset-x-16 h-20 bg-blue-400/20 blur-3xl rounded-full pointer-events-none" />

      {/* Corner chips — enter once at the end of the scene, then stay still */}
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: T_CHIPS, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="hidden sm:flex absolute -top-5 -left-4 z-10 glass-card items-center gap-2.5 rounded-2xl px-4 py-2.5"
      >
        <Flame size={17} className="text-orange-500" />
        <div>
          <p className="text-sm font-black text-slate-900 leading-none">22 days</p>
          <p className="text-[10px] text-slate-400 mt-0.5">current streak</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: T_CHIPS + 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="hidden sm:flex absolute -bottom-5 -right-4 z-10 glass-card items-center gap-2.5 rounded-2xl px-4 py-2.5"
      >
        <BellRing size={17} className="text-blue-500" />
        <div>
          <p className="text-sm font-black text-slate-900 leading-none">Dhuhr · 42 min</p>
          <p className="text-[10px] text-slate-400 mt-0.5">next prayer</p>
        </div>
      </motion.div>

      <div className="glass-deep rounded-3xl overflow-hidden">

        {/* Browser chrome */}
        <div className="px-5 py-3 flex items-center gap-3 border-b border-white/60"
          style={{ background: "rgba(255,255,255,0.35)" }}>
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400/80" />
            <div className="w-3 h-3 rounded-full bg-amber-400/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
          </div>
          <div className="flex-1 mx-4">
            <div className="rounded-lg px-3 py-1 text-xs text-slate-500 text-center max-w-xs mx-auto border border-white/70"
              style={{ background: "rgba(255,255,255,0.55)" }}>
              jannatie.com/dashboard
            </div>
          </div>
        </div>

        {/* Dashboard body */}
        <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* Main area */}
          <div className="sm:col-span-2 space-y-4">

            {/* Greeting + level */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-xs mb-0.5">Monday, 15 June 2026</p>
                <p className="text-slate-900 font-bold text-lg">Good morning</p>
              </div>
              <div className="text-right">
                <span className="inline-block text-blue-600 text-xs font-semibold px-3 py-1 rounded-full border border-blue-200/60"
                  style={{ background: "rgba(219,234,254,0.6)" }}>Level 12</span>
              </div>
            </div>

            {/* XP bar — fills to 70%, then nudges to 82% when the dhikr is logged */}
            <div className="glass-sm rounded-2xl p-3.5">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-600 font-medium">2,450 XP</span>
                <span className="text-slate-400">550 XP to Level 13</span>
              </div>
              <div className="h-2 bg-slate-200/70 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: ["0%", "70%", "70%", "82%"] }}
                  transition={{ duration: T_XP + 0.6, times: [0, 0.45, 0.75, 1], ease: "easeOut", delay: 0.8 }}
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
                      opacity: { delay: 0.7 + i * 0.1 },
                      x: { delay: 0.7 + i * 0.1 },
                      backgroundColor: { delay: h.selfChecks ? T_CHECK : 0, duration: 0.4 },
                    }}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border"
                    style={{ borderColor: (h.preDone || h.selfChecks) ? "rgba(191,219,254,0.6)" : "rgba(255,255,255,0.65)" }}
                  >
                    {/* Checkbox */}
                    <div className="relative w-5 h-5 flex-shrink-0">
                      {/* empty state */}
                      {!h.preDone && (
                        <motion.div
                          className="absolute inset-0 rounded-md border-2 border-slate-300"
                          animate={h.selfChecks ? { opacity: 0 } : {}}
                          transition={{ delay: T_CHECK, duration: 0.2 }}
                        />
                      )}
                      {/* filled state */}
                      {(h.preDone || h.selfChecks) && (
                        <motion.div
                          initial={h.selfChecks ? { scale: 0 } : { scale: 1 }}
                          animate={{ scale: 1 }}
                          transition={h.selfChecks ? { delay: T_CHECK, type: "spring", stiffness: 400, damping: 18 } : {}}
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
                          transition={{ delay: T_CHECK + 0.15, type: "spring", stiffness: 300, damping: 16 }}
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

            {/* Prayer */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
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
                  transition={{ duration: 1.4, delay: 1.2 }}
                  className="h-full bg-white/80 rounded-full"
                />
              </div>
            </motion.div>

            {/* Streak — pops when the dhikr is logged */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
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

            {/* AI snippet */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
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
    </div>
  );
}
