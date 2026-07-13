import { NextRequest, NextResponse } from "next/server";
import { incrementUserField, getUserDoc, updateUserDoc } from "@/lib/firestore-admin";

const AD_GEMS = 5;
const MAX_ADS_PER_DAY = 5;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json() as { userId: string };
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // Read flat ad log fields: adWatchDate (string) and adWatchCount (string)
    const userDoc = await getUserDoc(userId);
    const logDate = userDoc.adWatchDate as string | null;
    const logCount = logDate === today ? parseInt((userDoc.adWatchCount as string) ?? "0") || 0 : 0;

    if (logCount >= MAX_ADS_PER_DAY) {
      return NextResponse.json({ error: "Daily ad limit reached", limitReached: true }, { status: 429 });
    }

    // Atomically add gems and update the daily log
    await incrementUserField(userId, "gems", AD_GEMS);
    await updateUserDoc(userId, { adWatchDate: today, adWatchCount: String(logCount + 1) });

    return NextResponse.json({
      gemsAwarded: AD_GEMS,
      adsToday: logCount + 1,
      maxAds: MAX_ADS_PER_DAY,
    });
  } catch (error) {
    console.error("Ad reward error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
