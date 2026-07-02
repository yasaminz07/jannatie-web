export const ADMIN_EMAILS = ["jannatieteam+admin@gmail.com"];

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}

// Admin login uses a username instead of an email; this maps it to the
// real Firebase Auth email behind the scenes.
const ADMIN_USERNAME_TO_EMAIL: Record<string, string> = {
  jannatie_yzaid: "jannatieteam+admin@gmail.com",
};

export function resolveAdminEmail(username: string): string | null {
  return ADMIN_USERNAME_TO_EMAIL[username.trim().toLowerCase()] || null;
}
