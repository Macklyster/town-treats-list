import { useEffect, useRef, useState } from "react";
import { useParams } from "@/lib/router-compat";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { SEO } from "@/components/seo/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MapPin, EyeOff, Clock, MessageCircle, Crosshair, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StoreAvatar } from "@/components/site/StoreAvatar";
import { StoreFeaturedBadge } from "@/components/site/StoreFeaturedBadge";
import {
  fetchGeoOfferState,
  registerGeoVisit,
  formatBRL,
  formatTime,
  getCurrentPosition,
  type GeoOfferState,
} from "@/lib/geo-offer-api";
import { getSessionId } from "@/lib/offer-events";

export default function OfertaInvisivelPublic() {
  const { token } = useParams();
  const [state, setState] = useState<GeoOfferState | null>(null);
  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [storeLogo, setStoreLogo] = useState<string | null>(null);
  const [storeFeatured, setStoreFeatured] = useState<boolean>(false);
  const visitedRef = useRef(false);

  const requestLocation = async () => {
    setGeoError(null);
    try {
      const pos = await getCurrentPosition();
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    } catch (e: any) {
      setGeoError(e?.message ?? "Não foi possível obter sua localização. Permita o acesso à localização para ver esta oferta.");
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  useEffect(() => {
    (async () => {
      if (!token) return;
      setLoading(true);
      const s = await fetchGeoOfferState(token, coords?.lat ?? null, coords?.lng ?? null);
      setState(s);
      setLoading(false);
      if (s.found && s.offer?.store_id) {
        const { data } = await supabase
          .from("stores")
          .select("logo_url, featured_badge")
          .eq("id", s.offer.store_id)
          .maybeSingle();
        if (data) {
          setStoreLogo((data as any).logo_url ?? null);
          setStoreFeatured(!!(data as any).featured_badge);
        }
      }
      // Registrar visita se tudo bate
      if (s.found && s.in_radius && s.in_window && s.in_validity && s.status === "approved" && coords && !visitedRef.current) {
        visitedRef.current = true;
        await registerGeoVisit(token, coords.lat, coords.lng, getSessionId());
      }
    })();
  }, [token, coords?.lat, coords?.lng]);

  if (loading && !state) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container flex-1 py-10"><p className="text-muted-foreground">Carregando…</p></main>
        <Footer />
      </div>
    );
  }

  if (!state || !state.found) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="container flex-1 py-10">
          <Card className="mx-auto max-w-xl"><CardHeader><CardTitle>Oferta não encontrada</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground">Verifique o link e tente novamente.</p></CardContent>
          </Card>
        </main><Footer />
      </div>
    );
  }

  const offer = state.offer!;
  const unlocked = state.in_radius && state.in_window && state.in_validity && state.status === "approved";

  const whatsappUrl = state.store_whatsapp
    ? `https://wa.me/${state.store_whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Olá! Vi a oferta invisível "${offer.title}" e estou perto da loja. Posso garantir o preço de ${formatBRL(Number((offer as any).promo_price ?? 0))}?`,
      )}`
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO
        title={`${offer.title} — Oferta Invisível`}
        description="Esta oferta só aparece quando você está perto da loja."
        path={`/oferta-invisivel/${token}`}
        image={(offer as any).image_url ?? undefined}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: offer.title,
          description: (offer as any).description ?? undefined,
          image: (offer as any).image_url ? [(offer as any).image_url] : undefined,
          brand: state.store_name ? { "@type": "Brand", name: state.store_name } : undefined,
          offers: {
            "@type": "Offer",
            priceCurrency: "BRL",
            price: Number((offer as any).promo_price ?? 0).toFixed(2),
            availability:
              state.status === "approved"
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            areaServed: state.store_name
              ? { "@type": "Place", name: state.store_name }
              : undefined,
            eligibleRegion: offer.radius_meters
              ? {
                  "@type": "GeoShape",
                  description: `Disponível em raio de ${offer.radius_meters}m da loja`,
                }
              : undefined,
            availabilityStarts: offer.time_start ?? undefined,
            availabilityEnds: offer.time_end ?? undefined,
          },
        }}
      />
      <Header />
      <main className="container flex-1 py-8">
        <div className="mx-auto max-w-2xl space-y-6">
          <header className="space-y-2 text-center">
            <Badge variant="secondary" className="gap-1"><EyeOff className="h-3 w-3" /> Oferta Invisível</Badge>
            <h1 className="text-display text-foreground">{offer.title}</h1>
            <p className="text-muted-foreground text-sm">A promoção te encontra. Você não precisa procurar.</p>
          </header>

          {state.store_name && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <StoreAvatar name={state.store_name} logoUrl={storeLogo} size={28} />
              <span>{state.store_name}</span>
              {storeFeatured && <StoreFeaturedBadge showLabel={false} />}
            </div>
          )}

          {geoError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Permissão de localização necessária</AlertTitle>
              <AlertDescription className="space-y-3">
                <p>{geoError}</p>
                <Button size="sm" onClick={requestLocation}><Crosshair className="h-4 w-4" /> Tentar novamente</Button>
              </AlertDescription>
            </Alert>
          )}

          {!coords && !geoError && (
            <Alert><AlertTitle>Aguardando sua localização…</AlertTitle>
              <AlertDescription>Permita o acesso à sua localização para ver se esta oferta está disponível para você agora.</AlertDescription>
            </Alert>
          )}

          {coords && !unlocked && (
            <Card className="border-warning">
              <CardHeader><CardTitle className="flex items-center gap-2"><EyeOff className="h-5 w-5 text-warning-foreground" /> Oferta indisponível para você agora</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  Esta é uma <strong>Oferta Invisível</strong>: ela só aparece para clientes que estão dentro do raio definido pelo lojista, dentro da janela de horário.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-highlight" />
                    <span>
                      Raio: <strong>{offer.radius_meters} m</strong> da loja.
                      {state.distance_meters != null && (
                        <> Você está a <strong>{Math.round(state.distance_meters)} m</strong>.</>
                      )}
                      {state.in_radius === false && <> Aproxime-se da loja para liberar.</>}
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-highlight" />
                    <span>
                      Janela: das <strong>{formatTime(offer.time_start ?? "")}</strong> às <strong>{formatTime(offer.time_end ?? "")}</strong>.
                      {state.in_window === false && <> Volte dentro do horário acima.</>}
                    </span>
                  </li>
                  {state.in_validity === false && (
                    <li className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <span>Esta oferta está fora do período de validade.</span>
                    </li>
                  )}
                  {state.status !== "approved" && (
                    <li className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <span>Esta oferta ainda não está ativa.</span>
                    </li>
                  )}
                </ul>
                <Button size="sm" variant="outline" onClick={requestLocation}><Crosshair className="h-4 w-4" /> Atualizar minha localização</Button>
              </CardContent>
            </Card>
          )}

          {unlocked && (
            <Card className="overflow-hidden border-success">
              {offer.image_url && (<img src={offer.image_url} alt={offer.title} className="aspect-video w-full object-cover" />)}
              <CardContent className="space-y-4 p-5">
                <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Oferta liberada</Badge>
                <div className="flex items-baseline gap-3">
                  <span className="text-sm text-muted-foreground line-through">{formatBRL(Number((offer as any).original_price ?? 0))}</span>
                  <span className="text-3xl font-bold text-accent-strong">{formatBRL(Number((offer as any).promo_price ?? 0))}</span>
                </div>
                {(offer as any).description && (<p className="text-sm text-foreground whitespace-pre-line">{(offer as any).description}</p>)}
                {(offer as any).conditions && (<p className="text-xs text-muted-foreground"><strong>Condições:</strong> {(offer as any).conditions}</p>)}
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Você está a {Math.round(state.distance_meters ?? 0)} m</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Disponível até {formatTime((offer as any).time_end ?? "")}</span>
                </div>
                {whatsappUrl && (
                  <Button asChild variant="accent" className="w-full">
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" /> Falar com a loja</a>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
