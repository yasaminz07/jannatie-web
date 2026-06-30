"use client";

import { useEffect, useState, useCallback } from "react";
import {
  collection, query, where, getDocs, getCountFromServer,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { csvRow } from "@/lib/analytics-types";
import {
  Users, CalendarDays, Heart, MessageCircle, Download, RefreshCw, MapPin,
} from "lucide-react";

interface CommunityRow {
  uid: string;
  displayName: string;
  username: string;
  photoURL: string | null;
  city?: string;
  communityCategory?: string;
  applicationStatus?: "pending" | "approved" | "rejected";
  eventCount: number;
  likeCount: number;
  commentCount: number;
  followerCount: number;
}

export default function AdminCommunitiesPage() {
  const [rows, setRows] = useState<CommunityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const usersSnap = await getDocs(query(collection(db, "users"), where("accountType", "==", "community")));
      const communities = usersSnap.docs.map(d => d.data());

      const results: CommunityRow[] = await Promise.all(
        communities.map(async (c) => {
          const eventsSnap = await getDocs(query(collection(db, "communityEvents"), where("communityUid", "==", c.uid)));
          const eventIds = eventsSnap.docs.map(d => d.id);

          let likeCount = 0;
          let commentCount = 0;
          await Promise.all(
            eventIds.map(async (eventId) => {
              const [likesCount, commentsCount] = await Promise.all([
                getCountFromServer(collection(db, "communityEvents", eventId, "likes")),
                getCountFromServer(collection(db, "communityEvents", eventId, "comments")),
              ]);
              likeCount += likesCount.data().count;
              commentCount += commentsCount.data().count;
            })
          );

          const followersSnap = await getCountFromServer(
            query(collection(db, "users"), where("following", "array-contains", c.uid))
          );

          return {
            uid: c.uid,
            displayName: c.displayName ?? "Community",
            username: c.username ?? "",
            photoURL: c.photoURL ?? null,
            city: c.city,
            communityCategory: c.communityCategory,
            applicationStatus: c.applicationStatus,
            eventCount: eventIds.length,
            likeCount,
            commentCount,
            followerCount: followersSnap.data().count,
          };
        })
      );

      results.sort((a, b) => (b.eventCount + b.likeCount + b.commentCount) - (a.eventCount + a.likeCount + a.commentCount));
      setRows(results);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totals = rows.reduce(
    (acc, r) => ({
      events: acc.events + r.eventCount,
      likes: acc.likes + r.likeCount,
      comments: acc.comments + r.commentCount,
      followers: acc.followers + r.followerCount,
    }),
    { events: 0, likes: 0, comments: 0, followers: 0 }
  );

  function handleExport() {
    const lines: string[] = [
      csvRow(["Jannatie — Community Insights Report"]),
      csvRow([`Generated ${new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}`]),
      "",
      csvRow(["Community", "Username", "Category", "City", "Status", "Events", "Likes", "Comments", "Followers"]),
      ...rows.map(r => csvRow([
        r.displayName, `@${r.username}`, r.communityCategory ?? "—", r.city ?? "—",
        r.applicationStatus ?? "approved", r.eventCount, r.likeCount, r.commentCount, r.followerCount,
      ])),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jannatie-communities-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="px-4 md:px-8 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Communities</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} disabled={refreshing}
              className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors">
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            </button>
            <button onClick={handleExport} disabled={loading || rows.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>
        <p className="text-slate-500 text-sm mb-6">Activity and engagement across all approved community accounts.</p>

        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Communities", value: rows.length, icon: Users },
            { label: "Total Events", value: totals.events, icon: CalendarDays },
            { label: "Total Likes", value: totals.likes, icon: Heart },
            { label: "Total Comments", value: totals.comments, icon: MessageCircle },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 text-slate-400 mb-3">
                <Icon size={15} />
                <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{value.toLocaleString()}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-slate-400">Loading community data...</p>
        ) : rows.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <Users size={26} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No community accounts yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[680px]">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-400 uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">Community</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium text-right">Events</th>
                  <th className="px-3 py-3 font-medium text-right">Likes</th>
                  <th className="px-3 py-3 font-medium text-right">Comments</th>
                  <th className="px-3 py-3 font-medium text-right">Followers</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.uid} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {r.photoURL ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.photoURL} alt={r.displayName} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {r.displayName[0]?.toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{r.displayName}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-2">
                            @{r.username}
                            {r.city && <span className="flex items-center gap-0.5"><MapPin size={10} />{r.city}</span>}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                        r.applicationStatus === "pending" ? "bg-amber-50 text-amber-600"
                          : r.applicationStatus === "rejected" ? "bg-red-50 text-red-500"
                          : "bg-emerald-50 text-emerald-600"
                      }`}>
                        {r.applicationStatus ?? "approved"}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-right font-medium text-slate-700">{r.eventCount}</td>
                    <td className="px-3 py-3.5 text-right font-medium text-slate-700">{r.likeCount}</td>
                    <td className="px-3 py-3.5 text-right font-medium text-slate-700">{r.commentCount}</td>
                    <td className="px-3 py-3.5 text-right font-medium text-slate-700">{r.followerCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
