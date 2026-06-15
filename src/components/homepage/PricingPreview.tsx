"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Free",
    monthly: 0,
    annual: 0,
    description: "Get started with the essentials.",
    features: [
      "Core habit tracker",
      "10 lessons per month",
      "5 AI messages per day",
      "Islamic calendar",
      "Basic progress stats",
    ],
    cta: "Start free",
    ctaHref: "/signup",
    variant: "ghost" as const,
  },
  {
    name: "Premium",
    monthly: 4.99,
    annual: 39.99,
    description: "Unlimited growth for committed Muslims.",
    features: [
      "Everything in Free",
      "Unlimited AI messages",
      "Unlimited lessons",
      "Full analytics dashboard",
      "Offline mode",
      "Priority support",
    ],
    cta: "Start Premium",
    ctaHref: "/signup?plan=premium",
    variant: "primary" as const,
    popular: true,
  },
  {
    name: "Family",
    monthly: 9.99,
    annual: null,
    description: "Grow together — up to 5 accounts.",
    features: [
      "5 family accounts",
      "All Premium features",
      "Family leaderboard",
      "Shared Islamic calendar",
      "Parental controls",
    ],
    cta: "Get Family plan",
    ctaHref: "/signup?plan=family",
    variant: "accent" as const,
  },
];

export default function PricingPreview() {
  const [annual, setAnnual] = useState(false);

  return (
    <section className="py-24 bg-primary-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Simple, honest pricing
          </h2>
          <p className="text-muted text-lg mb-6">Start free. Upgrade when you&apos;re ready.</p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 bg-card border border-border rounded-full p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${!annual ? "bg-foreground text-white" : "text-muted"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${annual ? "bg-foreground text-white" : "text-muted"}`}
            >
              Annual
              <span className="bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                Save 33%
              </span>
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {plans.map(({ name, monthly, annual: annualPrice, description, features, cta, ctaHref, variant, popular }, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative bg-card rounded-2xl p-8 border ${popular ? "border-primary-500 shadow-blue-glow" : "border-border"}`}
            >
              {popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                  Most Popular
                </div>
              )}

              <h3 className="text-xl font-bold text-foreground mb-1">{name}</h3>
              <p className="text-sm text-muted mb-5">{description}</p>

              <div className="mb-6">
                <span className="mono text-4xl font-bold text-foreground">
                  {monthly === 0 ? "Free" : `£${annual && annualPrice ? (annualPrice / 12).toFixed(2) : monthly}`}
                </span>
                {monthly > 0 && (
                  <span className="text-muted text-sm ml-1">/mo</span>
                )}
                {annual && annualPrice && (
                  <p className="text-xs text-muted mt-1">£{annualPrice}/year billed annually</p>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                    <Check size={15} className="text-primary-500 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={ctaHref}
                className={`block text-center font-semibold py-3 rounded-xl transition-all duration-150 ${
                  variant === "primary"
                    ? "bg-primary-500 text-white hover:bg-primary-600 hover:shadow-blue-glow"
                    : variant === "accent"
                    ? "border-2 border-accent text-accent hover:bg-accent hover:text-white"
                    : "border border-foreground text-foreground hover:bg-foreground hover:text-white"
                }`}
              >
                {cta}
              </Link>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-sm text-muted mt-8">
          Also available: Mosque (£29/mo) and School (£49/mo) plans.{" "}
          <Link href="/pricing" className="text-primary-500 hover:underline">
            See full pricing →
          </Link>
        </p>
      </div>
    </section>
  );
}
