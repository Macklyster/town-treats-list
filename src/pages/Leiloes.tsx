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
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { computeCurrentPrice, computeSecondsToNext, formatBRL, type AuctionOffer } from "@/lib/auction-api";

type Row = AuctionOffer & { store: { id: string; name: string; slug: string; logo_url: string | null } | null };

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
          {row.store?.logo_url && <img src={row.store.logo_url} alt="" className="h-5 w-5 rounded-full object-cover" />}
          <span className="truncate">{row.store?.name ?? "Loja"}</span>
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
        .select("*, store:stores(id,name,slug,logo_url)")
        .eq("status", "approved")
        .in("store_id", storeIds)
        .order("created_at", { ascending: false });
      setRows(((data ?? []) as unknown) as Row[]);
      setLoading(false);
    })();
  }, [user?.id]);

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <SEO
        title="Leilões de Oferta — OfertasFly"
        description="Leilão reverso: o preço cai com o tempo. Veja os leilões ativos das lojas que você segue."
        path="/leiloes"
      />
      <Header />
      <main className="container flex-1 py-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <header className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-display text-foreground">Leilões de Oferta</h1>
              <Badge variant="secondary">Novo</Badge>
            </div>
            <p className="text-muted-foreground">
              Quem espera mais paga menos. Mas alguém pode reservar antes de você.
            </p>
          </header>

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
        </div>
      </main>
      <Footer />
    </div>
  );
}
