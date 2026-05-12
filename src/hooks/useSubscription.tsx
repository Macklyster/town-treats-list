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

const startOfMonthISO = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
};

export function useSubscription(storeId: string | null | undefined) {
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [freePlan, setFreePlan] = useState<PlanRow | null>(null);
  const [offerCount, setOfferCount] = useState(0);
  const [monthlyOfferCount, setMonthlyOfferCount] = useState(0);
  const [featuredCount, setFeaturedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!storeId) {
      setSubscription(null);
      setOfferCount(0);
      setMonthlyOfferCount(0);
      setFeaturedCount(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data: subs }, { count: oc }, { count: mc }, { count: fc }, { data: free }] = await Promise.all([
      supabase
        .from("subscriptions")
        .select(
          "id,status,plan_id,current_period_end,stripe_subscription_id,stripe_customer_id,cancel_at_period_end,canceled_at, plan:plans(id,slug,name,price_cents,max_offers,featured_slots,features)",
        )
        .eq("store_id", storeId)
        .order("created_at", { ascending: false })
        .limit(1),
      supabase.from("offers").select("id", { count: "exact", head: true }).eq("store_id", storeId),
      supabase
        .from("offers")
        .select("id", { count: "exact", head: true })
        .eq("store_id", storeId)
        .gte("created_at", startOfMonthISO()),
      supabase.from("offers").select("id", { count: "exact", head: true }).eq("store_id", storeId).eq("featured", true),
      supabase.from("plans").select("id,slug,name,price_cents,max_offers,featured_slots,features").eq("slug", "gratis").maybeSingle(),
    ]);
    setSubscription((subs?.[0] as any) ?? null);
    setOfferCount(oc ?? 0);
    setMonthlyOfferCount(mc ?? 0);
    setFeaturedCount(fc ?? 0);
    setFreePlan((free as any) ?? null);
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
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [storeId, load]);

  const paidActive = !!subscription && ["active", "trialing"].includes(subscription.status);
  const isFree = !paidActive;
  const fallbackFree: PlanRow = freePlan ?? {
    id: "free",
    slug: "gratis",
    name: "Grátis",
    price_cents: 0,
    max_offers: 1,
    featured_slots: 0,
    features: [],
  };
  const plan: PlanRow | null = paidActive ? subscription!.plan : fallbackFree;
  const maxOffers = plan?.max_offers ?? 0;
  const featuredSlots = plan?.featured_slots ?? 0;
  // On free plan we count offers created this month; paid counts total.
  const usedOffers = isFree ? monthlyOfferCount : offerCount;
  const isActive = paidActive || isFree; // free plan is always "active"
  const canCreateOffer = isActive && usedOffers < maxOffers;
  const canFeature = paidActive && featuredCount < featuredSlots;

  return {
    subscription,
    plan,
    isActive,
    isFree,
    paidActive,
    offerCount: usedOffers,
    totalOfferCount: offerCount,
    monthlyOfferCount,
    featuredCount,
    maxOffers,
    featuredSlots,
    canCreateOffer,
    canFeature,
    loading,
    refresh: load,
  };
}
