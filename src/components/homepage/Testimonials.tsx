"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    quote: "Jannatie changed how I approach my deen. The habit tracker keeps me accountable without making me feel guilty when I miss a day. The Streak Shield is genius.",
    name: "Amira K.",
    handle: "@amira_k_uk",
    location: "London, UK",
    initial: "A",
    color: "bg-blue-500",
  },
  {
    quote: "As a revert, the AI Buddy has been invaluable. I can ask questions I'm embarrassed to ask in person, and the answers always come with hadith references. SubhanAllah.",
    name: "Yusuf M.",
    handle: "@yusuf_revert",
    location: "Manchester, UK",
    initial: "Y",
    color: "bg-violet-500",
  },
  {
    quote: "My whole family uses this now. The learning game means my children are excited to learn about Islam. This is what we've been waiting for.",
    name: "Fatima R.",
    handle: "@fatima_r_mom",
    location: "Birmingham, UK",
    initial: "F",
    color: "bg-emerald-500",
  },
];

export default function Testimonials() {
  return (
    <section className="py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-3">Community</p>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight">
            Muslims love Jannatie.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map(({ quote, name, handle, location, initial, color }, i) => (
            <motion.div
              key={handle}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="flex gap-0.5 mb-6">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} size={14} fill="#2563eb" className="text-blue-600" />
                ))}
              </div>

              <p className="text-slate-600 text-sm leading-relaxed flex-1 mb-8">
                &ldquo;{quote}&rdquo;
              </p>

              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 ${color} rounded-full flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-xs font-bold">{initial}</span>
                </div>
                <div>
                  <p className="text-slate-900 text-sm font-semibold">{name}</p>
                  <p className="text-slate-400 text-xs">{handle} · {location}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
