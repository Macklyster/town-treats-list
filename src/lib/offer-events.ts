import { supabase } from "@/integrations/supabase/client";

const SID_KEY = "of_sid";

export const getSessionId = (): string => {
  try {
    let sid = localStorage.getItem(SID_KEY);
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem(SID_KEY, sid);
    }
    return sid;
  } catch {
    return "anon";
  }
};

export type OfferEventType = "whatsapp_click" | "phone_click" | "view" | "qr_scan";

export const trackOfferEvent = async (
  offerId: string,
  eventType: OfferEventType,
) => {
  try {
    await supabase.rpc("track_offer_event", {
      p_offer_id: offerId,
      p_event_type: eventType,
      p_session_id: getSessionId(),
      p_user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      p_referrer: typeof document !== "undefined" ? document.referrer || null : null,
    });
  } catch (e) {
    console.warn("trackOfferEvent failed", e);
  }
};
