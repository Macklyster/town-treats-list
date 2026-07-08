import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Ticket,
  Calendar,
  Store as StoreIcon,
  CheckCircle2,
  Copy,
  AlertCircle,
} from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Detail = {
  id: string;
  unique_code: string | null;
  redeemed_at: string | null;
  created_at: string;
  coupons: {
    title: string;
    kind: "fixed" | "unique";
    code: string | null;
    discount_type: "percent" | "amount";
    discount_value: number;
    valid_until: string | null;
    store_id: string;
    offer_id: string | null;
    stores: { name: string; slug: string | null; logo_url: string | null } | null;
    offers: { id: string; title: string; image_url: string | null } | null;
  } | null;
};

export default function MeuCupomDetalhe() {
  const { id } = useParams();
  const { user } = useAuth();
  const [row, setRow] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id || !user) return;
      const { data } = await supabase
        .from("coupon_redemptions" as any)
        .select(
          `id, unique_code, redeemed_at, created_at,
           coupons:coupon_id (
             title, kind, code, discount_type, discount_value, valid_until,
             store_id, offer_id,
             stores:store_id ( name, slug, logo_url ),
             offers:offer_id ( id, title, image_url )
           )`,
        )
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      setRow(data as unknown as Detail | null);
      setLoading(false);
    })();
  }, [id, user?.id]);

  const code = row?.unique_code ?? row?.coupons?.code ?? "";
  const c = row?.coupons;
  const discount = c
    ? c.discount_type === "percent"
      ? `${Number(c.discount_value)}% OFF`
      : `R$ ${Number(c.discount_value).toFixed(2)} OFF`
    : "";
  const expired =
    c?.valid_until && new Date(c.valid_until) < new Date(new Date().toDateString());

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container flex-1 py-10">
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link to="/meus-cupons">
            <ArrowLeft className="h-4 w-4" /> Meus cupons
          </Link>
        </Button>

        {loading ? (
          <p className="text-muted-foreground">Carregando…</p>
        ) : !row || !c ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Cupom não encontrado.
            </CardContent>
          </Card>
        ) : (
          <div className="mx-auto max-w-xl space-y-4">
            <Card className="overflow-hidden border-primary/30">
              <CardHeader className="bg-primary/5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Ticket className="h-5 w-5 text-primary" />
                      {c.title}
                    </CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {c.stores?.name}
                    </p>
                  </div>
                  <Badge variant="outline" className="font-mono">
                    {discount}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="rounded-lg border-2 border-dashed border-primary/40 bg-background p-6 text-center">
                  <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                    Comprovante de resgate
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <div className="font-mono text-2xl font-bold tracking-widest text-foreground">
                      {code}
                    </div>
                    {code && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          navigator.clipboard.writeText(code);
                          toast.success("Código copiado");
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Apresente este código no estabelecimento
                  </p>
                </div>

                {row.redeemed_at ? (
                  <div className="flex items-center gap-2 rounded-md bg-primary/10 p-3 text-sm text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                    Cupom usado em{" "}
                    {new Date(row.redeemed_at).toLocaleString("pt-BR")}
                  </div>
                ) : expired ? (
                  <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" /> Cupom expirado
                  </div>
                ) : (
                  <div className="rounded-md bg-accent/10 p-3 text-sm text-foreground">
                    Cupom disponível — aguardando validação no estabelecimento.
                  </div>
                )}

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Resgatado em{" "}
                    <span className="text-foreground">
                      {new Date(row.created_at).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  {c.valid_until && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Válido até{" "}
                      <span className="text-foreground">
                        {new Date(c.valid_until).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <StoreIcon className="h-4 w-4" />
                    <span className="text-foreground">{c.stores?.name}</span>
                  </div>
                </div>

                {c.offers && (
                  <>
                    <Separator />
                    <Link
                      to={`/oferta/${c.offers.id}`}
                      className="flex items-center gap-3 rounded-md border p-3 transition hover:border-primary/40"
                    >
                      {c.offers.image_url && (
                        <img
                          src={c.offers.image_url}
                          alt={c.offers.title}
                          className="h-14 w-14 rounded object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Oferta vinculada</p>
                        <p className="text-sm font-medium text-foreground">
                          {c.offers.title}
                        </p>
                      </div>
                    </Link>
                  </>
                )}

                {c.stores?.slug && (
                  <Button asChild variant="outline" className="w-full">
                    <Link to={`/loja/${c.stores.slug}`}>
                      <StoreIcon className="h-4 w-4" /> Ver loja
                    </Link>
                  </Button>
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
