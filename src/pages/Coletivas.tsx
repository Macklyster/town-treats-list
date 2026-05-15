import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { SEO } from "@/components/seo/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Users, Clock, Sparkles, TrendingDown, Share2, Heart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatBRLNumber } from "@/lib/format";
import type { Tier, GroupOffer } from "@/lib/group-offers-api";

type Row = GroupOffer & {
  store: { id: string; name: string; slug: string; logo_url: string | null } | null;
  participants_count: number;
};

const HowItWorks = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" /> Como funciona a OfertasFly Coletiva
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3 text-sm text-muted-foreground">
      <p>
        Compra coletiva viral: <strong className="text-foreground">quanto mais amigos entram, menor o preço para todos</strong>.
        Cada coletiva tem faixas de preço — uma escada que cai conforme novas pessoas garantem participação.
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        <li className="flex items-start gap-2">
          <TrendingDown className="mt-0.5 h-4 w-4 text-primary" />
          <span>O preço cai automaticamente a cada faixa atingida.</span>
        </li>
        <li className="flex items-start gap-2">
          <Users className="mt-0.5 h-4 w-4 text-primary" />
          <span>Todos pagam o último preço alcançado pelo grupo.</span>
        </li>
        <li className="flex items-start gap-2">
          <Clock className="mt-0.5 h-4 w-4 text-primary" />
          <span>Cada coletiva tem prazo definido pela loja para se completar.</span>
        </li>
        <li className="flex items-start gap-2">
          <Share2 className="mt-0.5 h-4 w-4 text-primary" />
          <span>Compartilhe pelo WhatsApp para destravar preços melhores.</span>
        </li>
      </ul>
    </CardContent>
  </Card>
);

export default function Coletivas() {
  const { user, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [followsCount, setFollowsCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data: follows } = await supabase
        .from("store_followers")
        .select("store_id")
        .eq("user_id", user.id);
      const storeIds = (follows ?? []).map((f: any) => f.store_id);
      setFollowsCount(storeIds.length);
      if (storeIds.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("group_offers" as any)
        .select(
          "id,title,description,image_url,category_slug,original_price,tiers,duration_hours,ends_at,status,share_token,store_id, store:stores(id,name,slug,logo_url), participants:group_offer_participants(count)",
        )
        .eq("status", "approved")
        .in("store_id", storeIds)
        .order("created_at", { ascending: false });
      const mapped: Row[] = ((data ?? []) as any[]).map((r) => ({
        ...r,
        participants_count: r.participants?.[0]?.count ?? 0,
      }));
      setRows(mapped);
      setLoading(false);
    })();
  }, [user?.id]);

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <SEO
        title="Ofertas Coletivas — OfertasFly"
        description="Compra coletiva: quanto mais amigos entram, menor o preço. Veja as ofertas coletivas das lojas que você segue."
      />
      <Header />
      <main className="container flex-1 py-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <header className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-display text-foreground">Ofertas Coletivas</h1>
              <Badge variant="secondary">Novo</Badge>
            </div>
            <p className="text-muted-foreground">
              Compre junto, pague menos. Quanto mais pessoas entram, menor o preço para todo o grupo.
            </p>
          </header>

          <HowItWorks />

          {authLoading ? (
            <p className="text-muted-foreground">Carregando…</p>
          ) : !user ? (
            <Card>
              <CardHeader>
                <CardTitle>Entre para ver as coletivas disponíveis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  As ofertas coletivas são exibidas apenas para clientes cadastrados. Faça login ou crie uma conta
                  para ver todas as coletivas das <strong>lojas que você segue</strong> e participar dos descontos
                  em grupo.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="accent">
                    <Link to="/auth">Entrar / Cadastrar</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/">Explorar lojas</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : loading ? (
            <p className="text-muted-foreground">Carregando coletivas…</p>
          ) : followsCount === 0 ? (
            <Alert>
              <Heart className="h-4 w-4" />
              <AlertTitle>Você ainda não segue nenhuma loja</AlertTitle>
              <AlertDescription>
                Siga lojas para receber e visualizar suas ofertas coletivas aqui.{" "}
                <Link to="/" className="underline">Explorar lojas</Link>
              </AlertDescription>
            </Alert>
          ) : rows.length === 0 ? (
            <Alert>
              <AlertTitle>Nenhuma coletiva ativa no momento</AlertTitle>
              <AlertDescription>
                Nenhuma das lojas que você segue tem coletiva ativa agora. Volte em breve — novas ofertas surgem
                a qualquer momento.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {rows.map((r) => {
                const tiers = (r.tiers ?? []) as Tier[];
                const minPrice = tiers.length ? Math.min(...tiers.map((t) => Number(t.price))) : 0;
                const maxPeople = tiers.length ? Math.max(...tiers.map((t) => t.min_people)) : 1;
                return (
                  <Link
                    key={r.id}
                    to={`/coletiva/${r.share_token}`}
                    className="group rounded-lg border bg-background transition hover:shadow-md"
                  >
                    {r.image_url && (
                      <img
                        src={r.image_url}
                        alt={r.title}
                        loading="lazy"
                        className="aspect-video w-full rounded-t-lg object-cover"
                      />
                    )}
                    <div className="space-y-2 p-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {r.store?.logo_url && (
                          <img src={r.store.logo_url} alt="" className="h-5 w-5 rounded-full object-cover" />
                        )}
                        <span className="truncate">{r.store?.name ?? "Loja"}</span>
                      </div>
                      <h2 className="line-clamp-2 font-semibold text-foreground group-hover:text-primary">
                        {r.title}
                      </h2>
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-xs text-muted-foreground line-through">
                          {formatBRLNumber(Number(r.original_price))}
                        </span>
                        <span className="text-lg font-bold text-primary">
                          a partir de {formatBRLNumber(minPrice)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" /> {r.participants_count} já entraram
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <TrendingDown className="h-3.5 w-3.5" /> até {maxPeople}+ pessoas
                        </span>
                        {r.ends_at && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            encerra {new Date(r.ends_at).toLocaleString("pt-BR")}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
