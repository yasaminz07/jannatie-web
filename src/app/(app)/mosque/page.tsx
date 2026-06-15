"use client";

import { useAuth } from "@/lib/auth-context";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Building2, Users, Calendar, TrendingUp, Plus } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const STATS = [
  { label: "Total members", value: "234", icon: Users, color: "text-primary-500" },
  { label: "Active this week", value: "189", icon: TrendingUp, color: "text-accent" },
  { label: "Events this month", value: "8", icon: Calendar, color: "text-primary-500" },
  { label: "Total XP earned", value: "12,450", icon: TrendingUp, color: "text-accent" },
];

const RECENT_EVENTS = [
  { title: "Friday Jumu'ah", date: "Fri 17 Jan", attendees: 145 },
  { title: "Sisters' Quran Circle", date: "Wed 15 Jan", attendees: 23 },
  { title: "Youth Halaqa", date: "Sun 12 Jan", attendees: 38 },
];

export default function MosquePage() {
  const { profile } = useAuth();
  const hasMosquePlan = profile?.plan === "mosque" || profile?.plan === "school";

  if (!hasMosquePlan) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Building2 size={36} className="text-primary-500" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-3">Mosque Admin Dashboard</h1>
        <p className="text-muted mb-8 leading-relaxed">
          The Mosque plan gives your community a powerful dashboard — event management,
          congregation analytics, collective XP tracking, and more.
        </p>
        <div className="bg-card border border-border rounded-2xl p-8 mb-6 text-left">
          <h2 className="font-semibold text-foreground mb-4">What&apos;s included:</h2>
          <ul className="space-y-2 text-sm text-muted">
            {[
              "Unlimited congregation accounts",
              "Event management and RSVPs",
              "Congregation-wide analytics",
              "Collective leaderboard",
              "Custom mosque branding",
              "Dedicated support line",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <span className="text-primary-500">✓</span> {f}
              </li>
            ))}
          </ul>
        </div>
        <Link href="/pricing#mosque">
          <Button size="lg">Get Mosque plan — £29/month</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mosque Dashboard</h1>
          <p className="text-sm text-muted mt-0.5">Manage your community and track collective growth.</p>
        </div>
        <Button size="sm" className="gap-1">
          <Plus size={14} /> Add event
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STATS.map(({ label, value, icon: Icon, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="p-5">
              <Icon size={18} className={`${color} mb-3`} />
              <p className="mono text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted mt-1">{label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent events */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Recent Events</h2>
            <Link href="/calendar" className="text-xs text-primary-500 hover:underline">Manage →</Link>
          </div>
          <div className="space-y-3">
            {RECENT_EVENTS.map((ev) => (
              <div key={ev.title} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-foreground">{ev.title}</p>
                  <p className="text-xs text-muted">{ev.date}</p>
                </div>
                <div className="flex items-center gap-1 text-muted">
                  <Users size={12} />
                  <span className="text-xs">{ev.attendees}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Community XP */}
        <Card className="p-6">
          <h2 className="font-semibold text-foreground mb-4">Community Growth</h2>
          <div className="space-y-3">
            {[
              { week: "This week", xp: 1240, change: "+12%" },
              { week: "Last week", xp: 1107, change: null },
              { week: "2 weeks ago", xp: 980, change: null },
            ].map(({ week, xp, change }) => (
              <div key={week} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-sm text-foreground">{week}</span>
                <div className="flex items-center gap-2">
                  <span className="mono text-sm font-bold text-foreground">{xp} XP</span>
                  {change && <span className="text-xs text-green-600 font-semibold">{change}</span>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
