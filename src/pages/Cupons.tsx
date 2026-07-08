import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Copy, CheckCircle2, XCircle, Ticket } from "lucide-react";
import { Header } from "@/components/site/Header";
import { PageHero } from "@/components/site/PageHero";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Coupon = {
  id: string;
  store_id: string;
  offer_id: string | null;
  title: string;
  kind: "fixed" | "unique";
  code: string | null;
  discount_type: "percent" | "amount";
  discount_value: number;
  max_uses: number | null;
  uses_count: number;
  max_per_user: number;
  valid_until: string | null;
  active: boolean;
  created_at: string;
};

type Redemption = {
  id: string;
  coupon_id: string;
  user_id: string | null;
  unique_code: string | null;
  redeemed_at: string | null;
  created_at: string;
};

type OfferLite = { id: string; title: string };

const emptyForm = {
  title: "",
  kind: "fixed" as "fixed" | "unique",
  code: "",
  discount_type: "percent" as "percent" | "amount",
  discount_value: "10",
  max_uses: "",
  max_per_user: "1",
  valid_until: "",
  offer_id: "none",
  active: true,
};

export default function Cupons() {
  const { user } = useAuth();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [redemptions, setRedemptions] = useState<Record<string, Redemption[]>>({});
  const [offers, setOffers] = useState<OfferLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [viewRedemptions, setViewRedemptions] = useState<Coupon | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data: stores } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1);
    const s = stores?.[0];
    if (!s) {
      setStoreId(null);
      setLoading(false);
      return;
    }
    setStoreId(s.id);

    const [{ data: cps }, { data: offs }] = await Promise.all([
      supabase
        .from("coupons" as any)
        .select("*")
        .eq("store_id", s.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("offers")
        .select("id,title")
        .eq("store_id", s.id)
        .eq("status", "approved"),
    ]);
    setCoupons((cps ?? []) as unknown as Coupon[]);
    setOffers((offs ?? []) as OfferLite[]);

    const ids = ((cps ?? []) as any[]).map((c) => c.id);
    if (ids.length) {
      const { data: rs } = await supabase
        .from("coupon_redemptions" as any)
        .select("*")
        .in("coupon_id", ids)
        .order("created_at", { ascending: false });
      const grouped: Record<string, Redemption[]> = {};
      ((rs ?? []) as unknown as Redemption[]).forEach((r) => {
        (grouped[r.coupon_id] ||= []).push(r);
      });
      setRedemptions(grouped);
    } else {
      setRedemptions({});
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  const handleCreate = async () => {
    if (!storeId) return;
    if (!form.title.trim()) return toast.error("Informe um título");
    const value = Number(form.discount_value);
    if (!value || value <= 0) return toast.error("Valor de desconto inválido");
    if (form.discount_type === "percent" && value > 100)
      return toast.error("Percentual deve ser ≤ 100");
    if (form.kind === "fixed" && !form.code.trim())
      return toast.error("Código obrigatório para cupom fixo");

    setSaving(true);
    const payload: any = {
      store_id: storeId,
      offer_id: form.offer_id === "none" ? null : form.offer_id,
      title: form.title.trim(),
      kind: form.kind,
      code: form.kind === "fixed" ? form.code.trim().toUpperCase() : null,
      discount_type: form.discount_type,
      discount_value: value,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      max_per_user: form.max_per_user ? Math.max(1, Number(form.max_per_user)) : 1,
      valid_until: form.valid_until || null,
      active: form.active,
    };
    const { error } = await supabase.from("coupons" as any).insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Cupom criado");
    setOpen(false);
    setForm(emptyForm);
    load();
  };

  const toggleActive = async (c: Coupon) => {
    const { error } = await supabase
      .from("coupons" as any)
      .update({ active: !c.active })
      .eq("id", c.id);
    if (error) return toast.error(error.message);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este cupom?")) return;
    const { error } = await supabase.from("coupons" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Cupom excluído");
    load();
  };

  const markRedeemed = async (r: Redemption) => {
    const { error } = await supabase
      .from("coupon_redemptions" as any)
      .update({ redeemed_at: new Date().toISOString() })
      .eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Resgate confirmado");
    load();
  };

  const formatDiscount = (c: Coupon) =>
    c.discount_type === "percent"
      ? `${Number(c.discount_value)}%`
      : `R$ ${Number(c.discount_value).toFixed(2)}`;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container flex-1 space-y-8 py-8 md:py-10">
        <PageHero
          eyebrow="Painel do lojista"
          title="Cupons"
          subtitle="Crie códigos promocionais fixos ou cupons únicos rastreáveis por cliente."
          crumbs={[{ label: "Painel", to: "/painel-lojista" }, { label: "Cupons" }]}
          compact
          actions={<span />}
        />
        <div className="flex flex-wrap items-end justify-end gap-3">
          <div className="hidden" />

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="accent" disabled={!storeId}>
                <Plus className="h-4 w-4" /> Novo cupom
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Novo cupom</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Título interno</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Ex: Promo Black Friday"
                    maxLength={80}
                  />
                </div>
                <Tabs
                  value={form.kind}
                  onValueChange={(v) => setForm({ ...form, kind: v as any })}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="fixed">Código fixo</TabsTrigger>
                    <TabsTrigger value="unique">Único por usuário</TabsTrigger>
                  </TabsList>
                  <TabsContent value="fixed" className="pt-3">
                    <Label>Código</Label>
                    <Input
                      value={form.code}
                      onChange={(e) =>
                        setForm({ ...form, code: e.target.value.toUpperCase() })
                      }
                      placeholder="BLACK20"
                      maxLength={32}
                    />
                  </TabsContent>
                  <TabsContent value="unique" className="pt-3">
                    <p className="text-xs text-muted-foreground">
                      O sistema gera um código exclusivo (8 caracteres) para cada cliente que
                      resgatar o cupom.
                    </p>
                  </TabsContent>
                </Tabs>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Tipo</Label>
                    <Select
                      value={form.discount_type}
                      onValueChange={(v) =>
                        setForm({ ...form, discount_type: v as any })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">% Percentual</SelectItem>
                        <SelectItem value="amount">R$ Valor fixo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Desconto</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.discount_value}
                      onChange={(e) =>
                        setForm({ ...form, discount_value: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Limite total</Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="ilimitado"
                      value={form.max_uses}
                      onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Por usuário</Label>
                    <Input
                      type="number"
                      min="1"
                      value={form.max_per_user}
                      onChange={(e) =>
                        setForm({ ...form, max_per_user: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Validade</Label>
                    <Input
                      type="date"
                      value={form.valid_until}
                      onChange={(e) =>
                        setForm({ ...form, valid_until: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label>Vincular a uma oferta (opcional)</Label>
                  <Select
                    value={form.offer_id}
                    onValueChange={(v) => setForm({ ...form, offer_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Toda a loja</SelectItem>
                      {offers.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div className="text-sm">
                    <div className="font-medium">Cupom ativo</div>
                    <div className="text-xs text-muted-foreground">
                      Exibe na página da oferta/loja
                    </div>
                  </div>
                  <Switch
                    checked={form.active}
                    onCheckedChange={(v) => setForm({ ...form, active: v })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="accent" onClick={handleCreate} disabled={saving}>
                  {saving ? "Salvando…" : "Criar cupom"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Carregando…</p>
        ) : !storeId ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Cadastre uma loja antes de criar cupons.
            </CardContent>
          </Card>
        ) : coupons.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <Ticket className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">
                Nenhum cupom cadastrado. Crie o primeiro para impulsionar conversões.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {coupons.map((c) => {
              const total = redemptions[c.id]?.length ?? 0;
              const used = redemptions[c.id]?.filter((r) => r.redeemed_at).length ?? 0;
              const expired = c.valid_until && new Date(c.valid_until) < new Date();
              return (
                <Card key={c.id}>
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="text-base">{c.title}</div>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant={c.active && !expired ? "default" : "secondary"}>
                            {expired ? "Expirado" : c.active ? "Ativo" : "Pausado"}
                          </Badge>
                          <Badge variant="outline">
                            {c.kind === "fixed" ? "Código fixo" : "Único por usuário"}
                          </Badge>
                          <Badge variant="outline" className="font-mono">
                            {formatDiscount(c)}
                          </Badge>
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {c.kind === "fixed" && c.code && (
                      <div className="flex items-center justify-between rounded-md border bg-muted/40 p-2">
                        <span className="font-mono text-base font-semibold tracking-wide">
                          {c.code}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(c.code!);
                            toast.success("Código copiado");
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                      <div>
                        <div className="text-foreground font-medium">{c.uses_count}</div>
                        Resgates
                      </div>
                      <div>
                        <div className="text-foreground font-medium">{used}</div>
                        Confirmados
                      </div>
                      <div>
                        <div className="text-foreground font-medium">
                          {c.max_uses ?? "∞"}
                        </div>
                        Limite
                      </div>
                    </div>
                    {c.valid_until && (
                      <p className="text-xs text-muted-foreground">
                        Válido até {new Date(c.valid_until).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewRedemptions(c)}
                        disabled={!total}
                      >
                        Ver resgates ({total})
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleActive(c)}>
                        {c.active ? (
                          <>
                            <XCircle className="h-4 w-4" /> Pausar
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" /> Ativar
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(c.id)}
                      >
                        <Trash2 className="h-4 w-4" /> Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog
          open={!!viewRedemptions}
          onOpenChange={(v) => !v && setViewRedemptions(null)}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Resgates — {viewRedemptions?.title}</DialogTitle>
            </DialogHeader>
            <div className="max-h-[60vh] space-y-2 overflow-y-auto">
              {(viewRedemptions ? redemptions[viewRedemptions.id] : [])?.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="space-y-1">
                    {r.unique_code && (
                      <div className="font-mono text-sm font-semibold">{r.unique_code}</div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Solicitado em {new Date(r.created_at).toLocaleString("pt-BR")}
                    </div>
                    {r.redeemed_at && (
                      <div className="text-xs text-primary">
                        Confirmado em {new Date(r.redeemed_at).toLocaleString("pt-BR")}
                      </div>
                    )}
                  </div>
                  {!r.redeemed_at && (
                    <Button size="sm" variant="accent" onClick={() => markRedeemed(r)}>
                      Confirmar uso
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
}
