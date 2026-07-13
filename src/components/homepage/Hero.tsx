"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Flame, BellRing, Sparkles } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">

      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #cbd5e1 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          opacity: 0.25,
          maskImage: "linear-gradient(to bottom, black 0%, transparent 70%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 70%)",
        }}
      />

      {/* Centered copy */}
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16 text-center">

        {/* Decorative floating frost orbs behind the headline */}
        <div className="absolute inset-0 pointer-events-none hidden md:block" aria-hidden="true">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 1 }}
            className="animate-float absolute left-4 top-44 w-14 h-14 rounded-full"
            style={{
              background: "rgba(255,255,255,0.45)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.8)",
              boxShadow: "0 8px 24px rgba(99,102,241,0.12), inset 0 1px 0 rgba(255,255,255,0.9)",
            }}
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 1 }}
            className="animate-float-delayed absolute right-10 top-32 w-9 h-9 rounded-full"
            style={{
              background: "rgba(219,234,254,0.55)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.8)",
              boxShadow: "0 6px 18px rgba(59,130,246,0.14), inset 0 1px 0 rgba(255,255,255,0.9)",
            }}
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 1 }}
            className="animate-float absolute right-24 bottom-40 w-6 h-6 rounded-full"
            style={{
              animationDelay: "3s",
              background: "rgba(224,231,255,0.6)",
              border: "1px solid rgba(255,255,255,0.85)",
              boxShadow: "0 4px 14px rgba(99,102,241,0.14)",
            }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="glass-sm inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-10"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-medium text-slate-600">Trusted by Muslims across the UK, UAE and Malaysia</span>
        </motion.div>

        <h1 className="text-6xl sm:text-7xl lg:text-[5.5rem] font-black text-slate-900 leading-[0.95] tracking-tight mb-8">
          <AnimatedTitle />
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.18 }}
          className="text-slate-500 text-xl leading-relaxed max-w-xl mx-auto mb-10"
        >
          Build Islamic habits that last, deepen your knowledge of the deen and get answers grounded in authentic scholarship. Everything you need, beautifully designed.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.26 }}
          className="flex flex-col sm:flex-row justify-center gap-3 mb-10"
        >
          <motion.div
            animate={{ scale: [1, 1.025, 1] }}
            transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut", repeatDelay: 1.2 }}
            className="inline-flex"
          >
            <Link
              href="/signup"
              className="group relative inline-flex items-center justify-center gap-2 text-white font-semibold px-8 py-4 rounded-2xl text-base transition-all duration-300 hover:-translate-y-0.5 overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%)",
                boxShadow: "0 10px 30px rgba(59,130,246,0.35), inset 0 1px 0 rgba(255,255,255,0.35)",
              }}
            >
              {/* Shine sweep on hover */}
              <span
                className="absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 opacity-0 group-hover:opacity-100 group-hover:translate-x-[320%] transition-all duration-700 pointer-events-none"
                style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)" }}
              />
              Start for free
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
          <Link
            href="/features"
            className="glass-card glass-card-hover inline-flex items-center justify-center text-slate-700 font-medium px-8 py-4 rounded-2xl text-base"
          >
            See features
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.36 }}
          className="flex flex-wrap justify-center gap-6"
        >
          {[
            "Free to start, no card needed",
            "Every hadith is cited and verified",
            "Authentic Sunni scholarship only",
          ].map((t) => (
            <span key={t} className="flex items-center gap-1.5 text-slate-400 text-sm">
              <CheckCircle2 size={14} className="text-blue-500 flex-shrink-0" />
              {t}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Wide dashboard preview with 3D tilt */}
      <motion.div
        initial={{ opacity: 0, y: 56 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-8"
      >
        <TiltPreview>
          <DashboardPreview />
        </TiltPreview>
      </motion.div>
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

/* Wraps children in a perspective container that tilts toward the cursor,
   with floating glass chips orbiting the card */
function TiltPreview({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 140, damping: 18 });
  const springY = useSpring(rotateY, { stiffness: 140, damping: 18 });

  function onMove(e: React.MouseEvent) {
    if (reduceMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;  // -0.5 … 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * 7);
    rotateX.set(-py * 7);
  }

  function onLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} style={{ perspective: 1400 }} className="relative">

      {/* Floating glass chips — desktop only */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="animate-float hidden xl:flex absolute -left-24 top-14 z-10 glass-card items-center gap-2.5 rounded-2xl px-4 py-3"
      >
        <Flame size={18} className="text-orange-500" />
        <div>
          <p className="text-sm font-black text-slate-900 leading-none">22 days</p>
          <p className="text-[11px] text-slate-400 mt-0.5">current streak</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.6 }}
        className="animate-float-delayed hidden xl:flex absolute -right-24 top-36 z-10 glass-card items-center gap-2.5 rounded-2xl px-4 py-3"
      >
        <BellRing size={18} className="text-blue-500" />
        <div>
          <p className="text-sm font-black text-slate-900 leading-none">Dhuhr · 42 min</p>
          <p className="text-[11px] text-slate-400 mt-0.5">next prayer</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 0.6 }}
        className="animate-float hidden xl:flex absolute -left-20 bottom-20 z-10 glass-card items-center gap-2 rounded-2xl px-4 py-2.5"
        style={{ animationDelay: "4s" }}
      >
        <Sparkles size={15} className="text-indigo-500" />
        <p className="text-sm font-bold text-indigo-600">+25 XP earned</p>
      </motion.div>

      <motion.div style={{ rotateX: springX, rotateY: springY, transformStyle: "preserve-3d" }}>
        {children}
      </motion.div>
    </div>
  );
}

