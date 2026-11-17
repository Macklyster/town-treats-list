import { useState } from "react";
import { Link } from "@/lib/router-compat";
import { Sparkles, Crown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useLoyaltyState } from "@/hooks/useLoyalty";
import { joinLoyalty } from "@/lib/loyalty-api";
import { toast } from "sonner";

interface Props {
  storeId: string | null | undefined;
  storeSlug: string;
}

/** Bloco "Ganhe pontos aqui" exibido na página da loja e no detalhe da oferta. */
export function StoreLoyaltyTeaser({ storeId, storeSlug }: Props) {
  const { user } = useAuth();
  const { state, refresh } = useLoyaltyState(storeId);
  const [joining, setJoining] = useState(false);

  if (!state?.active) return null;

  const membership = state.membership;
  const rules = state.program?.rules;

  const handleJoin = async () => {
    if (!user) return;
    setJoining(true);
    try {
      const res = await joinLoyalty(storeId!);
      if (!res.ok) throw new Error("Não foi possível participar agora");
      toast.success("Você entrou no programa de fidelidade desta loja!");
      refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setJoining(false);
    }
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Ganhe pontos aqui — FlyPontos</h3>
          </div>
          {membership ? (
            <p className="text-sm text-muted-foreground">
              Você tem <strong className="text-foreground">{membership.points_balance} pontos</strong> nesta loja
              {membership.tier?.name && (
                <>
                  {" "}
                  <Badge variant="secondary" className="ml-1 gap-1">
                    <Crown className="h-3 w-3" /> {membership.tier.name}
                  </Badge>
                </>
              )}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Acumule pontos ao seguir, avaliar e comprar
              {rules?.purchase_per_real ? ` (${rules.purchase_per_real} ponto por real)` : ""} e troque
              por recompensas exclusivas.
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          {!user ? (
            <Button asChild variant="accent">
              <Link to="/auth">Entrar e participar</Link>
            </Button>
          ) : membership ? (
            <Button asChild variant="accent">
              <Link to={`/fidelidade/${storeSlug}`}>Ver meus pontos</Link>
            </Button>
          ) : (
            <Button variant="accent" onClick={handleJoin} disabled={joining}>
              {joining ? "Entrando…" : "Participar grátis"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
