import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "@/lib/router-compat";
import {
  Clock,
  Gift,
  MapPin,
  QrCode,
  Sparkles,
  Target,
  Wallet,
} from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { PageHero } from "@/components/site/PageHero";
import { SEO } from "@/components/seo/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { StoreAvatar } from "@/components/site/StoreAvatar";
import { TierProgress } from "@/components/loyalty/TierProgress";
import { RewardCard } from "@/components/loyalty/RewardCard";
import { MissionList } from "@/components/loyalty/MissionList";
import { LoyaltyQrDialog } from "@/components/loyalty/LoyaltyQrDialog";
import { useAuth } from "@/hooks/useAuth";
import { useLoyaltyState } from "@/hooks/useLoyalty";
import {
  REASON_LABELS,
  formatCents,
  joinLoyalty,
  loyaltyCheckin,
  redeemLoyaltyReward,
  type LoyaltyReward,
} from "@/lib/loyalty-api";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CHECKIN_ERRORS: Record<string, string> = {
  too_far: "Você precisa estar na loja para fazer check-in.",
  already_today: "Você já fez check-in nesta loja hoje.",
  not_member: "Participe do programa para fazer check-in.",
  no_location: "Esta loja ainda não cadastrou a localização.",
  auth_required: "Entre na sua conta para fazer check-in.",
};

