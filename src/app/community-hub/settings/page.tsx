"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, writeBatch, limit } from "firebase/firestore";
import {
  updateEmail, updatePassword, EmailAuthProvider,
  reauthenticateWithCredential, deleteUser,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { compressImage } from "@/lib/image-utils";
import { sendSecurityEmail } from "@/lib/security-email";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, ChevronRight, Eye, EyeOff, Check, X, Shield,
  LifeBuoy, Trash2, AlertTriangle, Store, CreditCard, Crown,
} from "lucide-react";

function CommunityCancelSection({ uid }: { uid: string }) {
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);

  async function handleCancel() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success("Your Community Premium subscription will cancel at the end of your billing period.");
      setConfirm(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not cancel. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <CreditCard size={17} className="text-blue-600" />
        <h2 className="font-semibold text-slate-800">Subscription</h2>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
            Community Premium <Crown size={13} className="text-amber-500" />
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Verified badge, unlimited events and analytics</p>
        </div>
        {!confirm ? (
          <button
            onClick={() => setConfirm(true)}
            className="text-xs text-rose-500 hover:text-rose-600 font-semibold transition-colors"
          >
            Cancel subscription
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Are you sure?</span>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="text-xs text-rose-600 font-semibold hover:text-rose-700 transition-colors disabled:opacity-60"
            >
              {loading ? "Cancelling…" : "Yes, cancel"}
            </button>
            <button onClick={() => setConfirm(false)} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
              Keep it
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const inputCls =
  "w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white";

const CATEGORIES: { value: "business" | "influencer" | "coffee_shop" | "organization" | "other"; label: string }[] = [
  { value: "business", label: "Business" },
  { value: "coffee_shop", label: "Coffee shop / venue" },
  { value: "influencer", label: "Influencer / content creator" },
  { value: "organization", label: "Organization / charity" },
  { value: "other", label: "Other" },
];

function getPwChecks(pw: string) {
  return {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    symbol: /[^a-zA-Z0-9]/.test(pw),
  };
}

type EditSection = "username" | "email" | "password" | null;

export default function CommunitySettingsPage() {
  const { user, profile, logOut } = useAuth();
  const router = useRouter();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [category, setCategory] = useState(profile?.communityCategory ?? "business");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [website, setWebsite] = useState(profile?.website ?? "");
  const [city, setCity] = useState(profile?.city ?? "");
  const [photoURL, setPhotoURL] = useState<string | null>(profile?.photoURL ?? null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [expandedSection, setExpandedSection] = useState<EditSection>(null);

  const [newUsername, setNewUsername] = useState(profile?.username ?? "");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "taken" | "available">("idle");
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [savingUsername, setSavingUsername] = useState(false);

  const [newEmail, setNewEmail] = useState(user?.email ?? "");
  const [savingEmail, setSavingEmail] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmNewPw, setConfirmNewPw] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmNewPw, setShowConfirmNewPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const hasPasswordProvider = user?.providerData.some((p) => p.providerId === "password") ?? false;
  const pwChecks = getPwChecks(newPw);
  const pwAllValid = pwChecks.length && pwChecks.upper && pwChecks.symbol;
  const pwMatch = confirmNewPw.length > 0 && newPw === confirmNewPw;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePw, setDeletePw] = useState("");
  const [showDeletePw, setShowDeletePw] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName ?? "");
    setCategory(profile.communityCategory ?? "business");
    setBio(profile.bio ?? "");
    setWebsite(profile.website ?? "");
    setCity(profile.city ?? "");
    setPhotoURL(profile.photoURL ?? null);
  }, [profile]);

  useEffect(() => {
    setNewEmail(user?.email ?? "");
  }, [user?.email]);

  useEffect(() => {
    setNewUsername(profile?.username ?? "");
  }, [profile?.username]);

  function toggleSection(section: EditSection) {
    setExpandedSection((prev) => (prev === section ? null : section));
    setUsernameStatus("idle");
    setNewUsername(profile?.username ?? "");
  }

  const handleUsernameInput = useCallback((val: string) => {
    const v = val.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 14);
    setNewUsername(v);
    setUsernameStatus("idle");
    if (usernameTimer.current) clearTimeout(usernameTimer.current);
    if (v.length < 5 || v === profile?.username) return;
    setUsernameStatus("checking");
    usernameTimer.current = setTimeout(async () => {
      const snap = await getDocs(query(collection(db, "users"), where("username", "==", v), limit(1)));
      setUsernameStatus(snap.empty ? "available" : "taken");
    }, 500);
  }, [profile?.username]);

  async function saveUsername() {
    if (!user || newUsername.length < 5) return;
    if (usernameStatus === "taken") { toast.error("That username is already taken."); return; }
    if (usernameStatus === "checking") { toast.error("Still checking availability."); return; }
    if (newUsername === profile?.username) { setExpandedSection(null); return; }
    setSavingUsername(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { username: newUsername });

      // Keep already-posted events showing the new username instead of orphaning them.
      const eventsSnap = await getDocs(query(collection(db, "communityEvents"), where("communityUid", "==", user.uid)));
      if (!eventsSnap.empty) {
        const batch = writeBatch(db);
        eventsSnap.docs.forEach((d) => batch.update(d.ref, { communityUsername: newUsername }));
        await batch.commit();
      }

      toast.success("Username updated!");
      setExpandedSection(null);
    } catch {
      toast.error("Failed to update username.");
    } finally {
      setSavingUsername(false);
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setPhotoUploading(true);
    try {
      const dataUrl = await compressImage(file, 200, 0.75);
      await updateDoc(doc(db, "users", user.uid), { photoURL: dataUrl });
      setPhotoURL(dataUrl);
      toast.success("Logo updated!");
    } finally {
      setPhotoUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { displayName, communityCategory: category, bio, website, city });
      toast.success("Settings saved!");
    } catch {
      toast.error("Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function saveEmail() {
    if (!user || !newEmail.trim() || newEmail === user.email) return;
    setSavingEmail(true);
    try {
      const trimmedEmail = newEmail.trim();
      await updateEmail(auth.currentUser!, trimmedEmail);
      await sendSecurityEmail(trimmedEmail, "email", trimmedEmail, profile?.displayName ?? undefined);
      toast.success("Email updated!");
      setExpandedSection(null);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "auth/requires-recent-login") {
        toast.error("Session expired — please sign out and sign back in, then try again.");
      } else {
        toast.error("Failed to update email.");
      }
    } finally {
      setSavingEmail(false);
    }
  }

  async function handleChangePassword() {
    if (!auth.currentUser || !auth.currentUser.email) return;
    if (!currentPw) { toast.error("Please enter your current password."); return; }
    if (!pwAllValid) { toast.error("New password doesn't meet all requirements."); return; }
    if (!pwMatch) { toast.error("New passwords don't match."); return; }
    setChangingPw(true);
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPw);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPw);
      toast.success("Password updated!");
      setExpandedSection(null);
      setCurrentPw(""); setNewPw(""); setConfirmNewPw("");
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        toast.error("Current password is incorrect.");
      } else if (code === "auth/requires-recent-login") {
        toast.error("Session expired — please sign out and sign back in, then try again.");
      } else {
        toast.error("Failed to update password. Please try again.");
      }
    } finally {
      setChangingPw(false);
    }
  }

  async function handleDeleteAccount() {
    if (!auth.currentUser) return;
    if (hasPasswordProvider && !deletePw) { toast.error("Please enter your password to confirm."); return; }
    setDeleting(true);
    try {
      if (hasPasswordProvider && auth.currentUser.email) {
        const credential = EmailAuthProvider.credential(auth.currentUser.email, deletePw);
        await reauthenticateWithCredential(auth.currentUser, credential);
      }
      await deleteDoc(doc(db, "users", auth.currentUser.uid));
      await deleteUser(auth.currentUser);
      toast.success("Your account has been deleted.");
      router.push("/");
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        toast.error("Incorrect password.");
      } else if (code === "auth/requires-recent-login") {
        toast.error("Session expired — please sign out and sign back in, then try again.");
      } else {
        toast.error("Failed to delete account. Please try again.");
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Settings</h1>
      <p className="text-slate-500 text-sm mb-8">Manage your community account&apos;s public details.</p>

      {/* Public profile */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 mb-4">
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
          <div>
            <p className="text-sm font-medium text-slate-700">Logo</p>
            <p className="text-xs text-slate-400">{photoUploading ? "Uploading..." : "Click to change"}</p>
          </div>
          <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Community / business name</label>
          <input className={inputCls} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setCategory(value)}
                className={`flex items-center gap-2 py-2.5 px-3 rounded-xl border text-sm font-medium transition-all text-left ${
                  category === value
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <Store size={13} className="flex-shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Bio</label>
          <textarea className={inputCls + " resize-none"} rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">City</label>
          <input className={inputCls} value={city} onChange={(e) => setCity(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Website / social link</label>
          <input className={inputCls} value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>

      {/* Account */}
      <div className="bg-white rounded-2xl border border-slate-200 mb-4 overflow-hidden">
        <div className="px-6 pt-5 pb-1">
          <h2 className="font-semibold text-slate-800">Account</h2>
        </div>

        {/* Username */}
        <div className="border-t border-slate-100 mt-3">
          <button
            onClick={() => toggleSection("username")}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50/60 transition-colors text-left"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Username</p>
              <p className="text-sm text-slate-800 truncate">@{profile?.username ?? "—"}</p>
            </div>
            <ChevronRight size={16} className={`text-slate-300 flex-shrink-0 transition-transform ${expandedSection === "username" ? "rotate-90" : ""}`} />
          </button>
          <AnimatePresence>
            {expandedSection === "username" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-5 pt-1 space-y-2 bg-slate-50/50">
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => handleUsernameInput(e.target.value)}
                    placeholder="new_username"
                    className={inputCls}
                    autoFocus
                  />
                  <div className="h-4">
                    {usernameStatus === "checking" && <p className="text-xs text-slate-400">Checking…</p>}
                    {usernameStatus === "taken" && (
                      <div className="flex items-center gap-1"><X size={10} className="text-red-400" /><p className="text-xs text-red-500">Already taken</p></div>
                    )}
                    {usernameStatus === "available" && (
                      <div className="flex items-center gap-1"><Check size={10} className="text-emerald-500" /><p className="text-xs text-emerald-600">Available</p></div>
                    )}
                    {usernameStatus === "idle" && <p className="text-xs text-slate-400">5–14 characters · letters, numbers, underscores</p>}
                  </div>
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    This also updates the name shown on events you&apos;ve already posted.
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setExpandedSection(null)} className="flex-1 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors font-medium border border-slate-200 rounded-xl hover:bg-white">
                      Cancel
                    </button>
                    <button
                      onClick={saveUsername}
                      disabled={savingUsername || newUsername.length < 5 || usernameStatus === "taken" || usernameStatus === "checking"}
                      className="flex-[2] py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {savingUsername ? "Saving…" : "Save username"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Email */}
        <div className="border-t border-slate-100">
          <button
            onClick={() => toggleSection("email")}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50/60 transition-colors text-left"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Email address</p>
              <p className="text-sm text-slate-800 truncate">{user?.email ?? "—"}</p>
            </div>
            <ChevronRight size={16} className={`text-slate-300 flex-shrink-0 transition-transform ${expandedSection === "email" ? "rotate-90" : ""}`} />
          </button>
          <AnimatePresence>
            {expandedSection === "email" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-5 pt-1 space-y-3 bg-slate-50/50">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="new@email.com"
                    className={inputCls}
                    autoFocus
                  />
                  <p className="text-xs text-slate-400">
                    A security notification will be sent to your current email after this change.
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => { setExpandedSection(null); setNewEmail(user?.email ?? ""); }} className="flex-1 py-2 text-sm text-slate-500 font-medium border border-slate-200 rounded-xl hover:bg-white transition-colors">
                      Cancel
                    </button>
                    <button
                      onClick={saveEmail}
                      disabled={savingEmail || !newEmail.trim() || newEmail === user?.email}
                      className="flex-[2] py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {savingEmail ? "Saving…" : "Update email"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Password */}
        <div className="border-t border-slate-100">
          <button
            onClick={() => toggleSection("password")}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50/60 transition-colors text-left"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Password</p>
              <p className="text-sm text-slate-800">••••••••</p>
            </div>
            <ChevronRight size={16} className={`text-slate-300 flex-shrink-0 transition-transform ${expandedSection === "password" ? "rotate-90" : ""}`} />
          </button>
          <AnimatePresence>
            {expandedSection === "password" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {!hasPasswordProvider ? (
                  <p className="text-xs text-slate-400 px-6 pb-5 pt-1">
                    You signed in with Google, so there&apos;s no Jannatie password to change.
                  </p>
                ) : (
                  <div className="px-6 pb-5 pt-1 space-y-3 bg-slate-50/50">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Current password</label>
                      <div className="relative">
                        <input
                          type={showCurrentPw ? "text" : "password"}
                          value={currentPw}
                          onChange={(e) => setCurrentPw(e.target.value)}
                          placeholder="Current password"
                          className={inputCls + " pr-11"}
                          autoComplete="current-password"
                        />
                        <button type="button" onClick={() => setShowCurrentPw((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showCurrentPw ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">New password</label>
                      <div className="relative">
                        <input
                          type={showNewPw ? "text" : "password"}
                          value={newPw}
                          onChange={(e) => setNewPw(e.target.value)}
                          placeholder="New password"
                          className={inputCls + " pr-11"}
                          autoComplete="new-password"
                        />
                        <button type="button" onClick={() => setShowNewPw((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      {newPw.length > 0 && (
                        <div className="mt-2 flex flex-col gap-0.5">
                          {[
                            { label: "8+ characters", pass: pwChecks.length },
                            { label: "One capital letter", pass: pwChecks.upper },
                            { label: "One symbol", pass: pwChecks.symbol },
                          ].map(({ label, pass }) => (
                            <div key={label} className="flex items-center gap-1.5">
                              {pass ? <Check size={10} className="text-emerald-500 flex-shrink-0" /> : <X size={10} className="text-red-400 flex-shrink-0" />}
                              <span className={`text-xs ${pass ? "text-emerald-600" : "text-red-400"}`}>{label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Confirm new password</label>
                      <div className="relative">
                        <input
                          type={showConfirmNewPw ? "text" : "password"}
                          value={confirmNewPw}
                          onChange={(e) => setConfirmNewPw(e.target.value)}
                          placeholder="Repeat new password"
                          className={inputCls + " pr-11"}
                          autoComplete="new-password"
                        />
                        <button type="button" onClick={() => setShowConfirmNewPw((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showConfirmNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      {confirmNewPw.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          {pwMatch ? <Check size={10} className="text-emerald-500" /> : <X size={10} className="text-red-400" />}
                          <span className={`text-xs ${pwMatch ? "text-emerald-600" : "text-red-400"}`}>
                            {pwMatch ? "Passwords match" : "Passwords don't match"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setExpandedSection(null); setCurrentPw(""); setNewPw(""); setConfirmNewPw(""); }}
                        className="flex-1 py-2 text-sm text-slate-500 font-medium border border-slate-200 rounded-xl hover:bg-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleChangePassword}
                        disabled={changingPw || !currentPw || !pwAllValid || !pwMatch}
                        className="flex-[2] py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {changingPw ? "Updating…" : "Update password"}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Privacy & Help */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={17} className="text-blue-600" />
          <h2 className="font-semibold text-slate-800">Privacy</h2>
        </div>
        <a href="/privacy" className="block text-sm text-blue-600 hover:text-blue-500 transition-colors">
          View Privacy Policy
        </a>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <LifeBuoy size={17} className="text-blue-600" />
          <h2 className="font-semibold text-slate-800">Help &amp; Support</h2>
        </div>
        <div className="space-y-1">
          <a
            href="/support#help-centre"
            className="w-full text-left text-sm text-slate-600 hover:text-slate-900 py-2.5 px-3 -mx-3 rounded-xl hover:bg-slate-100 transition-colors font-medium flex items-center justify-between"
          >
            Help Centre
            <ChevronRight size={14} className="text-slate-300" />
          </a>
          <a
            href="/support#contact"
            className="w-full text-left text-sm text-slate-600 hover:text-slate-900 py-2.5 px-3 -mx-3 rounded-xl hover:bg-slate-100 transition-colors font-medium flex items-center justify-between"
          >
            Contact Support
            <ChevronRight size={14} className="text-slate-300" />
          </a>
        </div>
      </div>

      {/* Subscription */}
      {(profile?.communityPlan === "premium" || profile?.plan === "premium") && (
        <CommunityCancelSection uid={user?.uid ?? ""} />
      )}

      {/* Danger zone */}
      <div className="bg-white rounded-2xl border border-red-200 p-6">
        <div className="flex items-center gap-2 mb-2">
          <Trash2 size={17} className="text-red-500" />
          <h2 className="font-semibold text-slate-800">Danger zone</h2>
        </div>
        <p className="text-sm text-slate-400 mb-5">These actions are permanent and cannot be undone.</p>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={logOut}
            className="text-slate-600 hover:text-slate-900 font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors border border-slate-200 hover:bg-slate-100"
          >
            Sign out
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-red-600 hover:bg-red-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
          >
            Delete account
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showDeleteConfirm && (
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !deleting && setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm rounded-3xl p-6 bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-3">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Delete your account?</h2>
              <p className="text-sm text-slate-500 mb-4">
                This permanently deletes your community profile and event listings. This cannot be undone.
              </p>
              {hasPasswordProvider && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Enter your password to confirm</label>
                  <div className="relative">
                    <input
                      type={showDeletePw ? "text" : "password"}
                      value={deletePw}
                      onChange={(e) => setDeletePw(e.target.value)}
                      placeholder="Password"
                      className={inputCls + " pr-11"}
                      autoComplete="current-password"
                    />
                    <button type="button" onClick={() => setShowDeletePw((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showDeletePw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeletePw(""); }}
                  disabled={deleting}
                  className="flex-1 py-2.5 text-sm text-slate-600 font-medium border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting || (hasPasswordProvider && !deletePw)}
                  className="flex-[2] py-2.5 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-500 transition-colors disabled:opacity-50"
                >
                  {deleting ? "Deleting…" : "Delete my account"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
