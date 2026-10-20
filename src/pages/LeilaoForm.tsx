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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ImageUploader } from "@/components/site/ImageUploader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useManagedStore } from "@/hooks/useManagedStore";
import { useSubscription } from "@/hooks/useSubscription";
import {
  fetchActiveAuctionForStore,
  fetchAuctionById,
  formatBRL,
  type AuctionOffer,
} from "@/lib/auction-api";
import { Lock, Share2, Copy, MessageCircle, TrendingDown } from "lucide-react";

const schema = z.object({
  title: z.string().trim().min(3).max(140),
  category_slug: z.string().min(1),
  image_url: z.string().trim().url().max(500).optional().or(z.literal("")),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  conditions: z.string().trim().max(500).optional().or(z.literal("")),
  starting_price: z.number().min(0.01),
  min_price: z.number().min(0.01),
  decrement_amount: z.number().min(0.01),
  decrement_interval_minutes: z.number().int().min(5).max(1440),
  total_quantity: z.number().int().min(1).max(9999),
});

export default function LeilaoForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const ms = useManagedStore();
  const isEdit = !!id;

  const [storeId, setStoreId] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ slug: string; name: string }[]>([]);
  const [activeOther, setActiveOther] = useState<AuctionOffer | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedToken, setSavedToken] = useState<string | null>(null);
  const sub = useSubscription(storeId);
  const isPlus = !!sub.subscription && ["active", "trialing"].includes(sub.subscription.status) && sub.plan?.slug === "plus";

  const [form, setForm] = useState({
    title: "",
    category_slug: "",
    image_url: "",
    description: "",
    conditions: "",
    starting_price: 0,
    min_price: 0,
    decrement_amount: 5,
    decrement_interval_minutes: 60,
    total_quantity: 1,
  });

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data: stores } = await supabase
        .from("stores")
        .select("id")
        .eq(ms.managedStoreId ? "id" : "owner_id", ms.managedStoreId ?? user!.id)
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
          const existing = await fetchAuctionById(id);
          if (existing && existing.store_id === sid) {
            setForm({
              title: existing.title,
              category_slug: existing.category_slug,
              image_url: existing.image_url ?? "",
              description: existing.description ?? "",
              conditions: existing.conditions ?? "",
              starting_price: Number(existing.starting_price),
              min_price: Number(existing.min_price),
              decrement_amount: Number(existing.decrement_amount),
              decrement_interval_minutes: existing.decrement_interval_minutes,
              total_quantity: existing.total_quantity,
            });
            setSavedToken(existing.share_token);
          }
        } else {
          const active = await fetchActiveAuctionForStore(sid);
          if (active) setActiveOther(active);
        }
      }
      setLoaded(true);
    })();
  }, [user?.id, id, isEdit]);

  const ladder = useMemo(() => {
    if (form.starting_price <= form.min_price || form.decrement_amount <= 0) return [];
    const steps: { hour: number; price: number }[] = [];
    let p = form.starting_price;
    let i = 0;
    while (p > form.min_price && i < 60) {
      steps.push({ hour: i, price: p });
      p = Math.max(form.min_price, p - form.decrement_amount);
      i++;
    }
    steps.push({ hour: i, price: form.min_price });
    return steps;
  }, [form.starting_price, form.min_price, form.decrement_amount]);

  const totalMinutes = Math.max(0, ladder.length - 1) * form.decrement_interval_minutes;

  const handleSave = async () => {
    if (!storeId) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Preencha os campos corretamente");
      return;
    }
    if (parsed.data.min_price >= parsed.data.starting_price) {
      toast.error("O preço mínimo deve ser menor que o preço inicial");
      return;
    }
    setSaving(true);
    const payload = {
      ...parsed.data,
      store_id: storeId,
      ...ms.adminExtra,
      image_url: parsed.data.image_url || null,
      description: parsed.data.description || null,
      conditions: parsed.data.conditions || null,
    };
    let resultId = id;
    let resultToken = savedToken;
    if (isEdit && id) {
      const { error } = await supabase.from("auction_offers" as any).update(payload as any).eq("id", id);
      if (error) {
        setSaving(false);
        toast.error(error.message);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("auction_offers" as any)
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
    toast.success("Leilão salvo! Aguarde aprovação.");
    if (!isEdit && resultId) navigate(`${ms.base}/leilao/${resultId}`, { replace: true });
  };

  const shareUrl = savedToken ? `${window.location.origin}/leilao/${savedToken}` : "";

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
              Você precisa cadastrar sua loja antes de criar um leilão.{" "}
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
      <div className="flex min-h-screen flex-col bg-background">
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
                <strong>Leilão de Oferta</strong> é o leilão reverso: o preço cai com o tempo até alguém reservar.
                Faça o upgrade para o plano Plus para liberar este recurso.
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
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="container flex-1 py-10">
          <Card className="mx-auto max-w-xl">
            <CardHeader>
              <CardTitle>Você já tem um leilão ativo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                "{activeOther.title}" — {activeOther.status === "approved" ? "ativo" : "aguardando aprovação"}.
                É permitido apenas <strong>1 leilão ativo por loja</strong>. Encerre ou exclua o atual antes de criar outro.
              </p>
              <div className="flex gap-2">
                <Button asChild variant="accent">
                  <Link to={`${ms.base}/leilao/${activeOther.id}`}>Ver leilão atual</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to={ms.back}>Voltar ao painel</Link>
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
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container flex-1 py-10">
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-display text-foreground">{isEdit ? "Editar leilão" : "Novo leilão"}</h1>
              <Badge variant="secondary">Plus</Badge>
            </div>
            <p className="text-muted-foreground">
              Leilão reverso: o preço cai automaticamente até alguém reservar. Quem espera mais paga menos —
              quem reservar primeiro garante o item.
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
                  <Button variant="outline" onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success("Link copiado!"); }}>
                    <Copy className="h-4 w-4" /> Copiar
                  </Button>
                  <Button variant="accent" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Leilão relâmpago: ${shareUrl}`)}`, "_blank")}>
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">O leilão fica visível após aprovação.</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Detalhes</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Título *</Label>
                <Input id="title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Ex: Última pizza do dia" />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Categoria *</Label>
                  <Select value={form.category_slug} onValueChange={(v) => setForm((f) => ({ ...f, category_slug: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="total_quantity">Quantidade de itens *</Label>
                  <Input id="total_quantity" type="number" min={1} step={1}
                    value={form.total_quantity}
                    onChange={(e) => setForm((f) => ({ ...f, total_quantity: Math.max(1, parseInt(e.target.value || "1") || 1) }))}
                  />
                  <p className="text-xs text-muted-foreground">Cada cliente reserva 1 unidade. O leilão encerra ao esgotar.</p>
                </div>
              </div>
              <ImageUploader
                value={form.image_url}
                onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
                storeId={storeId}
                bucket="offer-images"
                label="Imagem"
              />
              <div className="grid gap-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea id="description" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="conditions">Condições</Label>
                <Textarea id="conditions" rows={2} value={form.conditions} onChange={(e) => setForm((f) => ({ ...f, conditions: e.target.value }))} placeholder="Ex: Retirada na loja em até 1h." />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Preço dinâmico</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="starting_price">Preço inicial (R$) *</Label>
                  <Input id="starting_price" type="number" min={0.01} step={0.01}
                    value={form.starting_price}
                    onChange={(e) => setForm((f) => ({ ...f, starting_price: Number(e.target.value) || 0 }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="min_price">Preço mínimo (R$) *</Label>
                  <Input id="min_price" type="number" min={0.01} step={0.01}
                    value={form.min_price}
                    onChange={(e) => setForm((f) => ({ ...f, min_price: Number(e.target.value) || 0 }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="decrement_amount">Decremento por ciclo (R$) *</Label>
                  <Input id="decrement_amount" type="number" min={0.01} step={0.01}
                    value={form.decrement_amount}
                    onChange={(e) => setForm((f) => ({ ...f, decrement_amount: Number(e.target.value) || 0 }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="decrement_interval_minutes">Intervalo (minutos) *</Label>
                  <Input id="decrement_interval_minutes" type="number" min={5} max={1440} step={1}
                    value={form.decrement_interval_minutes}
                    onChange={(e) => setForm((f) => ({ ...f, decrement_interval_minutes: parseInt(e.target.value || "60") || 60 }))}
                  />
                  <p className="text-xs text-muted-foreground">Mínimo 5 min.</p>
                </div>
              </div>

              {ladder.length > 1 && (
                <div className="rounded-md border bg-muted/30 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <TrendingDown className="h-4 w-4 text-primary" />
                    Pré-visualização da queda de preço
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3 md:grid-cols-4">
                    {ladder.slice(0, 12).map((s, i) => (
                      <div key={i} className="flex items-center justify-between rounded bg-background px-2 py-1">
                        <span className="text-xs text-muted-foreground">
                          {s.hour === 0 ? "Início" : `+${s.hour * form.decrement_interval_minutes}min`}
                        </span>
                        <span className="font-semibold">{formatBRL(s.price)}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Tempo total estimado até o mínimo: <strong>{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}min</strong> •{" "}
                    Quantidade ofertada: <strong>{form.total_quantity} unidade{form.total_quantity > 1 ? "s" : ""}</strong>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} variant="accent">
              {saving ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar leilão"}
            </Button>
            <Button variant="ghost" onClick={() => navigate(ms.back)}>Cancelar</Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
