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
import { isCommunityPremium } from "@/lib/community-utils";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, ChevronRight, Eye, EyeOff, Check, X, Shield,
  LifeBuoy, Trash2, AlertTriangle, Store, UserPlus, Crown, Lock,
} from "lucide-react";

const inputCls =
  "w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white";

const CATEGORIES: { value: "business" | "influencer" | "coffee_shop" | "organization" | "other"; label: string }[] = [
  { value: "business", label: "Business" },
  { value: "coffee_shop", label: "Coffee shop / venue" },
  { value: "influencer", label: "Influencer / content creator" },
  { value: "organization", label: "Organization / charity" },
  { value: "other", label: "Other" },
];

const MAX_TEAM_MEMBERS = 3;

function getPwChecks(pw: string) {
  return {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    symbol: /[^a-zA-Z0-9]/.test(pw),
  };
}

type EditSection = "username" | "email" | "password" | null;

interface TeamMemberInfo {
  uid: string;
  displayName: string | null;
  username: string;
  photoURL: string | null;
}

function TeamMemberRow({ info, onRemove }: { info: TeamMemberInfo; onRemove: () => void }) {
  const initials = (info.displayName ?? info.username).split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="flex items-center gap-3 py-2.5 px-4 rounded-xl bg-slate-50 border border-slate-100">
      {info.photoURL ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={info.photoURL} alt={info.displayName ?? info.username} width={32} height={32}
          className="rounded-full object-cover flex-shrink-0" style={{ width: 32, height: 32 }} />
      ) : (
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {initials}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{info.displayName ?? info.username}</p>
        <p className="text-xs text-slate-400">@{info.username}</p>
      </div>
      <button
        onClick={onRemove}
        className="flex-shrink-0 text-slate-300 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
        title="Remove member"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

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

  // Team members
  const isPremium = isCommunityPremium(profile);
  const [teamMembers, setTeamMembers] = useState<string[]>(profile?.teamMembers ?? []);
  const [teamMemberInfos, setTeamMemberInfos] = useState<TeamMemberInfo[]>([]);
  const [teamUsername, setTeamUsername] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [removingUid, setRemovingUid] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName ?? "");
    setCategory(profile.communityCategory ?? "business");
    setBio(profile.bio ?? "");
    setWebsite(profile.website ?? "");
    setCity(profile.city ?? "");
    setPhotoURL(profile.photoURL ?? null);
    setTeamMembers(profile.teamMembers ?? []);
  }, [profile]);

  useEffect(() => {
    setNewEmail(user?.email ?? "");
  }, [user?.email]);

  useEffect(() => {
    setNewUsername(profile?.username ?? "");
  }, [profile?.username]);

  // Load team member display info
  useEffect(() => {
    if (teamMembers.length === 0) { setTeamMemberInfos([]); return; }
    let cancelled = false;
    Promise.all(teamMembers.map(async uid => {
      const snap = await getDocs(query(collection(db, "users"), where("uid", "==", uid), limit(1)));
      if (snap.empty) return null;
      const d = snap.docs[0].data();
      return {
        uid,
        displayName: d.displayName ?? null,
        username: d.username ?? uid,
        photoURL: d.photoURL ?? null,
      } as TeamMemberInfo;
    })).then(results => {
      if (!cancelled) setTeamMemberInfos(results.filter(Boolean) as TeamMemberInfo[]);
    });
    return () => { cancelled = true; };
  }, [teamMembers]);

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

  async function handleAddMember() {
    if (!user || !teamUsername.trim()) return;
    const handle = teamUsername.trim().toLowerCase();
    if (handle === profile?.username) { toast.error("You cannot add yourself."); return; }
    if (teamMembers.length >= MAX_TEAM_MEMBERS) {
      toast.error(`Premium accounts can have up to ${MAX_TEAM_MEMBERS} team members.`);
      return;
    }
    setAddingMember(true);
    try {
      const snap = await getDocs(query(collection(db, "users"), where("username", "==", handle), limit(1)));
      if (snap.empty) { toast.error("No user found with that username."); return; }
      const d = snap.docs[0].data();
      const uid = d.uid as string;
      if (teamMembers.includes(uid)) { toast.error("This user is already a team member."); return; }
      const newList = [...teamMembers, uid];
      await updateDoc(doc(db, "users", user.uid), { teamMembers: newList });
      setTeamMembers(newList);
      setTeamUsername("");
      toast.success("Team member added!");
    } catch {
      toast.error("Failed to add team member.");
    } finally {
      setAddingMember(false);
    }
  }

  async function handleRemoveMember(uid: string) {
    if (!user) return;
    setRemovingUid(uid);
    try {
      const newList = teamMembers.filter(m => m !== uid);
      await updateDoc(doc(db, "users", user.uid), { teamMembers: newList });
      setTeamMembers(newList);
      toast.success("Team member removed.");
    } catch {
      toast.error("Failed to remove team member.");
    } finally {
      setRemovingUid(null);
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

      {/* Team Members */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <UserPlus size={17} className="text-blue-600" />
            <h2 className="font-semibold text-slate-800">Team Members</h2>
          </div>
          {isPremium && (
            <span className="text-[11px] font-semibold text-slate-400">{teamMembers.length}/{MAX_TEAM_MEMBERS}</span>
          )}
        </div>
        <p className="text-xs text-slate-400 mb-4">Invite up to {MAX_TEAM_MEMBERS} users to help manage your community.</p>

        {isPremium ? (
          <div className="space-y-3">
            {teamMemberInfos.length > 0 && (
              <div className="space-y-2">
                {teamMemberInfos.map(info => (
                  <div key={info.uid} className={removingUid === info.uid ? "opacity-50" : ""}>
                    <TeamMemberRow
                      info={info}
                      onRemove={() => !removingUid && handleRemoveMember(info.uid)}
                    />
                  </div>
                ))}
              </div>
            )}
            {teamMembers.length < MAX_TEAM_MEMBERS && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={teamUsername}
                  onChange={e => setTeamUsername(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !addingMember && handleAddMember()}
                  placeholder="Add by username…"
                  className={inputCls + " flex-1"}
                />
                <button
                  onClick={handleAddMember}
                  disabled={addingMember || !teamUsername.trim()}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  {addingMember ? "Adding…" : "Add"}
                </button>
              </div>
            )}
            {teamMembers.length === MAX_TEAM_MEMBERS && (
              <p className="text-xs text-slate-400 text-center py-1">
                Maximum {MAX_TEAM_MEMBERS} team members reached.
              </p>
            )}
          </div>
        ) : (
          /* Locked state for free accounts */
          <div className="relative rounded-2xl overflow-hidden border border-slate-200">
            {/* Blurred mock content */}
            <div className="blur-sm pointer-events-none select-none p-4 space-y-2">
              {["teamuser1", "teamuser2"].map(u => (
                <div key={u} className="flex items-center gap-3 py-2.5 px-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 w-24 bg-slate-200 rounded" />
                    <div className="h-2.5 w-16 bg-slate-100 rounded" />
                  </div>
                </div>
              ))}
              <div className="flex gap-2">
                <div className="flex-1 h-12 bg-slate-50 border border-slate-200 rounded-xl" />
                <div className="w-16 h-12 bg-blue-100 rounded-xl" />
              </div>
            </div>
            {/* Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-[2px] gap-3 p-6">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Lock size={18} className="text-amber-600" />
              </div>
              <p className="text-sm font-bold text-slate-800">Premium Feature</p>
              <p className="text-xs text-slate-500 text-center max-w-xs">
                Add up to 3 team members to manage your community account with Community Premium.
              </p>
              <Link
                href="/community-hub/upgrade"
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 transition-colors rounded-xl px-4 py-2.5"
              >
                <Crown size={12} /> Upgrade to Premium
              </Link>
            </div>
          </div>
        )}
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
