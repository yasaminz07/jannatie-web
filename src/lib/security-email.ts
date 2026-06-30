export async function sendSecurityEmail(to: string, changeType: string, newValue: string, displayName?: string) {
  try {
    await fetch("/api/security-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, changeType, newValue, displayName }),
    });
  } catch { /* non-critical — don't block the save */ }
}
