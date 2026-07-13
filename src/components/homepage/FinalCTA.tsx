"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Twinkling stars scattered over the dark block
const STARS = [
  { left: "8%",  top: "18%", size: 3, delay: 0.0 },
  { left: "16%", top: "62%", size: 2, delay: 1.1 },
  { left: "24%", top: "34%", size: 2, delay: 2.3 },
  { left: "36%", top: "12%", size: 3, delay: 0.7 },
  { left: "64%", top: "16%", size: 2, delay: 1.8 },
  { left: "76%", top: "42%", size: 3, delay: 0.4 },
  { left: "86%", top: "24%", size: 2, delay: 2.7 },
  { left: "92%", top: "58%", size: 2, delay: 1.4 },
  { left: "70%", top: "70%", size: 2, delay: 3.2 },
  { left: "12%", top: "80%", size: 2, delay: 2.0 },
];

export default function FinalCTA() {
  const darkRef = useRef<HTMLDivElement>(null);

  // Scroll parallax — the bismillah drifts slower than the page
  const { scrollYProgress } = useScroll({
    target: darkRef,
    offset: ["start end", "end start"],
  });
  const bismillahY = useTransform(scrollYProgress, [0, 1], [48, -48]);
  const headlineY = useTransform(scrollYProgress, [0, 1], [24, -24]);

  return (
    <section className="relative mt-20">

      {/* Organic wiggly curve out of the off-white page into the dark block —
          asymmetric and diagonal like Duolingo's, then the dark runs
          seamlessly into the footer (same bg, no gap) */}
      <svg
        viewBox="0 0 1440 160"
        preserveAspectRatio="none"
        className="block w-full h-[90px] sm:h-[140px]"
        aria-hidden="true"
      >
        <path
          d="M0,70 C90,45 180,32 280,38 C420,47 520,130 700,132 C860,133 920,55 1040,45 C1130,38 1200,68 1290,55 C1350,46 1400,28 1440,22 L1440,161 L0,161 Z"
          fill="#0f172a"
        />
      </svg>

      <div
        ref={darkRef}
        className="relative overflow-hidden pt-16 pb-24 -mt-px"
        style={{ background: "#0f172a" }}
      >

        {/* Twinkling stars — fade out before the footer so no seam shows */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            maskImage: "linear-gradient(to bottom, black 0%, black 72%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 72%, transparent 100%)",
          }}
        >
          {STARS.map(({ left, top, size, delay }, i) => (
            <motion.span
              key={i}
              className="absolute rounded-full bg-white"
              style={{ left, top, width: size, height: size }}
              animate={{ opacity: [0.1, 0.7, 0.1], scale: [1, 1.4, 1] }}
              transition={{ repeat: Infinity, duration: 3.4, delay, ease: "easeInOut" }}
            />
          ))}
        </div>

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

          <motion.div style={{ y: bismillahY }}>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="arabic text-4xl text-white/80 mb-3"
            >
              بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="text-white/55 text-sm mb-14 tracking-widest"
            >
              In the name of Allah, the Most Gracious, the Most Merciful
            </motion.p>
          </motion.div>

          <motion.div style={{ y: headlineY }}>
            <motion.h2
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6"
            >
              Your deen deserves
              <br />
              <span className="font-serif italic font-medium text-slate-200">
                more than a reminder.
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-slate-400 text-lg leading-relaxed mb-12 max-w-lg mx-auto"
            >
              Join thousands of Muslims building better habits, deepening their knowledge and getting closer to Allah every single day.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.38 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6"
            >
              <Link
                href="/signup"
                className="btn-liquid group inline-flex items-center gap-2 text-white font-bold px-8 py-4 rounded-2xl text-base transition-all hover:-translate-y-0.5 active:scale-[0.96]"
                style={{ boxShadow: "0 10px 30px rgba(59,130,246,0.30), inset 0 1px 0 rgba(255,255,255,0.30)" }}
              >
                Create your free account
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/features"
                className="inline-flex items-center gap-2 bg-white/8 hover:bg-white/12 border border-white/10 text-white/70 hover:text-white font-medium px-8 py-4 rounded-2xl text-base transition-all hover:-translate-y-0.5"
              >
                Explore features
              </Link>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-slate-500 text-sm"
            >
              No credit card. Cancel anytime.
            </motion.p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
