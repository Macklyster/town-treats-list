
CREATE TABLE public.offer_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL,
  store_id uuid NOT NULL,
  event_type text NOT NULL,
  session_id text,
  user_agent text,
  referrer text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_offer_events_offer_created ON public.offer_events(offer_id, created_at DESC);
CREATE INDEX idx_offer_events_store_created ON public.offer_events(store_id, created_at DESC);
CREATE INDEX idx_offer_events_type ON public.offer_events(event_type);

ALTER TABLE public.offer_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can insert offer events"
ON public.offer_events FOR INSERT
WITH CHECK (true);

CREATE POLICY "owners and admins read offer events"
ON public.offer_events FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.stores s WHERE s.id = offer_events.store_id AND s.owner_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "admins manage offer events"
ON public.offer_events FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.track_offer_event(
  p_offer_id uuid,
  p_event_type text,
  p_session_id text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_referrer text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store_id uuid;
BEGIN
  SELECT store_id INTO v_store_id FROM public.offers WHERE id = p_offer_id;
  IF v_store_id IS NULL THEN RETURN; END IF;

  IF p_session_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.offer_events
    WHERE offer_id = p_offer_id
      AND event_type = p_event_type
      AND session_id = p_session_id
      AND created_at > now() - interval '30 minutes'
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.offer_events (offer_id, store_id, event_type, session_id, user_agent, referrer)
  VALUES (p_offer_id, v_store_id, p_event_type, p_session_id, p_user_agent, p_referrer);
END;
$$;

GRANT EXECUTE ON FUNCTION public.track_offer_event(uuid, text, text, text, text) TO anon, authenticated;
