import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

export const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500];

export const GEMS_PER_LESSON = 5;
export const GEMS_PER_EXAM = 20;
export const FREEZE_COST = 10;        // gems to buy a streak freeze
export const REPAIR_COST = 25;        // gems to repair a broken streak
export const MAX_FREEZES = 2;
export const REPAIR_WINDOW_DAYS = 2;  // can repair within this many days of breaking

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

function todayDate(): string {
  return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local timezone
}

function subtractDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() - days);
  return d.toLocaleDateString("en-CA");
}

export interface StreakUpdateResult {
  newStreak: number;
  freezeUsed: boolean;
  streakBroken: boolean;
}

/**
 * Calculates the new streak state after completing a lesson today.
 * Handles: consecutive day, already done today, missed day with freeze, streak break.
 */
export function calcStreakUpdate(data: {
  streak: number;
  lastActiveDate?: string;
  streakFreezes?: number;
}): StreakUpdateResult & { newFreezes: number; newLastActive: string; clearBrokenAt: boolean } {
  const today = todayDate();
  const lastActive = data.lastActiveDate;
  const streakFreezes = data.streakFreezes ?? 0;
  let streak = data.streak ?? 0;

  // Already did a lesson today — no change
  if (lastActive === today) {
    return { newStreak: streak, newFreezes: streakFreezes, newLastActive: today, freezeUsed: false, streakBroken: false, clearBrokenAt: false };
  }

  const yesterday = subtractDays(today, 1);

  if (!lastActive || lastActive === yesterday) {
    // First ever or consecutive day
    return { newStreak: streak + 1, newFreezes: streakFreezes, newLastActive: today, freezeUsed: false, streakBroken: false, clearBrokenAt: true };
  }

  // Missed at least one day
  if (streakFreezes > 0) {
    // Auto-apply freeze — streak stays intact
    return { newStreak: streak, newFreezes: streakFreezes - 1, newLastActive: today, freezeUsed: true, streakBroken: false, clearBrokenAt: false };
  }

  // Streak broken
  return { newStreak: 1, newFreezes: 0, newLastActive: today, freezeUsed: false, streakBroken: true, clearBrokenAt: false };
}

export async function awardXP(uid: string, amount: number, gemsBonus = GEMS_PER_LESSON): Promise<StreakUpdateResult> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { newStreak: 0, freezeUsed: false, streakBroken: false };
  const data = snap.data();

  const newXP = ((data.xp as number) ?? 0) + amount;
  const newLevel = calcLevel(newXP);
  const newGems = ((data.gems as number) ?? 0) + gemsBonus;

  const streakResult = calcStreakUpdate({
    streak: (data.streak as number) ?? 0,
    lastActiveDate: data.lastActiveDate as string | undefined,
    streakFreezes: (data.streakFreezes as number) ?? 0,
  });

  const updates: Record<string, unknown> = {
    xp: newXP,
    level: newLevel,
    gems: newGems,
    streak: streakResult.newStreak,
    lastActiveDate: streakResult.newLastActive,
    streakFreezes: streakResult.newFreezes,
  };
  if (streakResult.streakBroken) {
    updates.streakBrokenAt = data.lastActiveDate ?? null;
    updates.streakBeforeBreak = (data.streak as number) ?? 0;
  }
  if (streakResult.clearBrokenAt) {
    updates.streakBrokenAt = null;
    updates.streakBeforeBreak = null;
  }

  await updateDoc(ref, updates);
  return streakResult;
}

/** Buy a streak freeze with gems. Returns false if not enough gems or already at max. */
export async function buyStreakFreeze(uid: string): Promise<{ ok: boolean; reason?: string }> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { ok: false, reason: "User not found" };
  const data = snap.data();
  const gems = (data.gems as number) ?? 0;
  const freezes = (data.streakFreezes as number) ?? 0;
  if (freezes >= MAX_FREEZES) return { ok: false, reason: `You already have the maximum ${MAX_FREEZES} streak freezes.` };
  if (gems < FREEZE_COST) return { ok: false, reason: `You need ${FREEZE_COST} gems (you have ${gems}).` };
  await updateDoc(ref, { gems: gems - FREEZE_COST, streakFreezes: freezes + 1 });
  return { ok: true };
}

/** Repair a broken streak with gems. Only allowed within REPAIR_WINDOW_DAYS days of breaking. */
export async function repairStreak(uid: string): Promise<{ ok: boolean; reason?: string }> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { ok: false, reason: "User not found" };
  const data = snap.data();
  const gems = (data.gems as number) ?? 0;
  const brokenAt = data.streakBrokenAt as string | undefined;
  const oldStreak = (data.streakBeforeBreak as number) ?? 0;

  if (!brokenAt) return { ok: false, reason: "No broken streak to repair." };

  const windowCutoff = subtractDays(todayDate(), REPAIR_WINDOW_DAYS);
  if (brokenAt < windowCutoff) return { ok: false, reason: "The repair window has passed (2 days)." };
  if (gems < REPAIR_COST) return { ok: false, reason: `You need ${REPAIR_COST} gems (you have ${gems}).` };

  await updateDoc(ref, {
    gems: gems - REPAIR_COST,
    streak: oldStreak + 1,
    streakBrokenAt: null,
    streakBeforeBreak: null,
    lastActiveDate: todayDate(),
  });
  return { ok: true };
}
