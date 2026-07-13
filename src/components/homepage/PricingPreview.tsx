"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Free",
    monthly: 0,
    annualTotal: 0,
    description: "Get started with the essentials.",
    features: ["Core habit tracker", "10 lessons per month", "5 AI messages per day", "Islamic calendar", "Basic progress stats"],
    cta: "Start free",
    ctaHref: "/signup",
    highlight: false,
  },
  {
    name: "Premium",
    monthly: 4.99,
    annualTotal: 49.99,
    description: "Unlimited growth for committed Muslims.",
    features: ["Everything in Free", "Unlimited AI messages", "Unlimited lessons", "Full analytics dashboard", "Offline mode", "Priority support"],
    cta: "Start Premium",
    ctaHref: "/signup?plan=premium",
    highlight: true,
    popular: true,
  },
  {
    name: "Family",
    monthly: 9.99,
    annualTotal: null,
    description: "Grow together with up to 5 accounts.",
    features: ["5 family accounts", "All Premium features", "Family leaderboard", "Shared Islamic calendar", "Parental controls"],
    cta: "Get Family plan",
    ctaHref: "/signup?plan=family",
    highlight: false,
  },
];

export default function PricingPreview() {
  const [annual, setAnnual] = useState(false);

  return (
    <section className="relative py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4">Simple, honest pricing.</h2>
          <p className="text-slate-500 text-lg mb-8">Start free. Upgrade when you&apos;re ready.</p>

          <div className="glass-card inline-flex items-center gap-1 rounded-full p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${!annual ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-700"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${annual ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-700"}`}
            >
              Annual
              <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Save up to 33%</span>
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {plans.map(({ name, monthly, annualTotal, description, features, cta, ctaHref, highlight, popular }, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative rounded-3xl p-8 ${highlight ? "" : "glass-card glass-card-hover"}`}
              style={highlight ? {
                background: "linear-gradient(150deg, #3b82f6 0%, #4f46e5 100%)",
                boxShadow: "0 24px 60px rgba(59,130,246,0.35), inset 0 1px 0 rgba(255,255,255,0.35)",
                border: "1px solid rgba(255,255,255,0.25)",
              } : undefined}
            >
              {popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold px-4 py-1.5 rounded-full">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className={`text-lg font-bold mb-1 ${highlight ? "text-white" : "text-slate-900"}`}>{name}</h3>
                <p className={`text-sm ${highlight ? "text-blue-100" : "text-slate-500"}`}>{description}</p>
              </div>

              <div className="mb-8">
                <div className={`text-5xl font-black ${highlight ? "text-white" : "text-slate-900"}`}>
                  {monthly === 0
                    ? "Free"
                    : `£${annual && annualTotal ? (annualTotal / 12).toFixed(2) : monthly}`}
                </div>
                {monthly > 0 && (
                  <p className={`text-sm mt-1 ${highlight ? "text-blue-100" : "text-slate-400"}`}>
                    {annual && annualTotal
                      ? `£${annualTotal}/year`
                      : "per month"}
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check
                      size={14}
                      className={`flex-shrink-0 mt-0.5 ${highlight ? "text-white" : "text-blue-600"}`}
                      strokeWidth={2.5}
                    />
                    <span className={highlight ? "text-blue-50" : "text-slate-600"}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={ctaHref}
                className={`block text-center font-semibold py-3.5 rounded-xl transition-all text-sm ${
                  highlight
                    ? "bg-white text-blue-600 hover:bg-blue-50"
                    : "bg-slate-900 text-white hover:bg-slate-800"
                }`}
              >
                {cta}
              </Link>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-sm text-slate-400 mt-8">
          Also available: Mosque (£29/mo) and School (£49/mo) plans.{" "}
          <Link href="/pricing" className="text-blue-600 hover:underline font-medium">
            See full pricing
          </Link>
        </p>
      </div>
    </section>
  );
}
