import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { SEO } from "@/components/seo/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Gavel, Clock, TrendingDown, Package, Heart, Sparkles } from "lucide-react";
import { StoreAvatar } from "@/components/site/StoreAvatar";
import { StoreFeaturedBadge } from "@/components/site/StoreFeaturedBadge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { computeCurrentPrice, computeSecondsToNext, formatBRL, type AuctionOffer } from "@/lib/auction-api";
import { FaqSection, faqToJsonLd, type FaqItem } from "@/components/site/FaqSection";

const LEILOES_FAQ: FaqItem[] = [
  {
    q: "O que é um leilão reverso de oferta?",
    a: "É um leilão onde o preço cai sozinho com o tempo, em vez de subir. Quanto mais você espera, mais barato fica — mas alguém pode reservar antes de você e travar o preço.",
  },
  {
    q: "Como funciona a reserva?",
    a: "Ao clicar em reservar, o preço atual fica travado para você. Depois é só combinar a retirada e o pagamento direto com a loja pelo WhatsApp.",
  },
  {
    q: "Quantas unidades cada leilão tem?",
    a: "Cada leilão tem uma quantidade limitada definida pela loja. Quando todas as unidades são reservadas, o leilão encerra como esgotado.",
  },
  {
    q: "Posso cancelar a reserva?",
    a: "A reserva é um compromisso com a loja. Cancelamentos seguem a política informada pela loja nas condições do leilão.",
  },
  {
    q: "Por que só vejo leilões das lojas que sigo?",
    a: "Os leilões são exclusivos para clientes da loja. Siga as lojas que você gosta na OfertasFly para receber os leilões delas no seu feed.",
  },
];

type Row = AuctionOffer & { store: { id: string; name: string; slug: string; logo_url: string | null; featured_badge: boolean } | null };

const HowItWorks = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" /> Como funciona o Leilão de Oferta
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3 text-sm text-muted-foreground">
      <p>
        Leilão reverso: <strong className="text-foreground">o preço cai sozinho conforme o tempo passa</strong>.
        Quanto mais você espera, mais barato fica — mas alguém pode reservar antes de você.
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        <li className="flex items-start gap-2"><TrendingDown className="mt-0.5 h-4 w-4 text-primary" /><span>O preço cai automaticamente em intervalos definidos.</span></li>
        <li className="flex items-start gap-2"><Package className="mt-0.5 h-4 w-4 text-primary" /><span>Cada leilão tem uma quantidade limitada de unidades.</span></li>
        <li className="flex items-start gap-2"><Gavel className="mt-0.5 h-4 w-4 text-primary" /><span>Quando você reserva, o preço atual fica travado para você.</span></li>
        <li className="flex items-start gap-2"><Clock className="mt-0.5 h-4 w-4 text-primary" /><span>O leilão acaba quando esgota ou atinge o preço mínimo.</span></li>
      </ul>
    </CardContent>
  </Card>
);

const AuctionCard = ({ row }: { row: Row }) => {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const price = computeCurrentPrice(row);
  const secsNext = computeSecondsToNext(row);
  const remainingUnits = row.total_quantity - row.reserved_quantity;
  return (
    <Link to={`/leilao/${row.share_token}`} className="group rounded-lg border bg-background transition hover:shadow-md">
      {row.image_url && (
        <img src={row.image_url} alt={row.title} loading="lazy" className="aspect-video w-full rounded-t-lg object-cover" />
      )}
      <div className="space-y-2 p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <StoreAvatar name={row.store?.name ?? "Loja"} logoUrl={row.store?.logo_url ?? null} size={20} />
          <span className="truncate">{row.store?.name ?? "Loja"}</span>
          {row.store?.featured_badge && <StoreFeaturedBadge showLabel={false} />}
          <Badge variant="secondary" className="ml-auto gap-1"><Gavel className="h-3 w-3" /> Leilão</Badge>
        </div>
        <h2 className="line-clamp-2 font-semibold text-foreground group-hover:text-primary">{row.title}</h2>
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-muted-foreground line-through">{formatBRL(Number(row.starting_price))}</span>
          <span className="text-xl font-bold text-accent-strong tabular-nums">{formatBRL(price)}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Package className="h-3.5 w-3.5" /> {remainingUnits} de {row.total_quantity}</span>
          {price > Number(row.min_price) && (
            <span className="inline-flex items-center gap-1"><TrendingDown className="h-3.5 w-3.5" /> próximo em {Math.floor(secsNext / 60)}m {secsNext % 60}s</span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default function Leiloes() {
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
      const { data } = await supabase
        .from("auction_offers" as any)
        .select("*, store:stores(id,name,slug,logo_url,featured_badge)")
        .eq("status", "approved")
        .in("store_id", storeIds)
        .order("created_at", { ascending: false });
      setRows(((data ?? []) as unknown) as Row[]);
      setLoading(false);
    })();
  }, [user?.id]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO
        title="Leilões de Oferta — OfertasFly"
        description="Leilão reverso: o preço cai com o tempo. Veja os leilões ativos das lojas que você segue."
        path="/leiloes"
        jsonLd={faqToJsonLd(LEILOES_FAQ)}
      />
      <Header />
      <main className="container flex-1 space-y-8 py-8">
        <PageHero
          eyebrow="Novo · Leilão reverso"
          title="Leilões de Oferta"
          subtitle="Quem espera mais paga menos. Mas alguém pode reservar antes de você."
          crumbs={[{ label: "Início", to: "/" }, { label: "Leilões" }]}
          compact
        />
        <div className="mx-auto max-w-5xl space-y-6">
          <HowItWorks />


          {authLoading ? (
            <p className="text-muted-foreground">Carregando…</p>
          ) : !user ? (
            <Card>
              <CardHeader><CardTitle>Entre para ver os leilões disponíveis</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Os leilões são exibidos apenas para clientes cadastrados. Faça login ou crie uma conta para ver
                  todos os leilões das <strong>lojas que você segue</strong> e disputar reservas em tempo real.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="accent"><Link to="/auth">Entrar / Cadastrar</Link></Button>
                  <Button asChild variant="outline"><Link to="/">Explorar lojas</Link></Button>
                </div>
              </CardContent>
            </Card>
          ) : loading ? (
            <p className="text-muted-foreground">Carregando leilões…</p>
          ) : followsCount === 0 ? (
            <Alert>
              <Heart className="h-4 w-4" />
              <AlertTitle>Você ainda não segue nenhuma loja</AlertTitle>
              <AlertDescription>
                Siga lojas para receber e visualizar seus leilões aqui.{" "}
                <Link to="/" className="underline">Explorar lojas</Link>
              </AlertDescription>
            </Alert>
          ) : rows.length === 0 ? (
            <Alert>
              <AlertTitle>Nenhum leilão ativo no momento</AlertTitle>
              <AlertDescription>Nenhuma das lojas que você segue tem leilão ativo agora. Volte em breve.</AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {rows.map((r) => <AuctionCard key={r.id} row={r} />)}
            </div>
          )}

          <FaqSection items={LEILOES_FAQ} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
