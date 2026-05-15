import { supabase } from "@/integrations/supabase/client";

export type SocialProof = {
  offer_id: string;
  eligible: boolean;
  views_today: number;
  contacts_today: number;
  viewers_now: number;
};

export const MIN_VIEWS_TODAY = 1;
export const MIN_VIEWERS_NOW = 2;

export const fetchOfferSocialProof = async (
  ids: string[],
): Promise<Map<string, SocialProof>> => {
  const map = new Map<string, SocialProof>();
  if (!ids.length) return map;
  const { data, error } = await supabase.rpc("offer_social_proof" as any, {
    p_offer_ids: ids,
  });
  if (error || !Array.isArray(data)) return map;
  (data as SocialProof[]).forEach((sp) => map.set(sp.offer_id, sp));
  return map;
};

export const subscribeOfferEvents = (
  offerId: string,
  onChange: () => void,
) => {
  const channel = supabase
    .channel(`offer-events-${offerId}`)
    .on(
      "postgres_changes" as any,
      {
        event: "INSERT",
        schema: "public",
        table: "offer_events",
        filter: `offer_id=eq.${offerId}`,
      },
      () => onChange(),
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
};

export const shouldShowViewsToday = (sp: SocialProof | undefined) =>
  !!sp && sp.eligible && sp.views_today >= MIN_VIEWS_TODAY;

export const shouldShowViewersNow = (sp: SocialProof | undefined) =>
  !!sp && sp.eligible && sp.viewers_now >= MIN_VIEWERS_NOW;
