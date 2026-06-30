"use client";

import { useEffect, useState } from "react";
import {
  collection, query, where, getDocs, getCountFromServer, orderBy, limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { CommunityEvent, EventComment } from "@/lib/community-utils";
import {
  Heart, MessageCircle, Share2, Users, TrendingUp, BarChart2,
  CalendarDays, Clock, MessageSquare,
} from "lucide-react";

interface EventStats {
  event: CommunityEvent;
  likes: number;
  comments: number;
  shares: number;
  total: number;
}

interface ActivityItem {
  comment: EventComment;
  eventId: string;
  eventTitle: string;
}

export default function InsightsPage() {
  const { user } = useAuth();
  const [eventStats, setEventStats] = useState<EventStats[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [followerCount, setFollowerCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

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
            const likes = likeSnap.data().count;
            const comments = commentSnap.data().count;
            return { event, likes, comments, shares, total: likes + comments + shares };
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
  }, [user]);

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
  const totalEngagement = totalLikes + totalComments + totalShares;
  const eventCount = eventStats.length;
  const engagementRate = followerCount && followerCount > 0
    ? ((totalEngagement / followerCount) * 100).toFixed(1)
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
      <div className="flex items-center gap-2 mb-1">
        <BarChart2 size={20} className="text-blue-600" />
        <h1 className="text-2xl font-bold text-slate-900">Insights</h1>
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
            ].map(({ label, value, sub, icon, accent }) => (
              <div key={label} className={`bg-white rounded-2xl border ${accent} p-4`}>
                <div className="flex items-center gap-1.5 mb-2">
                  {icon}
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-tight">{label}</p>
                </div>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{sub}</p>
              </div>
            ))}
          </div>

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
                    <p className="text-xs text-slate-400">{s.event.date}</p>
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
