"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { compressImage } from "@/lib/image-utils";
import toast from "react-hot-toast";
import { Eye, EyeOff, Check, X, Camera, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const inputCls =
  "w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white";

function getChecks(pw: string) {
  return {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    symbol: /[^a-zA-Z0-9]/.test(pw),
  };
}

function friendlyAuthError(err: unknown): string {
  const code = err && typeof err === "object" && "code" in err ? String((err as { code: unknown }).code) : "";
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try signing in instead.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password is too weak. Please choose a stronger password.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection and try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

const CATEGORIES: { value: "business" | "influencer" | "coffee_shop" | "organization" | "other"; label: string }[] = [
  { value: "business", label: "Business" },
  { value: "coffee_shop", label: "Coffee shop / venue" },
  { value: "influencer", label: "Influencer / content creator" },
  { value: "organization", label: "Organization / charity" },
  { value: "other", label: "Other" },
];

export default function SignupCommunityPage() {
  const router = useRouter();
  const { signUpCommunity } = useAuth();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<typeof CATEGORIES[number]["value"]>("business");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "taken" | "available">("idle");
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [city, setCity] = useState("");
  const [website, setWebsite] = useState("");
  const [verificationInfo, setVerificationInfo] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const categoryBtnRef = useRef<HTMLButtonElement>(null);
  const categoryPanelRef = useRef<HTMLDivElement>(null);
  const [categoryPickerRect, setCategoryPickerRect] = useState({ top: 0, left: 0, width: 0 });

  const checks = getChecks(password);
  const allValid = checks.length && checks.upper && checks.symbol;
  const pwMatch = confirmPassword.length > 0 && password === confirmPassword;
  const selectedCategory = CATEGORIES.find((c) => c.value === category)!;

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        categoryBtnRef.current && !categoryBtnRef.current.contains(e.target as Node) &&
        categoryPanelRef.current && !categoryPanelRef.current.contains(e.target as Node)
      ) {
        setShowCategoryPicker(false);
      }
    }
    if (showCategoryPicker) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [showCategoryPicker]);

  function toggleCategoryPicker() {
    if (!showCategoryPicker && categoryBtnRef.current) {
      const r = categoryBtnRef.current.getBoundingClientRect();
      setCategoryPickerRect({ top: r.bottom + 6, left: r.left, width: r.width });
    }
    setShowCategoryPicker((v) => !v);
  }

  function handleUsernameChange(val: string) {
    const v = val.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 14);
    setUsername(v);
    if (usernameTimer.current) clearTimeout(usernameTimer.current);
    if (v.length < 5) {
      setUsernameStatus("idle");
      return;
    }
    setUsernameStatus("checking");
    usernameTimer.current = setTimeout(async () => {
      const snap = await getDocs(query(collection(db, "users"), where("username", "==", v), limit(1)));
      setUsernameStatus(snap.empty ? "available" : "taken");
    }, 500);
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    try {
      const dataUrl = await compressImage(file, 200, 0.75);
      setPhotoURL(dataUrl);
    } finally {
      setPhotoUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter the community/business name.");
      return;
    }
    if (usernameStatus === "taken") {
      toast.error("That username is already taken.");
      return;
    }
    if (usernameStatus === "checking") {
      toast.error("Still checking that username, give it a second.");
      return;
    }
    if (username.length < 5) {
      toast.error("Username must be at least 5 characters.");
      return;
    }
    if (!verificationInfo.trim()) {
      toast.error("Please tell us how we can verify this is an official account.");
      return;
    }
    if (!email.trim()) {
      toast.error("Please enter a business email.");
      return;
    }
    if (!allValid) {
      toast.error("Password doesn't meet all requirements.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      await signUpCommunity({
        email,
        password,
        name,
        username,
        category,
        city,
        website,
        verificationInfo,
        photoURL,
      });
      toast.success("Application submitted! We'll review it shortly.");
      router.push("/community-hub");
    } catch (err) {
      toast.error(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white relative flex items-center justify-center px-4 py-12 overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #cbd5e1 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 0.4,
        }}
      />
      <div className="absolute top-0 inset-x-0 h-80 bg-gradient-to-b from-blue-50/70 to-transparent pointer-events-none" />

      <div className="relative w-full max-w-[480px]">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8 group">
          <Image src="/images/logo-black.PNG" alt="Jannatie" width={26} height={26} className="object-contain" />
          <span className="text-xl font-bold text-slate-900">Jannatie</span>
        </Link>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/70 ring-1 ring-slate-100 overflow-hidden">
          <div className="p-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Create a community account</h1>
            <p className="text-slate-500 text-sm mb-1">
              For businesses, venues, and official organizers to post events on Jannatie.
            </p>
            <p className="text-slate-400 text-xs mb-5">
              Not a business?{" "}
              <Link href="/signup" className="text-blue-600 font-semibold hover:underline">
                Sign up as a normal user
              </Link>
            </p>

            <div className="rounded-xl bg-blue-50/70 border border-blue-100 px-4 py-3 mb-5">
              <p className="text-xs text-blue-700 leading-relaxed">
                Every community account is reviewed by our team before it goes live. You&apos;ll get a verified badge
                once approved. Submitted accounts can&apos;t post events until then.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="relative w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden hover:bg-slate-50 transition-colors"
                  disabled={photoUploading}
                >
                  {photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoURL} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Camera size={18} className="text-slate-400" />
                  )}
                </button>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">Logo (optional)</p>
                  <p className="text-xs text-slate-400">{photoUploading ? "Uploading..." : "Square image works best"}</p>
                </div>
                <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Community / business name</label>
                <input className={inputCls} placeholder="Enter the community / business name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                <button
                  ref={categoryBtnRef}
                  type="button"
                  onClick={toggleCategoryPicker}
                  className={`${inputCls} flex items-center justify-between gap-2 text-left ${showCategoryPicker ? "ring-2 ring-blue-500 border-transparent" : ""}`}
                >
                  <span className="text-slate-900">{selectedCategory.label}</span>
                  <ChevronDown size={15} className={`text-slate-400 flex-shrink-0 transition-transform ${showCategoryPicker ? "rotate-180" : ""}`} />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
                <input className={inputCls} placeholder="Enter a username" value={username} onChange={(e) => handleUsernameChange(e.target.value)} required />
                <div className="mt-1 h-4">
                  {usernameStatus === "checking" && <p className="text-xs text-slate-400">Checking...</p>}
                  {usernameStatus === "taken" && (
                    <div className="flex items-center gap-1">
                      <X size={10} className="text-red-400" />
                      <p className="text-xs text-red-500">Already taken</p>
                    </div>
                  )}
                  {usernameStatus === "available" && (
                    <div className="flex items-center gap-1">
                      <Check size={10} className="text-emerald-500" />
                      <p className="text-xs text-emerald-600">Available</p>
                    </div>
                  )}
                  {usernameStatus === "idle" && <p className="text-xs text-slate-400">5–14 chars</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">City</label>
                <input className={inputCls} placeholder="Enter your city" value={city} onChange={(e) => setCity(e.target.value)} required />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Website or social media link <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input className={inputCls} type="url" placeholder="Enter a link" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  How can we verify this is an official account? <span className="text-red-400">*</span>
                </label>
                <textarea
                  className={inputCls + " resize-none"}
                  rows={3}
                  placeholder="e.g. link to your official Instagram/Google Business listing, business registration number, or a way to confirm you represent this business"
                  value={verificationInfo}
                  onChange={(e) => setVerificationInfo(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Business email</label>
                <input className={inputCls} type="email" placeholder="Enter your business email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    className={inputCls + " pr-11"}
                    type={showPw ? "text" : "password"}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label="Toggle password"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="mt-2 flex flex-col gap-0.5">
                    {[
                      { label: "8+ characters", pass: checks.length },
                      { label: "One capital letter", pass: checks.upper },
                      { label: "One symbol", pass: checks.symbol },
                    ].map(({ label, pass }) => (
                      <div key={label} className="flex items-center gap-1.5">
                        {pass ? (
                          <Check size={10} className="text-emerald-500 flex-shrink-0" />
                        ) : (
                          <X size={10} className="text-red-400 flex-shrink-0" />
                        )}
                        <span className={`text-xs ${pass ? "text-emerald-600" : "text-red-400"}`}>
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm password</label>
                <div className="relative">
                  <input
                    className={inputCls + " pr-11"}
                    type={showConfirmPw ? "text" : "password"}
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label="Toggle password"
                  >
                    {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirmPassword.length > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    {pwMatch ? (
                      <Check size={10} className="text-emerald-500" />
                    ) : (
                      <X size={10} className="text-red-400" />
                    )}
                    <span className={`text-xs ${pwMatch ? "text-emerald-600" : "text-red-400"}`}>
                      {pwMatch ? "Passwords match" : "Passwords don't match"}
                    </span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm disabled:opacity-60 mt-2"
              >
                {loading ? "Submitting..." : "Submit application"}
              </button>
            </form>

            <p className="text-center text-xs text-slate-400 mt-5">
              By applying you agree to our{" "}
              <Link href="/terms" className="underline">Terms</Link> and{" "}
              <Link href="/privacy" className="underline">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>

      {showCategoryPicker && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          <motion.div
            ref={categoryPanelRef}
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "fixed",
              top: categoryPickerRect.top,
              left: categoryPickerRect.left,
              width: categoryPickerRect.width,
              zIndex: 9999,
            }}
            className="rounded-2xl shadow-xl border border-slate-200 bg-white py-1.5 overflow-hidden"
          >
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setCategory(c.value);
                  setShowCategoryPicker(false);
                }}
                className={`w-full text-left flex items-center justify-between gap-2 px-4 py-2.5 text-sm transition-colors ${
                  c.value === category ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>{c.label}</span>
                {c.value === category && <Check size={14} className="text-blue-600 flex-shrink-0" />}
              </button>
            ))}
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
