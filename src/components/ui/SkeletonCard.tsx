import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  className?: string;
  lines?: number;
}

export default function SkeletonCard({ className, lines = 3 }: SkeletonCardProps) {
  return (
    <div className={cn("bg-card border border-border rounded-xl p-5 animate-pulse", className)}>
      <div className="h-4 bg-gray-200 rounded skeleton w-3/4 mb-3" />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 bg-gray-200 rounded skeleton mb-2"
          style={{ width: `${80 - i * 15}%` }}
        />
      ))}
    </div>
  );
}
