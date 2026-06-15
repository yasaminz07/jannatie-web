"use client";

import { motion } from "framer-motion";
import { MessageCircle, BookOpen, CheckSquare, Calendar, TrendingUp } from "lucide-react";

const features = [
  {
    icon: MessageCircle,
    name: "AI Buddy",
    description: "Scholar-reviewed answers to your Islamic questions, available 24/7.",
  },
  {
    icon: BookOpen,
    name: "Learning Game",
    description: "Gamified lessons on Quran, Seerah, Fiqh and more. Earn XP as you grow.",
  },
  {
    icon: CheckSquare,
    name: "Habit Tracker",
    description: "Build consistent Salah, Quran and Dhikr habits with streak protection.",
  },
  {
    icon: Calendar,
    name: "Islamic Calendar",
    description: "Hijri dates, mosque events, and study circles — all in one place.",
  },
  {
    icon: TrendingUp,
    name: "Progress & XP",
    description: "Level up your deen with badges, leaderboards and weekly summaries.",
  },
];

export default function FeaturesGrid() {
  return (
    <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-14"
      >
        <h2 className="text-4xl font-bold text-foreground mb-4">
          Everything you need for your deen —<br className="hidden sm:block" /> in one place.
        </h2>
        <p className="text-muted text-lg max-w-xl mx-auto">
          Five powerful tools, one beautiful app, built with Islamic values at its core.
        </p>
      </motion.div>

      <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide sm:grid sm:grid-cols-2 lg:grid-cols-5 sm:overflow-visible">
        {features.map(({ icon: Icon, name, description }, i) => (
          <motion.div
            key={name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="flex-shrink-0 w-64 sm:w-auto bg-card border border-border rounded-2xl p-6 hover:border-primary-500 hover:shadow-card-hover transition-all duration-200 group cursor-pointer"
          >
            <div className="w-11 h-11 bg-accent/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
              <Icon size={22} className="text-accent" />
            </div>
            <h3 className="font-semibold text-foreground text-base mb-2">{name}</h3>
            <p className="text-sm text-muted leading-relaxed">{description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