export default function FidelidadeLoja() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const { state, loading, refresh } = useLoyaltyState(storeId);
  const [qrOpen, setQrOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("stores")
      .select("id")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.id) setStoreId(data.id);
        else setNotFound(true);
      });
  }, [slug]);

  const membership = state?.membership ?? null;
  const balance = membership?.points_balance ?? 0;
  const rules = state?.program?.rules;

  const earnList = useMemo(() => {
    if (!rules) return [];
    return [
      { label: "Seguir a loja", pts: rules.follow },
      { label: "Favoritar uma oferta", pts: rules.favorite },
      { label: "Avaliar uma compra", pts: rules.review },
      { label: "Avaliação com foto", pts: rules.review_photo },
      { label: "Compartilhar uma oferta", pts: rules.share },
      { label: "Check-in na loja", pts: rules.checkin },
      { label: "Resgatar um cupom", pts: rules.coupon },
      { label: "Indicar um amigo", pts: rules.referral },
      { label: "Cada R$ 1 em compras", pts: rules.purchase_per_real },
    ].filter((r) => r.pts > 0);
  }, [rules]);

  const handleJoin = async () => {
    if (!storeId) return;
    setJoining(true);
    try {
      const res = await joinLoyalty(storeId);
      if (!res.ok) throw new Error("Não foi possível participar agora");
      toast.success("Bem-vindo ao programa desta loja!");
      refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setJoining(false);
    }
  };

  const handleCheckin = () => {
    if (!storeId) return;
    if (!navigator.geolocation) return toast.error("Seu dispositivo não suporta localização.");
    setChecking(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await loyaltyCheckin(
            storeId,
            pos.coords.latitude,
            pos.coords.longitude,
          );
          if (!res.ok) {
            toast.error(CHECKIN_ERRORS[res.error ?? ""] ?? "Check-in não permitido agora");
            return;
          }
          toast.success(`Check-in confirmado! +${res.points} pontos`);
          refresh();
        } catch (e: any) {
          toast.error(e.message);
        } finally {
          setChecking(false);
        }
      },
      () => {
        setChecking(false);
        toast.error("Precisamos da sua localização para o check-in.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
    return undefined;
  };

  const handleRedeem = async (reward: LoyaltyReward) => {
    setBusyId(reward.id);
    try {
      const res = await redeemLoyaltyReward(reward.id);
      if (!res.ok) {
        toast.error(
          res.error === "insufficient_points"
            ? "Você ainda não tem pontos suficientes."
            : res.error === "out_of_stock"
              ? "Esta recompensa esgotou."
              : res.error === "tier_locked"
                ? "Esta recompensa é exclusiva de um nível superior."
                : "Não foi possível resgatar agora.",
        );
        return;
      }
      toast.success(`Resgatado! Apresente o código ${res.code} na loja.`);
      refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  };

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="container flex-1 py-16 text-center">
          <p className="text-muted-foreground">Loja não encontrada.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/fidelidade">Voltar para minha carteira</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const store = state?.store;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO
        title={`FlyPontos ${store?.name ?? ""} — fidelidade e recompensas`.trim()}
        description={`Acumule pontos em ${store?.name ?? "lojas parceiras"} e troque por cupons, brindes e cashback no programa FlyPontos da OfertasFly.`}
        path={`/fidelidade/${slug ?? ""}`}
      />
      <Header />
      <main className="container flex-1 space-y-8 py-8 md:py-10">
        <PageHero
          eyebrow="FlyPontos"
          title={store?.name ? `Fidelidade — ${store.name}` : "Fidelidade"}
          subtitle={
            store ? `${store.city} · ${store.state}` : "Programa de pontos desta loja parceira"
          }
          crumbs={[
            { label: "Início", to: "/" },
            { label: "Fidelidade", to: "/fidelidade" },
            { label: store?.name ?? "Loja" },
          ]}
          actions={
            store ? (
              <Button asChild variant="outline">
                <Link to={`/loja/${store.slug}`}>Ver loja</Link>
              </Button>
            ) : undefined
          }
        />

        {loading || !state ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : !state.active ? (
          <Card>
            <CardContent className="space-y-3 py-12 text-center">
              <Sparkles className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">
                Esta loja ainda não ativou o programa FlyPontos.
              </p>
              <Button asChild variant="outline">
                <Link to="/fidelidade">Ver outras lojas</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="flex flex-col gap-5 p-5 md:flex-row md:items-center">
                <div className="flex flex-1 items-center gap-3">
                  <StoreAvatar name={store?.name ?? "Loja"} logoUrl={store?.logo_url} size={56} />
                  <div className="min-w-0">
                    <p className="font-semibold">{store?.name}</p>
                    {membership ? (
                      <p className="text-sm text-muted-foreground">
                        {membership.visits_count} visitas · desde{" "}
                        {new Date(membership.joined_at).toLocaleDateString("pt-BR")}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Participe grátis e comece a pontuar agora.
                      </p>
                    )}
                  </div>
                </div>

                {membership ? (
                  <div className="flex flex-1 flex-col gap-3">
                    <div className="flex items-center gap-6">
                      <div>
                        <div className="text-2xl font-bold text-highlight">{balance}</div>
                        <div className="text-xs text-muted-foreground">pontos</div>
                      </div>
                      {membership.credit_cents > 0 && (
                        <div>
                          <div className="text-2xl font-bold">
                            {formatCents(membership.credit_cents)}
                          </div>
                          <div className="text-xs text-muted-foreground">crédito</div>
                        </div>
                      )}
                    </div>
                    <TierProgress
                      points={balance}
                      tierName={membership.tier?.name}
                      tierMinPoints={membership.tier?.min_points}
                      nextTierName={
                        (state.tiers ?? []).find(
                          (t) => t.min_points > (membership.tier?.min_points ?? -1),
                        )?.name
                      }
                      nextTierPoints={
                        (state.tiers ?? []).find(
                          (t) => t.min_points > (membership.tier?.min_points ?? -1),
                        )?.min_points
                      }
                      multiplier={membership.tier?.multiplier}
                    />
                  </div>
                ) : null}

                <div className="flex shrink-0 flex-col gap-2">
                  {!user ? (
                    <Button asChild variant="accent">
                      <Link to="/auth">Entrar e participar</Link>
                    </Button>
                  ) : !membership ? (
                    <Button variant="accent" onClick={handleJoin} disabled={joining}>
                      {joining ? "Entrando…" : "Participar grátis"}
                    </Button>
                  ) : (
                    <>
                      <Button variant="accent" onClick={() => setQrOpen(true)}>
                        <QrCode className="h-4 w-4" /> Meu QR de compra
                      </Button>
                      <Button variant="outline" onClick={handleCheckin} disabled={checking}>
                        <MapPin className="h-4 w-4" />
                        {checking ? "Verificando…" : "Fazer check-in"}
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="recompensas">
              <TabsList className="flex-wrap">
                <TabsTrigger value="recompensas">
                  <Gift className="mr-1 h-4 w-4" /> Recompensas
                </TabsTrigger>
                <TabsTrigger value="missoes">
                  <Target className="mr-1 h-4 w-4" /> Missões
                </TabsTrigger>
                <TabsTrigger value="ganhar">
                  <Sparkles className="mr-1 h-4 w-4" /> Como pontuar
                </TabsTrigger>
                <TabsTrigger value="extrato">
                  <Clock className="mr-1 h-4 w-4" /> Extrato
                </TabsTrigger>
              </TabsList>

              <TabsContent value="recompensas" className="mt-4">
                {(state.rewards ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Esta loja ainda não publicou recompensas.
                  </p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {(state.rewards ?? []).map((r) => (
                      <RewardCard
                        key={r.id}
                        reward={r}
                        balance={balance}
                        isMember={!!membership}
                        busy={busyId === r.id}
                        onRedeem={handleRedeem}
                      />
                    ))}
                  </div>
                )}

                {!!state.redemptions?.length && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="text-base">Meus resgates</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {state.redemptions.map((r) => (
                        <div
                          key={r.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2 text-sm"
                        >
                          <span className="font-medium">{r.reward ?? "Recompensa"}</span>
                          <span className="font-mono text-xs">{r.code}</span>
                          <Badge
                            variant={r.status === "pending" ? "secondary" : "outline"}
                          >
                            {r.status === "pending"
                              ? "Aguardando retirada"
                              : r.status === "fulfilled"
                                ? "Entregue"
                                : "Cancelado"}
                          </Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="missoes" className="mt-4">
                <MissionList missions={state.missions ?? []} />
              </TabsContent>

              <TabsContent value="ganhar" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Formas de ganhar pontos</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-2 sm:grid-cols-2">
                    {earnList.map((e) => (
                      <div
                        key={e.label}
                        className="flex items-center justify-between rounded-md border p-2 text-sm"
                      >
                        <span>{e.label}</span>
                        <Badge variant="secondary">+{e.pts}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                {!!state.program?.cashback_percent && (
                  <Card>
                    <CardContent className="flex items-center gap-3 p-4 text-sm">
                      <Wallet className="h-5 w-5 text-highlight" />
                      <span>
                        Cada compra validada gera{" "}
                        <strong>{state.program.cashback_percent}%</strong> de cashback em crédito
                        para usar nesta loja.
                      </span>
                    </CardContent>
                  </Card>
                )}
                {state.program?.terms && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Regulamento da loja</CardTitle>
                    </CardHeader>
                    <CardContent className="whitespace-pre-line text-sm text-muted-foreground">
                      {state.program.terms}
                    </CardContent>
                  </Card>
                )}
                <p className="text-xs text-muted-foreground">
                  Pontos expiram após {state.program?.points_expire_months ?? 12} meses sem uso.
                </p>
              </TabsContent>

              <TabsContent value="extrato" className="mt-4">
                {(state.ledger ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma movimentação por aqui ainda.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {(state.ledger ?? []).map((l) => (
                      <li
                        key={l.id}
                        className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm"
                      >
                        <div>
                          <p className="font-medium">{REASON_LABELS[l.reason] ?? l.reason}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(l.created_at).toLocaleString("pt-BR")}
                          </p>
                        </div>
                        <div className="text-right">
                          {l.points !== 0 && (
                            <div
                              className={
                                l.points > 0
                                  ? "font-semibold text-highlight"
                                  : "font-semibold text-destructive"
                              }
                            >
                              {l.points > 0 ? "+" : ""}
                              {l.points} pts
                            </div>
                          )}
                          {l.credit_cents !== 0 && (
                            <div className="text-xs text-muted-foreground">
                              {l.credit_cents > 0 ? "+" : ""}
                              {formatCents(l.credit_cents)}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
      <Footer />
      <LoyaltyQrDialog open={qrOpen} onOpenChange={setQrOpen} />
    </div>
  );
}
