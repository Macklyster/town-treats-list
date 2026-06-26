
-- Remove overly permissive INSERT policies; inserts happen via SECURITY DEFINER RPCs (track_offer_event, geo_offer_register_visit) which bypass RLS.
DROP POLICY IF EXISTS "anyone can insert offer events" ON public.offer_events;
DROP POLICY IF EXISTS "visits insert anyone" ON public.geo_offer_visits;

-- Remove offer_events from Realtime publication to avoid broadcasting analytics rows to subscribers.
ALTER PUBLICATION supabase_realtime DROP TABLE public.offer_events;
