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
  group_offer_max_active_per_store: z.number().int().min(1).max(20),
  social_proof_min_views_today: z.number().int().min(0).max(1000),
  social_proof_min_viewers_now: z.number().int().min(0).max(100),
  social_proof_now_window_minutes: z.number().int().min(1).max(120),
});

type Initial = {
  flash: number;
  review: number;
  groupMax: number;
  spMinViews: number;
  spMinNow: number;
  spWindow: number;
};

export const AdminSettings = () => {
  const [flashHours, setFlashHours] = useState<string>("2");
  const [reviewHours, setReviewHours] = useState<string>("3");
  const [groupMax, setGroupMax] = useState<string>("1");
  const [spMinViews, setSpMinViews] = useState<string>("5");
  const [spMinNow, setSpMinNow] = useState<string>("2");
  const [spWindow, setSpWindow] = useState<string>("5");
  const [initial, setInitial] = useState<Initial>({
    flash: 2,
    review: 3,
    groupMax: 1,
    spMinViews: 5,
    spMinNow: 2,
    spWindow: 5,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("app_settings")
      .select(
        "flash_default_hours, review_prompt_hours, group_offer_max_active_per_store, social_proof_min_views_today, social_proof_min_viewers_now, social_proof_now_window_minutes",
      )
      .eq("id", true)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) toast.error("Erro ao carregar configurações");
        const f = data?.flash_default_hours ?? 2;
        const r = (data as any)?.review_prompt_hours ?? 3;
        const g = (data as any)?.group_offer_max_active_per_store ?? 1;
        const sv = (data as any)?.social_proof_min_views_today ?? 5;
        const sn = (data as any)?.social_proof_min_viewers_now ?? 2;
        const sw = (data as any)?.social_proof_now_window_minutes ?? 5;
        setFlashHours(String(f));
        setReviewHours(String(r));
        setGroupMax(String(g));
        setSpMinViews(String(sv));
        setSpMinNow(String(sn));
        setSpWindow(String(sw));
        setInitial({ flash: f, review: r, groupMax: g, spMinViews: sv, spMinNow: sn, spWindow: sw });
        setLoading(false);
      });
  }, []);

  const dirty =
    Number(flashHours) !== initial.flash ||
    Number(reviewHours) !== initial.review ||
    Number(groupMax) !== initial.groupMax ||
    Number(spMinViews) !== initial.spMinViews ||
    Number(spMinNow) !== initial.spMinNow ||
    Number(spWindow) !== initial.spWindow;

  const handleSave = async () => {
    setError(null);
    const parsed = schema.safeParse({
      flash_default_hours: Number(flashHours),
      review_prompt_hours: Number(reviewHours),
      group_offer_max_active_per_store: Number(groupMax),
      social_proof_min_views_today: Number(spMinViews),
      social_proof_min_viewers_now: Number(spMinNow),
      social_proof_now_window_minutes: Number(spWindow),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Valor inválido");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("app_settings")
      .update({
        ...parsed.data,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", true);
    setSaving(false);
    if (error) {
      toast.error("Não foi possível salvar: " + error.message);
      return;
    }
    setInitial({
      flash: parsed.data.flash_default_hours,
      review: parsed.data.review_prompt_hours,
      groupMax: parsed.data.group_offer_max_active_per_store,
      spMinViews: parsed.data.social_proof_min_views_today,
      spMinNow: parsed.data.social_proof_min_viewers_now,
      spWindow: parsed.data.social_proof_now_window_minutes,
    });
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

      <Card>
        <CardHeader>
          <CardTitle>OfertasFly Coletiva</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="group_offer_max_active_per_store">Máximo de coletivas ativas por loja</Label>
            <Input
              id="group_offer_max_active_per_store"
              type="number"
              min={1}
              max={20}
              step={1}
              value={groupMax}
              disabled={loading || saving}
              onChange={(e) => {
                setGroupMax(e.target.value);
                setError(null);
              }}
            />
            <p className="text-sm text-muted-foreground">
              Quantas coletivas (pendentes ou aprovadas) cada loja pode ter ao mesmo tempo. Padrão: 1.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prova social em tempo real</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-w-md">
          <p className="text-sm text-muted-foreground">
            Disponível para lojas com plano <strong>Destaque</strong> ou <strong>Plus</strong>. Define os limites mínimos para exibir os contadores ao público (anti-prova-social fraca).
          </p>
          <div className="space-y-2">
            <Label htmlFor="sp_min_views">Mínimo de visualizações para exibir "viram hoje"</Label>
            <Input
              id="sp_min_views"
              type="number"
              min={0}
              max={1000}
              step={1}
              value={spMinViews}
              disabled={loading || saving}
              onChange={(e) => {
                setSpMinViews(e.target.value);
                setError(null);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sp_min_now">Mínimo de sessões para exibir "vendo agora"</Label>
            <Input
              id="sp_min_now"
              type="number"
              min={0}
              max={100}
              step={1}
              value={spMinNow}
              disabled={loading || saving}
              onChange={(e) => {
                setSpMinNow(e.target.value);
                setError(null);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sp_window">Janela de "vendo agora" (minutos)</Label>
            <Input
              id="sp_window"
              type="number"
              min={1}
              max={120}
              step={1}
              value={spWindow}
              disabled={loading || saving}
              onChange={(e) => {
                setSpWindow(e.target.value);
                setError(null);
              }}
            />
            <p className="text-sm text-muted-foreground">
              Considera ativas as sessões com visualização nos últimos N minutos.
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
              setGroupMax(String(initial.groupMax));
              setSpMinViews(String(initial.spMinViews));
              setSpMinNow(String(initial.spMinNow));
              setSpWindow(String(initial.spWindow));
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
