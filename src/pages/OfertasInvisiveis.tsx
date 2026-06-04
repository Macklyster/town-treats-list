import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { SEO } from "@/components/seo/SEO";
import { FaqSection, faqToJsonLd } from "@/components/site/FaqSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EyeOff, MapPin, Clock, Heart, Sparkles, Bell } from "lucide-react";
import { StoreAvatar } from "@/components/site/StoreAvatar";
import { StoreFeaturedBadge } from "@/components/site/StoreFeaturedBadge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fetchActiveGeoOffers, formatTime, type GeoOffer } from "@/lib/geo-offer-api";

type Row = GeoOffer & {
  store: { id: string; name: string; slug: string; logo_url: string | null; featured_badge: boolean; city: string; state: string } | null;
};

const HowItWorks = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Como funciona</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3 text-sm text-muted-foreground">
      <p>A <strong className="text-foreground">Oferta Invisível</strong> só aparece quando você está perto da loja. Você não precisa procurar — a promoção te encontra.</p>
      <ul className="grid gap-2 sm:grid-cols-2">
        <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-primary" /><span>Cada lojista define um raio em torno da loja (50 a 5000 m).</span></li>
        <li className="flex items-start gap-2"><Clock className="mt-0.5 h-4 w-4 text-primary" /><span>Cada oferta tem janela de horário. Fora dela, fica oculta.</span></li>
        <li className="flex items-start gap-2"><EyeOff className="mt-0.5 h-4 w-4 text-primary" /><span>Se você sai do raio ou o dia acaba, a oferta some.</span></li>
        <li className="flex items-start gap-2"><Bell className="mt-0.5 h-4 w-4 text-primary" /><span>Ative notificações para receber alertas perto das lojas.</span></li>
      </ul>
    </CardContent>
  </Card>
);

const InvisibleCard = ({ row }: { row: Row }) => (
  <Link to={`/oferta-invisivel/${row.share_token}`} className="group rounded-lg border bg-background transition hover:shadow-md">
    <div className="relative">
      {row.image_url ? (
        <img src={row.image_url} alt={row.title} loading="lazy" className="aspect-video w-full rounded-t-lg object-cover blur-sm grayscale" />
      ) : (
        <div className="aspect-video w-full rounded-t-lg bg-muted" />
      )}
      <div className="absolute inset-0 flex items-center justify-center">
        <Badge variant="secondary" className="gap-1 bg-background/90"><EyeOff className="h-3 w-3" /> Visível só perto da loja</Badge>
      </div>
    </div>
    <div className="space-y-2 p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <StoreAvatar name={row.store?.name ?? "Loja"} logoUrl={row.store?.logo_url ?? null} size={20} />
        <span className="truncate">{row.store?.name ?? "Loja"}</span>
        {row.store?.featured_badge && <StoreFeaturedBadge showLabel={false} />}
      </div>
      <h2 className="line-clamp-2 font-semibold text-foreground group-hover:text-primary">{row.title}</h2>
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Raio {row.radius_meters} m</span>
        <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {formatTime(row.time_start)}–{formatTime(row.time_end)}</span>
      </div>
      <Button size="sm" variant="outline" className="w-full">Verificar se estou no raio</Button>
    </div>
  </Link>
);

export default function OfertasInvisiveis() {
  const { user, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [followsCount, setFollowsCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data: follows } = await supabase.from("store_followers").select("store_id").eq("user_id", user.id);
      const storeIds = (follows ?? []).map((f: any) => f.store_id);
      setFollowsCount(storeIds.length);
      if (storeIds.length === 0) { setRows([]); setLoading(false); return; }
      const data = await fetchActiveGeoOffers(storeIds);
      setRows(data as Row[]);
      setLoading(false);
    })();
  }, [user?.id]);

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <SEO title="Ofertas Invisíveis — OfertasFly" description="Promoções que só aparecem quando você está perto da loja." path="/ofertas-invisiveis" />
      <Header />
      <main className="container flex-1 py-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <header className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-display text-foreground">Ofertas Invisíveis</h1>
              <Badge variant="secondary">Novo</Badge>
            </div>
            <p className="text-muted-foreground">A promoção te encontra. Você não precisa procurar.</p>
          </header>

          <HowItWorks />

          {authLoading ? (
            <p className="text-muted-foreground">Carregando…</p>
          ) : !user ? (
            <Card>
              <CardHeader><CardTitle>Entre para ver as ofertas invisíveis</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">As ofertas invisíveis são exibidas apenas para clientes cadastrados. Faça login para ver as das lojas que você segue.</p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="accent"><Link to="/auth">Entrar / Cadastrar</Link></Button>
                  <Button asChild variant="outline"><Link to="/">Explorar lojas</Link></Button>
                </div>
              </CardContent>
            </Card>
          ) : loading ? (
            <p className="text-muted-foreground">Carregando ofertas…</p>
          ) : followsCount === 0 ? (
            <Alert>
              <Heart className="h-4 w-4" />
              <AlertTitle>Você ainda não segue nenhuma loja</AlertTitle>
              <AlertDescription>Siga lojas para ver as ofertas invisíveis aqui. <Link to="/" className="underline">Explorar lojas</Link></AlertDescription>
            </Alert>
          ) : rows.length === 0 ? (
            <Alert><AlertTitle>Nenhuma oferta invisível ativa</AlertTitle><AlertDescription>Nenhuma das lojas que você segue tem oferta invisível agora.</AlertDescription></Alert>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((r) => <InvisibleCard key={r.id} row={r} />)}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
