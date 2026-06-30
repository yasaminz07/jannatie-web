import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "react-hot-toast";
import AnalyticsTracker from "@/components/analytics/AnalyticsTracker";

export const metadata: Metadata = {
  title: {
    default: "Jannatie — Grow Your Deen Every Day",
    template: "%s | Jannatie",
  },
  description:
    "Jannatie (جنتي, My Paradise) is an AI-powered Islamic growth companion. Track your habits, learn Islam, chat with your AI Buddy, and grow every single day.",
  keywords: [
    "Islamic app",
    "Muslim habits",
    "Quran learning",
    "Islamic education",
    "Muslim prayer tracker",
    "deen",
    "jannatie",
  ],
  authors: [{ name: "Jannatie" }],
  creator: "Jannatie",
  publisher: "Jannatie",
  metadataBase: new URL("https://jannatie.com"),
  openGraph: {
    title: "Jannatie — Grow Your Deen Every Day",
    description:
      "AI-powered Islamic growth companion. Track habits, learn Islam, grow every day.",
    url: "https://jannatie.com",
    siteName: "Jannatie",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jannatie — Grow Your Deen Every Day",
    description: "AI-powered Islamic growth companion.",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#0066CC",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AnalyticsTracker />
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "rgba(255, 255, 255, 0.90)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(226, 232, 240, 0.80)",
                boxShadow: "0 8px 32px rgba(15, 23, 42, 0.10)",
                color: "#1e293b",
                borderRadius: "14px",
                fontSize: "13.5px",
                fontWeight: "500",
                padding: "12px 16px",
              },
              success: {
                iconTheme: { primary: "#2563eb", secondary: "#eff6ff" },
              },
              error: {
                iconTheme: { primary: "#dc2626", secondary: "#fef2f2" },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
