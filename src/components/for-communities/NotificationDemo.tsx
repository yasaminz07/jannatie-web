"use client";

import { motion } from "framer-motion";
import { Bell, MousePointer2, CakeSlice, Calendar } from "lucide-react";

const cycle = {
  duration: 4.5,
  repeat: Infinity,
  repeatDelay: 1.2,
  ease: "easeInOut" as const,
};

export default function NotificationDemo() {
  return (
    <div className="relative bg-white rounded-2xl border border-border shadow-sm shadow-slate-900/[0.03] p-6">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-1.5 font-bold text-foreground text-sm">
          <span className="w-2 h-2 rounded-full bg-primary-500" />
          Jannatie
        </div>

        <div className="relative">
          <motion.div
            className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center relative"
            animate={{ scale: [1, 1, 0.88, 1.05, 1, 1] }}
            transition={{ ...cycle, times: [0, 0.42, 0.46, 0.5, 0.55, 1] }}
          >
            <Bell size={16} className="text-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
          </motion.div>

          {/* click ripple */}
          <motion.span
            className="absolute inset-0 rounded-full bg-primary-400 pointer-events-none"
            animate={{ opacity: [0, 0, 0.35, 0, 0], scale: [1, 1, 1.6, 1.8, 1.8] }}
            transition={{ ...cycle, times: [0, 0.42, 0.46, 0.56, 1] }}
          />

          {/* notifications dropdown */}
          <motion.div
            className="absolute right-0 top-12 w-64 bg-white rounded-xl shadow-xl border border-border p-2 origin-top-right z-10"
            animate={{
              opacity: [0, 0, 1, 1, 0],
              scale: [0.92, 0.92, 1, 1, 0.92],
              y: [-6, -6, 0, 0, -6],
            }}
            transition={{ ...cycle, times: [0, 0.46, 0.54, 0.92, 1] }}
          >
            <p className="text-xs font-semibold text-muted px-2 py-1.5">Notifications</p>
            <div className="flex items-start gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-50">
              <span className="w-7 h-7 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                <CakeSlice size={13} className="text-primary-500" />
              </span>
              <p className="text-xs text-foreground leading-snug">
                <span className="font-semibold">Central Mosque Youth</span> posted a new event: Charity Bake Sale
              </p>
            </div>
            <div className="flex items-start gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-50">
              <span className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Calendar size={13} className="text-blue-500" />
              </span>
              <p className="text-xs text-foreground leading-snug">
                <span className="font-semibold">East London Mosque</span> posted: Friday Halaqah, 7PM
              </p>
            </div>
          </motion.div>

          {/* animated cursor */}
          <motion.div
            className="absolute -right-1 -bottom-1 z-20 pointer-events-none"
            animate={{
              x: [36, 36, 0, 0, 36],
              y: [36, 36, 0, 0, 36],
              opacity: [0, 1, 1, 1, 0],
            }}
            transition={{ ...cycle, times: [0, 0.18, 0.42, 0.92, 1] }}
          >
            <MousePointer2 size={20} className="text-slate-900 fill-slate-900 drop-shadow-md" />
          </motion.div>
        </div>
      </div>

      <p className="text-xs text-muted text-center mt-12">
        Follow a community, get notified the moment they post.
      </p>
    </div>
  );
}
