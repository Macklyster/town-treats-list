import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const schema = z.object({
  flash_default_hours: z.number().int().min(1).max(72),
  review_prompt_hours: z.number().int().min(1).max(168),
});

export const AdminSettings = () => {
  const [flashHours, setFlashHours] = useState<string>("2");
  const [reviewHours, setReviewHours] = useState<string>("3");
  const [initial, setInitial] = useState<{ flash: number; review: number }>({ flash: 2, review: 3 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("flash_default_hours, review_prompt_hours")
      .eq("id", true)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) toast.error("Erro ao carregar configurações");
        const f = data?.flash_default_hours ?? 2;
        const r = (data as any)?.review_prompt_hours ?? 3;
        setFlashHours(String(f));
        setReviewHours(String(r));
        setInitial({ flash: f, review: r });
        setLoading(false);
      });
  }, []);

  const dirty = Number(flashHours) !== initial.flash || Number(reviewHours) !== initial.review;

  const handleSave = async () => {
    setError(null);
    const parsed = schema.safeParse({
      flash_default_hours: Number(flashHours),
      review_prompt_hours: Number(reviewHours),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Valor inválido");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("app_settings")
      .update({
        flash_default_hours: parsed.data.flash_default_hours,
        review_prompt_hours: parsed.data.review_prompt_hours,
        updated_at: new Date().toISOString(),
      })
      .eq("id", true);
    setSaving(false);
    if (error) {
      toast.error("Não foi possível salvar: " + error.message);
      return;
    }
    setInitial({ flash: parsed.data.flash_default_hours, review: parsed.data.review_prompt_hours });
    toast.success("Configurações salvas");
  };

  return (
    <div className="space-y-6">
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
              value={flashHours}
              disabled={loading || saving}
              onChange={(e) => {
                setFlashHours(e.target.value);
                setError(null);
              }}
            />
            <p className="text-sm text-muted-foreground">
              Valor padrão sugerido ao lojista ao criar uma oferta relâmpago. Aceita 1 a 72 horas.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Avaliações de clientes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="review_prompt_hours">Janela após interação (horas)</Label>
            <Input
              id="review_prompt_hours"
              type="number"
              min={1}
              max={168}
              step={1}
              value={reviewHours}
              disabled={loading || saving}
              onChange={(e) => {
                setReviewHours(e.target.value);
                setError(null);
              }}
            />
            <p className="text-sm text-muted-foreground">
              Tempo após o clique em WhatsApp/telefone/QR para sugerir avaliação ao cliente. De 1 a 168 horas.
            </p>
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={!dirty || saving || loading}>
          {saving ? "Salvando..." : "Salvar alterações"}
        </Button>
        {dirty && (
          <Button
            variant="ghost"
            onClick={() => {
              setFlashHours(String(initial.flash));
              setReviewHours(String(initial.review));
              setError(null);
            }}
            disabled={saving}
          >
            Cancelar
          </Button>
        )}
      </div>
    </div>
  );
};
