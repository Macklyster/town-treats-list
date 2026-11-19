import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Ticket, Wallet, Crown } from "lucide-react";
import {
  REWARD_KIND_LABELS,
  formatCents,
  type LoyaltyReward,
} from "@/lib/loyalty-api";

const ICONS = {
  coupon: Ticket,
  credit: Wallet,
  gift: Gift,
  tier_benefit: Crown,
} as const;

interface Props {
  reward: LoyaltyReward;
  balance: number;
  isMember: boolean;
  onRedeem: (reward: LoyaltyReward) => void;
  busy?: boolean;
}

export function RewardCard({ reward, balance, isMember, onRedeem, busy }: Props) {
  const Icon = ICONS[reward.kind] ?? Gift;
  const missing = Math.max(0, reward.points_cost - balance);
  const soldOut = reward.stock !== null && reward.stock <= 0;

  return (
    <Card className="overflow-hidden">
      {reward.image_url && (
        <img
          src={reward.image_url}
          alt={reward.title}
          loading="lazy"
          className="h-32 w-full object-cover"
        />
      )}
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <h3 className="font-semibold leading-tight">{reward.title}</h3>
            <Badge variant="outline" className="gap-1 text-xs">
              <Icon className="h-3 w-3" /> {REWARD_KIND_LABELS[reward.kind]}
            </Badge>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-highlight">{reward.points_cost}</div>
            <div className="text-xs text-muted-foreground">pontos</div>
          </div>
        </div>
        {reward.description && (
          <p className="text-sm text-muted-foreground">{reward.description}</p>
        )}
        {reward.kind === "credit" && reward.credit_cents > 0 && (
          <p className="text-sm font-medium">Vale {formatCents(reward.credit_cents)} em compras</p>
        )}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {reward.stock !== null && <span>Restam {Math.max(0, reward.stock)}</span>}
          {reward.valid_until && (
            <span>Até {new Date(reward.valid_until).toLocaleDateString("pt-BR")}</span>
          )}
        </div>
        <Button
          className="w-full"
          variant={missing > 0 || soldOut ? "outline" : "accent"}
          disabled={!isMember || missing > 0 || soldOut || busy}
          onClick={() => onRedeem(reward)}
        >
          {soldOut
            ? "Esgotado"
            : !isMember
              ? "Participe para resgatar"
              : missing > 0
                ? `Faltam ${missing} pontos`
                : busy
                  ? "Resgatando…"
                  : "Resgatar"}
        </Button>
      </CardContent>
    </Card>
  );
}
