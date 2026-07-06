"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection, query, where, getDocs, getCountFromServer, orderBy, limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { CommunityEvent, EventComment, isCommunityPremium, getRsvpCount } from "@/lib/community-utils";
import {
  Heart, MessageCircle, Share2, Users, TrendingUp, BarChart2,
  CalendarDays, Clock, MessageSquare, Download, Lock, Crown, CheckCircle2,
} from "lucide-react";

interface EventStats {
  event: CommunityEvent;
  likes: number;
  comments: number;
  shares: number;
  rsvps: number;
  total: number;
  dayOfWeek: string;
}

interface ActivityItem {
  comment: EventComment;
  eventId: string;
  eventTitle: string;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function engagementColor(rate: number) {
  if (rate >= 10) return "text-emerald-600";
  if (rate >= 5) return "text-blue-600";
  if (rate >= 2) return "text-amber-600";
  return "text-slate-500";
}

export default function InsightsPage() {
  const { user, profile } = useAuth();
  const [eventStats, setEventStats] = useState<EventStats[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [followerCount, setFollowerCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const isPremium = isCommunityPremium(profile);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const [followerSnap, eventsSnap] = await Promise.all([
          getCountFromServer(
            query(collection(db, "users"), where("following", "array-contains", user.uid))
          ),
          getDocs(query(collection(db, "communityEvents"), where("communityUid", "==", user.uid))),
        ]);
        if (!cancelled) setFollowerCount(followerSnap.data().count);

        const events = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() } as CommunityEvent));
        if (events.length === 0) {
          if (!cancelled) { setEventStats([]); setLoading(false); }
          return;
        }

        const statsArr = await Promise.all(
          events.map(async event => {
            const [likeSnap, commentSnap] = await Promise.all([
              getCountFromServer(collection(db, "communityEvents", event.id, "likes")),
              getCountFromServer(collection(db, "communityEvents", event.id, "comments")),
            ]);
            let shares = 0;
            try {
              const shareSnap = await getCountFromServer(collection(db, "communityEvents", event.id, "shares"));
              shares = shareSnap.data().count;
            } catch { /* ignore */ }
            let rsvps = 0;
            if (isPremium) {
              try { rsvps = await getRsvpCount(event.id); } catch { /* ignore */ }
            }
            const likes = likeSnap.data().count;
            const comments = commentSnap.data().count;
            const dateObj = new Date(event.date + "T00:00:00");
            const dayOfWeek = DAYS[dateObj.getDay()] ?? "Unknown";
            return { event, likes, comments, shares, rsvps, total: likes + comments + shares, dayOfWeek };
          })
        );
        statsArr.sort((a, b) => b.total - a.total);
        if (!cancelled) setEventStats(statsArr);

