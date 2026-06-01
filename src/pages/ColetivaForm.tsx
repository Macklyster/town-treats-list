import { useEffect, useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ImageUploader } from "@/components/site/ImageUploader";
import { GroupOfferTierEditor } from "@/components/site/GroupOfferTierEditor";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import {
  fetchActiveGroupOfferForStore,
  fetchGroupOfferById,
  type Tier,
  type GroupOffer,
} from "@/lib/group-offers-api";
import { Lock, Share2, Copy, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const tierSchema = z.object({
  min_people: z.number().int().min(1),
  price: z.number().min(0.01),
});

const schema = z.object({
  title: z.string().trim().min(3).max(140),
  category_slug: z.string().min(1),
  image_url: z.string().trim().url().max(500).optional().or(z.literal("")),
  original_price: z.number().min(0).max(999999),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  conditions: z.string().trim().max(500).optional().or(z.literal("")),
  duration_hours: z.number().int().min(1).max(168),
  tiers: z.array(tierSchema).min(1),
});

export default function ColetivaForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [storeId, setStoreId] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ slug: string; name: string }[]>([]);
  const [activeOther, setActiveOther] = useState<GroupOffer | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedToken, setSavedToken] = useState<string | null>(null);
  const sub = useSubscription(storeId);

  const isPlus = !!sub.subscription && ["active", "trialing"].includes(sub.subscription.status) && (sub.plan?.slug === "plus");

  const [form, setForm] = useState({
    title: "",
    category_slug: "",
    image_url: "",
    original_price: 0,
    description: "",
    conditions: "",
    duration_hours: 12,
    tiers: [{ min_people: 1, price: 0 }] as Tier[],
  });

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data: stores } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", user.id)
        .limit(1);
      const sid = stores?.[0]?.id ?? null;
      setStoreId(sid);

      const { data: cats } = await supabase
        .from("categories")
        .select("slug,name")
        .order("sort_order");
      setCategories((cats ?? []) as any);

      if (sid) {
        if (isEdit && id) {
          const existing = await fetchGroupOfferById(id);
          if (existing && existing.store_id === sid) {
            setForm({
              title: existing.title,
              category_slug: existing.category_slug,
              image_url: existing.image_url ?? "",
              original_price: Number(existing.original_price) || 0,
              description: existing.description ?? "",
              conditions: existing.conditions ?? "",
              duration_hours: existing.duration_hours,
              tiers: existing.tiers,
            });
            setSavedToken(existing.share_token);
          }
        } else {
          const active = await fetchActiveGroupOfferForStore(sid);
          if (active) setActiveOther(active);
        }
      }
      setLoaded(true);
    })();
  }, [user?.id, id, isEdit]);

  const handleSave = async () => {
    if (!storeId) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Preencha os campos corretamente");
      return;
    }
    setSaving(true);
    const payload = {
      ...parsed.data,
      store_id: storeId,
      image_url: parsed.data.image_url || null,
      description: parsed.data.description || null,
      conditions: parsed.data.conditions || null,
    };
    let resultId = id;
    let resultToken = savedToken;
    if (isEdit && id) {
      const { error } = await supabase.from("group_offers" as any).update(payload as any).eq("id", id);
      if (error) {
        setSaving(false);
        toast.error(error.message);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("group_offers" as any)
        .insert(payload as any)
        .select("id, share_token")
        .single();
      if (error) {
        setSaving(false);
        toast.error(error.message);
        return;
      }
      resultId = (data as any).id;
      resultToken = (data as any).share_token;
      setSavedToken(resultToken);
    }
    setSaving(false);
    toast.success("Coletiva salva! Aguarde aprovação para começar.");
    if (!isEdit && resultId) navigate(`/painel-lojista/coletiva/${resultId}`, { replace: true });
  };

  const shareUrl = savedToken ? `${window.location.origin}/coletiva/${savedToken}` : "";

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
              Você precisa cadastrar sua loja antes de criar uma coletiva.{" "}
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
                <strong>OfertasFly Coletiva</strong> é a compra coletiva viral no WhatsApp:
                quanto mais amigos entram, menor o preço para todos. Faça o upgrade para o plano Plus
                para liberar este recurso.
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
            <CardHeader>
              <CardTitle>Você já tem uma coletiva ativa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                "{activeOther.title}" — {activeOther.status === "approved" ? "ativa" : "aguardando aprovação"}.
                É permitida apenas <strong>1 coletiva ativa por loja</strong>. Encerre ou exclua a atual antes de criar outra.
              </p>
              <div className="flex gap-2">
                <Button asChild variant="accent">
                  <Link to={`/painel-lojista/coletiva/${activeOther.id}`}>Ver coletiva atual</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/painel-lojista">Voltar ao painel</Link>
                </Button>
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
              <h1 className="text-display text-foreground">
                {isEdit ? "Editar coletiva" : "Nova coletiva"}
              </h1>
              <Badge variant="secondary">Plus</Badge>
            </div>
            <p className="text-muted-foreground">
              Compra coletiva: o preço cai conforme mais pessoas entram, e todos pagam o último tier alcançado.
            </p>
          </div>

          {savedToken && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" /> Link compartilhável
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
                        `https://wa.me/?text=${encodeURIComponent(`Vem comigo nessa coletiva: ${shareUrl}`)}`,
                        "_blank",
                      )
                    }
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  A coletiva fica visível no link após aprovação. Compartilhe com seus clientes!
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Detalhes da oferta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Ex: Corte + barba — coletiva surpresa"
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Categoria *</Label>
                  <Select
                    value={form.category_slug}
                    onValueChange={(v) => setForm((f) => ({ ...f, category_slug: v }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="original_price">Preço de tabela (R$, riscado)</Label>
                  <Input
                    id="original_price"
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.original_price}
                    onChange={(e) => setForm((f) => ({ ...f, original_price: Number(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <ImageUploader
                value={form.image_url}
                onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
                storeId={storeId}
                bucket="offer-images"
                label="Imagem da oferta"
              />
              <div className="grid gap-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="conditions">Condições</Label>
                <Textarea
                  id="conditions"
                  rows={2}
                  value={form.conditions}
                  onChange={(e) => setForm((f) => ({ ...f, conditions: e.target.value }))}
                  placeholder="Ex: Mediante agendamento. Válido por 30 dias após o fechamento da coletiva."
                />
              </div>
              <div className="grid gap-2 max-w-xs">
                <Label htmlFor="duration_hours">Duração da campanha (horas)</Label>
                <Input
                  id="duration_hours"
                  type="number"
                  min={1}
                  max={168}
                  step={1}
                  value={form.duration_hours}
                  onChange={(e) => setForm((f) => ({ ...f, duration_hours: Number(e.target.value) || 12 }))}
                />
                <p className="text-xs text-muted-foreground">Padrão 12h. Aceita de 1 a 168 horas.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Faixas de preço</CardTitle>
            </CardHeader>
            <CardContent>
              <GroupOfferTierEditor
                value={form.tiers}
                onChange={(tiers) => setForm((f) => ({ ...f, tiers }))}
                originalPrice={form.original_price}
              />
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} variant="accent">
              {saving ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar coletiva"}
            </Button>
            <Button variant="ghost" onClick={() => navigate("/painel-lojista")}>Cancelar</Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
