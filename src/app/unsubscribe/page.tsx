"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

function UnsubscribeContent() {
  const params = useSearchParams();
  const [state, setState] = useState<"loading" | "done" | "already" | "error">("loading");
  const [resubState, setResubState] = useState<"idle" | "loading" | "done">("idle");

  useEffect(() => {
    const email = params.get("e");
    const token = params.get("t");

    if (!email || !token) {
      setState("error");
      return;
    }

    fetch(`/api/unsubscribe?e=${encodeURIComponent(email)}&t=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({})) as {
          success?: boolean;
          alreadyUnsubscribed?: boolean;
          error?: string;
        };
        if (data.alreadyUnsubscribed) {
          setState("already");
        } else if (res.ok) {
          setState("done");
        } else {
          setState("error");
        }
      })
      .catch(() => setState("error"));
  }, [params]);

  function handleResubscribe() {
    const email = params.get("e");
    if (!email || resubState !== "idle") return;
    setResubState("loading");
    fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
      .then(() => setResubState("done"))
      .catch(() => setResubState("idle"));
  }

  const resubscribeBlock = (
    resubState === "done" ? (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-6">
        <p className="text-sm font-semibold text-emerald-700">You&apos;re back on the list!</p>
        <p className="text-xs text-emerald-600 mt-0.5">We&apos;re glad you changed your mind. JazakAllah Khair.</p>
      </div>
    ) : (
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-6 text-left">
        <p className="text-sm text-slate-600 mb-2">Changed your mind?</p>
        <button
          onClick={handleResubscribe}
          disabled={resubState === "loading"}
          className="text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50 transition-colors"
        >
          {resubState === "loading" ? "Re-subscribing…" : "Subscribe again"}
        </button>
      </div>
    )
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 max-w-md w-full p-10 text-center">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <Image src="/images/logo-black.PNG" alt="Jannatie" width={36} height={36} className="object-contain" />
          <span className="text-xl font-bold text-slate-900">Jannatie</span>
        </Link>

        {state === "loading" && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
            <p className="text-sm text-slate-500">Processing your request…</p>
          </div>
        )}

        {state === "done" && (
          <>
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Unsubscribed</h1>
            <p className="text-sm text-slate-500 mb-6">You&apos;ve been removed from Jannatie emails.</p>
            {resubscribeBlock}
            <Link href="/" className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors">
              Back to Jannatie
            </Link>
          </>
        )}

        {state === "already" && (
          <>
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Already unsubscribed</h1>
            <p className="text-sm text-slate-500 mb-6">You&apos;re already not receiving Jannatie emails.</p>
            {resubscribeBlock}
            <Link href="/" className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors">
              Back to Jannatie
            </Link>
          </>
        )}

        {state === "error" && (
          <>
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h1>
            <p className="text-sm text-slate-500 mb-8">This link may be invalid or expired. Please try again from a recent email.</p>
            <Link href="/" className="inline-flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors">
              Back to Jannatie
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
