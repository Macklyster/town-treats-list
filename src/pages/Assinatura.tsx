import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, Loader2, AlertTriangle, Gift, Shield, Sparkles, XCircle } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatBRL } from "@/lib/format";
import { toast } from "sonner";
import { PLAN_CATALOG } from "@/data/plans";

type Plan = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  features: string[];
  max_offers: number;
  featured_slots: number;
};
type Sub = {
  id: string;
  status: string;
  plan_id: string;
  current_period_end: string | null;
  stripe_subscription_id: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
};

const CANCEL_REASONS = [
  "Muito caro",
  "Não usei o suficiente",
  "Faltam recursos que preciso",
  "Mudando para outra solução",
  "Problemas técnicos",
  "Outro",
];

export default function Assinatura() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [sub, setSub] = useState<Sub | null>(null);
  const [trialEligible, setTrialEligible] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState<string>("");
  const [cancelDetails, setCancelDetails] = useState("");
  const [cycle, setCycle] = useState<"monthly" | "yearly">(
    params.get("cycle") === "yearly" ? "yearly" : "monthly",
  );

  const openExternalUrl = (url: string) => {
    const isEmbedded = window.self !== window.top;

    if (isEmbedded) {
      const popup = window.open(url, "_blank", "noopener,noreferrer");

      if (!popup) {
        toast.error("Não foi possível abrir a página de pagamento. Libere pop-ups e tente novamente.");
      }

      return;
    }

    window.location.href = url;
  };

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: pls }, { data: stores }] = await Promise.all([
      supabase.from("plans").select("*").eq("active", true).order("sort_order"),
      supabase.from("stores").select("id").eq("owner_id", user.id).limit(1),
    ]);
    const loadedPlans = (pls ?? []) as Plan[];
    setPlans(loadedPlans);
    const sId = stores?.[0]?.id ?? null;
    setStoreId(sId);
    if (sId) {
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("id,status,plan_id,current_period_end,stripe_subscription_id,cancel_at_period_end,canceled_at")
        .eq("store_id", sId)
        .order("created_at", { ascending: false });
      const list = (subs ?? []) as Sub[];
      setSub(list[0] ?? null);
      // Trial é elegível se a loja NUNCA assinou um plano pago (price_cents > 0).
      const paidPlanIds = new Set(loadedPlans.filter((p) => p.price_cents > 0).map((p) => p.id));
      const hadPaid = list.some((s) => s.plan_id && paidPlanIds.has(s.plan_id));
      setTrialEligible(!hadPaid);
    } else {
      setTrialEligible(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (params.get("success")) {
      if (params.get("trial")) {
        toast.success(`Seus ${trialDays} dias grátis começaram! Aproveite todos os recursos do plano.`);
      } else {
        toast.success("Pagamento concluído! Aguardando confirmação...");
      }
    }
    if (params.get("canceled")) toast.info("Solicitação de cancelamento processada.");
    if (params.get("success") || params.get("canceled")) {
      let tries = 0;
      const iv = setInterval(() => {
        tries++;
        load();
        if (tries >= 10) clearInterval(iv);
      }, 2000);
      return () => clearInterval(iv);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!storeId) return;
    const ch = supabase
      .channel(`assinatura-${storeId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `store_id=eq.${storeId}` },
        () => load()
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [storeId]);

  const [changePlanId, setChangePlanId] = useState<string | null>(null);

  const subscribe = async (planId: string) => {
    if (!storeId) {
      toast.error("Cadastre sua loja antes de assinar.");
      navigate("/painel-lojista/loja");
      return;
    }
    // If user already has an active sub, switch plan via change-subscription-plan
    const hasActive = sub && ["active", "trialing"].includes(sub.status);
    if (hasActive && sub?.plan_id !== planId) {
      setChangePlanId(planId);
      return;
    }
    setBusy(planId);
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { plan_id: planId, store_id: storeId, cycle },
    });
    setBusy(null);
    if (error || !data?.url) {
      let message = "Não foi possível iniciar o checkout.";
      try {
        const ctx = (error as any)?.context;
        if (ctx && typeof ctx.json === "function") {
          const body = await ctx.json();
          if (body?.error) message = body.error;
        } else if (data?.error) {
          message = data.error;
        }
      } catch {
        /* ignore */
      }
      toast.error(message);
      return;
    }
    openExternalUrl(data.url);
  };

  const confirmChangePlan = async () => {
    if (!changePlanId || !storeId) return;
    setBusy(changePlanId);
    const { data, error } = await supabase.functions.invoke("change-subscription-plan", {
      body: { plan_id: changePlanId, store_id: storeId },
    });
    setBusy(null);
    setChangePlanId(null);
    if (error || !data?.ok) {
      let message = "Não foi possível alterar o plano.";
      try {
        const ctx = (error as any)?.context;
        if (ctx && typeof ctx.json === "function") {
          const body = await ctx.json();
          if (body?.error) message = body.error;
        }
      } catch {
        /* ignore */
      }
      toast.error(message);
      return;
    }
    toast.success("Plano alterado com sucesso! Cobrança ajustada proporcionalmente.");
    load();
  };

  const manage = async () => {
    setBusy("portal");
    const { data, error } = await supabase.functions.invoke("customer-portal", { body: {} });
    setBusy(null);
    if (error || !data?.url) {
      toast.error("Não foi possível abrir o portal.");
      return;
    }
    openExternalUrl(data.url);
  };

  const confirmCancel = async () => {
    if (!sub?.stripe_subscription_id || !storeId) return;
    setBusy("cancel");

    if (cancelReason) {
      await supabase.from("cancellation_reasons").insert({
        store_id: storeId,
        subscription_id: sub.id,
        reason: cancelReason,
        details: cancelDetails || null,
      });
    }

    const { data, error } = await supabase.functions.invoke("customer-portal", {
      body: { flow: "cancel", subscription_id: sub.stripe_subscription_id },
    });
    setBusy(null);
    setCancelOpen(false);
    if (error || !data?.url) {
      toast.error("Não foi possível abrir o cancelamento.");
      return;
    }
    openExternalUrl(data.url);
  };

  const reactivate = async () => {
    if (!storeId) return;
    setBusy("reactivate");
    const { error } = await supabase.functions.invoke("reactivate-subscription", {
      body: { store_id: storeId },
    });
    setBusy(null);
    if (error) {
      toast.error("Não foi possível reativar a assinatura.");
      return;
    }
    toast.success("Assinatura reativada com sucesso!");
    load();
  };

  const isActive = sub && ["active", "trialing"].includes(sub.status);
  const willCancel = sub?.cancel_at_period_end && isActive;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container flex-1 space-y-8 py-8 md:py-10">
        <PageHero
          eyebrow="Painel do lojista"
          title="Assinatura"
          subtitle="Escolha o plano ideal para sua loja e gerencie sua assinatura."
          crumbs={[
            { label: "Painel", to: "/painel-lojista" },
            { label: "Assinatura" },
          ]}
          compact
          actions={
            sub ? (
              <>
                <Button variant="outline" onClick={manage} disabled={busy === "portal"}>
                  {busy === "portal" && <Loader2 className="h-4 w-4 animate-spin" />}
                  Gerenciar ou cancelar assinatura
                </Button>
                {isActive && !willCancel && (
                  <Button variant="destructive" onClick={() => setCancelOpen(true)}>
                    Cancelar plano
                  </Button>
                )}
              </>
            ) : undefined
          }
        />


        {willCancel && (
          <Alert className="mb-6 border-warning-border/50 bg-warning-bg text-warning-foreground">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Assinatura programada para cancelamento</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
              <span>
                Sua assinatura permanece ativa até{" "}
                <strong>
                  {sub?.current_period_end
                    ? new Date(sub.current_period_end).toLocaleDateString("pt-BR")
                    : "—"}
                </strong>
                . Após essa data, você perderá acesso aos benefícios do plano.
              </span>
              <Button size="sm" variant="accent" onClick={reactivate} disabled={busy === "reactivate"}>
                {busy === "reactivate" && <Loader2 className="h-4 w-4 animate-spin" />}
                Reativar assinatura
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {trialEligible && !sub && !loading && (
          <div className="relative mb-8 overflow-hidden rounded-2xl gradient-hero p-6 text-primary-foreground md:p-8">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/30 blur-3xl" aria-hidden />
            <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-accent/20 blur-3xl" aria-hidden />
            <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-accent/20 p-3 text-accent">
                  <Gift className="h-7 w-7" />
                </div>
                <div>
                  <div className="mb-1 inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-accent-foreground">
                    <Sparkles className="h-3 w-3" /> Oferta de boas-vindas
                  </div>
                  <h2 className="text-2xl font-bold leading-tight md:text-3xl">
                    Teste qualquer plano pago por <span className="text-accent">{trialDays} dias grátis</span>.
                  </h2>
                  <p className="mt-1 max-w-xl text-sm opacity-90 md:text-base">
                    Sem cobrança hoje. Cancele a qualquer momento dentro dos {trialDays} dias e não pague nada.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-xs md:flex-col md:text-sm">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/10 px-3 py-1.5 backdrop-blur">
                  <Shield className="h-3.5 w-3.5 text-accent" /> Sem fidelidade
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/10 px-3 py-1.5 backdrop-blur">
                  <XCircle className="h-3.5 w-3.5 text-accent" /> Cancele em 1 clique
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/10 px-3 py-1.5 backdrop-blur">
                  <Check className="h-3.5 w-3.5 text-accent" /> Acesso total aos recursos
                </span>
              </div>
            </div>
          </div>
        )}

        {loading ? <p>Carregando…</p> : (
          <>
            {/* Toggle Mensal / Anual */}
            <div className="mb-6 flex flex-col items-center gap-1">
              <div className="inline-flex items-center rounded-full border border-border bg-background p-1 shadow-soft">
                <button
                  type="button"
                  onClick={() => setCycle("monthly")}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                    cycle === "monthly" ? "bg-accent text-accent-foreground shadow" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Mensal
                </button>
                <button
                  type="button"
                  onClick={() => setCycle("yearly")}
                  className={`relative rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                    cycle === "yearly" ? "bg-accent text-accent-foreground shadow" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Anual
                  <span className="ml-2 inline-flex items-center rounded-full bg-accent-strong px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                    -17%
                  </span>
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Anual = 10 meses (2 meses grátis), cobrado uma vez por ano.
              </p>
            </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {PLAN_CATALOG.map((catalog) => {
              const isFreePlan = catalog.slug === "gratis";
              const dbPlan = plans.find((p) => p.slug === catalog.slug);
              const paidActive = sub && ["active", "trialing"].includes(sub.status);
              const isCurrent = isFreePlan
                ? !paidActive
                : !!dbPlan && sub?.plan_id === dbPlan.id && !!paidActive;
              const Icon = catalog.icon;
              const yearlyAvailable = !isFreePlan && !!catalog.priceCentsYearly;
              const isYearly = cycle === "yearly" && yearlyAvailable;
              // Yearly subscriptions don't get the trial (2 free months already baked into the yearly price).
              const showTrial = !isFreePlan && !isYearly && trialEligible && !paidActive;
              return (
                <Card
                  key={catalog.slug}
                  className={`relative ${isCurrent ? "ring-2 ring-accent" : showTrial ? "ring-2 ring-accent" : catalog.highlight ? "ring-2 ring-accent/40" : ""}`}
                >
                  {showTrial && !isCurrent ? (
                    <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground shadow-md">
                      <Gift className="h-3 w-3" /> {trialDays} DIAS GRÁTIS
                    </span>
                  ) : (
                    catalog.highlight && !isCurrent && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
                        Mais popular
                      </span>
                    )
                  )}
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent-strong">
                          <Icon className="h-5 w-5" />
                        </span>
                        <CardTitle>{catalog.name}</CardTitle>
                      </div>
                      {isCurrent && <Badge>Plano atual</Badge>}
                    </div>
                    {showTrial ? (
                      <div className="mt-2">
                        <div className="text-display text-foreground">
                          R$ 0
                          <span className="text-sm font-normal text-muted-foreground"> nos {trialDays} primeiros dias</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Depois, {formatBRL(catalog.priceCents)}{catalog.period} · cancele antes e não pague nada
                        </p>
                      </div>
                    ) : isYearly ? (
                      <div className="mt-2">
                        <div className="text-display text-foreground">
                          {formatBRL(catalog.priceCentsYearly!)}
                          <span className="text-sm font-normal text-muted-foreground"> /ano</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          <s className="opacity-60">{formatBRL(catalog.priceCents * 12)}/ano</s> · economize {formatBRL(catalog.priceCents * 2)}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-2 text-display text-foreground">
                        {formatBRL(catalog.priceCents)}
                        <span className="text-sm font-normal text-muted-foreground"> {catalog.period}</span>
                      </div>
                    )}
                    {!isFreePlan && isCurrent && sub?.current_period_end && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {willCancel ? "Termina em " : "Renova em "}
                        {new Date(sub.current_period_end).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {catalog.features.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 text-accent-strong" /> {f}
                        </li>
                      ))}
                    </ul>
                    {isFreePlan ? (
                      <Button
                        className="mt-6 w-full"
                        variant="outline"
                        disabled={isCurrent}
                        onClick={() => navigate("/painel-lojista")}
                      >
                        {isCurrent ? "Plano atual" : "Voltar ao plano grátis"}
                      </Button>
                    ) : (
                      <>
                        <Button
                          className="mt-6 w-full"
                          variant={isCurrent ? "outline" : showTrial || catalog.highlight ? "accent" : "default"}
                          disabled={isCurrent || !dbPlan || busy === dbPlan?.id}
                          onClick={() => dbPlan && subscribe(dbPlan.id)}
                        >
                          {dbPlan && busy === dbPlan.id && <Loader2 className="h-4 w-4 animate-spin" />}
                          {isCurrent
                            ? "Plano ativo"
                            : !dbPlan
                            ? "Indisponível"
                            : paidActive
                            ? "Mudar para este plano"
                            : showTrial
                            ? `Começar ${trialDays} dias grátis`
                            : isYearly
                            ? "Assinar plano anual"
                            : "Assinar"}
                        </Button>
                        {showTrial && (
                          <p className="mt-2 text-center text-[11px] leading-snug text-muted-foreground">
                            Sem cobrança nos primeiros {trialDays} dias · Cancele quando quiser · Sem multa
                          </p>
                        )}
                        {isYearly && !showTrial && (
                          <p className="mt-2 text-center text-[11px] leading-snug text-muted-foreground">
                            Cobrança única anual · Cancele quando quiser
                          </p>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          </>
        )}
      </main>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar sua assinatura?</AlertDialogTitle>
            <AlertDialogDescription>
              Você continuará com acesso aos benefícios até o final do período já pago
              {sub?.current_period_end ? ` (${new Date(sub.current_period_end).toLocaleDateString("pt-BR")})` : ""}.
              Depois disso, suas ofertas deixarão de ser exibidas.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Por que está cancelando? (opcional)</Label>
              <Select value={cancelReason} onValueChange={setCancelReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um motivo" />
                </SelectTrigger>
                <SelectContent>
                  {CANCEL_REASONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Conte mais (opcional)</Label>
              <Textarea
                value={cancelDetails}
                onChange={(e) => setCancelDetails(e.target.value)}
                placeholder="Seu feedback nos ajuda a melhorar."
                rows={3}
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy === "cancel"}>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel} disabled={busy === "cancel"}>
              {busy === "cancel" && <Loader2 className="h-4 w-4 animate-spin" />}
              Continuar cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!changePlanId} onOpenChange={(o) => !o && setChangePlanId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterar plano da assinatura?</AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                const target = plans.find((p) => p.id === changePlanId);
                const currentPlan = plans.find((p) => p.id === sub?.plan_id);
                return (
                  <>
                    Você está mudando de <strong>{currentPlan?.name ?? "plano atual"}</strong> para{" "}
                    <strong>{target?.name ?? "novo plano"}</strong>. A cobrança será ajustada
                    proporcionalmente pelo Stripe (crédito ou cobrança da diferença) e o novo plano
                    passa a valer imediatamente.
                  </>
                );
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!busy}>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmChangePlan} disabled={!!busy}>
              {busy === changePlanId && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar mudança
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}
