"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck, ArrowLeft, Check } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/auth-context";
import { isAdminEmail, resolveAdminEmail } from "@/lib/admin";

const inputCls =
  "w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white";

export default function AdminLoginPage() {
  const { user, signIn } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<"signin" | "forgot" | "forgot-sent">("signin");
  const [resetUsername, setResetUsername] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);

  useEffect(() => {
    if (user && isAdminEmail(user.email)) {
      router.push("/admin");
    }
  }, [user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error("Enter your admin username and password.");
      return;
    }

    const email = resolveAdminEmail(username);
    if (!email) {
      toast.error("Invalid admin username or password.");
      return;
    }

    setSubmitting(true);
    try {
      await signIn(email, password);
      router.push("/admin");
    } catch {
      toast.error("Invalid admin username or password.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    const email = resolveAdminEmail(resetUsername);
    if (!email) {
      toast.error("Invalid admin username.");
      return;
    }

    setResetSubmitting(true);
    try {
      const res = await fetch("/api/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("failed");
      setMode("forgot-sent");
    } catch {
      toast.error("Couldn't send reset link. Try again.");
    } finally {
      setResetSubmitting(false);
    }
  }

  if (mode === "forgot" || mode === "forgot-sent") {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-4">
        <div className="max-w-sm w-full">
          {mode === "forgot" ? (
            <>
              <div className="flex flex-col items-center mb-8">
                <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mb-4">
                  <ShieldCheck size={26} className="text-white" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Reset admin password</h1>
                <p className="text-sm text-slate-500 mt-1 text-center">
                  Enter your admin username and we&apos;ll email a reset link to the linked account.
                </p>
              </div>

              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <input
                  type="text"
                  autoComplete="username"
                  placeholder="Admin username"
                  value={resetUsername}
                  onChange={(e) => setResetUsername(e.target.value)}
                  className={inputCls}
                />
                <button
                  type="submit"
                  disabled={resetSubmitting}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-bold rounded-2xl text-sm transition-colors"
                >
                  {resetSubmitting ? "Sending…" : "Send reset link"}
                </button>
              </form>

              <button
                onClick={() => setMode("signin")}
                className="flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mt-6 w-full"
              >
                <ArrowLeft size={14} />
                Back to sign in
              </button>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check size={28} className="text-emerald-500" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-3">Check the inbox</h1>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">
                A reset link was sent to the email linked to this admin account.
                Check spam if it doesn&apos;t arrive in a few minutes.
              </p>
              <button
                onClick={() => setMode("signin")}
                className="flex items-center justify-center gap-1.5 text-sm text-blue-600 hover:underline font-medium mx-auto"
              >
                <ArrowLeft size={14} />
                Back to sign in
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mb-4">
            <ShieldCheck size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Admin sign in</h1>
          <p className="text-sm text-slate-500 mt-1">Jannatie internal dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            autoComplete="username"
            placeholder="Admin username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={inputCls}
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls + " pr-11"}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-bold rounded-2xl text-sm transition-colors"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <button
          onClick={() => { setResetUsername(username); setMode("forgot"); }}
          className="block w-full text-center text-sm text-slate-500 hover:text-slate-900 transition-colors mt-5"
        >
          Forgot password?
        </button>
      </div>
    </div>
  );
}
