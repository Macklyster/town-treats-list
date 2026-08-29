import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";

interface Props {
  points: number;
  tierName?: string | null;
  tierMinPoints?: number | null;
  nextTierName?: string | null;
  nextTierPoints?: number | null;
  multiplier?: number | null;
}

/** Barra de evolução de nível dentro do programa da loja. */
export function TierProgress({
  points,
  tierName,
  tierMinPoints,
  nextTierName,
  nextTierPoints,
  multiplier,
}: Props) {
  const base = tierMinPoints ?? 0;
  const target = nextTierPoints ?? null;
  const pct =
    target && target > base
      ? Math.min(100, Math.round(((points - base) / (target - base)) * 100))
      : 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Badge variant="secondary" className="gap-1">
          <Crown className="h-3.5 w-3.5" /> {tierName ?? "Bronze"}
          {multiplier && Number(multiplier) > 1 ? ` · ${Number(multiplier)}x pontos` : ""}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {target
            ? `Faltam ${Math.max(0, target - points)} pts para ${nextTierName}`
            : "Nível máximo alcançado"}
        </span>
      </div>
      <Progress value={pct} className="h-2" />
    </div>
  );
}
