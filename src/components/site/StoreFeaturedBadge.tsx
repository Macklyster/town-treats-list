import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md";
};

export const StoreFeaturedBadge = ({ className, showLabel = true, size = "sm" }: Props) => {
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <span
      title="Loja Destaque"
      aria-label="Loja Destaque"
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent-strong",
        className,
      )}
    >
      <BadgeCheck className={iconSize} />
      {showLabel && <span>Loja Destaque</span>}
    </span>
  );
};
