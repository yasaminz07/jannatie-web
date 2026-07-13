"use client";

import { useState, useEffect, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Lock, Unlock, ShieldCheck, Eye, EyeOff, Check, X,
  UserCheck, UserX, Zap, Flame, BookOpen, Crown, ArrowRight, RefreshCw,
  KeyRound, Mail,
} from "lucide-react";
import { useAuth, getChildAge, verifyParentPassword } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import {
  doc, updateDoc, arrayRemove, arrayUnion, collection,
  getDocs, query, where,
} from "firebase/firestore";
import toast from "react-hot-toast";

const inputCls =
  "w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all bg-white";

function getPwChecks(pw: string) {
  return {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    number: /[0-9]/.test(pw),
    symbol: /[^a-zA-Z0-9]/.test(pw),
  };
}

interface PendingUser {
  uid: string;
  displayName: string | null;
  username: string;
  photoURL: string | null;
}

export default function ParentalPage() {
  const { profile, user } = useAuth();
  const router = useRouter();
  const [unlocked, setUnlocked] = useState(false);
  const [enteredPw, setEnteredPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  // Change password flow
  const [showChangePw, setShowChangePw] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmNewPw, setConfirmNewPw] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  // Forgot parental password flow
  const [fpStep, setFpStep] = useState<"idle" | "send" | "verify" | "reset">("idle");
  const [fpLoading, setFpLoading] = useState(false);
  const [fpCodeHash, setFpCodeHash] = useState("");
  const [fpCodeExpiry, setFpCodeExpiry] = useState(0);
  const [fpCode, setFpCode] = useState("");
  const [fpCodeError, setFpCodeError] = useState("");
  const [fpNewPw, setFpNewPw] = useState("");
  const [fpConfirmPw, setFpConfirmPw] = useState("");
  const [fpShowPw, setFpShowPw] = useState(false);
  const [fpSavingPw, setFpSavingPw] = useState(false);

  // Pending friends
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);

  // Graduation conversion
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    if (!profile) return;
    if (profile.accountType !== "child") {
      router.push("/dashboard");
    }
  }, [profile, router]);

  useEffect(() => {
    const uids = profile?.pendingFriends ?? [];
    if (!unlocked || !uids.length) return;
    setLoadingPending(true);
    async function fetchPending() {
      // Fetch each pending user — batched by chunks of 10 (Firestore 'in' limit)
      const chunks: string[][] = [];
      for (let i = 0; i < uids.length; i += 10) chunks.push(uids.slice(i, i + 10));
      const results: PendingUser[] = [];
      for (const chunk of chunks) {
        const snap = await getDocs(query(collection(db, "users"), where("uid", "in", chunk)));
        snap.docs.forEach(d => {
          const data = d.data();
          results.push({ uid: data.uid, displayName: data.displayName ?? null, username: data.username ?? "", photoURL: data.photoURL ?? null });
        });
      }
      setPendingUsers(results);
      setLoadingPending(false);
    }
    fetchPending();
  }, [unlocked, profile?.pendingFriends]);

  async function sendResetCode() {
    if (!profile?.parentEmail) { toast.error("No parent email on this account."); return; }
    setFpLoading(true);
    try {
      const res = await fetch("/api/parental-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentEmail: profile.parentEmail, childName: profile.displayName }),
      });
      const data = await res.json() as { codeHash?: string; expiry?: number; error?: string };
      if (!res.ok) throw new Error(data.error ?? "failed");
      setFpCodeHash(data.codeHash!);
      setFpCodeExpiry(data.expiry!);
      setFpCode("");
      setFpCodeError("");
      setFpStep("verify");
    } catch (err) {
      toast.error((err as Error).message || "Failed to send reset email.");
    } finally {
      setFpLoading(false);
    }
  }

  async function verifyResetCode(e: React.FormEvent) {
    e.preventDefault();
    setFpCodeError("");
    if (Date.now() > fpCodeExpiry) {
      setFpCodeError("This code has expired. Please request a new one.");
      return;
    }
    const hashBuf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(fpCode.trim()));
    const hash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, "0")).join("");
    if (hash !== fpCodeHash) {
      setFpCodeError("Incorrect code. Please check your email and try again.");
      return;
    }
    setFpStep("reset");
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    const checks = getPwChecks(fpNewPw);
    if (!checks.length || !checks.upper || !checks.number || !checks.symbol) {
      toast.error("New password doesn't meet all requirements.");
      return;
    }
    if (fpNewPw !== fpConfirmPw) { toast.error("Passwords don't match."); return; }
    if (!user?.uid) return;
    setFpSavingPw(true);
    try {
      const hashBuf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(fpNewPw));
      const hash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, "0")).join("");
      await updateDoc(doc(db, "users", user.uid), { parentDashboardPassword: hash });
      toast.success("Parental password reset successfully!");
      setFpStep("idle");
      setFpNewPw("");
      setFpConfirmPw("");
      setFpCodeHash("");
    } finally {
      setFpSavingPw(false);
    }
  }

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (!profile?.parentDashboardPassword) { toast.error("No parental password set."); return; }
    setUnlocking(true);
    try {
      const ok = await verifyParentPassword(profile.parentDashboardPassword, enteredPw);
      if (ok) {
        setUnlocked(true);
        setEnteredPw("");
      } else {
        toast.error("Incorrect password. Please try again.");
      }
    } finally {
      setUnlocking(false);
    }
  }

  async function approveFriend(uid: string) {
    if (!user?.uid) return;
    await updateDoc(doc(db, "users", user.uid), {
      pendingFriends: arrayRemove(uid),
      following: arrayUnion(uid),
    });
    setPendingUsers(prev => prev.filter(u => u.uid !== uid));
    toast.success("Friend request approved!");
  }

  async function rejectFriend(uid: string) {
    if (!user?.uid) return;
    await updateDoc(doc(db, "users", user.uid), { pendingFriends: arrayRemove(uid) });
    setPendingUsers(prev => prev.filter(u => u.uid !== uid));
    toast("Friend request removed.");
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    const checks = getPwChecks(newPw);
    if (!checks.length || !checks.upper || !checks.number || !checks.symbol) {
      toast.error("New password doesn't meet all requirements.");
      return;
    }
    if (newPw !== confirmNewPw) { toast.error("Passwords don't match."); return; }
    if (!user?.uid) return;
    setSavingPw(true);
    try {
      const hashBuf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(newPw));
      const hash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, "0")).join("");
      await updateDoc(doc(db, "users", user.uid), { parentDashboardPassword: hash });
      toast.success("Parental password updated!");
      setShowChangePw(false);
      setNewPw("");
      setConfirmNewPw("");
    } finally {
      setSavingPw(false);
    }
  }

  async function convertToNormalAccount() {
    if (!user?.uid) return;
    setConverting(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        accountType: "user",
        childDateOfBirth: null,
        parentEmail: null,
        parentDashboardPassword: null,
        pendingFriends: [],
      });
      toast.success("Account converted to normal account. Welcome!");
      router.push("/dashboard");
    } finally {
      setConverting(false);
    }
  }

  if (!profile || profile.accountType !== "child") return null;

  const childAge = profile.childDateOfBirth ? getChildAge(profile.childDateOfBirth) : null;
  const isUnder13 = childAge !== null && childAge < 13;
  const isReadyToGraduate = childAge !== null && childAge >= 16;

  const learnProgress = (profile as unknown as { learnProgress?: Record<string, number> })?.learnProgress ?? {};
  const totalLessons = Object.values(learnProgress).reduce((s, v) => s + v, 0);

  // ─── Password Entry Screen ───────────────────────────────────────────────
  if (!unlocked) {
    const lightCard: CSSProperties = {
      background: "rgba(255,255,255,0.85)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: "1px solid rgba(226,232,240,0.80)",
      boxShadow: "0 4px 24px rgba(15,23,42,0.08), 0 1px 4px rgba(15,23,42,0.04)",
    };
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-slate-50">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }} className="w-full max-w-sm">

          {/* ── Step: idle / normal unlock ── */}
          {fpStep === "idle" && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex mb-5">
                  <div className="w-[68px] h-[68px] rounded-2xl flex items-center justify-center bg-blue-600 shadow-lg shadow-blue-200">
                    <ShieldCheck size={30} className="text-white" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-1.5">Parental Dashboard</h1>
                <p className="text-sm text-slate-500">Enter your parental password to continue</p>
              </div>

              <div className="rounded-2xl p-6" style={lightCard}>
                <form onSubmit={handleUnlock} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Parental Password</label>
                    <div className="relative">
                      <input
                        className={inputCls + " pr-11"}
                        type={showPw ? "text" : "password"}
                        placeholder="Enter parental password"
                        value={enteredPw}
                        onChange={e => setEnteredPw(e.target.value)}
                        required
                        autoFocus
                      />
                      <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={unlocking || !enteredPw}
                    className="w-full font-bold py-3.5 rounded-xl transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2 text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
                  >
                    <Unlock size={15} />
                    {unlocking ? "Verifying..." : "Unlock dashboard"}
                  </button>
                </form>

                <button
                  onClick={() => setFpStep("send")}
                  className="w-full text-center text-sm text-slate-400 hover:text-blue-600 transition-colors mt-5"
                >
                  Forgot parental password?
                </button>
              </div>

              <p className="text-center text-xs text-slate-400 mt-5">
                This dashboard is for parents and guardians only.
              </p>
            </>
          )}

          {/* ── Step: send code ── */}
          {fpStep === "send" && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex mb-5">
                  <div className="w-[68px] h-[68px] rounded-2xl flex items-center justify-center bg-blue-600 shadow-lg shadow-blue-200">
                    <Mail size={30} className="text-white" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-1.5">Reset parental password</h1>
                <p className="text-sm text-slate-500">We&apos;ll send a 6-digit code to the parent email on this account.</p>
              </div>

              <div className="rounded-2xl p-6 space-y-4" style={lightCard}>
                <div className="rounded-xl px-4 py-3 bg-slate-50 border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Code will be sent to</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {profile.parentEmail
                      ? profile.parentEmail.replace(/(.{2}).+(@.+)/, "$1•••$2")
                      : "No parent email set"}
                  </p>
                </div>

                {!profile.parentEmail && (
                  <p className="text-xs text-red-500">No parent email is linked to this account. Please contact support.</p>
                )}

                <button
                  onClick={sendResetCode}
                  disabled={fpLoading || !profile.parentEmail}
                  className="w-full font-bold py-3.5 rounded-xl transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2 text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
                >
                  {fpLoading ? "Sending..." : "Send reset code"}
                </button>

                <button
                  onClick={() => setFpStep("idle")}
                  className="w-full text-center text-sm text-slate-400 hover:text-slate-700 transition-colors"
                >
                  ← Back to login
                </button>
              </div>
            </>
          )}

          {/* ── Step: verify code ── */}
          {fpStep === "verify" && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex mb-5">
                  <div className="w-[68px] h-[68px] rounded-2xl flex items-center justify-center bg-blue-600 shadow-lg shadow-blue-200">
                    <KeyRound size={30} className="text-white" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-1.5">Check your email</h1>
                <p className="text-sm text-slate-500">
                  Enter the 6-digit code sent to{" "}
                  <span className="font-semibold text-blue-600">
                    {profile.parentEmail?.replace(/(.{2}).+(@.+)/, "$1•••$2")}
                  </span>
                </p>
              </div>

              <div className="rounded-2xl p-6" style={lightCard}>
                <form onSubmit={verifyResetCode} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">6-digit code</label>
                    <input
                      className={inputCls + " text-center text-2xl font-bold tracking-[0.35em]"}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="000000"
                      value={fpCode}
                      onChange={e => { setFpCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setFpCodeError(""); }}
                      autoFocus
                      required
                    />
                    {fpCodeError && (
                      <p className="text-xs text-red-500 mt-1.5">{fpCodeError}</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={fpCode.length !== 6}
                    className="w-full font-bold py-3.5 rounded-xl transition-all text-sm disabled:opacity-50 text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
                  >
                    Verify code
                  </button>
                </form>

                <div className="flex items-center justify-between mt-5">
                  <button
                    onClick={() => setFpStep("send")}
                    className="text-sm text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={sendResetCode}
                    disabled={fpLoading}
                    className="text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors disabled:opacity-50"
                  >
                    {fpLoading ? "Sending..." : "Resend code"}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── Step: set new password ── */}
          {fpStep === "reset" && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex mb-5">
                  <div className="w-[68px] h-[68px] rounded-2xl flex items-center justify-center bg-emerald-500 shadow-lg shadow-emerald-200">
                    <Check size={30} className="text-white" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-1.5">Set new password</h1>
                <p className="text-sm text-slate-500">Choose a strong parental password</p>
              </div>

              <div className="rounded-2xl p-6" style={lightCard}>
                <form onSubmit={handleResetPassword} className="space-y-3">
                  <div className="relative">
                    <input
                      className={inputCls + " pr-11"}
                      type={fpShowPw ? "text" : "password"}
                      placeholder="New parental password"
                      value={fpNewPw}
                      onChange={e => setFpNewPw(e.target.value)}
                      autoFocus
                      required
                    />
                    <button type="button" onClick={() => setFpShowPw(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                      {fpShowPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {fpNewPw.length > 0 && (
                    <div className="flex flex-col gap-0.5">
                      {[
                        { label: "8+ characters", pass: getPwChecks(fpNewPw).length },
                        { label: "One capital letter", pass: getPwChecks(fpNewPw).upper },
                        { label: "One number", pass: getPwChecks(fpNewPw).number },
                        { label: "One symbol", pass: getPwChecks(fpNewPw).symbol },
                      ].map(({ label, pass }) => (
                        <div key={label} className="flex items-center gap-1.5">
                          {pass ? <Check size={10} className="text-emerald-500" /> : <X size={10} className="text-red-400" />}
                          <span className={`text-xs ${pass ? "text-emerald-600" : "text-red-500"}`}>{label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <input
                    className={inputCls}
                    type="password"
                    placeholder="Confirm new password"
                    value={fpConfirmPw}
                    onChange={e => setFpConfirmPw(e.target.value)}
                    required
                  />
                  {fpConfirmPw.length > 0 && (
                    <div className="flex items-center gap-1">
                      {fpNewPw === fpConfirmPw ? <Check size={10} className="text-emerald-500" /> : <X size={10} className="text-red-400" />}
                      <span className={`text-xs ${fpNewPw === fpConfirmPw ? "text-emerald-600" : "text-red-500"}`}>
                        {fpNewPw === fpConfirmPw ? "Passwords match" : "Passwords don&apos;t match"}
                      </span>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={fpSavingPw}
                    className="w-full font-bold py-3.5 rounded-xl transition-all text-sm disabled:opacity-50 text-white bg-emerald-500 hover:bg-emerald-600 shadow-sm"
                  >
                    {fpSavingPw ? "Saving..." : "Save new password"}
                  </button>
                </form>
              </div>
            </>
          )}

        </motion.div>
      </div>
    );
  }

  // ─── Unlocked Dashboard ──────────────────────────────────────────────────
  return (
    <div className="max-w-xl mx-auto px-5 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={16} className="text-amber-500" />
            <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">Parental Dashboard</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{profile.displayName}</h1>
          {childAge !== null && (
            <p className="text-sm text-slate-400 mt-0.5">Age {childAge} · {isUnder13 ? "Friend requests need your approval" : "Can add friends freely"}</p>
          )}
        </div>
        <button
          onClick={() => setUnlocked(false)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 border border-slate-200 rounded-xl px-3 py-2 transition-colors"
        >
          <Lock size={12} /> Lock
        </button>
      </div>

      {/* Graduation notice */}
      {isReadyToGraduate && (
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 mb-5 border border-amber-200 bg-amber-50"
        >
          <div className="flex items-start gap-3">
            <Crown size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-800 mb-1">{profile.displayName} has turned 16</p>
              <p className="text-xs text-amber-700 leading-relaxed mb-3">
                Their account can now graduate to a full Jannatie account. All XP, streak, and progress will be carried over.
              </p>
              <button
                onClick={convertToNormalAccount}
                disabled={converting}
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-xl transition-colors disabled:opacity-60"
              >
                <ArrowRight size={12} />
                {converting ? "Converting..." : "Convert to normal account"}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Child stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          { label: "XP Earned", value: profile.xp ?? 0, icon: <Zap size={15} className="text-blue-500" /> },
          { label: "Day Streak", value: profile.streak ?? 0, icon: <Flame size={15} className="text-amber-400" /> },
          { label: "Level", value: profile.level ?? 1, icon: <Crown size={15} className="text-purple-500" /> },
          { label: "Lessons Done", value: totalLessons, icon: <BookOpen size={15} className="text-emerald-500" /> },
        ].map(({ label, value, icon }) => (
          <div key={label} className="rounded-2xl border border-slate-100 bg-white p-4">
            <div className="flex items-center gap-2 mb-1">
              {icon}
              <span className="text-xs text-slate-400 font-medium">{label}</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Pending friend requests — only shown for under-13 */}
      {isUnder13 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold text-slate-900">Friend requests</p>
              <p className="text-xs text-slate-400">Approve or reject friend requests for {profile.displayName}</p>
            </div>
            {loadingPending && <RefreshCw size={14} className="text-slate-400 animate-spin" />}
          </div>

          {!loadingPending && pendingUsers.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-4">No pending friend requests</p>
          )}

          <div className="space-y-3">
            {pendingUsers.map(u => (
              <div key={u.uid} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {(u.displayName ?? u.username).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{u.displayName ?? u.username}</p>
                  <p className="text-xs text-slate-400">@{u.username}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => rejectFriend(u.uid)}
                    className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors"
                  >
                    <UserX size={14} className="text-red-400" />
                  </button>
                  <button
                    onClick={() => approveFriend(u.uid)}
                    className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center hover:bg-emerald-600 transition-colors"
                  >
                    <UserCheck size={14} className="text-white" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security — change parental password */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-bold text-slate-900">Security</p>
        </div>
        <p className="text-xs text-slate-400 mb-4">Change the password used to lock this dashboard</p>

        {!showChangePw ? (
          <button
            onClick={() => setShowChangePw(true)}
            className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            <Lock size={14} /> Change parental password
          </button>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div className="relative">
              <input
                className={inputCls + " pr-11"}
                type={showNewPw ? "text" : "password"}
                placeholder="New parental password"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                required
              />
              <button type="button" onClick={() => setShowNewPw(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {newPw.length > 0 && (
              <div className="flex flex-col gap-0.5">
                {[
                  { label: "8+ characters", pass: getPwChecks(newPw).length },
                  { label: "One capital letter", pass: getPwChecks(newPw).upper },
                  { label: "One number", pass: getPwChecks(newPw).number },
                  { label: "One symbol", pass: getPwChecks(newPw).symbol },
                ].map(({ label, pass }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    {pass ? <Check size={10} className="text-emerald-500" /> : <X size={10} className="text-red-400" />}
                    <span className={`text-xs ${pass ? "text-emerald-600" : "text-red-400"}`}>{label}</span>
                  </div>
                ))}
              </div>
            )}
            <input
              className={inputCls}
              type="password"
              placeholder="Confirm new password"
              value={confirmNewPw}
              onChange={e => setConfirmNewPw(e.target.value)}
              required
            />
            {confirmNewPw.length > 0 && (
              <div className="flex items-center gap-1">
                {newPw === confirmNewPw ? <Check size={10} className="text-emerald-500" /> : <X size={10} className="text-red-400" />}
                <span className={`text-xs ${newPw === confirmNewPw ? "text-emerald-600" : "text-red-400"}`}>
                  {newPw === confirmNewPw ? "Passwords match" : "Passwords don't match"}
                </span>
              </div>
            )}
            <div className="flex gap-2.5">
              <button type="button" onClick={() => { setShowChangePw(false); setNewPw(""); setConfirmNewPw(""); }} className="flex-1 border border-slate-200 text-slate-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={savingPw} className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60">
                {savingPw ? "Saving..." : "Save password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
