"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Flame } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative bg-white overflow-hidden">

      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #cbd5e1 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          opacity: 0.35,
        }}
      />

      {/* Top gradient wash */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-blue-50/60 to-transparent pointer-events-none" />

      {/* Centered copy */}
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16 text-center">

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="inline-flex items-center gap-2 bg-white border border-slate-200 shadow-sm rounded-full px-4 py-1.5 mb-10"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-sm font-medium text-slate-600">Trusted by Muslims across the UK, UAE and Malaysia</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08 }}
          className="text-6xl sm:text-7xl lg:text-[5.5rem] font-black text-slate-900 leading-[0.95] tracking-tight mb-8"
        >
          Grow closer
          <br />
          to{" "}
          <span className="italic text-indigo-500">Allah</span>{" "}
          <span className="arabic text-indigo-500 not-italic" style={{ fontSize: "68%" }}>ﷻ</span>
          <br />
          every day.
        </motion.h1>

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
          <Link
            href="/signup"
            className="group inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl text-base transition-all duration-200 shadow-lg shadow-blue-600/20"
          >
            Start for free
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/features"
            className="inline-flex items-center justify-center bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium px-8 py-4 rounded-xl text-base transition-all duration-200"
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

      {/* Wide dashboard preview */}
      <motion.div
        initial={{ opacity: 0, y: 56 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-0"
      >
        <DashboardPreview />
      </motion.div>
    </section>
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
      <div className="absolute -bottom-4 inset-x-16 h-16 bg-blue-300/20 blur-2xl rounded-full pointer-events-none" />

      <div className="bg-white rounded-2xl shadow-2xl shadow-slate-300/40 ring-1 ring-slate-100 overflow-hidden">

        {/* Browser chrome */}
        <div className="bg-slate-50 border-b border-slate-100 px-5 py-3 flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-slate-300" />
            <div className="w-3 h-3 rounded-full bg-slate-300" />
            <div className="w-3 h-3 rounded-full bg-slate-300" />
          </div>
          <div className="flex-1 mx-4">
            <div className="bg-white rounded-md px-3 py-1 text-xs text-slate-400 border border-slate-100 text-center max-w-xs mx-auto">
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
                <span className="inline-block bg-blue-50 text-blue-600 text-xs font-semibold px-3 py-1 rounded-full">Level 12</span>
              </div>
            </div>

            {/* XP bar */}
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-600 font-medium">2,450 XP</span>
                <span className="text-slate-400">550 XP to Level 13</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "82%" }}
                  transition={{ duration: 1.6, delay: 1.0, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
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
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                      h.done ? "bg-blue-50" : "bg-slate-50"
                    }`}
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
              className="bg-blue-600 rounded-2xl p-5 text-white"
            >
              <p className="text-blue-200 text-xs font-medium mb-2">Next prayer</p>
              <p className="font-black text-2xl mb-0.5">Dhuhr</p>
              <p className="text-blue-200 text-sm">1:15 PM · in 42 min</p>
              <div className="mt-3 h-1 bg-blue-500/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "60%" }}
                  transition={{ duration: 1.4, delay: 1.2 }}
                  className="h-full bg-white/70 rounded-full"
                />
              </div>
            </motion.div>

            {/* Streak */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="bg-orange-50 rounded-2xl p-5"
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
              className="bg-slate-50 rounded-2xl p-4"
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
