"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";
import { Globe, MapPin, ExternalLink } from "lucide-react";

interface Application {
  uid: string;
  displayName: string | null;
  username: string;
  email: string | null;
  photoURL: string | null;
  communityCategory?: string;
  city?: string;
  website?: string;
  verificationInfo?: string;
  applicationStatus?: "pending" | "approved" | "rejected";
}

const TABS = ["pending", "approved", "rejected"] as const;

export default function CommunityApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [tab, setTab] = useState<(typeof TABS)[number]>("pending");
  const [actingUid, setActingUid] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "users"), where("accountType", "==", "community"));
    const unsub = onSnapshot(q, (snap) => {
      setApps(snap.docs.map((d) => d.data() as Application));
      setLoadingApps(false);
    });
    return () => unsub();
  }, []);

  async function setStatus(uid: string, status: "approved" | "rejected") {
    setActingUid(uid);
    try {
      await updateDoc(doc(db, "users", uid), { applicationStatus: status });
      toast.success(status === "approved" ? "Application approved" : "Application rejected");
    } catch {
      toast.error("Failed to update. Make sure firestore.rules has been updated to allow admin changes.");
    } finally {
      setActingUid(null);
    }
  }

  const filtered = apps.filter((a) => (a.applicationStatus ?? "pending") === tab);

  return (
    <div className="px-4 md:px-8 py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Community applications</h1>
        <p className="text-slate-500 text-sm mb-6">Review and approve businesses applying for a community account.</p>

        <div className="flex gap-2 mb-5">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
                tab === t ? "bg-blue-600 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {t} {t === "pending" && apps.filter((a) => (a.applicationStatus ?? "pending") === "pending").length > 0
                ? `(${apps.filter((a) => (a.applicationStatus ?? "pending") === "pending").length})`
                : ""}
            </button>
          ))}
        </div>

        {loadingApps ? (
          <p className="text-sm text-slate-400">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-slate-400">No {tab} applications.</p>
        ) : (
          <div className="space-y-4">
            {filtered.map((a) => (
              <div key={a.uid} className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-start gap-4">
                  {a.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.photoURL} alt={a.displayName ?? ""} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0 font-semibold">
                      {(a.displayName ?? "?")[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900">{a.displayName}</p>
                    <p className="text-xs text-slate-400 mb-2">@{a.username} · {a.email}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-2">
                      {a.communityCategory && <span className="capitalize bg-slate-100 px-2 py-0.5 rounded-full">{a.communityCategory.replace("_", " ")}</span>}
                      {a.city && (
                        <span className="flex items-center gap-1"><MapPin size={11} /> {a.city}</span>
                      )}
                      {a.website && (
                        <a href={a.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                          <Globe size={11} /> {a.website} <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                    {a.verificationInfo && (
                      <p className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2 mb-2">{a.verificationInfo}</p>
                    )}
                  </div>
                </div>

                {tab === "pending" && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => setStatus(a.uid, "approved")}
                      disabled={actingUid === a.uid}
                      className="flex-1 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setStatus(a.uid, "rejected")}
                      disabled={actingUid === a.uid}
                      className="flex-1 py-2 text-sm font-semibold bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                )}
                {tab === "rejected" && (
                  <button
                    onClick={() => setStatus(a.uid, "approved")}
                    disabled={actingUid === a.uid}
                    className="mt-3 w-full py-2 text-sm font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    Approve instead
                  </button>
                )}
                {tab === "approved" && (
                  <button
                    onClick={() => setStatus(a.uid, "rejected")}
                    disabled={actingUid === a.uid}
                    className="mt-3 w-full py-2 text-sm font-semibold bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
