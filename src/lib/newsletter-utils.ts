import { createHmac } from "crypto";

export function makeUnsubscribeToken(email: string): string {
  const secret = process.env.OTP_SECRET ?? "jannatie-otp-secret-change-me";
  return createHmac("sha256", secret).update(email).digest("hex").slice(0, 32);
}

export function buildUnsubscribeUrl(email: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://jannatie.com";
  const token = makeUnsubscribeToken(email);
  return `${base}/unsubscribe?e=${encodeURIComponent(email)}&t=${token}`;
}
