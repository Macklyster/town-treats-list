import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PlanRow = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  max_offers: number;
  featured_slots: number;
  features: string[];
};

export type SubscriptionRow = {
  id: string;
  status: string;
  plan_id: string;
  current_period_end: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  plan: PlanRow | null;
};

export function useSubscription(storeId: string | null | undefined) {
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [offerCount, setOfferCount] = useState(0);
  const [featuredCount, setFeaturedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!storeId) {
      setSubscription(null);
      setOfferCount(0);
      setFeaturedCount(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data: subs }, { count: oc }, { count: fc }] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("id,status,plan_id,current_period_end,stripe_subscription_id,stripe_customer_id,cancel_at_period_end,canceled_at, plan:plans(id,slug,name,price_cents,max_offers,featured_slots,features)")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false })
        .limit(1),
      supabase.from("offers").select("id", { count: "exact", head: true }).eq("store_id", storeId),
      supabase.from("offers").select("id", { count: "exact", head: true }).eq("store_id", storeId).eq("featured", true),
    ]);
    setSubscription((subs?.[0] as any) ?? null);
    setOfferCount(oc ?? 0);
    setFeaturedCount(fc ?? 0);
    setLoading(false);
  }, [storeId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!storeId) return;
    const ch = supabase
      .channel(`sub-${storeId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `store_id=eq.${storeId}` },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [storeId, load]);

  const isActive = !!subscription && ["active", "trialing"].includes(subscription.status);
  const plan = subscription?.plan ?? null;
  const maxOffers = plan?.max_offers ?? 0;
  const featuredSlots = plan?.featured_slots ?? 0;
  const canCreateOffer = isActive && offerCount < maxOffers;
  const canFeature = isActive && featuredCount < featuredSlots;

  return {
    subscription,
    plan,
    isActive,
    offerCount,
    featuredCount,
    maxOffers,
    featuredSlots,
    canCreateOffer,
    canFeature,
    loading,
    refresh: load,
  };
}
