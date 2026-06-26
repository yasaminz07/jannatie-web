"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Check, Building2, GraduationCap } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

const individualPlans = [
  {
    name: "Free",
    monthly: 0,
    annual: 0,
    description: "Perfect for getting started.",
    features: [
      "Core habit tracker (unlimited habits)",
      "10 lessons per month",
      "5 AI Buddy messages per day",
      "Islamic calendar access",
      "Basic XP & streak tracking",
      "Community leaderboard",
    ],
    notIncluded: ["Offline mode", "Full analytics", "Unlimited AI messages"],
    cta: "Start free",
    href: "/signup",
    variant: "ghost" as const,
  },
  {
    name: "Premium",
    monthly: 4.99,
    annual: 49.99,
    description: "Unlimited growth for serious learners.",
    popular: true,
    features: [
      "Everything in Free",
      "Unlimited AI Buddy messages",
      "Unlimited lessons & topics",
      "Full analytics dashboard",
      "Offline mode (PWA)",
      "Streak Shield weekly pass",
      "Priority customer support",
      "Early access to new features",
    ],
    cta: "Start Premium",
    href: "/signup?plan=premium",
    variant: "primary" as const,
  },
  {
    name: "Family",
    monthly: 9.99,
    annual: null,
    description: "Up to 5 accounts. Grow together.",
    features: [
      "5 separate family accounts",
      "All Premium features for each account",
      "Family dashboard & leaderboard",
      "Shared Islamic calendar events",
      "Parental controls & insights",
      "One shared billing",
    ],
    cta: "Get Family plan",
    href: "/signup?plan=family",
    variant: "accent" as const,
  },
];

const institutionPlans = [
  {
    icon: Building2,
    name: "Mosque",
    monthly: 29,
    description: "For mosques and Islamic centres.",
    features: [
      "Unlimited congregation accounts",
      "Community dashboard & analytics",
      "Event management & RSVPs",
      "Congregation-wide leaderboard",
      "Custom mosque branding",
      "Dedicated support",
    ],
    href: "/signup?plan=mosque",
  },
  {
    icon: GraduationCap,
    name: "School",
    monthly: 49,
    description: "For Islamic schools and academies.",
    features: [
      "Class management tools",
      "Student progress tracking",
      "Teacher dashboard",
      "Curriculum-aligned lessons",
      "Parent reporting",
      "Safeguarding compliant",
    ],
    href: "/signup?plan=school",
  },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const { user } = useAuth();

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20 bg-[#fafafa]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center py-16">
            <h1 className="text-5xl font-bold text-foreground mb-5">Simple, honest pricing</h1>
            <p className="text-xl text-muted mb-8">Start free. No credit card required.</p>

            {/* Toggle */}
            <div className="inline-flex items-center gap-3 bg-card border border-border rounded-full p-1">
              <button
                onClick={() => setAnnual(false)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${!annual ? "bg-foreground text-white" : "text-muted"}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${annual ? "bg-foreground text-white" : "text-muted"}`}
              >
                Annual
                <span className="bg-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Save 17%</span>
              </button>
            </div>
          </div>

          {/* Individual plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {individualPlans.map(({ name, monthly, annual: annualPrice, description, features, notIncluded, cta, href, variant, popular }) => (
              <div
                key={name}
                className={`relative bg-card rounded-2xl p-8 border ${popular ? "border-primary-500 shadow-blue-glow" : "border-border"}`}
              >
                {popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                    Most Popular
                  </div>
                )}

                <h2 className="text-2xl font-bold text-foreground mb-1">{name}</h2>
                <p className="text-sm text-muted mb-6">{description}</p>

                <div className="mb-6">
                  <span className="mono text-5xl font-bold text-foreground">
                    {monthly === 0 ? "£0" : `£${annual && annualPrice ? (annualPrice / 12).toFixed(2) : monthly}`}
                  </span>
                  {monthly > 0 && <span className="text-muted text-sm ml-1">/mo</span>}
                  {annual && annualPrice && (
                    <p className="text-xs text-muted mt-1">Billed as £{annualPrice}/year</p>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                      <Check size={15} className="text-primary-500 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                  {notIncluded?.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted line-through">
                      <div className="w-3.5 h-3.5 border border-gray-300 rounded-full flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={
                    user && (name === "Premium" || name === "Family")
                      ? `/checkout?plan=${name.toLowerCase()}&interval=${annual ? "annual" : "monthly"}`
                      : href
                  }
                  className={`block text-center font-semibold py-3 rounded-xl transition-all duration-150 ${
                    variant === "primary"
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : variant === "accent"
                      ? "border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                      : "border border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  {cta}
                </Link>
              </div>
            ))}
          </div>

          {/* Institution plans */}
          <div className="border-t border-border pt-16 mb-8">
            <h2 className="text-3xl font-bold text-foreground text-center mb-3">For organisations</h2>
            <p className="text-muted text-center mb-10">Tools for mosques, Islamic centres, and schools.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {institutionPlans.map(({ icon: Icon, name, monthly, description, features, href }) => (
                <div key={name} className="bg-card border border-border rounded-2xl p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon size={22} className="text-primary-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{name}</h3>
                      <p className="text-sm text-muted">{description}</p>
                    </div>
                  </div>
                  <div className="mb-6">
                    <span className="mono text-4xl font-bold text-foreground">£{monthly}</span>
                    <span className="text-muted text-sm ml-1">/month</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                        <Check size={15} className="text-primary-500 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={href}
                    className="block text-center font-semibold py-3 rounded-xl border border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white transition-all"
                  >
                    Get started with {name}
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-16 bg-primary-50 rounded-2xl p-10">
            <h3 className="text-2xl font-bold text-foreground mb-8 text-center">Frequently asked questions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { q: "Can I cancel anytime?", a: "Yes. Cancel from your settings page at any time. No questions asked." },
                { q: "Is my data private?", a: "Absolutely. We are UK GDPR compliant and never sell your data." },
                { q: "Are the Islamic rulings accurate?", a: "All content is scholar-reviewed, with hadith references cited for verification." },
                { q: "Does it work offline?", a: "Premium and above includes full PWA offline mode on any device." },
              ].map(({ q, a }) => (
                <div key={q}>
                  <h4 className="font-semibold text-foreground text-sm mb-1">{q}</h4>
                  <p className="text-sm text-muted leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
