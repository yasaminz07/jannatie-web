"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import CommunitySidebar from "@/components/layout/CommunitySidebar";
import CommunityBottomNav from "@/components/layout/CommunityBottomNav";
import SkeletonCard from "@/components/ui/SkeletonCard";
import { Clock, XCircle } from "lucide-react";

export default function CommunityHubLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, logOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }
    if (!loading && user && profile && profile.accountType !== "community") {
      router.push("/dashboard");
    }
  }, [user, profile, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-4">
          <SkeletonCard />
          <SkeletonCard lines={2} />
          <SkeletonCard lines={4} />
        </div>
      </div>
    );
  }

  if (!user || !profile || profile.accountType !== "community") return null;

  if (profile.applicationStatus === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <Clock size={24} className="text-amber-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Application under review</h1>
          <p className="text-sm text-slate-500 mb-6">
            Thanks for applying! Our team is reviewing your community account. We&apos;ll let you know as soon as
            it&apos;s approved, usually within a couple of days.
          </p>
          <button onClick={logOut} className="text-sm text-blue-600 font-semibold hover:underline">
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (profile.applicationStatus === "rejected") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <XCircle size={24} className="text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Application not approved</h1>
          <p className="text-sm text-slate-500 mb-6">
            We weren&apos;t able to verify this account. If you think this is a mistake, contact us and we&apos;ll
            take another look.
          </p>
          <button onClick={logOut} className="text-sm text-blue-600 font-semibold hover:underline">
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <CommunitySidebar />

      {/* Mobile-only top header */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 h-12"
        style={{
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.90)",
          boxShadow: "0 2px 12px rgba(15,23,42,0.06)",
        }}
      >
        <Link href="/" className="flex items-center gap-2">
          <Image src="/images/logo-white.PNG" alt="Jannatie" width={16} height={16}
            className="object-contain" style={{ filter: "brightness(0)" }} />
          <span className="text-sm font-bold text-slate-900 tracking-tight">Jannatie</span>
        </Link>
        <span />
      </header>

      <div className="md:ml-60 pt-12 md:pt-0 pb-20 md:pb-0">
        {children}
      </div>
      <CommunityBottomNav />
    </div>
  );
}
