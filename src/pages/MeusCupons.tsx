import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Ticket, CheckCircle2 } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Row = {
  id: string;
  coupon_id: string;
  unique_code: string | null;
  redeemed_at: string | null;
  created_at: string;
  coupons: {
    title: string;
    kind: string;
    code: string | null;
    discount_type: "percent" | "amount";
    discount_value: number;
    valid_until: string | null;
    store_id: string;
    offer_id: string | null;
    stores: { name: string; slug: string | null } | null;
    offers: { id: string; title: string } | null;
  } | null;
};

export default function MeusCupons() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase
        .from("coupon_redemptions" as any)
        .select(
          `id, coupon_id, unique_code, redeemed_at, created_at,
           coupons:coupon_id (
             title, kind, code, discount_type, discount_value, valid_until, store_id, offer_id,
             stores:store_id ( name, slug ),
             offers:offer_id ( id, title )
           )`,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setRows((data ?? []) as unknown as Row[]);
      setLoading(false);
    })();
  }, [user?.id]);

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <Header />
      <main className="container flex-1 py-10">
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        </Button>
        <h1 className="text-display text-foreground">Meus cupons</h1>
        <p className="mb-6 text-muted-foreground">
          Todos os cupons que você resgatou. Apresente o código no estabelecimento para
          usar o desconto.
        </p>

        {loading ? (
          <p className="text-muted-foreground">Carregando…</p>
        ) : rows.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <Ticket className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">
                Você ainda não resgatou nenhum cupom.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {rows.map((r) => {
              const c = r.coupons;
              const discount = c
                ? c.discount_type === "percent"
                  ? `${Number(c.discount_value)}% OFF`
                  : `R$ ${Number(c.discount_value).toFixed(2)} OFF`
                : "";
              return (
                <Link key={r.id} to={`/meus-cupons/${r.id}`}>
                  <Card className="transition hover:border-primary/40">
                    <CardContent className="space-y-2 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-semibold text-foreground">
                            {c?.title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {c?.stores?.name}
                            {c?.offers?.title ? ` · ${c.offers.title}` : ""}
                          </div>
                        </div>
                        <Badge variant="outline" className="font-mono">
                          {discount}
                        </Badge>
                      </div>
                      {r.unique_code && (
                        <div className="rounded border bg-muted/40 p-2 text-center font-mono text-base font-semibold tracking-widest">
                          {r.unique_code}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Resgatado em{" "}
                          {new Date(r.created_at).toLocaleDateString("pt-BR")}
                        </span>
                        {r.redeemed_at ? (
                          <span className="flex items-center gap-1 text-primary">
                            <CheckCircle2 className="h-3 w-3" /> Usado
                          </span>
                        ) : (
                          <span className="text-accent-foreground">Disponível</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
