export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { sendMail } from "@/lib/mailer";
import { parentalResetEmailHtml } from "@/lib/email-templates";

// Max 3 reset requests per IP per 15 minutes
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 3;
const CODE_TTL_MS = 10 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  if (entry.count >= MAX_REQUESTS) return true;
  entry.count++;
  return false;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests. Please wait 15 minutes." }, { status: 429 });
  }

  const { parentEmail, childName } = await request.json() as {
    parentEmail?: string;
    childName?: string;
  };

  if (!parentEmail?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail)) {
    return NextResponse.json({ error: "No parent email on this account." }, { status: 400 });
  }

  // Generate 6-digit code
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = createHash("sha256").update(code).digest("hex");
  const expiry = Date.now() + CODE_TTL_MS;

  try {
    await sendMail({
      to: parentEmail.trim().toLowerCase(),
      subject: "Reset your Jannatie parental password",
      html: parentalResetEmailHtml({
        greeting: "Assalamu Alaykum,",
        code,
        childName: childName?.trim() || "your child",
      }),
      from: "Jannatie",
    });

    return NextResponse.json({ codeHash, expiry });
  } catch (err) {
    console.error("[parental-reset]", err);
    return NextResponse.json({ error: "Failed to send reset email." }, { status: 500 });
  }
}