function DashboardPreview() {
  const habits = [
    { name: "Fajr Salah", done: true, xp: "+10 XP" },
    { name: "Quran · 1 page", done: true, xp: "+10 XP" },
    { name: "Morning Dhikr", done: true, xp: "+5 XP" },
    { name: "Dhuhr Salah", done: false, xp: "" },
  ];

  return (
    <div className="relative">
      {/* Glow behind card */}
      <div className="absolute -bottom-6 inset-x-16 h-20 bg-blue-400/25 blur-3xl rounded-full pointer-events-none" />

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
        <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-3 gap-5">

          {/* Main area */}
          <div className="sm:col-span-2 space-y-5">

            {/* Greeting + level */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-xs mb-0.5">Monday, 15 June 2026</p>
                <p className="text-slate-900 font-bold text-xl">Good morning</p>
              </div>
              <div className="text-right">
                <span className="inline-block text-blue-600 text-xs font-semibold px-3 py-1 rounded-full border border-blue-200/60"
                  style={{ background: "rgba(219,234,254,0.6)" }}>Level 12</span>
              </div>
            </div>

            {/* XP bar */}
            <div className="glass-sm rounded-2xl p-4">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-600 font-medium">2,450 XP</span>
                <span className="text-slate-400">550 XP to Level 13</span>
              </div>
              <div className="h-2 bg-slate-200/70 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "82%" }}
                  transition={{ duration: 1.6, delay: 1.0, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full"
                />
              </div>
            </div>

            {/* Habit list */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-slate-900 font-semibold text-sm">Today&apos;s habits</p>
                <p className="text-blue-600 text-xs font-bold">3 / 4</p>
              </div>
              <div className="space-y-2">
                {habits.map((h, i) => (
                  <motion.div
                    key={h.name}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border"
                    style={h.done
                      ? { background: "rgba(219,234,254,0.55)", borderColor: "rgba(191,219,254,0.6)" }
                      : { background: "rgba(255,255,255,0.40)", borderColor: "rgba(255,255,255,0.65)" }}
                  >
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${
                      h.done ? "bg-blue-500" : "border-2 border-slate-300"
                    }`}>
                      {h.done && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4l2.5 2.5 5.5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm font-medium flex-1 ${h.done ? "text-slate-700" : "text-slate-400"}`}>
                      {h.name}
                    </span>
                    {h.xp && (
                      <span className="text-xs text-blue-500 font-semibold">{h.xp}</span>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">

            {/* Prayer */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="rounded-2xl p-5 text-white"
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%)",
                boxShadow: "0 12px 32px rgba(59,130,246,0.35), inset 0 1px 0 rgba(255,255,255,0.30)",
              }}
            >
              <p className="text-blue-100 text-xs font-medium mb-2">Next prayer</p>
              <p className="font-black text-2xl mb-0.5">Dhuhr</p>
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

            {/* Streak */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="glass-sm rounded-2xl p-5"
            >
              <p className="text-orange-400 text-xs font-medium mb-1">Current streak</p>
              <div className="flex items-end gap-2">
                <p className="font-black text-3xl text-slate-900">22</p>
                <Flame size={22} className="text-orange-500 mb-0.5" />
              </div>
              <p className="text-slate-500 text-xs">days in a row</p>
            </motion.div>

            {/* AI snippet */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="glass-sm rounded-2xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
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
