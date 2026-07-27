import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Link } from "react-router-dom";
import { AlertCircle, Bell, RefreshCw, CalendarClock, Lock } from "lucide-react";
import { OfferMediaEditor, type OfferMediaItem } from "@/components/cms/OfferMediaEditor";
import { listOfferMedia, setOfferMedia } from "@/lib/media-api";
import { Checkbox } from "@/components/ui/checkbox";
import { PAYMENT_METHODS, type PaymentMethodId, parseConditions, buildConditions } from "@/lib/payment-methods";
import { useFlashSettings } from "@/hooks/useFlashSettings";
import { Zap } from "lucide-react";
import { AISuggestButton } from "@/components/site/AISuggestButton";

const schema = z.object({
  title: z.string().trim().min(3).max(140),
  category_slug: z.string().min(1),
  type: z.enum(["desconto", "cupom", "brinde"]),
  image_url: z.string().trim().url().max(500).optional().or(z.literal("")),
  original_price: z.number().min(0).max(999999),
  promo_price: z.number().min(0).max(999999),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  conditions: z.string().trim().max(500).optional().or(z.literal("")),
  valid_until: z.string().optional().or(z.literal("")),
  is_flash: z.boolean().optional(),
  flash_duration_hours: z.number().int().min(1).max(72).optional(),
  is_scheduled: z.boolean().optional(),
  scheduled_start_at: z.string().optional().or(z.literal("")),
  scheduled_end_at: z.string().optional().or(z.literal("")),
});

type ScheduleSettings = {
  minLeadHours: number;
  maxLeadDays: number;
  slaHours: number;
  minValidityHours: number;
};

