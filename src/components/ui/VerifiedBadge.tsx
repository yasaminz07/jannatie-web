import { BadgeCheck } from "lucide-react";

export default function VerifiedBadge({ size = 16 }: { size?: number }) {
  return (
    <BadgeCheck
      size={size}
      className="text-blue-500 flex-shrink-0"
      fill="currentColor"
      stroke="white"
      strokeWidth={2}
      aria-label="Verified community account"
    />
  );
}
