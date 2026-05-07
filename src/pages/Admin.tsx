import { useEffect, useState } from "react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, X, Star } from "lucide-react";

type AdminOffer = {
  id: string;
  title: string;
  status: string;
  featured: boolean;
  store: { name: string } | null;
};
type AdminStore = {
  id: string;
  name: string;
  approved: boolean;
  owner_id: string;
};

export default function Admin() {
  const [offers, setOffers] = useState<AdminOffer[]>([]);
  const [stores, setStores] = useState<AdminStore[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: offs }, { data: sts }] = await Promise.all([
      supabase
        .from("offers")
        .select("id,title,status,featured, store:stores(name)")
        .order("created_at", { ascending: false }),
      supabase.from("stores").select("id,name,approved,owner_id").order("created_at", { ascending: false }),
    ]);
    setOffers((offs ?? []) as any);
    setStores((sts ?? []) as any);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateOffer = async (id: string, patch: { status?: "pending" | "approved" | "rejected" | "paused"; featured?: boolean }) => {
    const { error } = await supabase.from("offers").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Atualizado");
    load();
  };

  const updateStore = async (id: string, patch: Partial<AdminStore>) => {
    const { error } = await supabase.from("stores").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Atualizado");
    load();
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <Header />
      <main className="container flex-1 py-10">
        <h1 className="mb-2 text-display text-foreground">Painel Admin</h1>
        <p className="mb-6 text-muted-foreground">Aprove ofertas, gerencie lojistas e destaques.</p>

        <Tabs defaultValue="offers">
          <TabsList>
            <TabsTrigger value="offers">Ofertas ({offers.length})</TabsTrigger>
            <TabsTrigger value="stores">Lojas ({stores.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="offers" className="mt-6">
            <Card>
              <CardHeader><CardTitle>Ofertas</CardTitle></CardHeader>
              <CardContent>
                {loading ? <p>Carregando…</p> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-left text-muted-foreground">
                        <tr><th className="py-2">Título</th><th>Loja</th><th>Status</th><th>Destaque</th><th className="text-right">Ações</th></tr>
                      </thead>
                      <tbody className="divide-y">
                        {offers.map((o) => (
                          <tr key={o.id}>
                            <td className="py-3 font-medium text-foreground">{o.title}</td>
                            <td>{o.store?.name ?? "—"}</td>
                            <td><Badge variant={o.status === "approved" ? "default" : "secondary"}>{o.status}</Badge></td>
                            <td>{o.featured ? <Star className="h-4 w-4 fill-accent text-accent" /> : "—"}</td>
                            <td className="text-right">
                              <div className="inline-flex gap-2">
                                {o.status !== "approved" && (
                                  <Button size="sm" variant="accent" onClick={() => updateOffer(o.id, { status: "approved" })}>
                                    <Check className="h-3.5 w-3.5" /> Aprovar
                                  </Button>
                                )}
                                {o.status !== "rejected" && (
                                  <Button size="sm" variant="outline" onClick={() => updateOffer(o.id, { status: "rejected" })}>
                                    <X className="h-3.5 w-3.5" /> Rejeitar
                                  </Button>
                                )}
                                <Button size="sm" variant="ghost" onClick={() => updateOffer(o.id, { featured: !o.featured })}>
                                  <Star className="h-3.5 w-3.5" />
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
          </TabsContent>

          <TabsContent value="stores" className="mt-6">
            <Card>
              <CardHeader><CardTitle>Lojas</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-muted-foreground">
                      <tr><th className="py-2">Nome</th><th>Status</th><th className="text-right">Ações</th></tr>
                    </thead>
                    <tbody className="divide-y">
                      {stores.map((s) => (
                        <tr key={s.id}>
                          <td className="py-3 font-medium text-foreground">{s.name}</td>
                          <td><Badge variant={s.approved ? "default" : "secondary"}>{s.approved ? "Aprovada" : "Pendente"}</Badge></td>
                          <td className="text-right">
                            <Button size="sm" variant={s.approved ? "outline" : "accent"} onClick={() => updateStore(s.id, { approved: !s.approved })}>
                              {s.approved ? "Suspender" : "Aprovar"}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
