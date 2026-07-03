"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  doc, setDoc, serverTimestamp, collection, query, where,
  getDocs, onSnapshot,
} from "firebase/firestore";
import { auth, db } from "./firebase";

interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  username: string;
  photoURL: string | null;
  plan: "free" | "premium" | "family" | "mosque" | "school";
  xp: number;
  level: number;
  streak: number;
  lastActiveDate?: string;       // YYYY-MM-DD
  streakFreezes?: number;        // 0–2 stored streak shields
  streakBrokenAt?: string;       // date streak broke — enables repair within 2 days
  streakBeforeBreak?: number;    // streak value before break — used for repair
  gems?: number;                 // earnable currency
  joinedAt: Date | null;
  habits?: string[];
  hifzPlan?: {
    preset: string;
    amount?: number;
    unit?: string;
    days?: number[];              // 0=Mon … 6=Sun
    time?: string;                // "HH:MM" 24-hour
    log?: Record<string, boolean>; // { "2026-06-25": true }
  };
  habitLog?: Record<string, Record<string, boolean>>; // { "2026-06-26": { "Pray all 5 Salah on time": true } }
  adhkarLog?: Record<string, { morning?: boolean; evening?: boolean }>; // { "2026-06-26": { morning: true } }
  gender?: "male" | "female";
  phone?: string;
  nameLastChanged?: string;
  usernameLastChanged?: string;
  prayerMethod?: number;
  chosenMosque?: { id: number; name: string; lat: number; lon: number } | null;
  onboarded?: boolean;
  following?: string[];
  followers?: string[];
  // Community accounts
  accountType?: "user" | "community"; // undefined = normal user
  communityCategory?: "business" | "influencer" | "coffee_shop" | "organization" | "other";
  bio?: string;
  website?: string;
  city?: string;
  verificationInfo?: string; // applicant-submitted proof (social link, registration info, etc.)
  applicationStatus?: "pending" | "approved" | "rejected"; // community accounts only
  communityPlan?: string; // "premium" when set by admin in Firebase Console
  teamMembers?: string[]; // UIDs of team members (premium only, max 3)
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, username: string) => Promise<void>;
  signUpCommunity: (params: {
    email: string;
    password: string;
    name: string;
    username: string;
    category: NonNullable<UserProfile["communityCategory"]>;
    city: string;
    website: string;
    verificationInfo: string;
    photoURL: string | null;
  }) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const googleProvider = new GoogleAuthProvider();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

      setUser(firebaseUser);

      if (firebaseUser) {
        const ref = doc(db, "users", firebaseUser.uid);
        unsubscribeDoc = onSnapshot(ref, (snap) => {
          if (snap.exists()) {
            setProfile(snap.data() as UserProfile);
          }
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  async function signIn(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signUp(email: string, password: string, name: string, username: string) {
    const taken = await getDocs(query(collection(db, "users"), where("username", "==", username.toLowerCase())));
    if (!taken.empty) throw new Error("That username is already taken. Please choose a different one.");

    const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(newUser, { displayName: name });
    const ref = doc(db, "users", newUser.uid);
    await setDoc(ref, {
      uid: newUser.uid,
      email: newUser.email,
      displayName: name,
      username: username.toLowerCase(),
      photoURL: null,
      plan: "free",
      xp: 0,
      level: 1,
      streak: 0,
      following: [],
      followers: [],
      joinedAt: serverTimestamp(),
    });
  }

  async function signUpCommunity(params: {
    email: string;
    password: string;
    name: string;
    username: string;
    category: NonNullable<UserProfile["communityCategory"]>;
    city: string;
    website: string;
    verificationInfo: string;
    photoURL: string | null;
  }) {
    const { email, password, name, username, category, city, website, verificationInfo, photoURL } = params;
    const taken = await getDocs(query(collection(db, "users"), where("username", "==", username.toLowerCase())));
    if (!taken.empty) throw new Error("That username is already taken. Please choose a different one.");

    const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(newUser, { displayName: name });
    const ref = doc(db, "users", newUser.uid);
    await setDoc(ref, {
      uid: newUser.uid,
      email: newUser.email,
      displayName: name,
      username: username.toLowerCase(),
      photoURL: photoURL ?? null,
      plan: "free",
      xp: 0,
      level: 1,
      streak: 0,
      joinedAt: serverTimestamp(),
      accountType: "community",
      communityCategory: category,
      city,
      website,
      verificationInfo,
      bio: "",
      applicationStatus: "pending",
    });
  }

  async function signInWithGoogle() {
    const { user: googleUser } = await signInWithPopup(auth, googleProvider);
    const ref = doc(db, "users", googleUser.uid);
    const { getDoc } = await import("firebase/firestore");
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: googleUser.uid,
        email: googleUser.email,
        displayName: googleUser.displayName,
        photoURL: googleUser.photoURL,
        plan: "free",
        xp: 0,
        level: 1,
        streak: 0,
        following: [],
        followers: [],
        joinedAt: serverTimestamp(),
      });
    }
  }

  async function logOut() {
    await signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signUpCommunity, signInWithGoogle, logOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
