import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "blue" | "orange" | "slate" | "red" | "green";
}

export default function Badge({ className, variant = "blue", children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full",
        {
          "bg-primary-50 text-primary-500 border border-primary-500/20": variant === "blue",
          "bg-accent-50 text-accent border border-accent/20": variant === "orange",
          "bg-gray-100 text-muted border border-border": variant === "slate",
          "bg-red-50 text-danger border border-danger/20": variant === "red",
          "bg-green-50 text-green-700 border border-green-200": variant === "green",
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
