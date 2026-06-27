import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

// XP required to REACH each level (index = level - 1)
// Gets progressively harder: 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500+
export const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500];

export function calcLevel(xp: number): number {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return level;
}

export function levelProgress(xp: number): number {
  const level = calcLevel(xp);
  const start = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const end = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  if (end === start) return 100;
  return Math.min(100, Math.round(((xp - start) / (end - start)) * 100));
}

export async function awardXP(uid: string, amount: number): Promise<void> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();

  const currentXP: number = (data.xp as number) ?? 0;
  const newXP = currentXP + amount;
  const newLevel = calcLevel(newXP);

  const todayStr = new Date().toISOString().split("T")[0];
  const lastActiveDate = data.lastActiveDate as string | undefined;

  let newStreak: number = (data.streak as number) ?? 0;
  if (lastActiveDate !== todayStr) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    if (lastActiveDate === yesterdayStr) {
      newStreak = newStreak + 1;
    } else {
      // Missed a day (or first ever activity) — reset to 1
      newStreak = 1;
    }
  }

  await updateDoc(ref, {
    xp: newXP,
    level: newLevel,
    streak: newStreak,
    lastActiveDate: todayStr,
  });
}
