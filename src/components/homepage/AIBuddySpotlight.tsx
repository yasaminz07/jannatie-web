"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, BadgeCheck } from "lucide-react";

const conversation = [
  { role: "user", text: "What is the ruling on praying Witr?" },
  {
    role: "ai",
    text: "Witr prayer is Sunnah Mu'akkadah (highly recommended). The Prophet ﷺ said: 'Make Witr the last of your night prayer.' (Bukhari 990). It can be prayed as 1, 3, 5, 7, or 9 rak'ahs.",
    verified: true,
  },
  { role: "user", text: "Can I combine my Dhur and Asr prayers while travelling?" },
  {
    role: "ai",
    text: "Yes. The Prophet ﷺ combined Dhuhr with Asr and Maghrib with Isha while on a journey (Muslim 705). This is permissible for a traveller according to all four madhabs.",
    verified: true,
  },
];

const bulletPoints = [
  "Answers grounded in Sahih Bukhari & Sahih Muslim",
  "Responses include hadith collection and number",
  "Covers Fiqh, Aqeedah, Seerah, and daily life",
  "Always cites the madhab where applicable",
  "Clear disclaimer: guidance only, not a fatwa",
];

export default function AIBuddySpotlight() {
  const [visibleChars, setVisibleChars] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);

  const currentText = conversation[msgIndex]?.text ?? "";

  useEffect(() => {
    if (visibleChars < currentText.length) {
      const t = setTimeout(() => setVisibleChars((v) => v + 1), 30);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        if (msgIndex < conversation.length - 1) {
          setMsgIndex((i) => i + 1);
          setVisibleChars(0);
        } else {
          const t2 = setTimeout(() => { setMsgIndex(0); setVisibleChars(0); }, 4000);
          return () => clearTimeout(t2);
        }
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [visibleChars, currentText, msgIndex]);

  return (
    <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left — animated chat */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-card border border-border rounded-2xl overflow-hidden shadow-card-hover"
        >
          <div className="bg-foreground px-5 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">J</span>
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Jannatie AI</p>
              <p className="text-gray-400 text-xs">Scholar-reviewed</p>
            </div>
            <div className="ml-auto flex gap-1.5">
              {["#ef4444", "#f59e0b", "#22c55e"].map((c) => (
                <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
              ))}
            </div>
          </div>

          <div className="p-5 min-h-[320px] flex flex-col gap-4">
            {conversation.slice(0, msgIndex).map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary-500 text-white rounded-br-sm"
                      : "bg-gray-100 text-foreground rounded-bl-sm"
                  }`}
                >
                  {msg.text}
                  {msg.role === "ai" && msg.verified && (
                    <div className="flex items-center gap-1 mt-2 text-primary-500 text-xs">
                      <BadgeCheck size={12} />
                      <span>Scholar-verified</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {msgIndex < conversation.length && (
              <div className={`flex ${conversation[msgIndex].role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    conversation[msgIndex].role === "user"
                      ? "bg-primary-500 text-white rounded-br-sm"
                      : "bg-gray-100 text-foreground rounded-bl-sm"
                  }`}
                >
                  {currentText.slice(0, visibleChars)}
                  <span className="inline-block w-0.5 h-4 bg-current ml-0.5 animate-pulse" />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border px-5 py-3">
            <p className="text-xs text-muted text-center">
              For guidance only — not a fatwa. Free tier: 5 messages/day.
            </p>
          </div>
        </motion.div>

        {/* Right — bullets */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 mb-4">
            <BadgeCheck size={14} className="text-accent" />
            <span className="text-sm text-accent font-semibold">Scholar-reviewed knowledge base</span>
          </div>

          <h2 className="text-4xl font-bold text-foreground mb-4">
            Your AI Buddy, grounded in authentic Islamic knowledge
          </h2>
          <p className="text-muted text-lg mb-8 leading-relaxed">
            Every response cites real hadith with collection name and number.
            No opinions. No fabrications. Just authentic Sunni knowledge from
            Sahih al-Bukhari, Sahih Muslim, and trusted scholars.
          </p>

          <ul className="space-y-4">
            {bulletPoints.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={11} className="text-white" strokeWidth={3} />
                </div>
                <span className="text-foreground text-sm leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>

          <p className="text-xs text-muted mt-6 border-t border-border pt-4">
            AI responses are for guidance only — not a fatwa. Always consult a
            qualified scholar for personal rulings.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
