import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchAuctionStateByToken,
  reserveAuction,
  computeCurrentPrice,
  computeSecondsToNext,
  formatBRL,
  trackAuctionEvent,
  fetchAuctionSocialProof,
  type AuctionState,
  type AuctionSocialProof,
} from "@/lib/auction-api";
import { getSessionId } from "@/lib/offer-events";
import { MessageCircle, Gavel, Clock, Package, TrendingDown, Eye, Users, ShoppingBag } from "lucide-react";
import { StoreAvatar } from "@/components/site/StoreAvatar";
import { StoreFeaturedBadge } from "@/components/site/StoreFeaturedBadge";
import { toast } from "sonner";
import { SEO } from "@/components/seo/SEO";

const fmtTime = (s: number) => {
  if (s <= 0) return "0s";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m >= 1) return `${m}m ${sec.toString().padStart(2, "0")}s`;
  return `${sec}s`;
};

export default function LeilaoPublic() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<AuctionState | null>(null);
  const [tick, setTick] = useState(0);
  const [reserving, setReserving] = useState(false);
  const [proof, setProof] = useState<AuctionSocialProof | null>(null);
  const [storeLogo, setStoreLogo] = useState<string | null>(null);
  const [storeFeatured, setStoreFeatured] = useState<boolean>(false);
  const [myReservedPrice, setMyReservedPrice] = useState<number | null>(null);

  const load = async () => {
    if (!token) return;
    const s = await fetchAuctionStateByToken(token);
    setState(s);
    if (s.offer?.id) {
      const p = await fetchAuctionSocialProof(s.offer.id);
      setProof(p);
      const { data: st } = await supabase
        .from("stores")
        .select("logo_url, featured_badge")
        .eq("id", s.offer.store_id)
        .maybeSingle();
      setStoreLogo(st?.logo_url ?? null);
      setStoreFeatured(!!st?.featured_badge);
      if (s.already_reserved && user) {
        const { data: r } = await supabase
          .from("auction_reservations" as any)
          .select("reserved_price")
          .eq("auction_id", s.offer.id)
          .eq("user_id", user.id)
          .maybeSingle();
        setMyReservedPrice(r ? Number((r as any).reserved_price) : null);
      } else {
        setMyReservedPrice(null);
      }
    }
  };

  useEffect(() => { load(); }, [token, user?.id]);

  // Track view once per auction load
  useEffect(() => {
    if (state?.offer?.id) {
      trackAuctionEvent(state.offer.id, "view", getSessionId());
    }
  }, [state?.offer?.id]);

  // local 1s tick
  useEffect(() => {
    const id = setInterval(() => setTick((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // realtime
  useEffect(() => {
    if (!state?.offer?.id) return;
    const ch = supabase
      .channel(`auction-${state.offer.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "auction_offers", filter: `id=eq.${state.offer.id}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "auction_reservations", filter: `auction_id=eq.${state.offer.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [state?.offer?.id]);

  const live = useMemo(() => {
    if (!state?.offer) return null;
    const o = state.offer;
    const price = computeCurrentPrice(o);
    const secsNext = computeSecondsToNext(o);
    const remaining = o.ends_at ? Math.max(0, Math.floor((new Date(o.ends_at).getTime() - Date.now()) / 1000)) : 0;
    const pct = ((Number(o.starting_price) - price) / (Number(o.starting_price) - Number(o.min_price))) * 100;
    return { price, secsNext, remaining, pct: Math.max(0, Math.min(100, pct)) };
  }, [state?.offer, tick]);

  const handleReserve = async () => {
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent(`/leilao/${token}`)}`);
      return;
    }
    if (!token) return;
    setReserving(true);
    try {
      const r = await reserveAuction(token);
      toast.success(`Reservado por ${formatBRL(Number(r.reserved_price))}!`);
      await load();
    } catch (e: any) {
      const msg = e?.message ?? "Erro ao reservar";
      if (msg.includes("sold out")) toast.error("Leilão esgotado.");
      else if (msg.includes("already reserved")) toast.info("Você já reservou.");
      else if (msg.includes("not active")) toast.error("Leilão não está ativo.");
      else toast.error(msg);
      await load();
    } finally {
      setReserving(false);
    }
  };

  if (!state) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container flex-1 py-10"><p className="text-muted-foreground">Carregando…</p></main>
        <Footer />
      </div>
    );
  }

  if (!state.found || !state.offer) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container flex-1 py-10">
          <Card><CardContent className="p-6">Leilão não encontrado.</CardContent></Card>
        </main>
        <Footer />
      </div>
    );
  }

  const offer = state.offer;
  const remainingUnits = offer.total_quantity - offer.reserved_quantity;
  const isSoldOut = offer.status === "sold_out" || remainingUnits <= 0;
  const isExpired = offer.status === "expired" || (live && live.remaining <= 0 && !isSoldOut);
  const isActive = offer.status === "approved" && !isSoldOut && !isExpired;
  const stockPct = (offer.reserved_quantity / Math.max(1, offer.total_quantity)) * 100;

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <SEO
        title={`${offer.title} — Leilão ${state.store_name ?? "OfertasFly"}`}
        description={offer.description ?? `Leilão reverso de oferta no OfertasFly. O preço cai com o tempo.`}
        path={`/leilao/${token}`}
        image={offer.image_url ?? undefined}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: offer.title,
          description: offer.description ?? undefined,
          image: offer.image_url ? [offer.image_url] : undefined,
          brand: state.store_name ? { "@type": "Brand", name: state.store_name } : undefined,
          offers: {
            "@type": "Offer",
            priceCurrency: "BRL",
            price: (live?.price ?? Number(offer.min_price)).toFixed(2),
            availability:
              offer.status === "sold_out" || remainingUnits <= 0
                ? "https://schema.org/SoldOut"
                : offer.status === "approved"
                  ? "https://schema.org/InStock"
                  : "https://schema.org/PreOrder",
            priceValidUntil: offer.ends_at
              ? new Date(offer.ends_at).toISOString().slice(0, 10)
              : undefined,
            url: typeof window !== "undefined" ? window.location.href : undefined,
          },
        }}
      />
      <Header />
      <main className="container flex-1 py-10">
        <div className="mx-auto max-w-2xl space-y-6">
          <Card className="overflow-hidden">
            {offer.image_url && (
              <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
                <img src={offer.image_url} alt={offer.title} className="h-full w-full object-cover" />
              </div>
            )}
            <CardContent className="space-y-2 p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="gap-1"><Gavel className="h-3 w-3" /> Leilão de oferta</Badge>
                <StoreAvatar name={state.store_name ?? "Loja"} logoUrl={storeLogo} size={24} />
                {state.store_name && <span className="text-xs uppercase tracking-wide text-muted-foreground">{state.store_name}</span>}
                {storeFeatured && <StoreFeaturedBadge showLabel={false} />}
              </div>
              <h1 className="text-2xl font-bold text-foreground">{offer.title}</h1>
              {offer.description && <p className="text-sm text-muted-foreground">{offer.description}</p>}
              {proof && (proof.views_today > 0 || proof.viewers_now > 0 || proof.reserved > 0) && (
                <div className="flex flex-wrap gap-2 pt-2 text-xs">
                  {proof.viewers_now > 1 && (
                    <Badge variant="outline" className="gap-1 border-accent/40 text-accent-strong">
                      <Users className="h-3 w-3" /> {proof.viewers_now} pessoas vendo agora
                    </Badge>
                  )}
                  {proof.views_today > 0 && (
                    <Badge variant="outline" className="gap-1">
                      <Eye className="h-3 w-3" /> {proof.views_today} {proof.views_today === 1 ? "pessoa viu" : "pessoas viram"} hoje
                    </Badge>
                  )}
                  {proof.reserved > 0 && (
                    <Badge variant="outline" className="gap-1 border-success/40 text-success-foreground">
                      <ShoppingBag className="h-3 w-3" /> {proof.reserved} {proof.reserved === 1 ? "unidade vendida" : "unidades vendidas"}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {offer.status === "pending" && (
            <Card><CardContent className="p-4 text-sm">⏳ Aguardando aprovação. Volte em breve.</CardContent></Card>
          )}

          {(isActive || isSoldOut || isExpired) && live && (
            <Card>
              <CardContent className="space-y-4 p-6">
                <div className="text-center">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Preço atual</p>
                  <p className="text-5xl font-bold text-accent-strong tabular-nums">{formatBRL(live.price)}</p>
                  {isActive && live.price > Number(offer.min_price) && (
                    <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground">
                      <TrendingDown className="h-4 w-4" />
                      Próximo preço: <strong>{formatBRL(Math.max(Number(offer.min_price), live.price - Number(offer.decrement_amount)))}</strong>
                      &nbsp;em <strong>{fmtTime(live.secsNext)}</strong>
                    </p>
                  )}
                </div>

                <div>
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>Inicial: {formatBRL(Number(offer.starting_price))}</span>
                    <span>Mínimo: {formatBRL(Number(offer.min_price))}</span>
                  </div>
                  <Progress value={live.pct} />
                </div>

                <div className="flex items-center justify-between rounded-md bg-muted/40 p-3 text-sm">
                  <span className="inline-flex items-center gap-1.5">
                    <Package className="h-4 w-4" />
                    <strong>{remainingUnits}</strong> de {offer.total_quantity} unidade{offer.total_quantity > 1 ? "s" : ""} disponíveis
                  </span>
                  {isActive && offer.ends_at && (
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Encerra em {fmtTime(live.remaining)}
                    </span>
                  )}
                </div>
                {offer.total_quantity > 1 && (
                  <Progress value={stockPct} className="h-2" />
                )}

                {isActive && !state.already_reserved && (
                  <Button
                    size="lg"
                    variant="accent"
                    className="w-full"
                    onClick={handleReserve}
                    disabled={reserving || authLoading}
                  >
                    <Gavel className="h-5 w-5" />
                    {user ? `Reservar 1 unidade por ${formatBRL(live.price)}` : "Entrar para reservar"}
                  </Button>
                )}

                {state.already_reserved && state.store_whatsapp && (
                  <Card>
                    <CardContent className="space-y-2 p-4 text-sm">
                      <p>
                        ✅ Você reservou
                        {myReservedPrice != null && (
                          <> por <strong>{formatBRL(myReservedPrice)}</strong></>
                        )}
                        ! Combine a retirada com a loja.
                      </p>
                      <Button
                        variant="accent"
                        onClick={() => {
                          const priceLine = myReservedPrice != null
                            ? ` no valor de ${formatBRL(myReservedPrice)}`
                            : "";
                          const msg = `Olá! Reservei o leilão "${offer.title}"${priceLine}. Como combinamos a retirada/pagamento?`;
                          window.open(
                            `https://wa.me/${(state.store_whatsapp || "").replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`,
                            "_blank",
                          );
                        }}
                      >
                        <MessageCircle className="h-4 w-4" /> Falar com a loja
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {isSoldOut && !state.already_reserved && (
                  <Card><CardContent className="p-4 text-center text-sm">😔 Esgotado. Todas as unidades foram reservadas.</CardContent></Card>
                )}
                {isExpired && !isSoldOut && (
                  <Card><CardContent className="p-4 text-center text-sm">⌛ Leilão encerrado.</CardContent></Card>
                )}
              </CardContent>
            </Card>
          )}

          {offer.conditions && (
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-2 font-semibold">Condições</h3>
                <p className="whitespace-pre-line text-sm text-muted-foreground">{offer.conditions}</p>
              </CardContent>
            </Card>
          )}

          <p className="text-center text-xs text-muted-foreground">
            <Link to="/leiloes" className="underline">Ver outros leilões</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
