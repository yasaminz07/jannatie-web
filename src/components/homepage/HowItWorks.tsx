"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const steps = [
  {
    num: "01",
    title: "Create your free account",
    desc: "Sign up with your email or Google in seconds. Nothing to pay and no card required.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    num: "02",
    title: "Set your daily intentions",
    desc: "Choose the habits you want to build. Salah, Quran, Dhikr and more. We make it simple and beautiful to track.",
    color: "bg-violet-50 text-violet-600",
  },
  {
    num: "03",
    title: "Grow every single day",
    desc: "Earn XP, build your streaks and ask your AI Buddy anything. Watch your deen grow one day at a time.",
    color: "bg-emerald-50 text-emerald-600",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-28 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-3">Simple to start</p>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900">How it works</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          {steps.map(({ num, title, desc, color }, i) => (
            <motion.div
              key={num}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="bg-white rounded-3xl p-8 shadow-sm relative overflow-hidden group"
            >
              <div className={`inline-flex items-center justify-center w-10 h-10 ${color} rounded-xl text-sm font-black mb-6`}>
                {num}
              </div>
              <h3 className="text-slate-900 font-bold text-lg mb-3">{title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>

              {/* Big number bg */}
              <span className="absolute -bottom-4 -right-2 text-[7rem] font-black text-slate-100 leading-none select-none group-hover:text-slate-200 transition-colors">
                {num.slice(1)}
              </span>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm hover:gap-3 transition-all group"
          >
            Create your free account
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="group-hover:translate-x-1 transition-transform">
              <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
