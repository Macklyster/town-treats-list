import { useEffect, useState } from "react";
import { Users, Loader2, Check, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { invokeBackend } from "@/lib/invoke-backend";
import { toast } from "sonner";

export function ManagedOffersAddonCard({ storeId }: { storeId: string }) {
  const [state, setState] = useState<"loading" | "active" | "available" | "locked">("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const [{ data: paid }, { data: addon }] = await Promise.all([
        supabase.rpc("store_has_paid_plan", { p_store_id: storeId }),
        supabase.from("store_addons").select("status").eq("store_id", storeId).eq("addon", "managed_offers").in("status", ["active", "trialing"]).limit(1),
      ]);
      setState(addon?.length ? "active" : paid ? "available" : "locked");
    })();
  }, [storeId]);

  const go = async (fn: "create-checkout" | "customer-portal") => {
    setBusy(true);
    const { data, error } = await invokeBackend(fn, { body: fn === "create-checkout" ? { addon: "managed_offers", store_id: storeId } : {} });
    setBusy(false);
    if (error || !data?.url) { toast.error(error?.message || "Não foi possível continuar."); return; }
    window.location.href = data.url;
  };

  return (
    <Card id="gerenciadas" className="scroll-mt-24">
      <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <Users className="mt-1 h-6 w-6 text-highlight" />
          <div>
            <p className="font-semibold">Ofertas Gerenciadas pela equipe OfertasFly <span className="text-muted-foreground">— R$ 59/mês</span></p>
            <p className="text-sm text-muted-foreground">
              Sem tempo para cadastrar? Nossa equipe cria e publica suas ofertas, cupons e imagens por você. Disponível nos planos Starter, Destaque e Plus.
            </p>
          </div>
        </div>
        {state === "loading" ? <Loader2 className="h-5 w-5 animate-spin" /> :
         state === "active" ? (
          <div className="flex items-center gap-2"><Badge><Check className="mr-1 h-3 w-3" /> Ativo</Badge>
            <Button size="sm" variant="outline" onClick={() => go("customer-portal")} disabled={busy}>Gerenciar ou cancelar</Button></div>
         ) : state === "locked" ? (
          <Button variant="outline" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><Lock className="h-4 w-4" />Fazer upgrade</Button>
         ) : (
          <Button variant="accent" onClick={() => go("create-checkout")} disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Contratar por R$ 59/mês</Button>
         )}
      </CardContent>
    </Card>
  );
}
