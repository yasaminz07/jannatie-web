"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ArrowLeft, Check } from "lucide-react";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json() as { success?: boolean; fallback?: boolean; error?: string };

      if (data.fallback) {
        // Admin SDK not yet configured — use Firebase's built-in reset email
        await sendPasswordResetEmail(auth, email.trim());
      } else if (!res.ok) {
        throw new Error(data.error ?? "failed");
      }

      setSent(true);
    } catch {
      toast.error("No account found with that email address.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        <div className="flex justify-center mb-10">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/images/logo-black.PNG" alt="Jannatie" width={24} height={24} className="object-contain" />
            <span className="text-xl font-bold text-slate-900">Jannatie</span>
          </Link>
        </div>

        {!sent ? (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Forgot your password?</h1>
              <p className="text-slate-500 text-sm">
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>

            <Link
              href="/login"
              className="flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mt-6"
            >
              <ArrowLeft size={14} />
              Back to login
            </Link>
          </>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={28} className="text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-3">Check your inbox</h1>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              We sent a reset link to{" "}
              <span className="font-semibold text-slate-900">{email}</span>.
              Check your spam folder if you don&apos;t see it within a few minutes.
            </p>
            <Link
              href="/login"
              className="flex items-center justify-center gap-1.5 text-sm text-blue-600 hover:underline font-medium"
            >
              <ArrowLeft size={14} />
              Back to login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
