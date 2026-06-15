"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

const stats = [
  { value: 10000, suffix: "+", label: "Muslims growing daily", note: "Across UK, UAE & Malaysia" },
  { value: 95, suffix: "%", label: "Habit completion rate", note: "Premium users, 30-day avg" },
  { value: 47000, suffix: "+", label: "Duas recited today", note: "Tracked across all users" },
  { value: 4.9, suffix: "/5", label: "App Store rating", note: "Based on 2,100+ reviews", decimal: true },
];

function CountUp({ to, suffix, decimal }: { to: number; suffix: string; decimal?: boolean }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const duration = 1800;
    const start = performance.now();
    const frame = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(parseFloat((eased * to).toFixed(decimal ? 1 : 0)));
      if (progress < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [inView, to, decimal]);

  const display = decimal
    ? count.toFixed(1)
    : count >= 1000
    ? `${(count / 1000).toFixed(0)}k`
    : count.toString();

  return <span ref={ref}>{display}{suffix}</span>;
}

export default function Statistics() {
  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-3">By the numbers</p>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900">A growing Ummah.</h2>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map(({ value, suffix, label, note, decimal }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <p className="text-4xl sm:text-5xl font-black text-slate-900 mb-2 mono">
                <CountUp to={value} suffix={suffix} decimal={decimal} />
              </p>
              <p className="text-slate-700 font-semibold text-sm mb-1">{label}</p>
              <p className="text-slate-400 text-xs">{note}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
