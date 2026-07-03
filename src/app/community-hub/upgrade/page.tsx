"use client";

import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  BadgeCheck, Calendar, Bell, Users, Sparkles, BarChart2,
  UserPlus, LifeBuoy, Check, X, Crown, ArrowLeft,
} from "lucide-react";

const PREMIUM_FEATURES = [
  {
    icon: <BadgeCheck size={18} className="text-blue-500" />,
    label: "Verified badge",
    desc: "Blue verified checkmark on your profile and all event cards",
  },
  {
    icon: <Calendar size={18} className="text-emerald-500" />,
    label: "Unlimited events",
    desc: "Post as many events as you like — no monthly cap",
  },
  {
    icon: <Bell size={18} className="text-amber-500" />,
    label: "Notify followers on new events",
    desc: "Send in-app push notifications to all your followers when you post",
  },
  {
    icon: <Users size={18} className="text-violet-500" />,
    label: "RSVP — see who is attending",
    desc: "Followers can mark themselves as going and you see the count per event",
  },
  {
    icon: <Sparkles size={18} className="text-amber-400" />,
    label: "Featured placement in discovery",
    desc: "Your events appear at the top of the Discover feed",
  },
  {
    icon: <BarChart2 size={18} className="text-blue-500" />,
    label: "Advanced analytics and follower growth",
    desc: "Engagement rates, best day to post, RSVP counts, CSV export",
  },
  {
    icon: <UserPlus size={18} className="text-slate-500" />,
    label: "Up to 3 team members",
    desc: "Invite team members to your community account",
  },
  {
    icon: <LifeBuoy size={18} className="text-rose-500" />,
    label: "Priority support",
    desc: "Direct email support with faster response times",
  },
];

const FREE_LIMITS = [
  { label: "3 events per month", included: true },
  { label: "Basic analytics", included: true },
  { label: "Verified badge", included: false },
  { label: "Follower notifications", included: false },
  { label: "RSVP system", included: false },
  { label: "Featured placement", included: false },
  { label: "Team members", included: false },
];

export default function UpgradePage() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [loading, setLoading] = useState(false);

  const price = billing === "monthly" ? "14.99" : "9.99";
  const annualSaving = billing === "annual" ? "Save 33%" : null;

  function handleGetPremium() {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success(
        "Our team will contact you shortly to set up your premium account. Email: hello@jannatie.com",
        { duration: 8000 }
      );
    }, 600);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
      {/* Back link */}
      <Link
        href="/community-hub"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-6"
      >
        <ArrowLeft size={14} /> Back to dashboard
      </Link>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5 text-amber-700 text-sm font-semibold mb-4">
          <Crown size={14} /> Community Premium
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-3">
          Grow your community with Premium
        </h1>
        <p className="text-slate-500 text-base max-w-lg mx-auto">
          Unlock the full power of Jannatie for businesses, mosques, and community organisations.
        </p>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <button
          onClick={() => setBilling("monthly")}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
            billing === "monthly"
              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
              : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBilling("annual")}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all flex items-center gap-2 ${
            billing === "annual"
              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
              : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
          }`}
        >
          Annual
          <span className="text-[11px] font-bold bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">
            Save 33%
          </span>
        </button>
      </div>

      {/* Pricing cards */}
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        {/* Free card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Free</p>
          <div className="flex items-baseline gap-1 mb-5">
            <p className="text-3xl font-bold text-slate-900">£0</p>
            <p className="text-slate-400 text-sm">/month</p>
          </div>

          <div className="space-y-3 mb-6">
            {FREE_LIMITS.map(({ label, included }) => (
              <div key={label} className="flex items-center gap-2.5">
                {included ? (
                  <Check size={14} className="text-emerald-500 flex-shrink-0" />
                ) : (
                  <X size={14} className="text-slate-300 flex-shrink-0" />
                )}
                <span className={`text-sm ${included ? "text-slate-700" : "text-slate-400"}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          <div className="w-full py-3 rounded-xl border-2 border-slate-200 text-center text-sm font-semibold text-slate-400">
            Current plan
          </div>
        </div>

        {/* Premium card */}
        <div
          className="rounded-3xl p-6 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
            boxShadow: "0 16px 40px rgba(59,130,246,0.30)",
          }}
        >
          <div className="absolute top-4 right-4">
            <span className="text-[11px] font-bold bg-white/20 text-white rounded-full px-2.5 py-1">
              Most popular
            </span>
          </div>

          <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-2">Premium</p>
          <div className="flex items-baseline gap-1 mb-1">
            <p className="text-3xl font-bold text-white">£{price}</p>
            <p className="text-blue-200 text-sm">/month</p>
          </div>
          {annualSaving && (
            <p className="text-blue-200 text-xs mb-4">billed annually (£119.88/year)</p>
          )}
          {billing === "monthly" && <div className="mb-5" />}

          <div className="space-y-2.5 mb-6">
            {PREMIUM_FEATURES.slice(0, 5).map(({ label }) => (
              <div key={label} className="flex items-center gap-2.5">
                <Check size={14} className="text-white flex-shrink-0" />
                <span className="text-sm text-white/90">{label}</span>
              </div>
            ))}
            <div className="flex items-center gap-2.5">
              <Check size={14} className="text-white flex-shrink-0" />
              <span className="text-sm text-white/90">
                + {PREMIUM_FEATURES.length - 5} more features
              </span>
            </div>
          </div>

          <button
            onClick={handleGetPremium}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-white text-blue-700 font-semibold text-sm hover:bg-blue-50 transition-colors disabled:opacity-70 shadow-sm"
          >
            {loading ? "Processing..." : "Get Community Premium"}
          </button>
          <p className="text-center text-blue-200 text-xs mt-2">
            No card required · We will contact you
          </p>
        </div>
      </div>

      {/* All features breakdown */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 mb-6">
        <h2 className="text-base font-bold text-slate-900 mb-5">Everything included in Premium</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {PREMIUM_FEATURES.map(({ icon, label, desc }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                {icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{label}</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-snug">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact CTA */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 text-center">
        <p className="text-sm font-semibold text-slate-700 mb-1">Questions? We are here to help.</p>
        <p className="text-xs text-slate-400 mb-3">
          Our team handles all community premium accounts manually to ensure the best onboarding experience.
        </p>
        <a
          href="mailto:hello@jannatie.com"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          Contact us at hello@jannatie.com
        </a>
      </div>
    </div>
  );
}
