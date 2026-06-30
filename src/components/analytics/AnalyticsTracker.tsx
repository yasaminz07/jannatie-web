"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackPageview, sendPresenceHeartbeat, recordScrollDepth } from "@/lib/analytics-tracker";

const HEARTBEAT_MS = 20000;

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const scrollMaxRef = useRef(0);
  const pathRef = useRef(pathname);

  useEffect(() => {
    function onScroll() {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.min(100, (window.scrollY / docHeight) * 100) : 100;
      if (pct > scrollMaxRef.current) scrollMaxRef.current = pct;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!pathname) return;
    pathRef.current = pathname;
    if (scrollMaxRef.current > 0) recordScrollDepth(scrollMaxRef.current);
    scrollMaxRef.current = 0;
    trackPageview(pathname);
    sendPresenceHeartbeat(pathname);
  }, [pathname]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (pathRef.current) sendPresenceHeartbeat(pathRef.current);
    }, HEARTBEAT_MS);
    return () => clearInterval(interval);
  }, []);

  return null;
}
