"use client";

import { useAuth } from "@/lib/auth-context";
import { Building2, Users, Calendar, TrendingUp, Plus, ChevronRight, Check } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const FEATURES = [
  "Unlimited congregation accounts",
  "Event management and RSVPs",
  "Congregation-wide analytics",
  "Collective leaderboard",
  "Custom mosque branding",
  "Dedicated support line",
];

const glassCard = {
  background: "rgba(255, 255, 255, 0.65)",
  border: "1px solid rgba(255, 255, 255, 0.80)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  boxShadow: "0 4px 24px rgba(15, 23, 42, 0.07)",
} as const;

export default function MosquePage() {
  const { profile } = useAuth();
  const hasMosquePlan = profile?.plan === "mosque" || profile?.plan === "school";

  if (!hasMosquePlan) {
    return (
      <div className="min-h-screen">
        <div className="max-w-2xl mx-auto px-5 py-16 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex justify-center mb-6">
              <Building2 size={44} className="text-slate-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-3">Mosque Admin Dashboard</h1>
            <p className="text-slate-500 mb-8 leading-relaxed max-w-md mx-auto">
              The Mosque plan gives your community a powerful dashboard with event management,
              congregation analytics, collective XP tracking and more.
            </p>

            <div className="rounded-2xl p-8 mb-6 text-left" style={glassCard}>
              <h2 className="font-semibold text-slate-800 mb-5">What is included</h2>
              <ul className="space-y-3">
                {FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-slate-600">
                    <Check size={15} className="text-emerald-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href="/pricing#mosque"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors text-sm"
            >
              Get Mosque plan <ChevronRight size={16} />
            </Link>
            <p className="text-xs text-slate-400 mt-3">From £29 per month</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-5 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Mosque Dashboard</h1>
            <p className="text-sm text-slate-400 mt-0.5">Manage your community and track collective growth.</p>
          </div>
          <button className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
            <Plus size={14} /> Add event
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total members", value: "0", Icon: Users },
            { label: "Active this week", value: "0", Icon: TrendingUp },
            { label: "Events this month", value: "0", Icon: Calendar },
            { label: "Total XP earned", value: "0", Icon: TrendingUp },
          ].map(({ label, value, Icon }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <div className="rounded-2xl p-5" style={glassCard}>
                <Icon size={18} className="text-slate-400 mb-3" />
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-400 mt-1">{label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Recent events */}
          <div className="rounded-2xl p-6" style={glassCard}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800">Recent Events</h2>
              <Link href="/calendar" className="text-xs text-slate-400 hover:text-blue-600 transition-colors">
                Manage
              </Link>
            </div>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar size={28} className="text-slate-200 mb-3" />
              <p className="text-sm text-slate-400">No events yet. Add your first event to get started.</p>
            </div>
          </div>

          {/* Community XP */}
          <div className="rounded-2xl p-6" style={glassCard}>
            <h2 className="font-semibold text-slate-800 mb-4">Community Growth</h2>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <TrendingUp size={28} className="text-slate-200 mb-3" />
              <p className="text-sm text-slate-400">XP data will appear here as members complete habits and lessons.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
