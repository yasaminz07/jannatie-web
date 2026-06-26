"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { CheckCircle, Zap } from "lucide-react";

function SuccessContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    // Stripe webhook will have already updated the user's plan in Firestore via the webhook handler.
    // The profile will auto-refresh via onSnapshot in auth-context.
    void sessionId;
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={32} className="text-green-500" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">Subscription activated!</h1>
        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
          Masha&apos;Allah — your Premium subscription is now active.
          Enjoy unlimited access to everything Jannatie has to offer.
        </p>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6 text-left space-y-2.5">
          {[
            "Unlimited AI Buddy messages",
            "All learning units & lessons",
            "Full analytics dashboard",
            "Offline mode enabled (PWA)",
          ].map((f) => (
            <div key={f} className="flex items-center gap-2.5 text-sm text-slate-700">
              <Zap size={13} className="text-blue-500 flex-shrink-0" />
              {f}
            </div>
          ))}
        </div>

        {user ? (
          <Link
            href="/dashboard"
            className="block w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-sm transition-colors mb-3"
          >
            Go to my Dashboard →
          </Link>
        ) : (
          <Link
            href="/login"
            className="block w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-sm transition-colors mb-3"
          >
            Log in to access Premium →
          </Link>
        )}

        <p className="text-xs text-slate-400">
          A confirmation receipt has been sent to your email.
          Questions? <Link href="/about" className="underline">Contact us</Link>
        </p>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
