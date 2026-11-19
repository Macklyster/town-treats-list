import { useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";
import { Award, RefreshCw, Star, Zap, BadgeCheck, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchFlyScore, recomputeFlyScore, type FlyScorePilares } from "@/lib/home-api";
import { toast } from "sonner";

type Props = {
  storeId: string;
};

const PILAR_META = [
  {
    key: "avaliacoes" as const,
    label: "Avaliações",
    icon: Star,
    tip: (p: FlyScorePilares) =>
      p.review_count && p.review_count > 0
        ? `${p.avg_rating?.toFixed(1)}★ com ${p.review_count} avaliação${p.review_count === 1 ? "" : "es"} aprovada${p.review_count === 1 ? "" : "s"}. Peça a mais clientes para atingir 20+ e maximizar.`
        : "Nenhuma avaliação aprovada ainda. Compartilhe seu QR Code para incentivar avaliações.",
  },
  {
    key: "informacoes" as const,
    label: "Informações",
    icon: BadgeCheck,
    tip: (p: FlyScorePilares) =>
      p.informacoes >= 100
        ? "Cadastro completo — perfeito!"
        : "Complete todos os dados da loja (foto de capa, descrição, WhatsApp, Instagram, telefone, localização) para chegar a 100%.",
    action: { to: "/painel-lojista/loja", label: "Editar dados" },
  },
  {
    key: "atualizacao" as const,
    label: "Atualização",
    icon: Zap,
    tip: (p: FlyScorePilares) =>
      p.atualizacao >= 100
        ? "Suas ofertas estão atualizadas nos últimos 30 dias."
        : "Publique ou edite ofertas com frequência. O pilar decai após 30 dias sem novidades.",
  },
];

export function FlyScoreCard({ storeId }: Props) {
  const [data, setData] = useState<FlyScorePilares | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setLoading(true);
    const r = await fetchFlyScore(storeId);
    setData(r);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [storeId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await recomputeFlyScore(storeId);
      await load();
      toast.success("FlyScore atualizado");
    } catch (e: any) {
      toast.error(e.message ?? "Falha ao atualizar");
    } finally {
      setRefreshing(false);
    }
  };

  const overall = data?.overall ?? 0;
  const dash = Math.max(0, Math.min(276, (overall / 100) * 276));
  const color =
    overall >= 80 ? "hsl(var(--primary))" : overall >= 50 ? "hsl(var(--warning-foreground))" : "hsl(var(--destructive))";

  return (
    <Card className="md:col-span-3">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-highlight" /> Meu FlyScore
        </CardTitle>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing || loading}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Calculando…</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[auto_1fr] items-start">
            <div className="relative h-36 w-36 grid place-items-center mx-auto lg:mx-0">
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90">
                <circle cx="50" cy="50" r="44" stroke="hsl(var(--muted))" strokeWidth="8" fill="none" />
                <circle
                  cx="50" cy="50" r="44" fill="none" strokeWidth="8"
                  stroke={color} strokeLinecap="round"
                  strokeDasharray={`${dash} 276`}
                />
              </svg>
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground leading-none">
                  {overall}
                  <span className="text-base text-muted-foreground font-medium">/100</span>
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                  FlyScore
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {PILAR_META.map((meta) => {
                const value = data ? (data as any)[meta.key] as number : 0;
                const Icon = meta.icon;
                return (
                  <div key={meta.key} className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      <Icon className="h-4 w-4 text-highlight" />
                      <span className="font-medium text-foreground flex-1">{meta.label}</span>
                      <span className="font-bold text-foreground">{value}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${value}%` }}
                      />
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs text-muted-foreground flex-1">{data && meta.tip(data)}</p>
                      {meta.action && value < 100 && (
                        <Button asChild variant="ghost" size="sm" className="h-auto shrink-0 px-2 py-1 text-xs">
                          <Link to={meta.action.to}>
                            {meta.action.label}
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
              <p className="pt-2 text-[11px] text-muted-foreground italic">
                Os pilares <strong>Resposta</strong>, <strong>Engajamento</strong> e <strong>Presença Digital</strong> serão liberados em breve.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
