import { useEffect, useState } from "react";
import { Sparkles, Loader2, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { invokeBackend } from "@/lib/invoke-backend";
import { toast } from "sonner";

export function AiAddonCard({ storeId }: { storeId: string }) {
  const [state, setState] = useState<"loading" | "included" | "addon" | "none">("loading");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [{ data: has }, { data: addon }] = await Promise.all([
      supabase.rpc("store_has_ai_assist", { p_store_id: storeId }),
      supabase.from("store_addons").select("status").eq("store_id", storeId).eq("addon", "ai_assist").in("status", ["active", "trialing"]).limit(1),
    ]);
    setState(!has ? "none" : addon?.length ? "addon" : "included");
  };
  useEffect(() => { void load(); }, [storeId]);

  const buy = async () => {
    setBusy(true);
    const { data, error } = await invokeBackend("create-checkout", { body: { addon: "ai_assist", store_id: storeId } });
    setBusy(false);
    if (error || !data?.url) { toast.error(error?.message || "Não foi possível iniciar o checkout."); return; }
    window.location.href = data.url;
  };
  const manage = async () => {
    setBusy(true);
    const { data, error } = await invokeBackend("customer-portal", { body: {} });
    setBusy(false);
    if (error || !data?.url) { toast.error("Não foi possível abrir o portal."); return; }
    window.location.href = data.url;
  };

  return (
    <Card id="ia" className="scroll-mt-24">
      <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-1 h-6 w-6 text-highlight" />
          <div>
            <p className="font-semibold">Assistente de IA <span className="text-muted-foreground">— R$ 19/mês</span></p>
            <p className="text-sm text-muted-foreground">
              Sugere título, descrição e preço para ofertas, coletivas, leilões e ofertas invisíveis. Já vem nos planos Destaque e Plus.
            </p>
          </div>
        </div>
        {state === "loading" ? <Loader2 className="h-5 w-5 animate-spin" /> :
         state === "included" ? <Badge><Check className="mr-1 h-3 w-3" /> Incluído no seu plano</Badge> :
         state === "addon" ? (
          <div className="flex items-center gap-2"><Badge><Check className="mr-1 h-3 w-3" /> Ativo</Badge>
            <Button size="sm" variant="outline" onClick={manage} disabled={busy}>Gerenciar ou cancelar</Button></div>
         ) : (
          <Button variant="accent" onClick={buy} disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Contratar por R$ 19/mês</Button>
         )}
      </CardContent>
    </Card>
  );
}
