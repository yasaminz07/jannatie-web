"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, query, where, onSnapshot, getCountFromServer, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { CommunityEvent, EventComment } from "@/lib/community-utils";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import { Users, CalendarDays, Heart, MessageCircle, Share2, Plus, Clock, MapPin, BarChart2 } from "lucide-react";

function formatEventDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export default function CommunityHubDashboard() {
  const { user, profile } = useAuth();
  const [followerCount, setFollowerCount] = useState<number | null>(null);
  const [eventCount, setEventCount] = useState<number | null>(null);
  const [recentEvents, setRecentEvents] = useState<CommunityEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [allEventIds, setAllEventIds] = useState<string[]>([]);
  const [totalLikes, setTotalLikes] = useState<number | null>(null);
  const [totalComments, setTotalComments] = useState<number | null>(null);
  const [totalShares, setTotalShares] = useState<number | null>(null);
  const [recentActivity, setRecentActivity] = useState<{ comment: EventComment; eventTitle: string }[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const followersSnap = await getCountFromServer(
        query(collection(db, "users"), where("following", "array-contains", user.uid))
      );
      setFollowerCount(followersSnap.data().count);

      const eventsSnap = await getCountFromServer(
        query(collection(db, "communityEvents"), where("communityUid", "==", user.uid))
      );
      setEventCount(eventsSnap.data().count);
    })();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "communityEvents"), where("communityUid", "==", user.uid));
    const unsub = onSnapshot(q, snap => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as CommunityEvent)).sort((a, b) => b.date.localeCompare(a.date));
      setRecentEvents(all.slice(0, 3));
      setAllEventIds(all.map(e => e.id));
      setEventsLoading(false);
    }, err => {
      console.error("Failed to load events:", err);
      setEventsLoading(false);
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    if (allEventIds.length === 0) {
      setTotalLikes(0);
      setTotalComments(0);
      setTotalShares(0);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [likeResults, commentResults] = await Promise.all([
          Promise.all(allEventIds.map(id => getCountFromServer(collection(db, "communityEvents", id, "likes")))),
          Promise.all(allEventIds.map(id => getCountFromServer(collection(db, "communityEvents", id, "comments")))),
        ]);
        if (!cancelled) {
          setTotalLikes(likeResults.reduce((s, r) => s + r.data().count, 0));
          setTotalComments(commentResults.reduce((s, r) => s + r.data().count, 0));
        }
      } catch (err) {
        console.error("Failed to load engagement stats:", err);
      }
      try {
        const shareResults = await Promise.all(
          allEventIds.map(id => getCountFromServer(collection(db, "communityEvents", id, "shares")))
        );
        if (!cancelled) setTotalShares(shareResults.reduce((s, r) => s + r.data().count, 0));
      } catch {
        if (!cancelled) setTotalShares(0);
      }
    })();
    return () => { cancelled = true; };
  }, [allEventIds]);

  // Fetch recent comments from the 3 most recent events for the activity feed
  useEffect(() => {
    if (recentEvents.length === 0) return;
    let cancelled = false;
    (async () => {
      const items: { comment: EventComment; eventTitle: string }[] = [];
      await Promise.all(recentEvents.map(async event => {
        try {
          const snap = await getDocs(
            query(
              collection(db, "communityEvents", event.id, "comments"),
              orderBy("createdAt", "desc"),
              limit(2)
            )
          );
          snap.docs.forEach(d => {
            const comment = { id: d.id, ...d.data() } as EventComment;
            if (!comment.parentId) items.push({ comment, eventTitle: event.title });
          });
        } catch { /* ignore */ }
      }));
      items.sort((a, b) => {
        const at = (a.comment.createdAt as { toMillis?: () => number })?.toMillis?.() ?? 0;
        const bt = (b.comment.createdAt as { toMillis?: () => number })?.toMillis?.() ?? 0;
        return bt - at;
      });
      if (!cancelled) setRecentActivity(items.slice(0, 5));
    })();
    return () => { cancelled = true; };
  }, [recentEvents]);

  const name = profile?.displayName ?? "Community";

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
      <div className="flex items-center gap-2 mb-1">
        <h1 className="text-2xl font-bold text-slate-900">{name}</h1>
        <VerifiedBadge size={18} />
      </div>
      <p className="text-slate-500 text-sm mb-8">@{profile?.username} · Community account</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Users size={15} />
            <span className="text-xs font-medium uppercase tracking-wide">Followers</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{followerCount ?? "—"}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <CalendarDays size={15} />
            <span className="text-xs font-medium uppercase tracking-wide">Events posted</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{eventCount ?? "—"}</p>
        </div>
      </div>

      {eventsLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <div className="h-5 w-32 mx-auto rounded-full bg-slate-100 animate-pulse" />
        </div>
      ) : recentEvents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <CalendarDays size={28} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500 mb-4">You haven&apos;t posted any events yet.</p>
          <Link
            href="/community-hub/events"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
          >
            <Plus size={15} /> Create event
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent events</p>
            <Link href="/community-hub/events" className="text-xs font-semibold text-blue-600 hover:underline">
              Manage all
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {recentEvents.map(event => (
              <Link key={event.id} href="/community-hub/events"
                className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                {event.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={event.photoURL} alt={event.title} width={44} height={44}
                    className="rounded-xl object-cover flex-shrink-0" style={{ width: 44, height: 44 }} />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <CalendarDays size={16} className="text-blue-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{event.title}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span className="flex items-center gap-1"><Clock size={11} />{formatEventDate(event.date)}</span>
                    {event.city && <span className="flex items-center gap-1"><MapPin size={11} />{event.city}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Engagement section */}
      <div className="mt-6 space-y-3">
        {/* Total row */}
        <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 flex items-center justify-between">

          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total engagement</p>
            <p className="text-3xl font-bold text-slate-900">
              {totalLikes !== null && totalComments !== null && totalShares !== null
                ? totalLikes + totalComments + totalShares
                : "—"}
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <Heart size={13} className="text-rose-400 fill-rose-400" />
              <span className="font-semibold text-slate-800">{totalLikes ?? "—"}</span>
            </span>
            <span className="text-slate-200">|</span>
            <span className="flex items-center gap-1.5">
              <MessageCircle size={13} className="text-blue-400" />
              <span className="font-semibold text-slate-800">{totalComments ?? "—"}</span>
            </span>
            <span className="text-slate-200">|</span>
            <span className="flex items-center gap-1.5">
              <Share2 size={13} className="text-slate-400" />
              <span className="font-semibold text-slate-800">{totalShares ?? "—"}</span>
            </span>
          </div>
        </div>

        {/* Detail cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              icon: <Heart size={14} className="text-rose-400 fill-rose-400" />,
              label: "Likes",
              value: totalLikes,
              accent: "bg-rose-500",
              sub: "rose",
            },
            {
              icon: <MessageCircle size={14} className="text-blue-400" />,
              label: "Comments",
              value: totalComments,
              accent: "bg-blue-500",
              sub: "blue",
            },
            {
              icon: <Share2 size={14} className="text-slate-400" />,
              label: "Shares",
              value: totalShares,
              accent: "bg-slate-400",
              sub: "slate",
            },
          ].map(({ icon, label, value, accent }) => {
            const avg = eventCount && eventCount > 0 && value !== null
              ? (value / eventCount).toFixed(1)
              : null;
            return (
              <div key={label} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className={`h-0.5 w-full ${accent}`} />
                <div className="p-4">
                  <div className="flex items-center gap-1.5 mb-3">
                    {icon}
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{label}</p>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{value ?? "—"}</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {avg !== null ? `${avg} avg / event` : "—"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Link to full insights */}
        <Link href="/community-hub/insights"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/40 transition-all">
          <BarChart2 size={13} /> View detailed insights
        </Link>
      </div>

      {/* Recent activity */}
      {recentActivity.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent activity</p>
            <Link href="/community-hub/insights" className="text-xs font-semibold text-blue-600 hover:underline">
              See all
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-3">
                <div className="w-6 h-6 rounded-full bg-sky-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MessageCircle size={11} className="text-sky-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-700 leading-snug">
                    <span className="font-semibold text-slate-900">{a.comment.authorName}</span>
                    {" "}commented on <span className="font-semibold">&ldquo;{a.eventTitle}&rdquo;</span>
                  </p>
                  <p className="text-xs text-slate-400 truncate mt-0.5 italic">&ldquo;{a.comment.text}&rdquo;</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
