import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, Loader2 } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatBRL } from "@/lib/format";
import { toast } from "sonner";

type Plan = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  features: string[];
  max_offers: number;
  featured_slots: number;
};
type Sub = { id: string; status: string; plan_id: string; current_period_end: string | null };

export default function Assinatura() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [sub, setSub] = useState<Sub | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

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
        .select("id,status,plan_id,current_period_end")
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
    if (params.get("canceled")) toast.info("Pagamento cancelado.");
    if (params.get("success")) {
      // poll a few times for webhook to update sub
      let tries = 0;
      const iv = setInterval(() => {
        tries++;
        load();
        if (tries >= 10) clearInterval(iv);
      }, 2000);
      return () => clearInterval(iv);
    }
  }, [user?.id]);

  // realtime updates from webhook
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
    window.location.href = data.url;
  };

  const manage = async () => {
    setBusy("portal");
    const { data, error } = await supabase.functions.invoke("customer-portal", { body: {} });
    setBusy(null);
    if (error || !data?.url) {
      toast.error("Não foi possível abrir o portal.");
      return;
    }
    window.location.href = data.url;
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <Header />
      <main className="container flex-1 py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-primary">Assinatura</h1>
            <p className="text-muted-foreground">Escolha o plano ideal para sua loja.</p>
          </div>
          {sub && (
            <Button variant="outline" onClick={manage} disabled={busy === "portal"}>
              {busy === "portal" && <Loader2 className="h-4 w-4 animate-spin" />}
              Gerenciar pagamento
            </Button>
          )}
        </div>

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
                    <div className="mt-2 text-3xl font-bold text-primary">
                      {formatBRL(p.price_cents)}<span className="text-sm font-normal text-muted-foreground">/mês</span>
                    </div>
                    {isCurrent && sub?.current_period_end && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Renova em {new Date(sub.current_period_end).toLocaleDateString("pt-BR")}
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
      <Footer />
    </div>
  );
}
