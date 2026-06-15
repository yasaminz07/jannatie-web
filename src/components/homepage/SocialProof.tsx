"use client";

import { Star } from "lucide-react";

const reviews = [
  { name: "@umm_khalid", text: "Finally an app that actually helps me stay consistent with Fajr. MashaAllah!" },
  { name: "@brotherali_uk", text: "The learning game is incredible — my kids love it too. 5 stars without question." },
  { name: "@sister_fatimah", text: "I love that it doesn't guilt-trip you. The Streak Shield is a game changer." },
  { name: "@abu_ibrahim99", text: "The AI Buddy answered my question about ghusl perfectly. Scholar-reviewed ✅" },
  { name: "@zaynab_reads", text: "Every feature I've ever wanted in one clean app. Jannatie is a blessing." },
  { name: "@hafidh_student", text: "The Arabic text is beautiful and the duas are accurate with references. Jazakallah." },
];

const doubled = [...reviews, ...reviews];

export default function SocialProof() {
  return (
    <section className="py-16 relative overflow-hidden border-y border-border">
      {/* Gradient masks */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />

      <div className="max-w-7xl mx-auto px-4 mb-8 text-center">
        <div className="inline-flex items-center gap-2">
          <span className="mono text-4xl font-bold text-primary-500">10,000+</span>
          <span className="text-muted text-sm">Muslims growing with Jannatie</span>
        </div>
      </div>

      <div className="flex animate-ticker whitespace-nowrap gap-4">
        {doubled.map((review, i) => (
          <div
            key={i}
            className="inline-flex flex-shrink-0 items-start gap-3 bg-card border border-border rounded-xl px-5 py-4 w-72"
          >
            <div>
              <div className="flex gap-0.5 mb-1">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} size={12} fill="#E07B00" className="text-accent" />
                ))}
              </div>
              <p className="text-xs text-foreground leading-relaxed whitespace-normal">{review.text}</p>
              <p className="text-[11px] text-muted mt-2 font-medium">{review.name}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
