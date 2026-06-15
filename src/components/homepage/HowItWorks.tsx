"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const steps = [
  {
    num: "01",
    title: "Create your free account",
    desc: "Sign up in 30 seconds with email or Google. No credit card needed.",
  },
  {
    num: "02",
    title: "Set your daily intentions",
    desc: "Choose the Islamic habits you want to build — Salah, Quran, Dhikr and more.",
  },
  {
    num: "03",
    title: "Grow every single day",
    desc: "Check off habits, earn XP, ask your AI Buddy and watch your deen flourish.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-24 bg-primary-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-foreground mb-3">
            How it works
          </h2>
          <p className="text-muted text-lg">Simple to start. Powerful to continue.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {steps.map(({ num, title, desc }, i) => (
            <motion.div
              key={num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="text-center"
            >
              <div className="mono text-7xl font-bold text-primary-500/20 mb-4 select-none">
                {num}
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">{title}</h3>
              <p className="text-muted leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-14"
        >
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 text-primary-500 font-semibold text-lg hover:gap-4 transition-all duration-200"
          >
            Create your free account →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
