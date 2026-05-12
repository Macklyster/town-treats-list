import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const schema = z.object({
  flash_default_hours: z
    .number({ invalid_type_error: "Informe um número" })
    .int("Use apenas números inteiros")
    .min(1, "Mínimo 1 hora")
    .max(72, "Máximo 72 horas"),
});

export const AdminSettings = () => {
  const [hours, setHours] = useState<string>("2");
  const [initial, setInitial] = useState<number>(2);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("flash_default_hours")
      .eq("id", true)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) toast.error("Erro ao carregar configurações");
        const v = data?.flash_default_hours ?? 2;
        setHours(String(v));
        setInitial(v);
        setLoading(false);
      });
  }, []);

  const dirty = Number(hours) !== initial;

  const handleSave = async () => {
    setError(null);
    const parsed = schema.safeParse({ flash_default_hours: Number(hours) });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Valor inválido");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("app_settings")
      .update({ flash_default_hours: parsed.data.flash_default_hours, updated_at: new Date().toISOString() })
      .eq("id", true);
    setSaving(false);
    if (error) {
      toast.error("Não foi possível salvar: " + error.message);
      return;
    }
    setInitial(parsed.data.flash_default_hours);
    toast.success("Configurações salvas");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ofertas relâmpago</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 max-w-md">
        <div className="space-y-2">
          <Label htmlFor="flash_default_hours">Duração padrão (horas)</Label>
          <Input
            id="flash_default_hours"
            type="number"
            min={1}
            max={72}
            step={1}
            value={hours}
            disabled={loading || saving}
            onChange={(e) => {
              setHours(e.target.value);
              setError(null);
            }}
          />
          <p className="text-sm text-muted-foreground">
            Valor padrão sugerido ao lojista ao criar uma oferta relâmpago. Aceita 1 a 72 horas.
          </p>
          {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={!dirty || saving || loading}>
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
          {dirty && (
            <Button
              variant="ghost"
              onClick={() => {
                setHours(String(initial));
                setError(null);
              }}
              disabled={saving}
            >
              Cancelar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
