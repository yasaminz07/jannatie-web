"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  color?: "blue" | "orange";
}

export default function ProgressBar({
  value,
  max = 100,
  className,
  showLabel = false,
  color = "blue",
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn("w-full", className)}>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full",
            color === "blue" ? "bg-primary-500" : "bg-accent"
          )}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-muted mt-1 text-right">{Math.round(pct)}%</p>
      )}
    </div>
  );
}
