import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Ticket, Copy, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Coupon = {
  id: string;
  store_id: string;
  offer_id: string | null;
  title: string;
  kind: "fixed" | "unique";
  code: string | null;
  discount_type: "percent" | "amount";
  discount_value: number;
  max_uses: number | null;
  uses_count: number;
  max_per_user: number;
  valid_until: string | null;
  active: boolean;
};

type Props = {
  storeId: string;
  offerId?: string | null;
  /**
   * When offerId is provided, also include "whole store" coupons (offer_id null).
   */
  includeStoreWide?: boolean;
};

export function CouponRedeemList({ storeId, offerId, includeStoreWide = true }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [myRedemptions, setMyRedemptions] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    let query = supabase
      .from("coupons" as any)
      .select("*")
      .eq("store_id", storeId)
      .eq("active", true);

    const { data } = await query.order("created_at", { ascending: false });
    let list = ((data ?? []) as unknown as Coupon[]).filter((c) => {
      if (c.valid_until && new Date(c.valid_until) < new Date(new Date().toDateString()))
        return false;
      if (c.max_uses != null && c.uses_count >= c.max_uses) return false;
      if (offerId) {
        return c.offer_id === offerId || (includeStoreWide && c.offer_id == null);
      }
      return c.offer_id == null;
    });
    setCoupons(list);

    if (user && list.length) {
      const { data: rs } = await supabase
        .from("coupon_redemptions" as any)
        .select("coupon_id,id")
        .eq("user_id", user.id)
        .in(
          "coupon_id",
          list.map((c) => c.id),
        );
      const map: Record<string, string> = {};
      ((rs ?? []) as any[]).forEach((r) => (map[r.coupon_id] = r.id));
      setMyRedemptions(map);
    } else {
      setMyRedemptions({});
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, offerId, user?.id]);

  const handleRedeem = async (c: Coupon) => {
    if (!user) {
      toast.info("Faça login para resgatar cupons");
      navigate("/auth");
      return;
    }
    setRedeemingId(c.id);
    const { data, error } = await supabase.rpc("redeem_coupon" as any, {
      p_coupon_id: c.id,
    });
    setRedeemingId(null);
    if (error) {
      const map: Record<string, string> = {
        expired: "Cupom expirado",
        no_uses_left: "Cupom esgotado",
        inactive: "Cupom indisponível",
        store_unavailable: "Loja indisponível",
        unauthenticated: "Faça login para resgatar",
        not_found: "Cupom não encontrado",
      };
      toast.error(map[error.message] ?? error.message);
      return;
    }
    const res = data as any;
    toast.success(res?.already ? "Você já havia resgatado" : "Cupom resgatado!");
    if (res?.redemption_id) navigate(`/meus-cupons/${res.redemption_id}`);
  };

  if (loading) return null;
  if (!coupons.length) return null;

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
        <Ticket className="h-4 w-4 text-primary" />
        Cupons disponíveis
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {coupons.map((c) => {
          const already = !!myRedemptions[c.id];
          const discount =
            c.discount_type === "percent"
              ? `${Number(c.discount_value)}% OFF`
              : `R$ ${Number(c.discount_value).toFixed(2)} OFF`;
          return (
            <Card key={c.id} className="border-primary/20 bg-primary/5">
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-foreground">{c.title}</div>
                    <Badge variant="outline" className="mt-1 font-mono text-xs">
                      {discount}
                    </Badge>
                  </div>
                  {c.kind === "fixed" && c.code && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(c.code!);
                        toast.success("Código copiado");
                      }}
                      className="flex items-center gap-1 rounded border bg-background px-2 py-1 font-mono text-xs text-foreground hover:bg-muted"
                    >
                      {c.code}
                      <Copy className="h-3 w-3" />
                    </button>
                  )}
                </div>
                {c.valid_until && (
                  <p className="text-xs text-muted-foreground">
                    Válido até {new Date(c.valid_until).toLocaleDateString("pt-BR")}
                  </p>
                )}
                {already ? (
                  <Button asChild size="sm" variant="outline" className="w-full">
                    <Link to={`/meus-cupons/${myRedemptions[c.id]}`}>
                      <CheckCircle2 className="h-4 w-4" /> Ver meu cupom
                    </Link>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="accent"
                    className="w-full"
                    onClick={() => handleRedeem(c)}
                    disabled={redeemingId === c.id}
                  >
                    {redeemingId === c.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Resgatando…
                      </>
                    ) : (
                      <>Resgatar cupom</>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