        // Fetch recent comments from top 5 events
        const topIds = statsArr.slice(0, 5).map(s => s.event.id);
        const items: ActivityItem[] = [];
        await Promise.all(topIds.map(async eventId => {
          const stat = statsArr.find(s => s.event.id === eventId)!;
          try {
            const snap = await getDocs(
              query(
                collection(db, "communityEvents", eventId, "comments"),
                orderBy("createdAt", "desc"),
                limit(3)
              )
            );
            snap.docs.forEach(d => {
              const comment = { id: d.id, ...d.data() } as EventComment;
              if (!comment.parentId) {
                items.push({ comment, eventId, eventTitle: stat.event.title });
              }
            });
          } catch { /* ignore */ }
        }));
        items.sort((a, b) => {
          const at = (a.comment.createdAt as { toMillis?: () => number })?.toMillis?.() ?? 0;
          const bt = (b.comment.createdAt as { toMillis?: () => number })?.toMillis?.() ?? 0;
          return bt - at;
        });
        if (!cancelled) {
          setRecentActivity(items.slice(0, 10));
          setLoading(false);
        }
      } catch (err) {
        console.error("Insights fetch failed:", err);
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isPremium]);

  function timeAgo(ts: unknown) {
    const t = ts as { toMillis?: () => number } | null;
    if (!t?.toMillis) return "";
    const diff = Date.now() - t.toMillis();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  const totalLikes = eventStats.reduce((s, e) => s + e.likes, 0);
  const totalComments = eventStats.reduce((s, e) => s + e.comments, 0);
  const totalShares = eventStats.reduce((s, e) => s + e.shares, 0);
  const totalRsvps = eventStats.reduce((s, e) => s + e.rsvps, 0);
  const totalEngagement = totalLikes + totalComments + totalShares;
  const eventCount = eventStats.length;
  const engagementRateNum = followerCount && followerCount > 0
    ? (totalEngagement / followerCount) * 100
    : null;
  const engagementRate = engagementRateNum !== null ? engagementRateNum.toFixed(1) : null;

  // Best day to post (premium) — which weekday has highest avg engagement
  const bestDay = (() => {
    if (!isPremium || eventStats.length === 0) return null;
    const dayTotals: Record<string, { total: number; count: number }> = {};
    for (const s of eventStats) {
      if (!dayTotals[s.dayOfWeek]) dayTotals[s.dayOfWeek] = { total: 0, count: 0 };
      dayTotals[s.dayOfWeek].total += s.total;
      dayTotals[s.dayOfWeek].count += 1;
    }
    let best = "";
    let bestAvg = -1;
    for (const [day, { total, count }] of Object.entries(dayTotals)) {
      const avg = total / count;
      if (avg > bestAvg) { bestAvg = avg; best = day; }
    }
    return best || null;
  })();

  function exportCsv() {
    const header = "Title,Date,Day,Likes,Comments,Shares,RSVPs,Total Engagement\n";
    const rows = eventStats.map(s =>
      [
        `"${s.event.title.replace(/"/g, '""')}"`,
        s.event.date,
        s.dayOfWeek,
        s.likes,
        s.comments,
        s.shares,
        s.rsvps,
        s.total,
      ].join(",")
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jannatie-insights-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <BarChart2 size={20} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-slate-900">Insights</h1>
        </div>
        {isPremium && eventStats.length > 0 && (
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Download size={14} /> Export CSV
          </button>
        )}
      </div>
      <p className="text-slate-500 text-sm mb-8">Performance overview for your community account</p>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : eventStats.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <CalendarDays size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium text-slate-500">No events yet</p>
          <p className="text-xs mt-1">Post your first event to start seeing insights.</p>
        </div>
      ) : (
        <>
          {/* Key metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              {
                label: "Total engagement",
                value: totalEngagement,
                sub: eventCount > 0 ? `${(totalEngagement / eventCount).toFixed(1)} per event` : "—",
                icon: <TrendingUp size={14} className="text-blue-500" />,
                accent: "border-blue-200",
              },
              {
                label: "Followers",
                value: followerCount ?? "—",
                sub: engagementRate ? `${engagementRate}% engagement rate` : "—",
                icon: <Users size={14} className="text-violet-500" />,
                accent: "border-violet-200",
                subClass: engagementRateNum !== null ? engagementColor(engagementRateNum) : undefined,
              },
              {
                label: "Total likes",
                value: totalLikes,
                sub: eventCount > 0 ? `${(totalLikes / eventCount).toFixed(1)} avg / event` : "—",
                icon: <Heart size={14} className="text-rose-500 fill-rose-400" />,
                accent: "border-rose-200",
              },
              {
                label: "Total comments",
                value: totalComments,
                sub: eventCount > 0 ? `${(totalComments / eventCount).toFixed(1)} avg / event` : "—",
                icon: <MessageCircle size={14} className="text-sky-500" />,
                accent: "border-sky-200",
              },
            ].map(({ label, value, sub, icon, accent, subClass }) => (
              <div key={label} className={`bg-white rounded-2xl border ${accent} p-4`}>
                <div className="flex items-center gap-1.5 mb-2">
                  {icon}
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-tight">{label}</p>
                </div>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className={`text-[11px] mt-0.5 leading-snug font-semibold ${subClass ?? "text-slate-400"}`}>{sub}</p>
              </div>
            ))}
          </div>

          {/* Premium stats row */}
          {isPremium && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {/* RSVPs */}
              <div className="bg-white rounded-2xl border border-emerald-200 p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total RSVPs</p>
                </div>
                <p className="text-2xl font-bold text-slate-900">{totalRsvps}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {eventCount > 0 ? `${(totalRsvps / eventCount).toFixed(1)} avg / event` : "—"}
                </p>
              </div>
              {/* Engagement rate */}
              <div className="bg-white rounded-2xl border border-blue-200 p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp size={14} className="text-blue-500" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Engagement rate</p>
                </div>
                <p className={`text-2xl font-bold ${engagementRateNum !== null ? engagementColor(engagementRateNum) : "text-slate-900"}`}>
                  {engagementRate !== null ? `${engagementRate}%` : "—"}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {engagementRateNum !== null
                    ? engagementRateNum >= 10 ? "Excellent — keep it up!"
                      : engagementRateNum >= 5 ? "Good engagement"
                      : engagementRateNum >= 2 ? "Room to improve"
                      : "Post more consistently"
                    : "No follower data"}
                </p>
              </div>
              {/* Best day */}
              <div className="bg-white rounded-2xl border border-amber-200 p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <CalendarDays size={14} className="text-amber-500" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Best day to post</p>
                </div>
                <p className="text-2xl font-bold text-slate-900">{bestDay ?? "—"}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {bestDay ? "Highest avg engagement on this day" : "Post more events to see"}
                </p>
              </div>
            </div>
          )}

          {/* Locked premium section for free accounts */}
          {!isPremium && (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-8 flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Lock size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="text-base font-bold text-slate-800 mb-1">Premium Analytics</p>
                <p className="text-sm text-slate-500 max-w-sm">
                  Unlock RSVP counts per event, engagement rate, best day to post, and CSV export with Community Premium.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 w-full max-w-sm pointer-events-none select-none opacity-40">
                {["Total RSVPs", "Engagement rate", "Best day"].map(label => (
                  <div key={label} className="bg-white rounded-xl border border-slate-200 p-3">
                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">{label}</p>
                    <p className="text-lg font-bold text-slate-300">--</p>
                  </div>
                ))}
              </div>
              <Link
                href="/community-hub/upgrade"
                className="flex items-center gap-1.5 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 transition-colors rounded-xl px-5 py-2.5"
              >
                <Crown size={13} /> Upgrade to Premium
              </Link>
            </div>
          )}

          {/* Top posts */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-6">
            <div className="px-5 pt-4 pb-3 border-b border-slate-50">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Top posts by engagement</p>
            </div>
            <div className="divide-y divide-slate-50">
              {eventStats.map((s, i) => (
                <div key={s.event.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-xs font-bold text-slate-300 w-5 flex-shrink-0 text-right">#{i + 1}</span>
                  {s.event.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.event.photoURL} alt={s.event.title}
                      className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <CalendarDays size={14} className="text-blue-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{s.event.title}</p>
                    <p className="text-xs text-slate-400">{s.event.date}{isPremium && ` · ${s.dayOfWeek}`}</p>
                  </div>
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <span className="flex items-center gap-1 text-rose-500 text-xs font-semibold">
                      <Heart size={11} className="fill-rose-500" /> {s.likes}
                    </span>
                    <span className="flex items-center gap-1 text-sky-500 text-xs font-semibold">
                      <MessageCircle size={11} /> {s.comments}
                    </span>
                    <span className="flex items-center gap-1 text-slate-400 text-xs font-semibold">
                      <Share2 size={11} /> {s.shares}
                    </span>
                    {isPremium && (
                      <span className="flex items-center gap-1 text-emerald-500 text-xs font-semibold">
                        <CheckCircle2 size={11} /> {s.rsvps}
                      </span>
                    )}
                    <span className="text-[10px] bg-slate-100 text-slate-500 rounded-lg px-2 py-0.5 font-bold">
                      {s.total}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent comment activity */}
          {recentActivity.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-5 pt-4 pb-3 border-b border-slate-50">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent comment activity</p>
              </div>
              <div className="divide-y divide-slate-50">
                {recentActivity.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 px-5 py-3">
                    <div className="w-7 h-7 rounded-full bg-sky-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MessageSquare size={12} className="text-sky-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-700">
                        <span className="font-semibold text-slate-900">{a.comment.authorName}</span>
                        {" "}commented on{" "}
                        <span className="font-semibold">&ldquo;{a.eventTitle}&rdquo;</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate italic">&ldquo;{a.comment.text}&rdquo;</p>
                      <p className="text-[10px] text-slate-300 mt-0.5 flex items-center gap-1">
                        <Clock size={9} /> {timeAgo(a.comment.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
