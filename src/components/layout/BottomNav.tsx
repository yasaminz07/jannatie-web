"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  BookOpen,
  MessageCircle,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Habits", href: "/habits", icon: CheckSquare },
  { label: "Learn", href: "/learn", icon: BookOpen },
  { label: "AI", href: "/ai", icon: MessageCircle },
  { label: "Progress", href: "/progress", icon: TrendingUp },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-sidebar border-t border-white/10 safe-area-inset-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {items.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 px-3 py-1"
            >
              <Icon
                size={22}
                className={cn(
                  "transition-colors",
                  active ? "text-primary-500" : "text-gray-500"
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  active ? "text-primary-500" : "text-gray-500"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
