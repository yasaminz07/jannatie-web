"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, Handshake, BarChart2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Dashboard", href: "/community-hub", icon: LayoutDashboard },
  { label: "Events", href: "/community-hub/events", icon: CalendarDays },
  { label: "Community", href: "/community-hub/community", icon: Users },
  { label: "Collabs", href: "/community-hub/collabs", icon: Handshake },
  { label: "Insights", href: "/community-hub/insights", icon: BarChart2 },
];

export default function CommunityBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30"
      style={{
        background: "rgba(255,255,255,0.88)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.90)",
        boxShadow: "0 -4px 24px rgba(15,23,42,0.06)",
      }}
    >
      <div className="flex items-center justify-around px-1 py-2">
        {tabs.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== "/community-hub" && pathname.startsWith(href + "/"));
          return (
            <Link key={href} href={href} className="flex flex-col items-center gap-1 px-3 py-1 min-w-0">
              <Icon size={22} className={cn("transition-colors", active ? "text-blue-600" : "text-slate-400")} />
              <span className={cn("text-[10px] font-medium transition-colors", active ? "text-blue-600" : "text-slate-400")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
