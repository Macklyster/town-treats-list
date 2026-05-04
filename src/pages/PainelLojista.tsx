import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Store, Tag, Settings, CreditCard, Pencil } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatBRLNumber } from "@/lib/format";
import { toast } from "sonner";

type StoreRow = {
  id: string;
  name: string;
  slug: string;
  approved: boolean;
};
type OfferRow = {
  id: string;
  title: string;
  status: string;
  promo_price: number;
  original_price: number;
  category_slug: string;
  featured: boolean;
  valid_until: string | null;
};
type Sub = { status: string; plan: { name: string } | null };

export default function PainelLojista() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [store, setStore] = useState<StoreRow | null>(null);
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [sub, setSub] = useState<Sub | null>(null);
  const [loading, setLoading] = useState(true);
  const subInfo = useSubscription(store?.id ?? null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data: stores } = await supabase
      .from("stores")
      .select("id,name,slug,approved")
      .eq("owner_id", user.id)
      .limit(1);
    const s = stores?.[0] ?? null;
    setStore(s);

    if (s) {
      const { data: offs } = await supabase
        .from("offers")
        .select("id,title,status,promo_price,original_price,category_slug,featured,valid_until")
        .eq("store_id", s.id)
        .order("created_at", { ascending: false });
      setOffers((offs ?? []) as OfferRow[]);

      const { data: subs } = await supabase
        .from("subscriptions")
        .select("status, plan:plans(name)")
        .eq("store_id", s.id)
        .order("created_at", { ascending: false })
        .limit(1);
      setSub((subs?.[0] as any) ?? null);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta oferta?")) return;
    const { error } = await supabase.from("offers").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Oferta excluída");
    load();
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <Header />
      <main className="container flex-1 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">Painel do Lojista</h1>
            <p className="text-muted-foreground">Gerencie sua loja, ofertas e plano.</p>
          </div>
          {store && (
            <Button asChild variant="accent">
              <Link to="/painel-lojista/oferta">
                <Plus className="h-4 w-4" /> Nova oferta
              </Link>
            </Button>
          )}
        </div>

        {loading ? (
          <p className="text-muted-foreground">Carregando…</p>
        ) : !store ? (
          <Card>
            <CardHeader>
              <CardTitle>Crie sua loja</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Você ainda não cadastrou uma loja. Cadastre os dados para começar a publicar ofertas.
              </p>
              <Button asChild variant="accent">
                <Link to="/painel-lojista/loja"><Store className="h-4 w-4" /> Cadastrar loja</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {!subInfo.loading && !subInfo.isActive && (
              <Alert variant="destructive" className="mb-6">
                <AlertTitle>Assine um plano para publicar suas ofertas</AlertTitle>
                <AlertDescription className="flex items-center justify-between gap-3">
                  <span>Sem plano ativo, suas ofertas não ficam visíveis aos clientes.</span>
                  <Button asChild size="sm" variant="accent">
                    <Link to="/painel-lojista/assinatura">Ver planos</Link>
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Store className="h-5 w-5" /> Loja</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="font-semibold text-primary">{store.name}</div>
                  <Badge variant={store.approved ? "default" : "secondary"}>
                    {store.approved ? "Aprovada" : "Aguardando aprovação"}
                  </Badge>
                </div>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link to="/painel-lojista/loja"><Settings className="h-4 w-4" /> Editar dados</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Plano</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sub ? (
                  <>
                    <div className="font-semibold text-primary">{sub.plan?.name ?? "—"}</div>
                    <Badge>{sub.status}</Badge>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum plano ativo.</p>
                )}
                <Button variant="accentOutline" size="sm" asChild className="w-full">
                  <Link to="/painel-lojista/assinatura">Gerenciar assinatura</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Tag className="h-5 w-5" /> Resumo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div>Total de ofertas: <strong>{offers.length}</strong></div>
                <div>Aprovadas: <strong>{offers.filter((o) => o.status === "approved").length}</strong></div>
                <div>Pendentes: <strong>{offers.filter((o) => o.status === "pending").length}</strong></div>
                <div>Em destaque: <strong>{offers.filter((o) => o.featured).length}</strong></div>
              </CardContent>
            </Card>

            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>Suas ofertas</CardTitle>
              </CardHeader>
              <CardContent>
                {offers.length === 0 ? (
                  <p className="text-muted-foreground">Nenhuma oferta cadastrada ainda.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-left text-muted-foreground">
                        <tr>
                          <th className="py-2">Título</th>
                          <th>Categoria</th>
                          <th>Preço</th>
                          <th>Validade</th>
                          <th>Status</th>
                          <th className="text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {offers.map((o) => (
                          <tr key={o.id}>
                            <td className="py-3 font-medium text-primary">{o.title}</td>
                            <td>{o.category_slug}</td>
                            <td>{formatBRLNumber(Number(o.promo_price))}</td>
                            <td>{o.valid_until ?? "—"}</td>
                            <td><Badge variant={o.status === "approved" ? "default" : "secondary"}>{o.status}</Badge></td>
                            <td className="text-right">
                              <div className="inline-flex gap-2">
                                <Button size="sm" variant="ghost" onClick={() => navigate(`/painel-lojista/oferta/${o.id}`)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleDelete(o.id)}>
                                  Excluir
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
