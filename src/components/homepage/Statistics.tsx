"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

const stats = [
  { value: 1800000000, display: "1.8 Billion", label: "Muslims worldwide", suffix: "" },
  { value: 10000, display: "10,000+", label: "Habits tracked daily", suffix: "+" },
  { value: 5, display: "5", label: "Features, one app", suffix: "" },
];

function CountUp({ target, display }: { target: number; display: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1500;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  const formatted = target >= 1000000000
    ? `${(count / 1000000000).toFixed(1)}B`
    : target >= 1000
    ? `${count.toLocaleString()}+`
    : count.toString();

  return <span ref={ref}>{inView ? formatted : display}</span>;
}

export default function Statistics() {
  return (
    <section className="py-20 border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map(({ value, display, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-card border border-border rounded-2xl p-8 text-center"
            >
              <div className="mono text-6xl font-bold text-primary-500 mb-3">
                <CountUp target={value} display={display} />
              </div>
              <p className="text-muted text-base font-medium">{label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
