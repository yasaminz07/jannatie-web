"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";

const conversation = [
  { role: "user", text: "What is the ruling on combining prayers while travelling?" },
  {
    role: "ai",
    text: "The Prophet ﷺ combined Dhuhr with Asr, and Maghrib with Isha while on a journey (Sahih Muslim 705). This is permissible according to all four major madhabs for a traveller.",
  },
  { role: "user", text: "What dua should I read before sleeping?" },
  {
    role: "ai",
    text: "Recite Ayat al-Kursi (Quran 2:255) before sleeping. The Prophet ﷺ said it will protect you until morning (Sahih al-Bukhari 5010).",
  },
];

export default function AIBuddySpotlight() {
  const [visibleChars, setVisibleChars] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);
  const inView = useInView(chatRef, { amount: 0.4 });

  const currentText = conversation[msgIndex]?.text ?? "";

  useEffect(() => {
    if (!inView) return;
    if (visibleChars < currentText.length) {
      const t = setTimeout(() => setVisibleChars((v) => v + 1), 22);
      return () => clearTimeout(t);
    } else {
      if (msgIndex < conversation.length - 1) {
        const t = setTimeout(() => { setMsgIndex((i) => i + 1); setVisibleChars(0); }, 900);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => { setMsgIndex(0); setVisibleChars(0); }, 3500);
        return () => clearTimeout(t);
      }
    }
  }, [visibleChars, currentText, msgIndex, inView]);

  return (
    <section className="py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

          {/* Left — Chat UI */}
          <motion.div
            ref={chatRef}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-white rounded-3xl overflow-hidden shadow-xl shadow-slate-200/80 ring-1 ring-slate-100">
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">J</span>
                </div>
                <div>
                  <p className="text-slate-900 text-sm font-semibold">Jannatie AI</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    <p className="text-slate-400 text-xs">Online · Scholar-reviewed</p>
                  </div>
                </div>
                <div className="ml-auto">
                  <ShieldCheck size={16} className="text-blue-500" />
                </div>
              </div>

              {/* Messages */}
              <div className="p-6 min-h-[300px] flex flex-col gap-4 bg-slate-50/50">
                {conversation.slice(0, msgIndex).map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-white text-slate-700 shadow-sm rounded-bl-sm"
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}

                {msgIndex < conversation.length && (
                  <div className={`flex ${conversation[msgIndex].role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      conversation[msgIndex].role === "user"
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-white text-slate-700 shadow-sm rounded-bl-sm"
                    }`}>
                      {currentText.slice(0, visibleChars)}
                      <span className="inline-block w-0.5 h-4 bg-blue-400 ml-0.5 animate-pulse" />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-3 border-t border-slate-100 text-center bg-white">
                <p className="text-slate-400 text-xs">For guidance only. Not a fatwa.</p>
              </div>
            </div>
          </motion.div>

          {/* Right — copy */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-4">AI Buddy</p>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight mb-6">
              Islamic knowledge,
              <br />
              always cited.
            </h2>
            <p className="text-slate-500 text-lg leading-relaxed mb-8">
              Every response includes the exact hadith collection and number so you can verify it yourself. No opinions. No fabrications.
            </p>

            <div className="space-y-3 mb-10">
              {[
                "Sources: Sahih al-Bukhari, Sahih Muslim, and major collections",
                "Every hadith cited with collection name and number",
                "Scholar-reviewed badge on verified responses",
                "Clear disclaimer on every reply. Never a fatwa.",
              ].map((point) => (
                <div key={point} className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                  </div>
                  <p className="text-slate-500 text-sm">{point}</p>
                </div>
              ))}
            </div>

            <Link
              href="/signup"
              className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm hover:gap-3 transition-all group"
            >
              Try the AI Buddy free
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
