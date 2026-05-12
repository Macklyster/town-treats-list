import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, Loader2, AlertTriangle } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
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
import { PLAN_CATALOG, getPlanBySlug } from "@/data/plans";

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
  const [storeId, setStoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState<string>("");
  const [cancelDetails, setCancelDetails] = useState("");

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
    setPlans((pls ?? []) as any);
    const sId = stores?.[0]?.id ?? null;
    setStoreId(sId);
    if (sId) {
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("id,status,plan_id,current_period_end,stripe_subscription_id,cancel_at_period_end,canceled_at")
        .eq("store_id", sId)
        .order("created_at", { ascending: false })
        .limit(1);
      setSub((subs?.[0] as any) ?? null);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (params.get("success")) toast.success("Pagamento concluído! Aguardando confirmação...");
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

  const subscribe = async (planId: string) => {
    if (!storeId) {
      toast.error("Cadastre sua loja antes de assinar.");
      navigate("/painel-lojista/loja");
      return;
    }
    setBusy(planId);
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { plan_id: planId, store_id: storeId },
    });
    setBusy(null);
    if (error || !data?.url) {
      toast.error("Não foi possível iniciar o checkout.");
      return;
    }
    openExternalUrl(data.url);
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
    <div className="flex min-h-screen flex-col bg-muted/20">
      <Header />
      <main className="container flex-1 py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-display text-foreground">Assinatura</h1>
            <p className="text-muted-foreground">Escolha o plano ideal para sua loja.</p>
          </div>
          {sub && (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={manage} disabled={busy === "portal"}>
                {busy === "portal" && <Loader2 className="h-4 w-4 animate-spin" />}
                Gerenciar ou cancelar assinatura
              </Button>
              {isActive && !willCancel && (
                <Button variant="destructive" onClick={() => setCancelOpen(true)}>
                  Cancelar plano
                </Button>
              )}
            </div>
          )}
        </div>

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

        {loading ? <p>Carregando…</p> : (
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((p) => {
              const isCurrent = sub?.plan_id === p.id && sub?.status === "active";
              return (
                <Card key={p.id} className={isCurrent ? "ring-2 ring-accent" : ""}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{p.name}</CardTitle>
                      {isCurrent && <Badge>Plano atual</Badge>}
                    </div>
                    <div className="mt-2 text-display text-foreground">
                      {formatBRL(p.price_cents)}<span className="text-sm font-normal text-muted-foreground">/mês</span>
                    </div>
                    {isCurrent && sub?.current_period_end && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {willCancel ? "Termina em " : "Renova em "}
                        {new Date(sub.current_period_end).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {(p.features ?? []).map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 text-accent-strong" /> {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="mt-6 w-full"
                      variant={isCurrent ? "outline" : "accent"}
                      disabled={isCurrent || busy === p.id}
                      onClick={() => subscribe(p.id)}
                    >
                      {busy === p.id && <Loader2 className="h-4 w-4 animate-spin" />}
                      {isCurrent ? "Plano ativo" : "Assinar"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
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

      <Footer />
    </div>
  );
}
