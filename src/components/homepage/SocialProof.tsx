"use client";

import { Star } from "lucide-react";

const reviews = [
  { name: "@umm_khalid", text: "Finally an app that keeps me consistent with Fajr. The Streak Shield is genius." },
  { name: "@brotherali_uk", text: "The learning game is incredible. My kids absolutely love it. 5 stars without question." },
  { name: "@sister_fatimah", text: "I love that it doesn't guilt-trip you when you miss a day. So thoughtful." },
  { name: "@abu_ibrahim99", text: "The AI Buddy answered my question with a real hadith reference. Impressed." },
  { name: "@zaynab_reads", text: "Every feature I've ever wanted in one clean, beautiful app. Jannatie is special." },
  { name: "@hafidh_student", text: "Arabic text is beautiful, duas are accurate with references. Jazakallah khair." },
];

const doubled = [...reviews, ...reviews];

export default function SocialProof() {
  return (
    <section className="relative py-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 mb-10 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">Loved by the Ummah</p>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-slate-900">10,000+</span>
          <span className="text-slate-400 text-sm">Muslims growing daily</span>
        </div>
      </div>

      <div
        className="relative"
        style={{
          maskImage: "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
          WebkitMaskImage: "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
        }}
      >
        <div className="flex animate-ticker whitespace-nowrap gap-3 px-4">
          {doubled.map((review, i) => (
            <div
              key={i}
              className="glass-card inline-flex flex-shrink-0 flex-col gap-2 rounded-2xl px-5 py-4 w-72 whitespace-normal"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} size={12} fill="#2563eb" className="text-blue-600" />
                ))}
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">{review.text}</p>
              <p className="text-slate-400 text-xs font-medium">{review.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
