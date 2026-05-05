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
import { AlertCircle } from "lucide-react";
import { ImageUploader } from "@/components/site/ImageUploader";
import { Checkbox } from "@/components/ui/checkbox";
import { PAYMENT_METHODS, type PaymentMethodId, parseConditions, buildConditions } from "@/lib/payment-methods";

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
});

export default function OfertaForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [storeId, setStoreId] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ slug: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const sub = useSubscription(storeId);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodId[]>([]);
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
  });

  const togglePayment = (id: PaymentMethodId) =>
    setPaymentMethods((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );

  useEffect(() => {
    (async () => {
      const [{ data: cats }, { data: stores }] = await Promise.all([
        supabase.from("categories").select("slug,name").order("sort_order"),
        supabase.from("stores").select("id").eq("owner_id", user!.id).limit(1),
      ]);
      setCategories(cats ?? []);
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
          setForm({
            title: data.title,
            category_slug: data.category_slug,
            type: data.type,
            image_url: data.image_url ?? "",
            original_price: Number(data.original_price),
            promo_price: Number(data.promo_price),
            description: data.description ?? "",
            conditions: data.conditions ?? "",
            valid_until: data.valid_until ?? "",
            featured: !!data.featured,
          });
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
    if (!storeId) return;
    if (!sub.isActive) {
      toast.error("Você precisa de uma assinatura ativa para publicar ofertas.");
      return;
    }
    if (!isEdit && sub.offerCount >= sub.maxOffers) {
      toast.error(`Limite do plano atingido (${sub.maxOffers} ofertas).`);
      return;
    }
    if (form.featured && !isEdit && sub.featuredCount >= sub.featuredSlots) {
      toast.error(`Seu plano permite apenas ${sub.featuredSlots} oferta(s) em destaque.`);
      return;
    }
    setLoading(true);
    const payload = {
      ...form,
      store_id: storeId,
      valid_until: form.valid_until || null,
      status: "pending" as const,
    };
    const { error } = isEdit
      ? await supabase.from("offers").update(payload).eq("id", id!)
      : await supabase.from("offers").insert(payload);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(isEdit ? "Oferta atualizada" : "Oferta enviada para aprovação");
    navigate("/painel-lojista");
  };

  const featureDisabled = !sub.isActive || sub.featuredSlots === 0 || (!isEdit && !sub.canFeature && !form.featured);
  const blocked = !sub.loading && !isEdit && (!sub.isActive || sub.offerCount >= sub.maxOffers);

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <Header />
      <main className="container flex-1 py-10">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle>{isEdit ? "Editar oferta" : "Nova oferta"}</CardTitle>
          </CardHeader>
          <CardContent>
            {!sub.loading && !sub.isActive && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Assinatura necessária</AlertTitle>
                <AlertDescription className="flex items-center justify-between gap-3">
                  <span>Você precisa de um plano ativo para publicar ofertas.</span>
                  <Button asChild size="sm" variant="accent">
                    <Link to="/painel-lojista/assinatura">Assinar plano</Link>
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            {!sub.loading && sub.isActive && !isEdit && sub.offerCount >= sub.maxOffers && (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Limite atingido</AlertTitle>
                <AlertDescription>
                  Seu plano permite {sub.maxOffers} oferta(s). Faça upgrade para criar mais.
                </AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <ImageUploader
                value={form.image_url}
                onChange={(url) => setForm({ ...form, image_url: url })}
                storeId={storeId}
                label="Imagem da oferta"
              />

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
              <div>
                <Label>Condições</Label>
                <Textarea rows={2} value={form.conditions} onChange={(e) => setForm({ ...form, conditions: e.target.value })} />
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

              <div className="flex gap-3 pt-2">
                <Button type="submit" variant="accent" disabled={loading || blocked}>Salvar</Button>
                <Button type="button" variant="ghost" onClick={() => navigate("/painel-lojista")}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
