import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Store, Tag, Settings, CreditCard, Pencil, AlertTriangle, BarChart3, QrCode, Users, Share2, Copy, MessageCircle, Sparkles, Trash2 } from "lucide-react";
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
import { OfferQrDialog } from "@/components/site/OfferQrDialog";
import { NewOfferDropdown } from "@/components/site/NewOfferDropdown";
import { fetchActiveGroupOfferForStore, type GroupOffer } from "@/lib/group-offers-api";
import { fetchActiveAuctionForStore, type AuctionOffer, formatBRL as formatBRLAuc } from "@/lib/auction-api";
import { fetchActiveGeoOfferForStore, formatTime as formatGeoTime, type GeoOffer } from "@/lib/geo-offer-api";
import { Gavel, Package, EyeOff, MapPin, Clock } from "lucide-react";

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
  auto_renew?: boolean;
  auto_renew_count?: number;
};
type Sub = { status: string; plan: { name: string } | null };

export default function PainelLojista() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [store, setStore] = useState<StoreRow | null>(null);
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [clicks, setClicks] = useState<Record<string, number>>({});
  const [qrScans, setQrScans] = useState<Record<string, number>>({});
  const [totalClicks, setTotalClicks] = useState(0);
  const [qrFor, setQrFor] = useState<OfferRow | null>(null);
  const [sub, setSub] = useState<Sub | null>(null);
  const [activeColetiva, setActiveColetiva] = useState<GroupOffer | null>(null);
  const [activeLeilao, setActiveLeilao] = useState<AuctionOffer | null>(null);
  const [activeInvisivel, setActiveInvisivel] = useState<GeoOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const subInfo = useSubscription(store?.id ?? null);
  const isPlus = !!subInfo.subscription && subInfo.subscription.status === "active" && subInfo.plan?.slug === "plus";

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
        .select("id,title,status,promo_price,original_price,category_slug,featured,valid_until,auto_renew,auto_renew_count")
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

      const { data: events } = await supabase
        .from("offer_events")
        .select("offer_id, event_type")
        .eq("store_id", s.id)
        .in("event_type", ["whatsapp_click", "qr_scan"]);
      const counts: Record<string, number> = {};
      const qr: Record<string, number> = {};
      let totalWa = 0;
      (events ?? []).forEach((e: any) => {
        if (e.event_type === "whatsapp_click") {
          counts[e.offer_id] = (counts[e.offer_id] ?? 0) + 1;
          totalWa++;
        } else if (e.event_type === "qr_scan") {
          qr[e.offer_id] = (qr[e.offer_id] ?? 0) + 1;
        }
      });
      setClicks(counts);
      setQrScans(qr);
      setTotalClicks(totalWa);

      const ac = await fetchActiveGroupOfferForStore(s.id);
      setActiveColetiva(ac);
      const al = await fetchActiveAuctionForStore(s.id);
      setActiveLeilao(al);
      const ai = await fetchActiveGeoOfferForStore(s.id);
      setActiveInvisivel(ai);
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
            <h1 className="text-display text-foreground">Painel do Lojista</h1>
            <p className="text-muted-foreground">Gerencie sua loja, ofertas e plano.</p>
          </div>
          {store && (
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link to="/painel-lojista/inteligencia">
                  <BarChart3 className="h-4 w-4" /> Inteligência
                </Link>
              </Button>
              <NewOfferDropdown isPlus={isPlus} hasActiveColetiva={!!activeColetiva} hasActiveLeilao={!!activeLeilao} hasActiveInvisivel={!!activeInvisivel} />
            </div>
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
            {!subInfo.loading && subInfo.isFree && (
              <Alert className="mb-6">
                <AlertTitle>Você está no plano Grátis</AlertTitle>
                <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
                  <span>
                    Plano Grátis permite <strong>1 oferta por mês</strong>. Para destaque, ofertas relâmpago e mais publicações, conheça os planos pagos.
                  </span>
                  <Button asChild size="sm" variant="accent">
                    <Link to="/painel-lojista/assinatura">Ver planos</Link>
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            {subInfo.subscription?.cancel_at_period_end && subInfo.isActive && (
              <Alert className="mb-6 border-warning-border/50 bg-warning-bg text-warning-foreground">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Assinatura programada para cancelamento</AlertTitle>
                <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
                  <span>
                    Ativa até{" "}
                    <strong>
                      {subInfo.subscription.current_period_end
                        ? new Date(subInfo.subscription.current_period_end).toLocaleDateString("pt-BR")
                        : "—"}
                    </strong>
                    .
                  </span>
                  <Button asChild size="sm" variant="accent">
                    <Link to="/painel-lojista/assinatura">Reativar assinatura</Link>
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
                  <div className="font-medium text-foreground">{store.name}</div>
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
                    <div className="font-medium text-foreground">{sub.plan?.name ?? "—"}</div>
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
                <div>{subInfo.isFree ? "Ofertas este mês" : "Total de ofertas"}: <strong>{subInfo.offerCount}{subInfo.maxOffers ? ` / ${subInfo.maxOffers}` : ""}</strong></div>
                <div>Aprovadas: <strong>{offers.filter((o) => o.status === "approved").length}</strong></div>
                <div>Pendentes: <strong>{offers.filter((o) => o.status === "pending").length}</strong></div>
                <div>Em destaque: <strong>{offers.filter((o) => o.featured).length}{subInfo.featuredSlots ? ` / ${subInfo.featuredSlots}` : ""}</strong></div>
                <div>Cliques no WhatsApp: <strong>{totalClicks}</strong></div>
              </CardContent>
            </Card>

            {activeColetiva && (
              <Card className="md:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" /> Sua coletiva ativa
                    <Badge variant={activeColetiva.status === "approved" ? "default" : "secondary"}>
                      {activeColetiva.status === "approved" ? "Ativa" : "Aguardando aprovação"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    {activeColetiva.image_url && (
                      <img
                        src={activeColetiva.image_url}
                        alt={activeColetiva.title}
                        className="h-28 w-full rounded-md object-cover sm:w-44"
                      />
                    )}
                    <div className="flex-1 space-y-2">
                      <h3 className="font-semibold text-foreground">{activeColetiva.title}</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>De {formatBRLNumber(Number(activeColetiva.original_price))}</span>
                        <span>
                          Faixas: {(activeColetiva.tiers ?? []).map((t) => `${t.min_people}+ ${formatBRLNumber(Number(t.price))}`).join(" / ")}
                        </span>
                        {activeColetiva.ends_at && (
                          <span>Encerra em {new Date(activeColetiva.ends_at).toLocaleString("pt-BR")}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="accent"
                      size="sm"
                      onClick={() => navigate(`/painel-lojista/coletiva/${activeColetiva.id}`)}
                    >
                      <Pencil className="h-4 w-4" /> Editar coletiva
                    </Button>
                    {activeColetiva.status === "approved" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const url = `${window.location.origin}/coletiva/${activeColetiva.share_token}`;
                            navigator.clipboard.writeText(url);
                            toast.success("Link copiado!");
                          }}
                        >
                          <Copy className="h-4 w-4" /> Copiar link
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const url = `${window.location.origin}/coletiva/${activeColetiva.share_token}`;
                            window.open(`https://wa.me/?text=${encodeURIComponent(`Vem comigo: ${url}`)}`, "_blank");
                          }}
                        >
                          <MessageCircle className="h-4 w-4" /> WhatsApp
                        </Button>
                        <Button asChild variant="ghost" size="sm">
                          <Link to={`/coletiva/${activeColetiva.share_token}`} target="_blank">
                            <Share2 className="h-4 w-4" /> Ver pública
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            if (!confirm("Encerrar esta coletiva agora?")) return;
                            const { error } = await supabase
                              .from("group_offers" as any)
                              .update({ status: "expired" })
                              .eq("id", activeColetiva.id);
                            if (error) return toast.error(error.message);
                            toast.success("Coletiva encerrada");
                            load();
                          }}
                        >
                          Encerrar
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        if (!confirm("Excluir esta coletiva? Esta ação não pode ser desfeita.")) return;
                        const { error } = await supabase
                          .from("group_offers" as any)
                          .delete()
                          .eq("id", activeColetiva.id);
                        if (error) return toast.error(error.message);
                        toast.success("Coletiva excluída");
                        load();
                      }}
                    >
                      <Trash2 className="h-4 w-4" /> Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeLeilao && (
              <Card className="md:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gavel className="h-5 w-5 text-primary" /> Seu leilão ativo
                    <Badge variant={activeLeilao.status === "approved" ? "default" : "secondary"}>
                      {activeLeilao.status === "approved" ? "Ativo" : "Aguardando aprovação"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    {activeLeilao.image_url && (
                      <img
                        src={activeLeilao.image_url}
                        alt={activeLeilao.title}
                        className="h-28 w-full rounded-md object-cover sm:w-44"
                      />
                    )}
                    <div className="flex-1 space-y-2">
                      <h3 className="font-semibold text-foreground">{activeLeilao.title}</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>De {formatBRLAuc(Number(activeLeilao.starting_price))} até {formatBRLAuc(Number(activeLeilao.min_price))}</span>
                        <span>−{formatBRLAuc(Number(activeLeilao.decrement_amount))} a cada {activeLeilao.decrement_interval_minutes} min</span>
                        <span className="inline-flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {activeLeilao.reserved_quantity} de {activeLeilao.total_quantity} reservadas
                        </span>
                        {activeLeilao.ends_at && (
                          <span>Encerra em {new Date(activeLeilao.ends_at).toLocaleString("pt-BR")}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="accent"
                      size="sm"
                      onClick={() => navigate(`/painel-lojista/leilao/${activeLeilao.id}`)}
                    >
                      <Pencil className="h-4 w-4" /> Editar leilão
                    </Button>
                    {activeLeilao.status === "approved" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const url = `${window.location.origin}/leilao/${activeLeilao.share_token}`;
                            navigator.clipboard.writeText(url);
                            toast.success("Link copiado!");
                          }}
                        >
                          <Copy className="h-4 w-4" /> Copiar link
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const url = `${window.location.origin}/leilao/${activeLeilao.share_token}`;
                            window.open(`https://wa.me/?text=${encodeURIComponent(`Leilão acontecendo agora: ${url}`)}`, "_blank");
                          }}
                        >
                          <MessageCircle className="h-4 w-4" /> WhatsApp
                        </Button>
                        <Button asChild variant="ghost" size="sm">
                          <Link to={`/leilao/${activeLeilao.share_token}`} target="_blank">
                            <Share2 className="h-4 w-4" /> Ver pública
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            if (!confirm("Encerrar este leilão agora?")) return;
                            const { error } = await supabase
                              .from("auction_offers" as any)
                              .update({ status: "expired" })
                              .eq("id", activeLeilao.id);
                            if (error) return toast.error(error.message);
                            toast.success("Leilão encerrado");
                            load();
                          }}
                        >
                          Encerrar
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        if (!confirm("Excluir este leilão? Esta ação não pode ser desfeita.")) return;
                        const { error } = await supabase
                          .from("auction_offers" as any)
                          .delete()
                          .eq("id", activeLeilao.id);
                        if (error) return toast.error(error.message);
                        toast.success("Leilão excluído");
                        load();
                      }}
                    >
                      <Trash2 className="h-4 w-4" /> Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeInvisivel && (
              <Card className="md:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <EyeOff className="h-5 w-5 text-primary" /> Sua oferta invisível ativa
                    <Badge variant={activeInvisivel.status === "approved" ? "default" : "secondary"}>
                      {activeInvisivel.status === "approved" ? "Ativa" : "Aguardando aprovação"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    {activeInvisivel.image_url && (
                      <img src={activeInvisivel.image_url} alt={activeInvisivel.title} className="h-28 w-full rounded-md object-cover sm:w-44" />
                    )}
                    <div className="flex-1 space-y-2">
                      <h3 className="font-semibold text-foreground">{activeInvisivel.title}</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span><span className="line-through">R$ {Number(activeInvisivel.original_price).toFixed(2)}</span> → <strong>R$ {Number(activeInvisivel.promo_price).toFixed(2)}</strong></span>
                        <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> Raio {activeInvisivel.radius_meters} m</span>
                        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {formatGeoTime(activeInvisivel.time_start)}–{formatGeoTime(activeInvisivel.time_end)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="accent" size="sm" onClick={() => navigate(`/painel-lojista/oferta-invisivel/${activeInvisivel.id}`)}>
                      <Pencil className="h-4 w-4" /> Editar
                    </Button>
                    {activeInvisivel.status === "approved" && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => {
                          const url = `${window.location.origin}/oferta-invisivel/${activeInvisivel.share_token}`;
                          navigator.clipboard.writeText(url); toast.success("Link copiado!");
                        }}><Copy className="h-4 w-4" /> Copiar link</Button>
                        <Button variant="outline" size="sm" onClick={() => {
                          const url = `${window.location.origin}/oferta-invisivel/${activeInvisivel.share_token}`;
                          window.open(`https://wa.me/?text=${encodeURIComponent(`Tem uma oferta secreta perto de você: ${url}`)}`, "_blank");
                        }}><MessageCircle className="h-4 w-4" /> WhatsApp</Button>
                        <Button asChild variant="ghost" size="sm">
                          <Link to={`/oferta-invisivel/${activeInvisivel.share_token}`} target="_blank"><Share2 className="h-4 w-4" /> Ver pública</Link>
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="sm" onClick={async () => {
                      if (!confirm("Excluir esta oferta invisível?")) return;
                      const { error } = await supabase.from("geo_offers" as any).delete().eq("id", activeInvisivel.id);
                      if (error) return toast.error(error.message);
                      toast.success("Oferta excluída"); load();
                    }}><Trash2 className="h-4 w-4" /> Excluir</Button>
                  </div>
                </CardContent>
              </Card>
            )}

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
                          <th className="text-center">Cliques WA</th>
                          <th className="text-center">Scans QR</th>
                          <th className="text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {offers.map((o) => (
                          <tr key={o.id}>
                            <td className="py-3 font-medium text-foreground">{o.title}</td>
                            <td>{o.category_slug}</td>
                            <td>{formatBRLNumber(Number(o.promo_price))}</td>
                            <td>
                              <div className="flex items-center gap-1">
                                <span>{o.valid_until ?? "—"}</span>
                                {o.auto_renew && (
                                  <Badge variant="outline" className="text-[10px]" title={`${o.auto_renew_count ?? 0}/6 renovações`}>
                                    🔄 Auto
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td><Badge variant={o.status === "approved" ? "default" : "secondary"}>{o.status}</Badge></td>
                            <td className="text-center font-medium">{clicks[o.id] ?? 0}</td>
                            <td className="text-center font-medium">{qrScans[o.id] ?? 0}</td>
                            <td className="text-right">
                              <div className="inline-flex gap-1">
                                <Button size="sm" variant="ghost" title="QR Code para vitrine" onClick={() => setQrFor(o)}>
                                  <QrCode className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="sm" variant="ghost" title="Editar" onClick={() => navigate(`/painel-lojista/oferta/${o.id}`)}>
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
          </>
        )}
      </main>
      <Footer />
      {qrFor && (
        <OfferQrDialog
          open={!!qrFor}
          onOpenChange={(v) => !v && setQrFor(null)}
          offer={qrFor as any}
        />
      )}
    </div>
  );
}