export default function OfertaForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [storeId, setStoreId] = useState<string | null>(null);
  const [offerStatus, setOfferStatus] = useState<string | null>(null);
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [categories, setCategories] = useState<{ slug: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const sub = useSubscription(storeId);
  const { defaultHours: flashDefaultHours } = useFlashSettings();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodId[]>([]);
  const [mediaItems, setMediaItems] = useState<OfferMediaItem[]>([]);
  const [coverMediaId, setCoverMediaId] = useState<string | undefined>(undefined);
  const [form, setForm] = useState({
    title: "",
    category_slug: "",
    type: "desconto" as "desconto" | "cupom" | "brinde",
    image_url: "",
    original_price: 0,
    promo_price: 0,
    description: "",
    conditions: "",
    valid_until: "",
    featured: false,
    is_flash: false,
    flash_duration_hours: 2,
    auto_renew: false,
    auto_renew_days: 7,
    auto_renew_count: 0,
    is_scheduled: false,
    scheduled_start_at: "",
    scheduled_end_at: "",
  });
  const [scheduleSettings, setScheduleSettings] = useState<ScheduleSettings>({
    minLeadHours: 12,
    maxLeadDays: 30,
    slaHours: 24,
    minValidityHours: 6,
  });

  const planSlug = sub.plan?.slug ?? null;
  const canSchedule = sub.paidActive && (planSlug === "destaque" || planSlug === "plus");

  const togglePayment = (id: PaymentMethodId) =>
    setPaymentMethods((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );

  useEffect(() => {
    (async () => {
      const [{ data: cats }, { data: stores }, { data: settings }] = await Promise.all([
        supabase.from("categories").select("slug,name").order("sort_order"),
        supabase.from("stores").select("id").eq("owner_id", user!.id).limit(1),
        supabase
          .from("app_settings")
          .select("scheduled_offer_min_lead_hours, scheduled_offer_max_lead_days, offer_approval_sla_hours, offer_min_validity_hours")
          .eq("id", true)
          .maybeSingle(),
      ]);
      setCategories(cats ?? []);
      if (settings) {
        setScheduleSettings({
          minLeadHours: (settings as any).scheduled_offer_min_lead_hours ?? 12,
          maxLeadDays: (settings as any).scheduled_offer_max_lead_days ?? 30,
          slaHours: (settings as any).offer_approval_sla_hours ?? 24,
          minValidityHours: (settings as any).offer_min_validity_hours ?? 6,
        });
      }
      const sId = stores?.[0]?.id ?? null;
      setStoreId(sId);
      if (!sId) {
        toast.error("Cadastre sua loja antes de criar ofertas");
        navigate("/painel-lojista/loja");
        return;
      }
      if (isEdit) {
        const { data } = await supabase.from("offers").select("*").eq("id", id).maybeSingle();
        if (data) {
          const parsedCond = parseConditions(data.conditions ?? "");
          setPaymentMethods(parsedCond.methods);
          setOfferStatus(data.status);
          const toLocal = (ts: string | null) => {
            if (!ts) return "";
            const d = new Date(ts);
            const pad = (n: number) => String(n).padStart(2, "0");
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
          };
          setForm({
            title: data.title,
            category_slug: data.category_slug,
            type: data.type,
            image_url: data.image_url ?? "",
            original_price: Number(data.original_price),
            promo_price: Number(data.promo_price),
            description: data.description ?? "",
            conditions: parsedCond.text,
            valid_until: data.valid_until ?? "",
            featured: !!data.featured,
            is_flash: !!(data as any).is_flash,
            flash_duration_hours: (data as any).flash_duration_hours ?? flashDefaultHours,
            auto_renew: !!(data as any).auto_renew,
            auto_renew_days: (data as any).auto_renew_days ?? 7,
            auto_renew_count: (data as any).auto_renew_count ?? 0,
            is_scheduled: !!(data as any).is_scheduled,
            scheduled_start_at: toLocal((data as any).scheduled_start_at),
            scheduled_end_at: toLocal((data as any).scheduled_end_at),
          });
        }
        // Load existing media for the offer
        const existing = await listOfferMedia(id!).catch(() => []);
        if (existing.length) {
          const its: OfferMediaItem[] = existing.map((r) => ({
            id: r.asset.id,
            url: r.asset.url,
            media_type: r.asset.media_type,
            poster_url: r.asset.poster_url,
            alt_text: r.asset.alt_text,
            duration_seconds: r.asset.duration_seconds,
          }));
          setMediaItems(its);
          const cover = existing.find((r) => r.is_cover)?.media_id
            ?? its.find((i) => i.media_type === "image")?.id;
          setCoverMediaId(cover);
        }
      }
    })();
  }, [user?.id, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    if (Number(form.promo_price) <= 0) {
      toast.error("Informe um preço promocional maior que zero.");
      return;
    }
    if (Number(form.promo_price) >= Number(form.original_price)) {
      toast.error("O preço promocional deve ser menor que o preço original.");
      return;
    }
    if (form.valid_until) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (new Date(form.valid_until + "T23:59:59") < today) {
        toast.error("A validade não pode ser uma data passada.");
        return;
      }
    }
    if (!storeId) return;
    if (!sub.isActive) {
      toast.error("Você precisa de um plano ativo para publicar ofertas.");
      return;
    }
    if (!isEdit && sub.offerCount >= sub.maxOffers) {
      toast.error(
        sub.isFree
          ? `Limite do plano Grátis: ${sub.maxOffers} oferta(s) por mês. Faça upgrade para publicar mais.`
          : `Limite do plano atingido (${sub.maxOffers} ofertas).`,
      );
      return;
    }
    if (form.featured && !isEdit && sub.featuredCount >= sub.featuredSlots) {
      toast.error(`Seu plano permite apenas ${sub.featuredSlots} oferta(s) em destaque.`);
      return;
    }
    // Validação extra de agendamento (client-side)
    if (form.is_scheduled) {
      if (!canSchedule) {
        toast.error("Agendamento exclusivo dos planos Destaque e Plus.");
        return;
      }
      if (!form.scheduled_start_at) {
        toast.error("Informe a data e hora de início do agendamento.");
        return;
      }
      const start = new Date(form.scheduled_start_at);
      const now = new Date();
      const minMs = scheduleSettings.minLeadHours * 3600 * 1000;
      const maxMs = scheduleSettings.maxLeadDays * 86400 * 1000;
      if (start.getTime() - now.getTime() < minMs) {
        toast.error(`Agende com pelo menos ${scheduleSettings.minLeadHours}h de antecedência.`);
        return;
      }
      if (start.getTime() - now.getTime() > maxMs) {
        toast.error(`Agendamento máximo de ${scheduleSettings.maxLeadDays} dias no futuro.`);
        return;
      }
      if (form.scheduled_end_at && new Date(form.scheduled_end_at) <= start) {
        toast.error("Fim do agendamento deve ser após o início.");
        return;
      }
    }
    setLoading(true);
    const payload: any = {
      ...form,
      conditions: buildConditions(paymentMethods, form.conditions),
      store_id: storeId,
      valid_until: form.valid_until || null,
      status: "pending" as const,
      scheduled_start_at: form.is_scheduled && form.scheduled_start_at ? new Date(form.scheduled_start_at).toISOString() : null,
      scheduled_end_at: form.is_scheduled && form.scheduled_end_at ? new Date(form.scheduled_end_at).toISOString() : null,
    };
    let savedId = id as string | undefined;
    if (isEdit) {
      const { error } = await supabase.from("offers").update(payload).eq("id", id!);
      if (error) { setLoading(false); return toast.error(error.message); }
    } else {
      const { data: inserted, error } = await supabase.from("offers").insert(payload).select("id").single();
      if (error) { setLoading(false); return toast.error(error.message); }
      savedId = inserted?.id;
    }
    if (savedId) {
      try {
        await setOfferMedia(savedId, mediaItems.map((m) => m.id), coverMediaId);
      } catch (e: any) {
        setLoading(false);
        toast.error(`A oferta foi salva, mas as mídias não: ${e.message}`);
        return;
      }
    }
    setLoading(false);
    toast.success(isEdit ? "Oferta atualizada" : "Oferta enviada para aprovação");
    navigate("/painel-lojista");
  };

  const featureDisabled = !sub.isActive || sub.featuredSlots === 0 || (!isEdit && !sub.canFeature && !form.featured);
  const blocked = !sub.loading && !isEdit && (!sub.isActive || sub.offerCount >= sub.maxOffers);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container flex-1 py-10">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle>{isEdit ? "Editar oferta" : "Nova oferta"}</CardTitle>
          </CardHeader>
          <CardContent>
            {!sub.loading && sub.isActive && !isEdit && sub.offerCount >= sub.maxOffers && (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Limite atingido</AlertTitle>
                <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
                  <span>
                    {sub.isFree
                      ? `Plano Grátis permite ${sub.maxOffers} oferta(s) por mês. Faça upgrade para publicar mais.`
                      : `Seu plano permite ${sub.maxOffers} oferta(s). Faça upgrade para criar mais.`}
                  </span>
                  <Button asChild size="sm" variant="accent">
                    <Link to="/painel-lojista/assinatura">Ver planos</Link>
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <AISuggestButton
                category_slug={form.category_slug}
                original_price={form.original_price}
                current_title={form.title}
                image_url={form.image_url}
                onApply={(patch) =>
                  setForm((f) => ({
                    ...f,
                    ...(patch.title !== undefined ? { title: patch.title } : {}),
                    ...(patch.description !== undefined ? { description: patch.description } : {}),
                    ...(patch.promo_price !== undefined ? { promo_price: patch.promo_price } : {}),
                  }))
                }
              />
              <div>
                <Label>Título *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Categoria *</Label>
                  <Select value={form.category_slug} onValueChange={(v) => setForm({ ...form, category_slug: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desconto">Desconto</SelectItem>
                      <SelectItem value="cupom">Cupom</SelectItem>
                      <SelectItem value="brinde">Brinde</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {storeId && (
                <OfferMediaEditor
                  storeId={storeId}
                  value={mediaItems}
                  coverId={coverMediaId}
                  onChange={(items, cover) => {
                    setMediaItems(items);
                    setCoverMediaId(cover);
                    const coverAsset = items.find((i) => i.id === cover);
                    if (coverAsset?.media_type === "image") {
                      setForm((f) => ({ ...f, image_url: coverAsset.url }));
                    } else if (items.length === 0) {
                      setForm((f) => ({ ...f, image_url: "" }));
                    }
                  }}
                />
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Preço original (R$)</Label>
                  <Input type="number" min={0} step="0.01" value={form.original_price}
                    onChange={(e) => setForm({ ...form, original_price: parseFloat(e.target.value || "0") })} />
                </div>
                <div>
                  <Label>Preço promocional (R$)</Label>
                  <Input type="number" min={0} step="0.01" value={form.promo_price}
                    onChange={(e) => setForm({ ...form, promo_price: parseFloat(e.target.value || "0") })} required />
                </div>
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Formas de pagamento aceitas</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {PAYMENT_METHODS.map((m) => {
                    const checked = paymentMethods.includes(m.id);
                    const Icon = m.icon;
                    return (
                      <label
                        key={m.id}
                        className={`flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm transition-colors ${
                          checked ? "border-primary bg-primary/5" : "hover:border-primary/40"
                        }`}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => togglePayment(m.id)}
                        />
                        <Icon className="h-4 w-4 text-primary" />
                        <span>{m.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label>Outras condições (opcional)</Label>
                <Textarea
                  rows={2}
                  placeholder="Ex.: válido apenas na loja física, mediante agendamento..."
                  value={form.conditions}
                  onChange={(e) => setForm({ ...form, conditions: e.target.value })}
                />
              </div>
              <div>
                <Label>Validade</Label>
                <Input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} />
              </div>

              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <Label className="text-sm">Destacar oferta</Label>
                  <p className="text-xs text-muted-foreground">
                    {sub.featuredSlots > 0
                      ? `${sub.featuredCount}/${sub.featuredSlots} destaques usados`
                      : "Seu plano não inclui destaques"}
                  </p>
                </div>
                <Switch
                  checked={form.featured}
                  disabled={featureDisabled}
                  onCheckedChange={(v) => setForm({ ...form, featured: v })}
                />
              </div>

              <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <Zap className="mt-0.5 h-5 w-5 text-destructive" />
                    <div>
                      <Label className="text-sm">Oferta relâmpago</Label>
                      <p className="text-xs text-muted-foreground">
                        Mostra contagem regressiva visível e dispara alerta para seguidores ao publicar.
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={form.is_flash}
                    onCheckedChange={(v) =>
                      setForm({ ...form, is_flash: v, flash_duration_hours: v ? form.flash_duration_hours || flashDefaultHours : 2 })
                    }
                  />
                </div>
                {form.is_flash && (
                  <div className="mt-3 flex items-center gap-3">
                    <Label className="text-sm">Duração (horas)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={72}
                      className="w-24"
                      value={form.flash_duration_hours}
                      onChange={(e) =>
                        setForm({ ...form, flash_duration_hours: Math.max(1, Math.min(72, parseInt(e.target.value || "0") || flashDefaultHours)) })
                      }
                    />
                    <span className="text-xs text-muted-foreground">Padrão: {flashDefaultHours}h</span>
                  </div>
                )}
              </div>

              <div className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <RefreshCw className="mt-0.5 h-5 w-5 text-primary" />
                    <div>
                      <Label className="text-sm">Renovar automaticamente ao vencer</Label>
                      <p className="text-xs text-muted-foreground">
                        Estende a validade automaticamente quando expirar (até 6 ciclos).
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={form.auto_renew}
                    onCheckedChange={(v) => setForm({ ...form, auto_renew: v })}
                  />
                </div>
                {form.auto_renew && (
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <Label className="text-sm">Renovar por (dias)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      className="w-24"
                      value={form.auto_renew_days}
                      onChange={(e) =>
                        setForm({ ...form, auto_renew_days: Math.max(1, Math.min(30, parseInt(e.target.value || "0") || 7)) })
                      }
                    />
                    {form.auto_renew_count > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {form.auto_renew_count}/6 renovações usadas
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Agendamento (Destaque/Plus) */}
              <div className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-start gap-2">
                    {canSchedule ? (
                      <CalendarClock className="mt-0.5 h-5 w-5 text-primary" />
                    ) : (
                      <Lock className="mt-0.5 h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <Label className="text-sm">Agendar publicação</Label>
                      <p className="text-xs text-muted-foreground">
                        {canSchedule
                          ? `Envie com no mínimo ${scheduleSettings.minLeadHours}h e no máximo ${scheduleSettings.maxLeadDays} dias de antecedência. Análise em até ${scheduleSettings.slaHours}h.`
                          : "Disponível nos planos Destaque e Plus."}
                      </p>
                    </div>
                  </div>
                  {canSchedule ? (
                    <Switch
                      checked={form.is_scheduled}
                      onCheckedChange={(v) => setForm({ ...form, is_scheduled: v })}
                    />
                  ) : (
                    <Button asChild size="sm" variant="outline">
                      <Link to="/painel-lojista/assinatura">Fazer upgrade</Link>
                    </Button>
                  )}
                </div>
                {canSchedule && form.is_scheduled && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="text-sm">Início *</Label>
                      <Input
                        type="datetime-local"
                        value={form.scheduled_start_at}
                        onChange={(e) => setForm({ ...form, scheduled_start_at: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Fim (opcional)</Label>
                      <Input
                        type="datetime-local"
                        value={form.scheduled_end_at}
                        onChange={(e) => setForm({ ...form, scheduled_end_at: e.target.value })}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground sm:col-span-2">
                      A oferta entra em análise e é publicada automaticamente no horário marcado, desde que aprovada antes.
                    </p>
                  </div>
                )}
              </div>

              {!form.is_scheduled && (
                <p className="text-xs text-muted-foreground">
                  Validade mínima de {scheduleSettings.minValidityHours}h a partir do envio. SLA de análise: até {scheduleSettings.slaHours}h.
                </p>
              )}


              <div className="flex gap-3 pt-2">
                <Button type="submit" variant="accent" disabled={loading || blocked}>Salvar</Button>
                <Button type="button" variant="ghost" onClick={() => navigate("/painel-lojista")}>Cancelar</Button>
              </div>
            </form>

            {isEdit && offerStatus === "approved" && id && storeId && (
              <div className="mt-6 rounded-lg border bg-secondary/40 p-4">
                <div className="flex items-start gap-3">
                  <Bell className="mt-0.5 h-5 w-5 text-accent-strong" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">Avisar seguidores da loja</h3>
                    <p className="text-sm text-muted-foreground">
                      Envia uma notificação push para quem segue sua loja. Pode ser feito uma vez por oferta.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="accent"
                  className="mt-3"
                  disabled={notifyLoading}
                  onClick={async () => {
                    setNotifyLoading(true);
                    const { data, error } = await supabase.functions.invoke("notify-store-followers", {
                      body: {
                        store_id: storeId,
                        offer_id: id,
                        title: `Nova oferta: ${form.title}`,
                        body: form.description?.slice(0, 120) || "Confira agora no OfertasFly!",
                        url: `/oferta/${id}`,
                      },
                    });
                    setNotifyLoading(false);
                    if (error) {
                      const msg = (error as any).message || "";
                      if (msg.includes("already")) toast.error("Você já notificou seus seguidores sobre esta oferta.");
                      else toast.error(msg || "Falha ao enviar");
                      return;
                    }
                    toast.success(`Notificação enviada para ${data?.success ?? 0} seguidor(es).`);
                  }}
                >
                  <Bell className="h-4 w-4" /> Notificar seguidores agora
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
