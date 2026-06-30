"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import SkeletonCard from "@/components/ui/SkeletonCard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }
    if (!loading && profile?.accountType === "community") {
      router.push("/community-hub");
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

  if (!user || profile?.accountType === "community") return null;

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="md:ml-60 pb-20 md:pb-0">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
