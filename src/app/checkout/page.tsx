"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/layout/Navbar";
import { Check, Shield, RefreshCw, AlertCircle } from "lucide-react";
import Link from "next/link";

const PLANS: Record<string, { name: string; monthly: number; annual: number; annualTotal: number; features: string[] }> = {
  premium: {
    name: "Premium",
    monthly: 4.99,
    annual: 3.33,
    annualTotal: 39.99,
    features: [
      "Unlimited AI Buddy messages",
      "Unlimited lessons & topics",
      "Full analytics dashboard",
      "Offline mode (PWA)",
      "Streak Shield weekly pass",
      "Priority customer support",
      "Early access to new features",
    ],
  },
  family: {
    name: "Family",
    monthly: 9.99,
    annual: 6.66,
    annualTotal: 79.99,
    features: [
      "5 separate family accounts",
      "All Premium features for each account",
      "Family dashboard & leaderboard",
      "Shared Islamic calendar events",
      "Parental controls & insights",
      "One shared billing",
    ],
  },
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const planKey = searchParams.get("plan") ?? "premium";
  const interval = searchParams.get("interval") === "annual" ? "annual" : "monthly";
  const plan = PLANS[planKey] ?? PLANS.premium;
  const price = interval === "annual" ? plan.annual : plan.monthly;
  const billedAs = interval === "annual" ? `£${plan.annualTotal}/year` : null;

  useEffect(() => {
    if (!user) router.push(`/login?redirect=/checkout?plan=${planKey}&interval=${interval}`);
  }, [user, router, planKey, interval]);

  async function handlePay() {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey, interval, uid: user.uid, email: user.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create checkout session");
      window.location.href = data.url;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 pt-28 pb-16">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Complete your subscription</h1>
          <p className="text-sm text-slate-500">You are one step away from unlocking {plan.name}</p>
        </div>

        {/* Plan summary card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-4">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">Jannatie {plan.name}</p>
              <p className="text-2xl font-black text-slate-900">
                £{price.toFixed(2)}<span className="text-base font-medium text-slate-400">/mo</span>
              </p>
              {billedAs && <p className="text-xs text-slate-400 mt-0.5">Billed as {billedAs}</p>}
            </div>
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full capitalize">
              {interval}
            </span>
          </div>

          <ul className="space-y-2.5 mb-6">
            {plan.features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                <Check size={14} className="text-blue-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                {f}
              </li>
            ))}
          </ul>

          {/* Paying as */}
          <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-600">
            Paying as <span className="font-semibold text-slate-900">{profile?.displayName ?? user.email}</span>
            <span className="text-slate-400"> ({user.email})</span>
          </div>
        </div>

        {/* Subscription policy */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-6 space-y-3">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-widest">Subscription policy</p>
          <div className="space-y-2 text-xs text-amber-800 leading-relaxed">
            <div className="flex items-start gap-2">
              <RefreshCw size={12} className="flex-shrink-0 mt-0.5" />
              <p>Your subscription renews automatically each {interval === "annual" ? "year" : "month"} until cancelled.</p>
            </div>
            <div className="flex items-start gap-2">
              <Shield size={12} className="flex-shrink-0 mt-0.5" />
              <p>
                You can cancel anytime from your account settings. After cancelling, your Premium access continues until
                your current billing period ends — you will not be charged again.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
              <p>
                All payments are final. We do not offer refunds for partial billing periods. Cancellation stops future
                charges, but does not refund the current period.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-2xl text-sm transition-colors mb-3"
        >
          {loading ? "Redirecting to payment…" : `Pay £${price.toFixed(2)}/mo — Secure checkout`}
        </button>

        <p className="text-center text-xs text-slate-400 mb-4">
          Powered by Stripe · Your card details are never stored by Jannatie
        </p>

        <Link href="/pricing" className="block text-center text-sm text-slate-500 hover:text-slate-700 transition-colors">
          ← Back to pricing
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  );
}
