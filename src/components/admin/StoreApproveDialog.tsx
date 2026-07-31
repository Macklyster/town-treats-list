import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTrialSettings } from "@/hooks/useTrialSettings";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  store: { id: string; name: string; trial_days_override?: number | null } | null;
  onDone: () => void;
};

export const StoreApproveDialog = ({ open, onOpenChange, store, onDone }: Props) => {
  const { trialDays: defaultDays } = useTrialSettings();
  const [days, setDays] = useState<string>("");
  const [grantNow, setGrantNow] = useState(false);
  const [planSlug, setPlanSlug] = useState<string>("destaque");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDays(String(store?.trial_days_override ?? defaultDays));
    setGrantNow(false);
    setPlanSlug("destaque");
  }, [open, store?.id, store?.trial_days_override, defaultDays]);

  const handleConfirm = async () => {
    if (!store) return;
    const n = Number(days);
    if (!Number.isInteger(n) || n < 1 || n > 365) {
      toast.error("Informe um número de dias entre 1 e 365");
      return;
    }
    setSaving(true);
    try {
      const { error: approveError } = await supabase
        .from("stores")
        .update({ approved: true })
        .eq("id", store.id);
      if (approveError) throw approveError;

      if (grantNow) {
        const { error } = await supabase.rpc("grant_store_trial" as any, {
          p_store_id: store.id,
          p_plan_slug: planSlug,
          p_days: n,
        });
        if (error) throw error;
        toast.success(`Loja aprovada com ${n} dias de teste no plano selecionado`);
      } else {
        const useDefault = n === defaultDays;
        const { error } = await supabase.rpc("set_store_trial_override" as any, {
          p_store_id: store.id,
          p_days: useDefault ? null : n,
        });
        if (error) throw error;
        toast.success(
          useDefault
            ? "Loja aprovada com o período de teste padrão"
            : `Loja aprovada. ${n} dias grátis serão aplicados no checkout`,
        );
      }
      onOpenChange(false);
      onDone();
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível aprovar a loja");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Aprovar {store?.name}</DialogTitle>
          <DialogDescription>
            Defina os dias grátis de teste para esta loja. O padrão da plataforma é {defaultDays} dias.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="store_trial_days">Dias grátis para esta loja</Label>
            <Input
              id="store_trial_days"
              type="number"
              min={1}
              max={365}
              step={1}
              value={days}
              disabled={saving}
              onChange={(e) => setDays(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Mantenha {defaultDays} para usar o padrão global.
            </p>
          </div>

          <div className="flex items-start gap-2 rounded-md border p-3">
            <Checkbox
              id="grant_now"
              checked={grantNow}
              disabled={saving}
              onCheckedChange={(v) => setGrantNow(!!v)}
            />
            <div className="space-y-1">
              <Label htmlFor="grant_now" className="cursor-pointer">
                Conceder assinatura de teste agora (sem pagamento)
              </Label>
              <p className="text-xs text-muted-foreground">
                Use para negócios fechados pelo comercial. A loja recebe o plano em teste pelos dias
                informados, sem passar pelo checkout.
              </p>
            </div>
          </div>

          {grantNow && (
            <div className="space-y-2">
              <Label>Plano do teste</Label>
              <Select value={planSlug} onValueChange={setPlanSlug} disabled={saving}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="destaque">Destaque</SelectItem>
                  <SelectItem value="plus">Plus</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="accent" onClick={handleConfirm} disabled={saving}>
            {saving ? "Aprovando..." : "Aprovar loja"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
