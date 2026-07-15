import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ImageUploader } from "@/components/site/ImageUploader";
import { LocationPicker } from "@/components/site/LocationPicker";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Lock, Share2, Copy, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  EVENT_KINDS,
  fetchEventById,
  slugifyTitle,
  type EventKind,
} from "@/lib/events-api";

const schema = z.object({
  title: z.string().trim().min(3).max(120),
  kind: z.enum(["happy_hour", "show", "feira", "evento", "promocao"]),
  category_slug: z.string().optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  venue: z.string().trim().max(200).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  price_info: z.string().trim().max(120).optional().or(z.literal("")),
  link_url: z
    .string()
    .trim()
    .max(500)
    .refine((v) => !v || /^https?:\/\//.test(v), "URL deve começar com http(s)://")
    .optional()
    .or(z.literal("")),
  image_url: z.string().optional().or(z.literal("")),
  cover_url: z.string().optional().or(z.literal("")),
  starts_at: z.string().min(1, "Selecione data de início"),
  ends_at: z.string().min(1, "Selecione data de término"),
});

export default function EventoForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeInfo, setStoreInfo] = useState<{ city: string; state: string } | null>(null);
  const [categories, setCategories] = useState<{ slug: string; name: string }[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const sub = useSubscription(storeId);
  const isPremium =
    !!sub.subscription &&
    ["active", "trialing"].includes(sub.subscription.status) &&
    (sub.plan?.slug === "plus" || sub.plan?.slug === "destaque");

  const [form, setForm] = useState({
    title: "",
    kind: "evento" as EventKind,
    category_slug: "",
    description: "",
    venue: "",
    address: "",
    price_info: "",
    link_url: "",
    image_url: "",
    cover_url: "",
    starts_at: "",
    ends_at: "",
  });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);


  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data: stores } = await supabase
        .from("stores")
        .select("id,city,state")
        .eq("owner_id", user.id)
        .limit(1);
      const s = stores?.[0];
      setStoreId(s?.id ?? null);
      setStoreInfo(s ? { city: s.city, state: s.state } : null);
      const { data: cats } = await supabase.from("categories").select("slug,name").order("sort_order");
      setCategories((cats ?? []) as any);

      if (isEdit && id) {
        const existing = await fetchEventById(id);
        if (existing && (!s || existing.store_id === s.id)) {
          setForm({
            title: existing.title,
            kind: existing.kind,
            category_slug: existing.category_slug ?? "",
            description: existing.description ?? "",
            venue: existing.venue ?? "",
            address: existing.address ?? "",
            price_info: existing.price_info ?? "",
            link_url: existing.link_url ?? "",
            image_url: existing.image_url ?? "",
            cover_url: existing.cover_url ?? "",
            starts_at: existing.starts_at.slice(0, 16),
            ends_at: existing.ends_at.slice(0, 16),
          });
          setSavedSlug(existing.slug);
        }
      }
      setLoaded(true);
    })();
  }, [user?.id, id, isEdit]);

  const shareUrl = useMemo(
    () => (savedSlug ? `${window.location.origin}/evento/${savedSlug}` : ""),
    [savedSlug],
  );

  const handleSave = async () => {
    if (!storeId || !storeInfo) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Preencha os campos corretamente");
      return;
    }
    const starts = new Date(parsed.data.starts_at);
    const ends = new Date(parsed.data.ends_at);
    if (ends <= starts) {
      toast.error("A data de término deve ser posterior ao início.");
      return;
    }
    setSaving(true);
    const payload: any = {
      store_id: storeId,
      title: parsed.data.title,
      kind: parsed.data.kind,
      category_slug: parsed.data.category_slug || null,
      description: parsed.data.description || null,
      venue: parsed.data.venue || null,
      address: parsed.data.address || null,
      price_info: parsed.data.price_info || null,
      link_url: parsed.data.link_url || null,
      image_url: parsed.data.image_url || null,
      cover_url: parsed.data.cover_url || parsed.data.image_url || null,
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
      city: storeInfo.city,
      state: storeInfo.state,
      slug: slugifyTitle(parsed.data.title) + "-" + Math.random().toString(36).slice(2, 8),
    };
    if (isEdit && id) {
      delete payload.slug;
      const { error, data } = await supabase
        .from("events" as any)
        .update(payload)
        .eq("id", id)
        .select("slug")
        .single();
      setSaving(false);
      if (error) return toast.error(error.message);
      setSavedSlug((data as any)?.slug ?? savedSlug);
      toast.success("Evento atualizado!");
    } else {
      const { error, data } = await supabase
        .from("events" as any)
        .insert(payload)
        .select("id,slug")
        .single();
      setSaving(false);
      if (error) return toast.error(error.message);
      setSavedSlug((data as any).slug);
      toast.success("Evento enviado para aprovação!");
      navigate(`/painel-lojista/evento/${(data as any).id}`, { replace: true });
    }
  };

  if (!loaded || sub.loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container flex-1 py-10">
          <p className="text-muted-foreground">Carregando…</p>
        </main>
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
              Você precisa cadastrar sua loja antes de criar eventos.{" "}
              <Link to="/painel-lojista/loja" className="underline">
                Cadastrar loja
              </Link>
            </AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="container flex-1 py-10">
          <Card className="mx-auto max-w-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" /> Recurso dos planos Destaque e Plus
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Publique <strong>Eventos</strong> — shows, happy hours, feiras e experiências. Notificamos
                automaticamente seus seguidores e os usuários da sua cidade. Faça upgrade para liberar.
              </p>
              <Button asChild variant="accent">
                <Link to="/painel-lojista/assinatura">Ver planos</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container flex-1 py-10">
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-3xl font-medium tracking-tight text-foreground">
                {isEdit ? "Editar evento" : "Novo evento"}
              </h1>
              <Badge variant="secondary">Destaque · Plus</Badge>
            </div>
            <p className="text-muted-foreground">
              Divulgue shows, happy hours, feiras e experiências. Notificamos seguidores e usuários da sua
              cidade quando o evento for aprovado.
            </p>
          </div>

          {savedSlug && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" /> Link do evento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input value={shareUrl} readOnly />
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(shareUrl);
                      toast.success("Link copiado!");
                    }}
                  >
                    <Copy className="h-4 w-4" /> Copiar
                  </Button>
                  <Button
                    variant="accent"
                    onClick={() =>
                      window.open(
                        `https://wa.me/?text=${encodeURIComponent(`Vem para: ${shareUrl}`)}`,
                        "_blank",
                      )
                    }
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Após aprovação, o evento fica público neste link.
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Informações principais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Ex: Happy Hour com música ao vivo"
                  maxLength={120}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Tipo de evento *</Label>
                  <Select
                    value={form.kind}
                    onValueChange={(v) => setForm((f) => ({ ...f, kind: v as EventKind }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_KINDS.map((k) => (
                        <SelectItem key={k.value} value={k.value}>
                          {k.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Categoria (opcional)</Label>
                  <Select
                    value={form.category_slug || "none"}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, category_slug: v === "none" ? "" : v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.slug} value={c.slug}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Detalhes do evento, atrações, condições…"
                  maxLength={2000}
                />
              </div>
              <ImageUploader
                value={form.image_url}
                onChange={(url) => setForm((f) => ({ ...f, image_url: url, cover_url: f.cover_url || url }))}
                storeId={storeId}
                bucket="offer-images"
                label="Imagem do evento"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data e local</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="starts_at">Início *</Label>
                  <Input
                    id="starts_at"
                    type="datetime-local"
                    value={form.starts_at}
                    onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ends_at">Término *</Label>
                  <Input
                    id="ends_at"
                    type="datetime-local"
                    value={form.ends_at}
                    onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="venue">Local (nome)</Label>
                  <Input
                    id="venue"
                    value={form.venue}
                    onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
                    placeholder="Ex: Bar da Praça"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price_info">Ingresso / preço</Label>
                  <Input
                    id="price_info"
                    value={form.price_info}
                    onChange={(e) => setForm((f) => ({ ...f, price_info: e.target.value }))}
                    placeholder="Ex: Gratuito · Couvert R$ 20"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="Rua, número, bairro"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="link_url">Link (ingressos, Instagram, site)</Label>
                <Input
                  id="link_url"
                  value={form.link_url}
                  onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))}
                  placeholder="https://…"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} variant="accent">
              {saving ? "Salvando…" : isEdit ? "Salvar alterações" : "Criar evento"}
            </Button>
            <Button variant="ghost" onClick={() => navigate("/painel-lojista")}>
              Cancelar
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
