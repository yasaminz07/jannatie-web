"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import toast from "react-hot-toast";
import { Eye, EyeOff, Check, X, ChevronRight, ArrowLeft, Baby, ShieldCheck, Lock } from "lucide-react";

const inputCls =
  "w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white";

function getChildAge(dob: string): number {
  const d = new Date(dob + "T00:00:00");
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

function getPwChecks(pw: string) {
  return {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    number: /[0-9]/.test(pw),
    symbol: /[^a-zA-Z0-9]/.test(pw),
  };
}

const maxDob = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 5);
  return d.toISOString().split("T")[0];
})();

const minDob = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 15);
  d.setMonth(d.getMonth() - 11);
  return d.toISOString().split("T")[0];
})();

const variants = {
  enter: (d: number) => ({ x: d * 52, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as number[] } },
  exit: (d: number) => ({ x: -d * 52, opacity: 0, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] as number[] } }),
};

function StepBadge({ step, current }: { step: number; current: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {[1, 2, 3].map((n, i) => (
        <div key={n} className="flex items-center flex-1 last:flex-none">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
            current > n ? "bg-blue-600 text-white" : current === n ? "bg-blue-600 text-white ring-4 ring-blue-100" : "bg-slate-100 text-slate-400"
          }`}>
            {current > n ? <Check size={12} /> : n}
          </div>
          {i < 2 && <div className={`flex-1 h-px mx-2 transition-colors ${current > n + 1 ? "bg-blue-600" : "bg-slate-200"}`} />}
        </div>
      ))}
    </div>
  );
}

export default function SignupChildPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [dir, setDir] = useState(1);

  // Step 1 — child info
  const [childName, setChildName] = useState("");
  const [dob, setDob] = useState("");

  // Step 2 — account
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "taken" | "available">("idle");
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step 3 — parental controls
  const [parentEmail, setParentEmail] = useState("");
  const [parentPw, setParentPw] = useState("");
  const [confirmParentPw, setConfirmParentPw] = useState("");
  const [showParentPw, setShowParentPw] = useState(false);
  const [showConfirmParentPw, setShowConfirmParentPw] = useState(false);

  const [loading, setLoading] = useState(false);
  const { signUpChild } = useAuth();
  const router = useRouter();

  const pwChecks = getPwChecks(pw);
  const allPwValid = pwChecks.length && pwChecks.upper && pwChecks.symbol;
  const pwMatch = confirmPw.length > 0 && pw === confirmPw;

  const parentPwChecks = getPwChecks(parentPw);
  const parentPwChecksWithNumber = { ...parentPwChecks, number: /[0-9]/.test(parentPw) };
  const allParentPwValid = parentPwChecksWithNumber.length && parentPwChecksWithNumber.upper && parentPwChecksWithNumber.number && parentPwChecksWithNumber.symbol;
  const parentPwMatch = confirmParentPw.length > 0 && parentPw === confirmParentPw;

  function go(to: 1 | 2 | 3, forward = true) {
    setDir(forward ? 1 : -1);
    setStep(to);
  }

  function handleUsernameChange(val: string) {
    const v = val.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 14);
    setUsername(v);
    setUsernameStatus("idle");
    if (usernameTimer.current) clearTimeout(usernameTimer.current);
    if (v.length < 5) return;
    setUsernameStatus("checking");
    usernameTimer.current = setTimeout(async () => {
      const snap = await getDocs(query(collection(db, "users"), where("username", "==", v), limit(1)));
      setUsernameStatus(snap.empty ? "available" : "taken");
    }, 500);
  }

  function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    if (!childName.trim()) { toast.error("Please enter the child's name."); return; }
    if (!dob) { toast.error("Please enter the child's date of birth."); return; }
    const age = getChildAge(dob);
    if (age < 5) { toast.error("Child must be at least 5 years old."); return; }
    if (age >= 16) {
      toast.error("This child is 16 or older and should create a normal account instead.");
      return;
    }
    go(2);
  }

  function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    if (username.length < 5) { toast.error("Username must be at least 5 characters."); return; }
    if (usernameStatus === "taken") { toast.error("That username is already taken."); return; }
    if (usernameStatus === "checking") { toast.error("Still checking username. Please wait."); return; }
    if (!email.trim()) { toast.error("Please enter an email address."); return; }
    if (!allPwValid) { toast.error("Password doesn't meet all requirements."); return; }
    if (pw !== confirmPw) { toast.error("Passwords don't match."); return; }
    go(3);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allParentPwValid) { toast.error("Parental password doesn't meet all requirements."); return; }
    if (!parentPwMatch) { toast.error("Parental passwords don't match."); return; }
    setLoading(true);
    try {
      await signUpChild({
        email,
        password: pw,
        name: childName,
        username,
        childDateOfBirth: dob,
        parentEmail,
        parentDashboardPassword: parentPw,
      });
      toast.success("Bismillah! Welcome to Jannatie.");
      router.push("/dashboard");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white relative flex items-center justify-center px-4 py-12 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, #cbd5e1 1px, transparent 1px)", backgroundSize: "28px 28px", opacity: 0.4 }} />
      <div className="absolute top-0 inset-x-0 h-80 bg-gradient-to-b from-blue-50/70 to-transparent pointer-events-none" />

      <div className="relative w-full max-w-[440px]">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <Image src="/images/logo-black.PNG" alt="Jannatie" width={26} height={26} className="object-contain" />
          <span className="text-xl font-bold text-slate-900">Jannatie</span>
        </Link>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/70 ring-1 ring-slate-100 overflow-hidden">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div key={step} custom={dir} variants={variants} initial="enter" animate="center" exit="exit" className="p-8">

              {/* ─── STEP 1: Child Info ─── */}
              {step === 1 && (
                <>
                  <StepBadge step={1} current={1} />
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center">
                      <Baby size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-slate-900 leading-tight">Child Account</h1>
                      <p className="text-xs text-slate-400">For ages 5–15</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mb-6">
                    Already have an account?{" "}
                    <Link href="/login" className="text-blue-600 font-semibold hover:underline">Log in</Link>
                  </p>

                  <form onSubmit={handleStep1} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Child&apos;s full name</label>
                      <input className={inputCls} placeholder="e.g. Yusuf Ahmed" value={childName} onChange={e => setChildName(e.target.value)} required />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Date of birth</label>
                      <input
                        className={inputCls}
                        type="date"
                        value={dob}
                        onChange={e => setDob(e.target.value)}
                        max={maxDob}
                        min={minDob}
                        required
                      />
                      {dob && (() => {
                        const age = getChildAge(dob);
                        if (age >= 16) return <p className="text-xs text-red-500 mt-1">Child is 16+. Please create a <Link href="/signup" className="underline font-semibold">normal account</Link> instead.</p>;
                        if (age < 5) return <p className="text-xs text-red-500 mt-1">Child must be at least 5 years old.</p>;
                        return <p className="text-xs text-emerald-600 mt-1">Age: {age} years old ✓</p>;
                      })()}
                    </div>

                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-1.5 mt-2">
                      Continue <ChevronRight size={15} />
                    </button>
                  </form>

                  <p className="text-center text-xs text-slate-400 mt-4">
                    Creating a normal account instead?{" "}
                    <Link href="/signup" className="text-blue-600 font-semibold hover:underline">Sign up here</Link>
                  </p>
                </>
              )}

              {/* ─── STEP 2: Account Setup ─── */}
              {step === 2 && (
                <>
                  <StepBadge step={2} current={2} />
                  <h1 className="text-xl font-bold text-slate-900 mb-1">Account details</h1>
                  <p className="text-sm text-slate-500 mb-5">Set up login credentials for {childName || "the child"}.</p>

                  <form onSubmit={handleStep2} className="space-y-3.5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
                      <input className={inputCls} placeholder="Enter a username" value={username} onChange={e => handleUsernameChange(e.target.value)} required />
                      <div className="mt-1 h-4">
                        {usernameStatus === "checking" && <p className="text-xs text-slate-400">Checking...</p>}
                        {usernameStatus === "taken" && <p className="text-xs text-red-500 flex items-center gap-1"><X size={10} /> Already taken</p>}
                        {usernameStatus === "available" && <p className="text-xs text-emerald-600 flex items-center gap-1"><Check size={10} /> Available</p>}
                        {usernameStatus === "idle" && <p className="text-xs text-slate-400">5–14 characters</p>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                      <input className={inputCls} type="email" placeholder="child@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                      <div className="relative">
                        <input className={inputCls + " pr-11"} type={showPw ? "text" : "password"} placeholder="Create a password" value={pw} onChange={e => setPw(e.target.value)} required />
                        <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                          {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {pw.length > 0 && (
                        <div className="mt-2 flex flex-col gap-0.5">
                          {[
                            { label: "8+ characters", pass: pwChecks.length },
                            { label: "One capital letter", pass: pwChecks.upper },
                            { label: "One symbol", pass: pwChecks.symbol },
                          ].map(({ label, pass }) => (
                            <div key={label} className="flex items-center gap-1.5">
                              {pass ? <Check size={10} className="text-emerald-500" /> : <X size={10} className="text-red-400" />}
                              <span className={`text-xs ${pass ? "text-emerald-600" : "text-red-400"}`}>{label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm password</label>
                      <div className="relative">
                        <input className={inputCls + " pr-11"} type={showConfirm ? "text" : "password"} placeholder="Repeat password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required />
                        <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                          {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {confirmPw.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          {pwMatch ? <Check size={10} className="text-emerald-500" /> : <X size={10} className="text-red-400" />}
                          <span className={`text-xs ${pwMatch ? "text-emerald-600" : "text-red-400"}`}>{pwMatch ? "Passwords match" : "Passwords don't match"}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2.5 pt-1">
                      <button type="button" onClick={() => go(1, false)} className="flex-1 border border-slate-200 text-slate-600 font-semibold py-3 rounded-xl hover:bg-slate-50 transition-colors text-sm flex items-center justify-center gap-1.5">
                        <ArrowLeft size={14} /> Back
                      </button>
                      <button type="submit" disabled={usernameStatus === "checking" || usernameStatus === "taken"} className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-1.5 disabled:opacity-60">
                        Continue <ChevronRight size={15} />
                      </button>
                    </div>
                  </form>
                </>
              )}

              {/* ─── STEP 3: Parental Controls ─── */}
              {step === 3 && (
                <>
                  <StepBadge step={3} current={3} />
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center">
                      <ShieldCheck size={20} className="text-amber-600" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-slate-900 leading-tight">Parental controls</h1>
                      <p className="text-xs text-slate-400">Completed by the parent or guardian</p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Parent email <span className="text-slate-400 font-normal">(optional)</span></label>
                      <input className={inputCls} type="email" placeholder="parent@email.com" value={parentEmail} onChange={e => setParentEmail(e.target.value)} />
                      <p className="text-xs text-slate-400 mt-1">Used for notifications about your child&apos;s account</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Lock size={14} className="text-slate-500" />
                        <p className="text-sm font-semibold text-slate-700">Parental dashboard password</p>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">This password locks the parental dashboard — only you as the parent should know it. The child cannot change this.</p>

                      <div className="space-y-3">
                        <div className="relative">
                          <input className={inputCls + " pr-11"} type={showParentPw ? "text" : "password"} placeholder="Create a parental password" value={parentPw} onChange={e => setParentPw(e.target.value)} required />
                          <button type="button" onClick={() => setShowParentPw(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                            {showParentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>

                        {parentPw.length > 0 && (
                          <div className="flex flex-col gap-0.5">
                            {[
                              { label: "8+ characters", pass: parentPwChecksWithNumber.length },
                              { label: "One capital letter", pass: parentPwChecksWithNumber.upper },
                              { label: "One number (0–9)", pass: parentPwChecksWithNumber.number },
                              { label: "One symbol (!@#$...)", pass: parentPwChecksWithNumber.symbol },
                            ].map(({ label, pass }) => (
                              <div key={label} className="flex items-center gap-1.5">
                                {pass ? <Check size={10} className="text-emerald-500" /> : <X size={10} className="text-red-400" />}
                                <span className={`text-xs ${pass ? "text-emerald-600" : "text-red-400"}`}>{label}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="relative">
                          <input className={inputCls + " pr-11"} type={showConfirmParentPw ? "text" : "password"} placeholder="Confirm parental password" value={confirmParentPw} onChange={e => setConfirmParentPw(e.target.value)} required />
                          <button type="button" onClick={() => setShowConfirmParentPw(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                            {showConfirmParentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>

                        {confirmParentPw.length > 0 && (
                          <div className="flex items-center gap-1">
                            {parentPwMatch ? <Check size={10} className="text-emerald-500" /> : <X size={10} className="text-red-400" />}
                            <span className={`text-xs ${parentPwMatch ? "text-emerald-600" : "text-red-400"}`}>{parentPwMatch ? "Passwords match" : "Passwords don't match"}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2.5">
                      <button type="button" onClick={() => go(2, false)} className="flex-1 border border-slate-200 text-slate-600 font-semibold py-3 rounded-xl hover:bg-slate-50 transition-colors text-sm flex items-center justify-center gap-1.5">
                        <ArrowLeft size={14} /> Back
                      </button>
                      <button type="submit" disabled={loading || !allParentPwValid || !parentPwMatch} className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm disabled:opacity-60 flex items-center justify-center gap-1.5">
                        {loading ? "Creating account..." : "Create account →"}
                      </button>
                    </div>

                    <p className="text-xs text-slate-400 text-center mt-2">
                      By continuing you agree to our{" "}
                      <Link href="/terms" className="underline">Terms</Link> and{" "}
                      <Link href="/privacy" className="underline">Privacy Policy</Link>.
                    </p>
                  </form>
                </>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
