"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { isAdminEmail } from "@/lib/admin";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminBottomNav from "@/components/layout/AdminBottomNav";
import SkeletonCard from "@/components/ui/SkeletonCard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const isAdmin = isAdminEmail(user?.email);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/admin-login");
      return;
    }
    if (!loading && user && !isAdmin) {
      router.push("/dashboard");
    }
  }, [user, loading, isAdmin, router]);

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

  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar />
      <div className="md:ml-60 pb-20 md:pb-0">{children}</div>
      <AdminBottomNav />
    </div>
  );
}
