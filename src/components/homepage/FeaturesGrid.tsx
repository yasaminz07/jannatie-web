"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { CheckSquare, GraduationCap, Calendar, TrendingUp, MessageCircle } from "lucide-react";

const chatMessages = [
  { role: "user", text: "What duas should I read after Salah?" },
  { role: "ai", text: "After Salah, recite Ayat al-Kursi (Quran 2:255). The Prophet ﷺ said whoever recites it after each prayer will be protected until the next (Sahih al-Bukhari 5010)." },
];

function MiniChat() {
  const [visible, setVisible] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const current = chatMessages[visible];

  useEffect(() => {
    if (charCount < current.text.length) {
      const t = setTimeout(() => setCharCount(c => c + 1), 18);
      return () => clearTimeout(t);
    } else {
      if (visible < chatMessages.length - 1) {
        const t = setTimeout(() => { setVisible(v => v + 1); setCharCount(0); }, 800);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => { setVisible(0); setCharCount(0); }, 4000);
        return () => clearTimeout(t);
      }
    }
  }, [charCount, current, visible]);

  return (
    <div className="mt-5 space-y-3">
      {chatMessages.slice(0, visible).map((m, i) => (
        <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
          <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            m.role === "user" ? "bg-blue-600 text-white" : "bg-white/10 text-white/80"
          }`}>{m.text}</div>
        </div>
      ))}
      <div className={`flex ${current.role === "user" ? "justify-end" : "justify-start"}`}>
        <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          current.role === "user" ? "bg-blue-600 text-white" : "bg-white/10 text-white/80"
        }`}>
          {current.text.slice(0, charCount)}
          <span className="inline-block w-0.5 h-4 bg-blue-400 ml-0.5 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

const smallFeatures = [
  {
    Icon: CheckSquare,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    name: "Habit Tracker",
    desc: "Build your Salah, Quran and Dhikr streaks. We keep you going without the guilt when life gets busy.",
  },
  {
    Icon: GraduationCap,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
    name: "Learning Game",
    desc: "Earn XP through Quran, Seerah and Fiqh lessons. Knowledge that actually stays with you.",
  },
  {
    Icon: Calendar,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-500",
    name: "Islamic Calendar",
    desc: "Hijri dates, mosque events and community study circles. Everything in one shared view.",
  },
  {
    Icon: TrendingUp,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-500",
    name: "Progress and XP",
    desc: "Level up through badges and streaks. Watch your deen grow visibly, day by day.",
  },
];

export default function FeaturesGrid() {
  return (
    <section className="py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14"
        >
          <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-3">
            Everything you need
          </p>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight">
            Five tools. One deen.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Large AI card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:row-span-2 bg-slate-900 rounded-3xl p-8 flex flex-col"
          >
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mb-5 flex-shrink-0">
              <MessageCircle size={18} className="text-white" />
            </div>
            <h3 className="text-white font-bold text-xl mb-2">AI Buddy</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-2">
              Get answers to any Islamic question. Every response cites the exact hadith so you can verify it yourself.
            </p>
            <div className="flex-1 flex flex-col justify-end">
              <MiniChat />
              <p className="text-slate-600 text-xs mt-4 text-center">For guidance only. Not a fatwa.</p>
            </div>
          </motion.div>

          {/* 4 smaller cards */}
          {smallFeatures.map(({ Icon, iconBg, iconColor, name, desc }, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className="bg-slate-50 hover:bg-white hover:shadow-md transition-all duration-300 rounded-3xl p-7 group"
            >
              <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center mb-4`}>
                <Icon size={18} className={iconColor} />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">{name}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
