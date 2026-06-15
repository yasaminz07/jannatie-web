"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Shield, Star, Users } from "lucide-react";

const trustBadges = [
  { icon: Shield, label: "Scholar-reviewed content" },
  { icon: Star, label: "Sahih Hadith only" },
  { icon: Users, label: "Built for the Ummah" },
];

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Background glow + star pattern */}
      <div className="absolute inset-0 star-pattern pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-primary-500/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left — copy */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 mb-6">
            <span className="arabic text-accent text-sm">جنتي</span>
            <span className="text-sm text-accent font-medium">My Paradise</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-[1.05] tracking-tight mb-6">
            GROW YOUR DEEN.<br />
            BUILD YOUR HABITS.<br />
            <span className="text-gradient-blue">EVERY SINGLE DAY.</span>
          </h1>

          <p className="text-lg text-muted leading-relaxed mb-8 max-w-lg">
            Jannatie is your AI-powered Islamic growth companion — helping you
            track Salah, learn Quran, and build consistent habits with the
            warmth of a knowledgeable Muslim friend.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-10">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 bg-primary-500 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-primary-600 hover:shadow-blue-glow hover:scale-[1.02] transition-all duration-150 text-base"
            >
              Start for free
            </Link>
            <button className="inline-flex items-center justify-center gap-2 border border-border text-foreground font-semibold px-8 py-3.5 rounded-xl hover:bg-foreground hover:text-white transition-all duration-150 text-base">
              Watch demo ▶
            </button>
          </div>

          <div className="flex flex-wrap gap-4">
            {trustBadges.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-sm text-accent font-medium">
                <Icon size={14} className="text-accent" />
                {label}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right — phone mockup */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="flex justify-center lg:justify-end"
        >
          <PhoneMockup />
        </motion.div>
      </div>
    </section>
  );
}

function PhoneMockup() {
  const habits = [
    { name: "Fajr Salah", done: true, streak: 14 },
    { name: "Quran (1 page)", done: true, streak: 8 },
    { name: "Morning Dhikr", done: true, streak: 22 },
    { name: "Dhuhr Salah", done: false, streak: 6 },
    { name: "Fast (Monday)", done: false, streak: 3 },
  ];

  return (
    <div className="relative">
      {/* Floating glow */}
      <div className="absolute inset-0 bg-primary-500/20 blur-3xl rounded-full scale-75 pointer-events-none" />

      <div className="relative w-[280px] bg-white rounded-[40px] shadow-2xl border-4 border-gray-900 overflow-hidden">
        {/* Status bar */}
        <div className="bg-foreground text-white px-6 py-2 flex justify-between text-[10px]">
          <span>9:41</span>
          <span className="arabic text-accent text-xs">جنتي</span>
        </div>

        <div className="p-4 bg-background min-h-[480px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted">Good morning</p>
              <p className="text-sm font-bold text-foreground">Aisha ✨</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted">Next prayer</p>
              <p className="text-xs font-bold text-accent">Dhuhr 1:15pm</p>
            </div>
          </div>

          <div className="bg-primary-500 rounded-xl p-3 mb-4 text-white">
            <p className="text-[10px] opacity-80 mb-1">Today&apos;s progress</p>
            <p className="text-lg font-bold">3 of 5 habits</p>
            <div className="h-1.5 bg-white/30 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: "60%" }} />
            </div>
          </div>

          <p className="text-xs font-semibold text-foreground mb-2">Today&apos;s Habits</p>
          <div className="space-y-2">
            {habits.map((h) => (
              <div key={h.name} className="flex items-center gap-2 bg-white rounded-lg p-2.5 border border-border">
                <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${h.done ? "bg-primary-500" : "border border-gray-300"}`}>
                  {h.done && <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span className={`text-[11px] flex-1 ${h.done ? "text-muted line-through" : "text-foreground font-medium"}`}>
                  {h.name}
                </span>
                <span className={`text-[10px] font-bold ${h.streak >= 7 ? "text-accent" : "text-muted"}`}>
                  🔥{h.streak}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
