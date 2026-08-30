import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  Crown,
  QrCode,
  Sparkles,
  Trophy,
  Wallet,
  Clock,
} from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { PageHero } from "@/components/site/PageHero";
import { SEO } from "@/components/seo/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { StoreAvatar } from "@/components/site/StoreAvatar";
import { TierProgress } from "@/components/loyalty/TierProgress";
import { LoyaltyQrDialog } from "@/components/loyalty/LoyaltyQrDialog";
import { useLoyaltyWallet } from "@/hooks/useLoyalty";
import { useAuth } from "@/hooks/useAuth";
import { useCity } from "@/hooks/useCity";
import { fetchCityRanking, formatCents } from "@/lib/loyalty-api";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type RankRow = { name: string; avatar_url: string | null; points: number; badges: number };

export default function Fidelidade() {
  const { user } = useAuth();
  const { city } = useCity();
  const { wallet, loading } = useLoyaltyWallet();
  const [qrOpen, setQrOpen] = useState(false);
  const [ranking, setRanking] = useState<RankRow[]>([]);
  const [optIn, setOptIn] = useState(false);

  useEffect(() => {
    fetchCityRanking(city?.city ?? null, 10)
      .then((r) => setRanking(r ?? []))
      .catch(() => setRanking([]));
  }, [city?.city]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("loyalty_ranking_opt_in")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setOptIn(!!(data as any)?.loyalty_ranking_opt_in));
  }, [user?.id]);

  const toggleOptIn = async (v: boolean) => {
    if (!user) return;
    setOptIn(v);
    const { error } = await supabase
      .from("profiles")
      .update({ loyalty_ranking_opt_in: v } as any)
      .eq("id", user.id);
    if (error) {
      setOptIn(!v);
      toast.error(error.message);
    } else {
      toast.success(v ? "Você entrou no ranking da sua cidade" : "Você saiu do ranking");
      fetchCityRanking(city?.city ?? null, 10).then((r) => setRanking(r ?? []));
    }
  };

  const cards = wallet?.cards ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO
        title="FlyPontos — programa de fidelidade das lojas parceiras"
        description="Acumule pontos nas lojas parceiras da OfertasFly, evolua de nível, cumpra missões e troque por cupons, brindes e cashback."
        path="/fidelidade"
      />
      <Header />
      <main className="container flex-1 space-y-8 py-8 md:py-10">
        <PageHero
          eyebrow="Programa de fidelidade"
          title="FlyPontos"
          subtitle="Cada loja parceira tem sua carteira de pontos. Compre, avalie, participe e troque por recompensas."
          crumbs={[{ label: "Início", to: "/" }, { label: "Fidelidade" }]}
          actions={
            <div className="flex flex-wrap gap-2">
              {user ? (
                <Button variant="accent" onClick={() => setQrOpen(true)}>
                  <QrCode className="h-4 w-4" /> Meu QR
                </Button>
              ) : (
                <Button asChild variant="accent">
                  <Link to="/auth">Entrar</Link>
                </Button>
              )}
              <Button asChild variant="outline">
                <Link to="/fidelidade/como-funciona">Como funciona</Link>
              </Button>
            </div>
          }
        />

        {!user ? (
          <Card>
            <CardContent className="space-y-3 py-10 text-center">
              <Sparkles className="mx-auto h-10 w-10 text-primary" />
              <p className="text-muted-foreground">
                Entre na sua conta para começar a acumular pontos nas lojas parceiras.
              </p>
              <Button asChild variant="accent">
                <Link to="/auth">Criar conta grátis</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardContent className="flex items-center gap-3 p-5">
                  <Sparkles className="h-8 w-8 text-primary" />
                  <div>
                    <div className="text-2xl font-bold">{wallet?.total_points ?? 0}</div>
                    <div className="text-xs text-muted-foreground">pontos acumulados</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-5">
                  <Wallet className="h-8 w-8 text-primary" />
                  <div>
                    <div className="text-2xl font-bold">
                      {formatCents(wallet?.total_credit_cents ?? 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">em crédito nas lojas</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-5">
                  <Clock className="h-8 w-8 text-primary" />
                  <div>
                    <div className="text-2xl font-bold">{wallet?.expiring_points ?? 0}</div>
                    <div className="text-xs text-muted-foreground">expiram em 30 dias</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Minhas lojas</h2>
              {loading ? (
                <p className="text-muted-foreground">Carregando…</p>
              ) : cards.length === 0 ? (
                <Card>
                  <CardContent className="space-y-3 py-10 text-center">
                    <p className="text-muted-foreground">
                      Você ainda não participa do programa de nenhuma loja. Encontre uma loja
                      parceira e clique em "Participar grátis".
                    </p>
                    <Button asChild variant="outline">
                      <Link to="/#empresas">Ver lojas parceiras</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {cards.map((c) => (
                    <Card key={c.store_id}>
                      <CardContent className="space-y-4 p-5">
                        <div className="flex items-center gap-3">
                          <StoreAvatar name={c.store_name} logoUrl={c.logo_url} size={48} />
                          <div className="min-w-0 flex-1">
                            <Link
                              to={`/fidelidade/${c.store_slug}`}
                              className="block truncate font-semibold hover:underline"
                            >
                              {c.store_name}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {c.city} · {c.state}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-primary">
                              {c.points_balance}
                            </div>
                            <div className="text-xs text-muted-foreground">pontos</div>
                          </div>
                        </div>
                        <TierProgress
                          points={c.points_balance}
                          tierName={c.tier_name}
                          tierMinPoints={c.tier_min_points}
                          nextTierName={c.next_tier_name}
                          nextTierPoints={c.next_tier_points}
                          multiplier={c.multiplier}
                        />
                        <div className="flex flex-wrap gap-2 text-xs">
                          {c.credit_cents > 0 && (
                            <Badge variant="outline">
                              Crédito {formatCents(c.credit_cents)}
                            </Badge>
                          )}
                          {c.cheapest_reward !== null && (
                            <Badge variant="outline">
                              Recompensa a partir de {c.cheapest_reward} pts
                            </Badge>
                          )}
                          {c.open_missions > 0 && (
                            <Badge variant="outline">{c.open_missions} missões ativas</Badge>
                          )}
                        </div>
                        <Button asChild variant="outline" className="w-full">
                          <Link to={`/fidelidade/${c.store_slug}`}>
                            Ver recompensas e extrato
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {!!wallet?.badges?.length && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" /> Meus selos
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {wallet.badges.map((b) => (
                    <Badge key={b.slug} variant="secondary" className="gap-1 py-1.5">
                      <Sparkles className="h-3.5 w-3.5" /> {b.name}
                    </Badge>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" /> Ranking do mês
                {city?.city ? ` — ${city.city}` : ""}
              </span>
              {user && (
                <span className="flex items-center gap-2 text-sm font-normal">
                  Participar do ranking
                  <Switch checked={optIn} onCheckedChange={toggleOptIn} />
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ranking.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ninguém no ranking deste mês ainda. Ative sua participação e comece a pontuar.
              </p>
            ) : (
              <ol className="space-y-2">
                {ranking.map((r, i) => (
                  <li
                    key={`${r.name}-${i}`}
                    className="flex items-center gap-3 rounded-md border p-2 text-sm"
                  >
                    <span className="w-6 text-center font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                    <StoreAvatar name={r.name} logoUrl={r.avatar_url} size={32} />
                    <span className="flex-1 truncate font-medium">{r.name}</span>
                    {r.badges > 0 && (
                      <Badge variant="outline" className="gap-1">
                        <Crown className="h-3 w-3" /> {r.badges}
                      </Badge>
                    )}
                    <span className="font-semibold text-primary">{r.points} pts</span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
      <LoyaltyQrDialog open={qrOpen} onOpenChange={setQrOpen} />
    </div>
  );
}
