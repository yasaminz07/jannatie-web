import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Generate a unique nonce per request — Next.js reads x-nonce and adds it
  // to its own inline scripts, removing the need for unsafe-inline in script-src
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const csp = [
    "default-src 'self'",
    // nonce-{value} allows only scripts with this nonce attribute;
    // strict-dynamic propagates trust to scripts loaded by nonced scripts (chunks etc.)
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://apis.google.com https://accounts.google.com`,
    // Tailwind utility classes and Framer Motion animations use inline styles
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.googleusercontent.com https://firebasestorage.googleapis.com",
    // Firebase Auth/Firestore API calls and Resend
    "connect-src 'self' https://*.googleapis.com https://*.firebase.com https://*.firebaseio.com wss://*.firebaseio.com https://api.resend.com",
    "font-src 'self'",
    "frame-src 'self' https://accounts.google.com https://*.firebaseapp.com",
    "object-src 'none'",
    "base-uri 'self'",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  // Next.js 14 automatically reads x-nonce and adds it to its generated scripts
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);

  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
