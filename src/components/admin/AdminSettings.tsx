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
  scheduled_offer_min_lead_hours: z.number().int().min(1).max(168),
  scheduled_offer_max_lead_days: z.number().int().min(1).max(180),
  offer_approval_sla_hours: z.number().int().min(1).max(168),
  offer_min_validity_hours: z.number().int().min(1).max(168),
  trial_default_days: z.number().int().min(1).max(365),
});

type Initial = {
  flash: number;
  review: number;
  groupMax: number;
  spMinViews: number;
  spMinNow: number;
  spWindow: number;
  schedMinLead: number;
  schedMaxLead: number;
  slaHours: number;
  minValidity: number;
  trialDays: number;
};

export const AdminSettings = () => {
  const [flashHours, setFlashHours] = useState<string>("2");
  const [reviewHours, setReviewHours] = useState<string>("3");
  const [groupMax, setGroupMax] = useState<string>("1");
  const [spMinViews, setSpMinViews] = useState<string>("5");
  const [spMinNow, setSpMinNow] = useState<string>("2");
  const [spWindow, setSpWindow] = useState<string>("5");
  const [schedMinLead, setSchedMinLead] = useState<string>("12");
  const [schedMaxLead, setSchedMaxLead] = useState<string>("30");
  const [slaHours, setSlaHours] = useState<string>("24");
  const [minValidity, setMinValidity] = useState<string>("6");
  const [trialDays, setTrialDays] = useState<string>("14");
  const [initial, setInitial] = useState<Initial>({
    flash: 2,
    review: 3,
    groupMax: 1,
    spMinViews: 5,
    spMinNow: 2,
    spWindow: 5,
    schedMinLead: 12,
    schedMaxLead: 30,
    slaHours: 24,
    minValidity: 6,
    trialDays: 14,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("app_settings")
      .select(
        "flash_default_hours, review_prompt_hours, group_offer_max_active_per_store, social_proof_min_views_today, social_proof_min_viewers_now, social_proof_now_window_minutes, scheduled_offer_min_lead_hours, scheduled_offer_max_lead_days, offer_approval_sla_hours, offer_min_validity_hours, trial_default_days",
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
        const sml = (data as any)?.scheduled_offer_min_lead_hours ?? 12;
        const sxl = (data as any)?.scheduled_offer_max_lead_days ?? 30;
        const sla = (data as any)?.offer_approval_sla_hours ?? 24;
        const mv = (data as any)?.offer_min_validity_hours ?? 6;
        const td = (data as any)?.trial_default_days ?? 14;
        setFlashHours(String(f));
        setReviewHours(String(r));
        setGroupMax(String(g));
        setSpMinViews(String(sv));
        setSpMinNow(String(sn));
        setSpWindow(String(sw));
        setSchedMinLead(String(sml));
        setSchedMaxLead(String(sxl));
        setSlaHours(String(sla));
        setMinValidity(String(mv));
        setTrialDays(String(td));
        setInitial({ flash: f, review: r, groupMax: g, spMinViews: sv, spMinNow: sn, spWindow: sw, schedMinLead: sml, schedMaxLead: sxl, slaHours: sla, minValidity: mv, trialDays: td });
        setLoading(false);
      });
  }, []);

  const dirty =
    Number(flashHours) !== initial.flash ||
    Number(reviewHours) !== initial.review ||
    Number(groupMax) !== initial.groupMax ||
    Number(spMinViews) !== initial.spMinViews ||
    Number(spMinNow) !== initial.spMinNow ||
    Number(spWindow) !== initial.spWindow ||
    Number(schedMinLead) !== initial.schedMinLead ||
    Number(schedMaxLead) !== initial.schedMaxLead ||
    Number(slaHours) !== initial.slaHours ||
    Number(minValidity) !== initial.minValidity ||
    Number(trialDays) !== initial.trialDays;

  const handleSave = async () => {
    setError(null);
    const parsed = schema.safeParse({
      flash_default_hours: Number(flashHours),
      review_prompt_hours: Number(reviewHours),
      group_offer_max_active_per_store: Number(groupMax),
      social_proof_min_views_today: Number(spMinViews),
      social_proof_min_viewers_now: Number(spMinNow),
      social_proof_now_window_minutes: Number(spWindow),
      scheduled_offer_min_lead_hours: Number(schedMinLead),
      scheduled_offer_max_lead_days: Number(schedMaxLead),
      offer_approval_sla_hours: Number(slaHours),
      offer_min_validity_hours: Number(minValidity),
      trial_default_days: Number(trialDays),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Valor inválido");
      return;
    }
    if (parsed.data.scheduled_offer_min_lead_hours >= parsed.data.scheduled_offer_max_lead_days * 24) {
      setError("Antecedência mínima (h) deve ser menor que o máximo (em horas).");
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
      schedMinLead: parsed.data.scheduled_offer_min_lead_hours,
      schedMaxLead: parsed.data.scheduled_offer_max_lead_days,
      slaHours: parsed.data.offer_approval_sla_hours,
      minValidity: parsed.data.offer_min_validity_hours,
      trialDays: parsed.data.trial_default_days,
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

      <Card>
        <CardHeader>
          <CardTitle>Agendamento e aprovação de ofertas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-w-md">
          <p className="text-sm text-muted-foreground">
            Janelas que controlam o envio de ofertas agendadas (planos Destaque/Plus) e a validade mínima das demais. Esses limites aparecem no formulário do lojista e no FAQ público.
          </p>
          <div className="space-y-2">
            <Label htmlFor="sched_min_lead">Antecedência mínima de agendamento (horas)</Label>
            <Input
              id="sched_min_lead"
              type="number"
              min={1}
              max={168}
              step={1}
              value={schedMinLead}
              disabled={loading || saving}
              onChange={(e) => { setSchedMinLead(e.target.value); setError(null); }}
            />
            <p className="text-xs text-muted-foreground">Tempo mínimo entre o envio e o horário agendado, para garantir análise.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sched_max_lead">Antecedência máxima de agendamento (dias)</Label>
            <Input
              id="sched_max_lead"
              type="number"
              min={1}
              max={180}
              step={1}
              value={schedMaxLead}
              disabled={loading || saving}
              onChange={(e) => { setSchedMaxLead(e.target.value); setError(null); }}
            />
            <p className="text-xs text-muted-foreground">Quão longe no futuro o lojista pode agendar.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sla_hours">SLA de aprovação (horas)</Label>
            <Input
              id="sla_hours"
              type="number"
              min={1}
              max={168}
              step={1}
              value={slaHours}
              disabled={loading || saving}
              onChange={(e) => { setSlaHours(e.target.value); setError(null); }}
            />
            <p className="text-xs text-muted-foreground">Prazo prometido para análise. Exibido ao lojista no formulário e no FAQ.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="min_validity">Validade mínima de ofertas não agendadas (horas)</Label>
            <Input
              id="min_validity"
              type="number"
              min={1}
              max={168}
              step={1}
              value={minValidity}
              disabled={loading || saving}
              onChange={(e) => { setMinValidity(e.target.value); setError(null); }}
            />
            <p className="text-xs text-muted-foreground">Evita aprovar ofertas que vão expirar logo após o envio.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Período de teste grátis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="trial_default_days">Dias grátis padrão</Label>
            <Input
              id="trial_default_days"
              type="number"
              min={1}
              max={365}
              step={1}
              value={trialDays}
              disabled={loading || saving}
              onChange={(e) => { setTrialDays(e.target.value); setError(null); }}
            />
            <p className="text-sm text-muted-foreground">
              Vale para a primeira assinatura mensal paga de cada loja no checkout e é o valor sugerido
              ao aprovar um lojista. Na aba <strong>Lojas</strong> é possível definir um período
              diferente por loja (negócios fechados pelo comercial). De 1 a 365 dias.
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
              setSchedMinLead(String(initial.schedMinLead));
              setSchedMaxLead(String(initial.schedMaxLead));
              setSlaHours(String(initial.slaHours));
              setMinValidity(String(initial.minValidity));
              setTrialDays(String(initial.trialDays));
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
