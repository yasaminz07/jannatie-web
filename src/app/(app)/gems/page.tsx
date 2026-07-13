"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, CheckCircle, Lock, Clock, Star, Gem, Shield, Heart, SkipForward } from "lucide-react";
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
    <motion.button
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => !loading && onBuy(pack.id)}
      disabled={loading}
      className={`relative rounded-3xl p-5 text-center ${popular ? "" : "glass-card"}`}
      style={popular ? {
        background: "rgba(255,255,255,0.65)",
        backdropFilter: "blur(24px) saturate(170%)",
        WebkitBackdropFilter: "blur(24px) saturate(170%)",
        border: "1.5px solid rgba(99,102,241,0.45)",
        boxShadow: "0 18px 44px rgba(79,70,229,0.18), inset 0 1px 0 rgba(255,255,255,0.95)",
      } : undefined}
    >
      {popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap"
          style={{ background: "linear-gradient(135deg, #3b82f6, #4f46e5)", boxShadow: "0 4px 12px rgba(79,70,229,0.35)" }}>
          BEST VALUE
        </span>
      )}

      {/* Gem icon with soft glow */}
      <div className="relative w-12 h-12 mx-auto mb-3">
        <div className="absolute inset-0 rounded-2xl bg-blue-400/20 blur-lg" />
        <div className="relative w-12 h-12 rounded-2xl flex items-center justify-center border border-white/70"
          style={{ background: "linear-gradient(135deg, rgba(219,234,254,0.9), rgba(224,231,255,0.9))" }}>
          <Gem size={22} className="text-blue-500" />
        </div>
      </div>

      <p className="text-2xl font-black text-slate-900 tracking-tight">
        {pack.gems.toLocaleString()}
      </p>
      <p className="text-xs text-slate-400 font-medium mb-4">{pack.label} pack</p>

      <span
        className="block w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all"
        style={{
          background: "linear-gradient(135deg, #3b82f6, #4f46e5)",
          boxShadow: "0 6px 18px rgba(59,130,246,0.28), inset 0 1px 0 rgba(255,255,255,0.30)",
        }}
      >
        {loading ? "Opening…" : poundsStr}
      </span>
    </motion.button>
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
      style={{ background: "rgba(15,23,42,0.60)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
    >
      <motion.div
        initial={{ scale: 0.94, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{
          background: "rgba(15,23,42,0.92)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 32px 80px rgba(15,23,42,0.5), inset 0 1px 0 rgba(255,255,255,0.12)",
        }}
      >
        {/* Ad placeholder */}
        <div className="relative h-48 flex flex-col items-center justify-center overflow-hidden"
          style={{ background: "linear-gradient(135deg, #1e1b4b, #312e81)" }}>
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-3 border border-white/15">
            <Star size={28} className="text-amber-300" />
          </div>
          <p className="text-white font-bold text-lg">Advertisement</p>
          <p className="text-white/50 text-xs mt-1">Support Jannatie by watching this ad</p>
          <span className="absolute top-3 left-3 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full border border-white/10">
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
              className="h-full rounded-full"
              style={{
                width: `${((AD_DURATION_SEC - timeLeft) / AD_DURATION_SEC) * 100}%`,
                background: "linear-gradient(90deg, #fbbf24, #f59e0b)",
              }}
            />
          </div>
          <button
            onClick={onCancel}
            className="mt-4 w-full py-2 text-white/40 text-xs hover:text-white/70 transition-colors"
          >
            Cancel (gems not awarded)
          </button>
        </div>
      </motion.div>
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
        setAdError(data.limitReached ? "You've reached today's limit." : (data.error ?? "Something went wrong."));
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

      <div className="min-h-screen p-4 sm:p-6 max-w-2xl mx-auto">
        {/* Purchased success banner */}
        <AnimatePresence>
          {showPurchasedBanner && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="glass-card mb-4 rounded-2xl px-4 py-3 flex items-center gap-3"
              style={{ borderColor: "rgba(52,211,153,0.45)" }}
            >
              <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" />
              <p className="text-sm font-semibold text-emerald-700">
                +{purchasedAmount} 💎 gems added to your account!
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Balance hero ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-deep relative overflow-hidden rounded-[2rem] px-6 py-10 mb-8 text-center"
        >
          {/* soft glows inside the panel */}
          <div className="absolute -top-16 -left-10 w-56 h-56 rounded-full bg-blue-400/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-8 w-64 h-64 rounded-full bg-indigo-400/15 blur-3xl pointer-events-none" />

          <div className="relative">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
              className="relative w-16 h-16 mx-auto mb-4"
            >
              <div className="absolute inset-0 rounded-3xl bg-blue-400/25 blur-xl" />
              <div className="relative w-16 h-16 rounded-3xl flex items-center justify-center border border-white/80"
                style={{ background: "linear-gradient(135deg, rgba(219,234,254,0.95), rgba(224,231,255,0.95))" }}>
                <Gem size={30} className="text-blue-500" />
              </div>
            </motion.div>

            <p className="text-5xl font-black text-slate-900 tracking-tight mb-1">
              {gemBalance.toLocaleString()}
            </p>
            <p className="text-sm font-semibold text-blue-500 mb-2">gems</p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Spend gems on streak freezes, heart refills and more
            </p>
          </div>
        </motion.div>

        {/* ── Earn free gems ───────────────────────────────────────────────────── */}
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
          Earn Free Gems
        </h2>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="glass-card rounded-3xl p-5 mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 flex-shrink-0">
              <div className="absolute inset-0 rounded-2xl bg-amber-400/25 blur-lg" />
              <div className="relative w-12 h-12 rounded-2xl flex items-center justify-center border border-white/70"
                style={{ background: "linear-gradient(135deg, rgba(254,243,199,0.95), rgba(253,230,138,0.75))" }}>
                <Play size={20} className="text-amber-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900">Watch an Ad</p>
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
              className="flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                boxShadow: canWatchAd ? "0 6px 18px rgba(245,158,11,0.30), inset 0 1px 0 rgba(255,255,255,0.35)" : "none",
              }}
            >
              {adLoading ? "…" : canWatchAd ? "Watch" : <Lock size={14} />}
            </button>
          </div>

          {/* Progress bar of ads watched today */}
          {adsToday !== null && (
            <div className="mt-4">
              <div className="h-1.5 bg-slate-200/60 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(adsToday / MAX_ADS_PER_DAY) * 100}%`,
                    background: "linear-gradient(90deg, #fbbf24, #f59e0b)",
                  }}
                />
              </div>
              <p className="text-[10px] text-slate-400 text-right mt-1">{adsToday}/{MAX_ADS_PER_DAY} today</p>
            </div>
          )}
        </motion.div>

        {/* ── Buy gems ─────────────────────────────────────────────────────────── */}
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
          Buy Gems
        </h2>

        {buyError && (
          <div className="glass-card rounded-2xl px-4 py-3 mb-3" style={{ borderColor: "rgba(248,113,113,0.45)" }}>
            <p className="text-sm text-red-500">{buyError}</p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 pt-2">
          {GEM_PACKS.map((pack, i) => (
            <motion.div
              key={pack.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + i * 0.06 }}
            >
              <GemPackCard
                pack={pack}
                onBuy={buyPack}
                loading={buyingPack === pack.id}
              />
            </motion.div>
          ))}
        </div>

        {/* ── What can I spend gems on? ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card rounded-3xl p-5"
        >
          <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-4">
            What can I spend gems on?
          </p>
          <div className="space-y-3">
            {[
              { Icon: Shield,      tint: "text-blue-500",    bg: "rgba(219,234,254,0.8)", label: "Streak Freeze", detail: "Protect your streak for 1 day — 25 💎" },
              { Icon: Heart,       tint: "text-rose-500",    bg: "rgba(254,226,226,0.8)", label: "Heart Refill",  detail: "Restore all 5 hearts instantly — 20 💎" },
              { Icon: SkipForward, tint: "text-indigo-500",  bg: "rgba(224,231,255,0.8)", label: "Skip Question", detail: "Skip a hard question in a lesson — 10 💎" },
            ].map(({ Icon, tint, bg, label, detail }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/70"
                  style={{ background: bg }}>
                  <Icon size={16} className={tint} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 leading-tight">{label}</p>
                  <p className="text-xs text-slate-400">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <p className="text-center text-[11px] text-slate-300 mt-6 pb-4">
          Payments are processed securely by Stripe. Gems are non-refundable.
        </p>
      </div>
    </>
  );
}
