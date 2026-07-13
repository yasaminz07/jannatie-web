"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function FinalCTA() {
  return (
    <section className="relative mt-20">

      {/* Organic curve out of the off-white page into the dark block —
          the dark then runs seamlessly into the footer (same bg, no gap) */}
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="block w-full h-[70px] sm:h-[110px]"
        aria-hidden="true"
      >
        <path d="M0,0 C480,110 960,110 1440,0 L1440,121 L0,121 Z" fill="#0f172a" />
      </svg>

      <div className="relative overflow-hidden pt-16 pb-24 -mt-px" style={{ background: "#0f172a" }}>

        {/* Soft glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="animate-aurora-a absolute -top-24 left-[10%] w-[26rem] h-[26rem] rounded-full bg-blue-500/15 blur-[90px]" />
          <div className="animate-aurora-b absolute -bottom-32 right-[8%] w-[24rem] h-[24rem] rounded-full bg-indigo-500/15 blur-[90px]" />
        </div>

        {/* Dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="arabic text-3xl text-white/20 mb-2">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
            <p className="text-white/25 text-xs mb-14 tracking-widest">
              In the name of Allah, the Most Gracious, the Most Merciful
            </p>

            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.0] tracking-tight mb-6">
              Your deen deserves
              <br />
              <span className="text-gradient">more than a reminder.</span>
            </h2>

            <p className="text-slate-400 text-lg leading-relaxed mb-12 max-w-lg mx-auto">
              Join thousands of Muslims building better habits, deepening their knowledge and getting closer to Allah every single day.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-xl text-base transition-all shadow-lg shadow-blue-500/20"
              >
                Create your free account
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/features"
                className="inline-flex items-center gap-2 bg-white/8 hover:bg-white/12 border border-white/10 text-white/70 hover:text-white font-medium px-8 py-4 rounded-xl text-base transition-all"
              >
                Explore features
              </Link>
            </div>

            <p className="text-slate-500 text-sm">No credit card. Cancel anytime.</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
