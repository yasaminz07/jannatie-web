"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, CheckCircle, Lock, Clock, Star } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useSearchParams } from "next/navigation";
import { GEM_PACKS } from "@/lib/gemPacks";

const AD_GEMS = 5;
const MAX_ADS_PER_DAY = 5;
const AD_DURATION_SEC = 30;

// ─── Pack card ────────────────────────────────────────────────────────────────
function GemPackCard({
  pack, onBuy, loading,
}: {
  pack: (typeof GEM_PACKS)[number];
  onBuy: (packId: string) => void;
  loading: boolean;
}) {
  const popular = pack.id === "gems_1500";
  const poundsStr = `£${(pack.pence / 100).toFixed(2)}`;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative rounded-2xl p-4 cursor-pointer"
      style={
        popular
          ? { background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.12))", border: "1.5px solid rgba(99,102,241,0.35)" }
          : { background: "rgba(248,250,252,0.9)", border: "1px solid rgba(226,232,240,0.7)" }
      }
      onClick={() => !loading && onBuy(pack.id)}
    >
      {popular && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
          BEST VALUE
        </span>
      )}
      <div className="text-center">
        <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
          {pack.gems.toLocaleString()}
        </p>
        <p className="text-xs text-amber-500 font-semibold mb-3">💎 gems</p>
        <p className={`text-sm font-bold ${popular ? "text-indigo-700 dark:text-indigo-300" : "text-slate-600 dark:text-slate-400"}`}>
          {pack.label}
        </p>
        <button
          className="mt-3 w-full py-2 rounded-xl text-sm font-bold text-white transition-all"
          style={
            popular
              ? { background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }
              : { background: "rgba(99,102,241,0.8)" }
          }
          disabled={loading}
        >
          {poundsStr}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Simulated ad player ──────────────────────────────────────────────────────
