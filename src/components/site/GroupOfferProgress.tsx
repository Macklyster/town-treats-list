import { useEffect, useState } from "react";
import { Users, Clock } from "lucide-react";
import type { Tier } from "@/lib/group-offers-api";
import { formatBRL } from "@/lib/group-offers-api";

type Props = {
  participantsCount: number;
  currentTier: Tier;
  nextTier: Tier | null;
  endsAt: string | null;
  originalPrice?: number;
};

const formatRemaining = (sec: number) => {
  if (sec <= 0) return "Encerrada";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
};

export const GroupOfferProgress = ({
  participantsCount,
  currentTier,
  nextTier,
  endsAt,
  originalPrice,
}: Props) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const secondsRemaining = endsAt ? Math.max(0, Math.floor((new Date(endsAt).getTime() - now) / 1000)) : 0;
  const ended = secondsRemaining <= 0;

  const missing = nextTier ? Math.max(0, nextTier.min_people - participantsCount) : 0;
  const progress = nextTier
    ? Math.min(100, (participantsCount / nextTier.min_people) * 100)
    : 100;

  return (
    <div className="space-y-4 rounded-2xl border bg-card p-6 shadow-card">
      <div className="text-center">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Preço atual</div>
        <div className="mt-1 flex items-baseline justify-center gap-2">
          {originalPrice && originalPrice > currentTier.price && (
            <span className="text-sm text-muted-foreground line-through">{formatBRL(originalPrice)}</span>
          )}
          <span className="text-4xl font-bold text-accent-strong">{formatBRL(currentTier.price)}</span>
          <span className="text-sm text-muted-foreground">cada</span>
        </div>
      </div>

      {nextTier && !ended && (
        <div>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Mais {missing} {missing === 1 ? "pessoa" : "pessoas"} e cai pra{" "}
              <strong className="text-foreground">{formatBRL(nextTier.price)}</strong>
            </span>
            <span className="font-medium">{participantsCount}/{nextTier.min_people}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-sm">
        <div className="inline-flex items-center gap-1.5">
          <Users className="h-4 w-4 text-primary" />
          <span>
            🔥 <strong>{participantsCount}</strong>{" "}
            {participantsCount === 1 ? "pessoa entrou" : "pessoas já entraram"}
          </span>
        </div>
        <div className={`inline-flex items-center gap-1.5 ${ended ? "text-muted-foreground" : "text-destructive"}`}>
          <Clock className="h-4 w-4" />
          <span className="font-mono font-semibold">{formatRemaining(secondsRemaining)}</span>
        </div>
      </div>
    </div>
  );
};
