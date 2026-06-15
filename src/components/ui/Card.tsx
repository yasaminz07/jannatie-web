import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export default function Card({ className, hover = false, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl shadow-card",
        hover && "hover:shadow-card-hover hover:border-primary-500/30 transition-all duration-200",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
