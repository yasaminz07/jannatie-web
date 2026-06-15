"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "Jannatie changed how I approach my deen. The habit tracker keeps me accountable without making me feel guilty when I miss a day. The Streak Shield is genius.",
    name: "Amira K.",
    handle: "@amira_k_uk",
    location: "London, UK",
  },
  {
    quote:
      "As a revert, the AI Buddy has been invaluable. I can ask questions I'm embarrassed to ask in person, and the answers always come with hadith references. SubhanAllah.",
    name: "James (Yusuf) M.",
    handle: "@yusuf_revert",
    location: "Manchester, UK",
  },
  {
    quote:
      "My whole family uses this now. The learning game means my children are excited to learn about Islam. This is what we've been waiting for.",
    name: "Fatima R.",
    handle: "@fatima_r_mom",
    location: "Birmingham, UK",
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-14"
      >
        <h2 className="text-4xl font-bold text-foreground mb-4">
          Muslims love Jannatie
        </h2>
        <p className="text-muted text-lg">Real people. Real growth. Real impact.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map(({ quote, name, handle, location }, i) => (
          <motion.div
            key={handle}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.15 }}
            className="bg-card border border-border rounded-2xl p-7 flex flex-col"
          >
            <div className="flex gap-0.5 mb-4">
              {Array.from({ length: 5 }).map((_, s) => (
                <Star key={s} size={16} fill="#E07B00" className="text-accent" />
              ))}
            </div>
            <p className="text-foreground text-sm leading-relaxed flex-1 mb-5">
              &ldquo;{quote}&rdquo;
            </p>
            <div>
              <p className="text-sm font-semibold text-foreground">{name}</p>
              <p className="text-xs text-muted">{handle} · {location}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
