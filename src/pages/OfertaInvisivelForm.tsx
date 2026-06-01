import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ImageUploader } from "@/components/site/ImageUploader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import {
  fetchActiveGeoOfferForStore,
  fetchGeoOfferById,
  formatBRL,
  getCurrentPosition,
  type GeoOffer,
} from "@/lib/geo-offer-api";
import { Lock, MapPin, Crosshair, ExternalLink, Copy, MessageCircle } from "lucide-react";

const schema = z.object({
  title: z.string().trim().min(3).max(140),
  category_slug: z.string().min(1),
  image_url: z.string().trim().url().max(500).optional().or(z.literal("")),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  conditions: z.string().trim().max(500).optional().or(z.literal("")),
  original_price: z.number().min(0.01),
  promo_price: z.number().min(0.01),
  center_lat: z.number().refine((v) => v >= -90 && v <= 90, "latitude inválida"),
  center_lng: z.number().refine((v) => v >= -180 && v <= 180, "longitude inválida"),
  radius_meters: z.number().int().min(50).max(5000),
  time_start: z.string(),
  time_end: z.string(),
  valid_from: z.string(),
  valid_until: z.string().optional().or(z.literal("")),
});

export default function OfertaInvisivelForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeData, setStoreData] = useState<{ latitude: number | null; longitude: number | null; address: string | null } | null>(null);
  const [categories, setCategories] = useState<{ slug: string; name: string }[]>([]);
  const [activeOther, setActiveOther] = useState<GeoOffer | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedToken, setSavedToken] = useState<string | null>(null);
  const sub = useSubscription(storeId);
  const isPlus = !!sub.subscription && ["active", "trialing"].includes(sub.subscription.status) && sub.plan?.slug === "plus";

  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    title: "",
    category_slug: "",
    image_url: "",
    description: "",
    conditions: "",
    original_price: 0,
    promo_price: 0,
    center_lat: 0,
    center_lng: 0,
    radius_meters: 300,
    time_start: "10:00",
    time_end: "22:00",
    valid_from: today,
    valid_until: "",
  });

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data: stores } = await supabase
        .from("stores")
        .select("id, latitude, longitude, address")
        .eq("owner_id", user.id)
        .limit(1);
      const sid = stores?.[0]?.id ?? null;
      setStoreId(sid);
      if (stores?.[0]) {
        setStoreData({
          latitude: stores[0].latitude as number | null,
          longitude: stores[0].longitude as number | null,
          address: stores[0].address as string | null,
        });
      }

      const { data: cats } = await supabase
        .from("categories")
        .select("slug,name")
        .order("sort_order");
      setCategories((cats ?? []) as any);

      if (sid) {
        if (isEdit && id) {
          const existing = await fetchGeoOfferById(id);
          if (existing && existing.store_id === sid) {
            setForm({
              title: existing.title,
              category_slug: existing.category_slug,
              image_url: existing.image_url ?? "",
              description: existing.description ?? "",
              conditions: existing.conditions ?? "",
              original_price: Number(existing.original_price),
              promo_price: Number(existing.promo_price),
              center_lat: Number(existing.center_lat),
              center_lng: Number(existing.center_lng),
              radius_meters: existing.radius_meters,
              time_start: (existing.time_start ?? "10:00:00").slice(0, 5),
              time_end: (existing.time_end ?? "22:00:00").slice(0, 5),
              valid_from: existing.valid_from,
              valid_until: existing.valid_until ?? "",
            });
            setSavedToken(existing.share_token);
          }
        } else {
          const active = await fetchActiveGeoOfferForStore(sid);
          if (active) setActiveOther(active);
          // Pré-preencher com a localização da loja
          if (stores?.[0]?.latitude && stores?.[0]?.longitude) {
            setForm((f) => ({
              ...f,
              center_lat: Number(stores[0].latitude),
              center_lng: Number(stores[0].longitude),
            }));
          }
        }
      }
      setLoaded(true);
    })();
  }, [user?.id, id, isEdit]);

  const useStoreLocation = () => {
    if (!storeData?.latitude || !storeData?.longitude) {
      toast.error("Sua loja não tem coordenadas. Edite a loja para definir endereço.");
      return;
    }
    setForm((f) => ({ ...f, center_lat: storeData.latitude!, center_lng: storeData.longitude! }));
    toast.success("Coordenadas da loja aplicadas");
  };

  const useMyLocation = async () => {
    try {
      const pos = await getCurrentPosition();
      setForm((f) => ({ ...f, center_lat: pos.coords.latitude, center_lng: pos.coords.longitude }));
      toast.success("Localização atual aplicada");
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível obter sua localização");
    }
  };

  const mapsLink = useMemo(
    () => form.center_lat && form.center_lng
      ? `https://www.google.com/maps/search/?api=1&query=${form.center_lat},${form.center_lng}`
      : null,
    [form.center_lat, form.center_lng],
  );

  const handleSave = async () => {
    if (!storeId) return;
    const payload = { ...form, valid_until: form.valid_until || undefined };
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Preencha os campos corretamente");
      return;
    }
    if (parsed.data.promo_price >= parsed.data.original_price) {
      toast.error("O preço promocional deve ser menor que o original");
      return;
    }
    if (parsed.data.time_end <= parsed.data.time_start) {
      toast.error("O horário final deve ser maior que o inicial");
      return;
    }
    setSaving(true);
    const dbPayload: any = {
      ...parsed.data,
      store_id: storeId,
      image_url: parsed.data.image_url || null,
      description: parsed.data.description || null,
      conditions: parsed.data.conditions || null,
      valid_until: parsed.data.valid_until || null,
    };
    let resultId = id;
    let resultToken = savedToken;
    if (isEdit && id) {
      const { error } = await supabase.from("geo_offers" as any).update(dbPayload).eq("id", id);
      if (error) { setSaving(false); toast.error(error.message); return; }
    } else {
      const { data, error } = await supabase
        .from("geo_offers" as any)
        .insert(dbPayload)
        .select("id, share_token")
        .single();
      if (error) { setSaving(false); toast.error(error.message); return; }
      resultId = (data as any).id;
      resultToken = (data as any).share_token;
      setSavedToken(resultToken);
    }
    setSaving(false);
    toast.success("Oferta invisível salva! Aguarde aprovação.");
    if (!isEdit && resultId) navigate(`/painel-lojista/oferta-invisivel/${resultId}`, { replace: true });
  };

  const shareUrl = savedToken ? `${window.location.origin}/oferta-invisivel/${savedToken}` : "";

  if (!loaded || sub.loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container flex-1 py-10"><p className="text-muted-foreground">Carregando…</p></main>
        <Footer />
      </div>
    );
  }

  if (!storeId) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container flex-1 py-10">
          <Alert>
            <AlertTitle>Cadastre sua loja</AlertTitle>
            <AlertDescription>
              Você precisa cadastrar sua loja antes de criar uma oferta invisível.{" "}
              <Link to="/painel-lojista/loja" className="underline">Cadastrar loja</Link>
            </AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isPlus) {
    return (
      <div className="flex min-h-screen flex-col bg-muted/20">
        <Header />
        <main className="container flex-1 py-10">
          <Card className="mx-auto max-w-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" /> Recurso exclusivo do plano Plus
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                <strong>Oferta Invisível</strong> só aparece para o cliente quando ele entra no raio que você definir.
                Faça o upgrade para o plano Plus para liberar.
              </p>
              <Button asChild variant="accent">
                <Link to="/painel-lojista/assinatura">Conhecer o plano Plus</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isEdit && activeOther) {
    return (
      <div className="flex min-h-screen flex-col bg-muted/20">
        <Header />
        <main className="container flex-1 py-10">
          <Card className="mx-auto max-w-xl">
            <CardHeader><CardTitle>Você já tem uma oferta invisível ativa</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                "{activeOther.title}" — {activeOther.status === "approved" ? "ativa" : "aguardando aprovação"}.
                É permitida apenas <strong>1 oferta invisível ativa por loja</strong>.
              </p>
              <div className="flex gap-2">
                <Button asChild variant="accent"><Link to={`/painel-lojista/oferta-invisivel/${activeOther.id}`}>Ver oferta atual</Link></Button>
                <Button asChild variant="outline"><Link to="/painel-lojista">Voltar ao painel</Link></Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <Header />
      <main className="container flex-1 py-10">
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-display text-foreground">{isEdit ? "Editar oferta invisível" : "Nova oferta invisível"}</h1>
              <Badge variant="secondary">Plus</Badge>
            </div>
            <p className="text-muted-foreground">
              A oferta só aparece quando o cliente entrar no raio que você definir, dentro da janela de horário.
            </p>
          </div>

          <Card>
            <CardHeader><CardTitle>Conteúdo da oferta</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Título</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={140} />
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Select value={form.category_slug} onValueChange={(v) => setForm({ ...form, category_slug: v })}>
                    <SelectTrigger><SelectValue placeholder="Escolha…" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Imagem</Label>
                  <ImageUploader value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url ?? "" })} storeId={storeId} bucket="offer-images" label="Imagem" />
                </div>
                <div>
                  <Label>Preço original (R$)</Label>
                  <Input type="number" step="0.01" min={0} value={form.original_price || ""} onChange={(e) => setForm({ ...form, original_price: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label>Preço promocional (R$)</Label>
                  <Input type="number" step="0.01" min={0} value={form.promo_price || ""} onChange={(e) => setForm({ ...form, promo_price: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Descrição</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Condições / regras</Label>
                  <Textarea value={form.conditions} onChange={(e) => setForm({ ...form, conditions: e.target.value })} rows={2} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Geolocalização</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={useStoreLocation}><MapPin className="h-4 w-4" /> Usar endereço da loja</Button>
                <Button type="button" variant="outline" size="sm" onClick={useMyLocation}><Crosshair className="h-4 w-4" /> Usar minha localização atual</Button>
                {mapsLink && (
                  <Button asChild variant="ghost" size="sm">
                    <a href={mapsLink} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /> Ver no mapa</a>
                  </Button>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Latitude</Label>
                  <Input type="number" step="any" value={form.center_lat || ""} onChange={(e) => setForm({ ...form, center_lat: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label>Longitude</Label>
                  <Input type="number" step="any" value={form.center_lng || ""} onChange={(e) => setForm({ ...form, center_lng: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label>Raio de atuação</Label>
                  <span className="text-sm font-medium tabular-nums">{form.radius_meters} m</span>
                </div>
                <Slider min={50} max={5000} step={50} value={[form.radius_meters]} onValueChange={(v) => setForm({ ...form, radius_meters: v[0] })} />
                <p className="mt-1 text-xs text-muted-foreground">Entre 50 e 5000 metros. O cliente só verá a oferta dentro deste raio.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Janela de exibição</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Horário inicial</Label>
                <Input type="time" value={form.time_start} onChange={(e) => setForm({ ...form, time_start: e.target.value })} />
              </div>
              <div>
                <Label>Horário final</Label>
                <Input type="time" value={form.time_end} onChange={(e) => setForm({ ...form, time_end: e.target.value })} />
              </div>
              <div>
                <Label>Válida a partir de</Label>
                <Input type="date" value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} />
              </div>
              <div>
                <Label>Válida até (opcional)</Label>
                <Input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} />
              </div>
            </CardContent>
          </Card>

          {savedToken && (
            <Alert>
              <AlertTitle>Link da oferta</AlertTitle>
              <AlertDescription className="flex flex-wrap items-center gap-2 break-all">
                <code className="text-xs">{shareUrl}</code>
                <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success("Link copiado!"); }}>
                  <Copy className="h-3.5 w-3.5" /> Copiar
                </Button>
                <Button size="sm" variant="outline" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Tem uma oferta secreta perto de você: ${shareUrl}`)}`, "_blank")}>
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" asChild><Link to="/painel-lojista">Cancelar</Link></Button>
            <Button onClick={handleSave} disabled={saving} variant="accent">{saving ? "Salvando…" : "Salvar oferta invisível"}</Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