function AdPlayer({
  onComplete, onCancel,
}: { onComplete: () => void; onCancel: () => void }) {
  const [timeLeft, setTimeLeft] = useState(AD_DURATION_SEC);

  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
    >
      <div className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: "#0f172a" }}>
        {/* Ad placeholder */}
        <div className="relative h-48 flex flex-col items-center justify-center"
          style={{ background: "linear-gradient(135deg, #1e1b4b, #312e81)" }}>
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-3">
            <Star size={28} className="text-amber-300" />
          </div>
          <p className="text-white font-bold text-lg">Advertisement</p>
          <p className="text-white/50 text-xs mt-1">Support Jannatie by watching this ad</p>
          <span className="absolute top-3 left-3 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">
            AD
          </span>
        </div>

        {/* Timer row */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm">
              You&apos;ll earn <span className="text-amber-400 font-bold">+{AD_GEMS} 💎</span>
            </span>
            <span className="text-white/60 text-sm flex items-center gap-1">
              <Clock size={13} />
              {timeLeft}s
            </span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-amber-400 rounded-full"
              style={{ width: `${((AD_DURATION_SEC - timeLeft) / AD_DURATION_SEC) * 100}%` }}
            />
          </div>
          <button
            onClick={onCancel}
            className="mt-4 w-full py-2 text-white/40 text-xs hover:text-white/70 transition-colors"
          >
            Cancel (gems not awarded)
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function GemsPage() {
  const { user, profile } = useAuth();
  const searchParams = useSearchParams();

  // Purchased gems success banner (from ?purchased=500 redirect)
  const purchasedAmount = searchParams.get("purchased");
  const [showPurchasedBanner, setShowPurchasedBanner] = useState(!!purchasedAmount);
  useEffect(() => {
    if (purchasedAmount) {
      const t = setTimeout(() => setShowPurchasedBanner(false), 6000);
      return () => clearTimeout(t);
    }
  }, [purchasedAmount]);

  // Ad state
  const [adPlaying, setAdPlaying] = useState(false);
  const [adLoading, setAdLoading] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);
  const [adSuccess, setAdSuccess] = useState(false);
  const [adsToday, setAdsToday] = useState<number | null>(null);

  // Pack purchase state
  const [buyingPack, setBuyingPack] = useState<string | null>(null);
  const [buyError, setBuyError] = useState<string | null>(null);

  // Load today's ad count from profile.adWatchDate / adWatchCount
  useEffect(() => {
    if (!profile) return;
    const today = new Date().toISOString().split("T")[0];
    if (profile.adWatchDate === today) {
      setAdsToday(parseInt(profile.adWatchCount ?? "0") || 0);
    } else {
      setAdsToday(0);
    }
  }, [profile]);

  const adsRemaining = MAX_ADS_PER_DAY - (adsToday ?? MAX_ADS_PER_DAY);
  const canWatchAd = adsRemaining > 0;

  // ── Watch ad flow ────────────────────────────────────────────────────────────
  function startAd() {
    if (!canWatchAd || adLoading) return;
    setAdError(null);
    setAdPlaying(true);
  }

  const handleAdComplete = useCallback(async () => {
    setAdPlaying(false);
    setAdLoading(true);
    setAdError(null);
    try {
      const res = await fetch("/api/gems/ad-reward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user!.uid }),
      });
      const data = await res.json() as { gemsAwarded?: number; adsToday?: number; error?: string; limitReached?: boolean };
      if (!res.ok) {
        setAdError(data.limitReached ? "You&apos;ve reached today&apos;s limit." : (data.error ?? "Something went wrong."));
      } else {
        setAdsToday(data.adsToday ?? null);
        setAdSuccess(true);
        setTimeout(() => setAdSuccess(false), 3500);
      }
    } catch {
      setAdError("Network error. Please try again.");
    } finally {
      setAdLoading(false);
    }
  }, [user]);

  function cancelAd() {
    setAdPlaying(false);
  }

  // ── Buy gem pack ─────────────────────────────────────────────────────────────
  async function buyPack(packId: string) {
    if (!user || !profile || buyingPack) return;
    setBuyingPack(packId);
    setBuyError(null);
    try {
      const res = await fetch("/api/gems/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId, userId: user.uid, userEmail: user.email }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setBuyError(data.error ?? "Failed to open checkout.");
      } else {
        window.location.href = data.url;
      }
    } catch {
      setBuyError("Network error. Please try again.");
    } finally {
      setBuyingPack(null);
    }
  }

  if (!user || !profile) return null;

  const gemBalance = profile.gems ?? 0;

  return (
    <>
      <AnimatePresence>
        {adPlaying && (
          <AdPlayer onComplete={handleAdComplete} onCancel={cancelAd} />
        )}
      </AnimatePresence>

      <div className="min-h-screen p-4 max-w-lg mx-auto">
        {/* Purchased success banner */}
        <AnimatePresence>
          {showPurchasedBanner && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="mb-4 rounded-2xl px-4 py-3 flex items-center gap-3"
              style={{ background: "rgba(209,250,229,0.9)", border: "1px solid rgba(52,211,153,0.4)" }}
            >
              <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" />
              <p className="text-sm font-semibold text-emerald-800">
                +{purchasedAmount} 💎 gems added to your account!
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="text-center py-6">
          <p className="text-5xl font-black text-slate-900 dark:text-white">
            {gemBalance.toLocaleString()}
          </p>
          <p className="text-amber-500 font-bold mt-1">💎 gems</p>
          <p className="text-xs text-slate-400 mt-2">
            Spend gems on streak freezes, heart refills, and more
          </p>
        </div>

        {/* ── Earn free gems section ──────────────────────────────────────────── */}
        <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 px-1">
          Earn Free Gems
        </h2>

        <div className="rounded-2xl p-4 mb-6"
          style={{ background: "rgba(254,243,199,0.6)", border: "1px solid rgba(251,191,36,0.3)" }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(251,191,36,0.2)" }}>
              <Play size={22} className="text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Watch an Ad</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {canWatchAd
                  ? `Earn +${AD_GEMS} 💎 · ${adsRemaining} of ${MAX_ADS_PER_DAY} remaining today`
                  : "You've watched all 5 ads today — come back tomorrow!"}
              </p>
              {adError && <p className="text-xs text-red-500 mt-1">{adError}</p>}
              {adSuccess && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-emerald-600 font-semibold mt-1"
                >
                  +{AD_GEMS} gems earned! ✓
                </motion.p>
              )}
            </div>
            <button
              onClick={startAd}
              disabled={!canWatchAd || adLoading || adPlaying}
              className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all"
              style={
                canWatchAd && !adLoading
                  ? { background: "rgba(251,191,36,0.9)", color: "#78350f" }
                  : { background: "rgba(226,232,240,0.7)", color: "#94a3b8" }
              }
            >
              {adLoading ? "…" : canWatchAd ? "Watch" : <Lock size={14} />}
            </button>
          </div>

          {/* Progress bar of ads watched today */}
          {adsToday !== null && (
            <div className="mt-3">
              <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${(adsToday / MAX_ADS_PER_DAY) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-amber-600 text-right mt-0.5">{adsToday}/{MAX_ADS_PER_DAY} today</p>
            </div>
          )}
        </div>

        {/* ── Buy gems section ────────────────────────────────────────────────── */}
        <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 px-1">
          Buy Gems
        </h2>

        {buyError && (
          <p className="text-sm text-red-500 mb-3 px-1">{buyError}</p>
        )}

        <div className="grid grid-cols-2 gap-3 mb-6">
          {GEM_PACKS.map((pack) => (
            <GemPackCard
              key={pack.id}
              pack={pack}
              onBuy={buyPack}
              loading={buyingPack === pack.id}
            />
          ))}
        </div>

        {/* ── What can I spend gems on? ────────────────────────────────────────── */}
        <div className="rounded-2xl p-4"
          style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.12)" }}>
          <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-3">
            What can I spend gems on?
          </p>
          <div className="space-y-2">
            {[
              { icon: "🛡️", label: "Streak Freeze", detail: "Protect your streak for 1 day — 25 💎" },
              { icon: "❤️", label: "Heart Refill",  detail: "Restore all 5 hearts instantly — 20 💎" },
              { icon: "⏭️", label: "Skip Question",  detail: "Skip a hard question in a lesson — 10 💎" },
            ].map(({ icon, label, detail }) => (
              <div key={label} className="flex items-center gap-3 text-sm">
                <span className="text-lg leading-none">{icon}</span>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 leading-tight">{label}</p>
                  <p className="text-xs text-slate-400">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-300 mt-6 pb-4">
          Payments are processed securely by Stripe. Gems are non-refundable.
        </p>
      </div>
    </>
  );
}
