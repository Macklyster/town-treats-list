import { useEffect, useState } from "react";
import { Zap } from "lucide-react";

const fmt = (ms: number) => {
  if (ms <= 0) return "Encerrada";
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`;
  if (m >= 10) return `${m}m`;
  return `${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`;
};

type Props = {
  endsAt: string | Date;
  className?: string;
  variant?: "card" | "detail";
  onExpire?: () => void;
};

export const CountdownBadge = ({ endsAt, className = "", variant = "card", onExpire }: Props) => {
  const target = typeof endsAt === "string" ? new Date(endsAt).getTime() : endsAt.getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (Number.isNaN(target)) return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= target) {
        clearInterval(id);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [target, onExpire]);

  if (Number.isNaN(target)) return null;
  const diff = target - now;
  const isUrgent = diff > 0 && diff < 10 * 60 * 1000;
  const ended = diff <= 0;

  const base =
    variant === "detail"
      ? "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold"
      : "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold shadow-soft";

  const tone = ended
    ? "bg-muted text-muted-foreground"
    : isUrgent
      ? "bg-destructive text-destructive-foreground animate-pulse"
      : "bg-discount text-discount-foreground";

  return (
    <span className={`${base} ${tone} ${className}`}>
      <Zap className={variant === "detail" ? "h-4 w-4" : "h-3 w-3"} fill="currentColor" />
      {ended ? "Encerrada" : `Acaba em ${fmt(diff)}`}
    </span>
  );
};
