-- Track a view event for an auction (reuses offer_events table)
CREATE OR REPLACE FUNCTION public.track_auction_event(
  p_auction_id uuid,
  p_event_type text,
  p_session_id text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_referrer text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_store_id uuid;
BEGIN
  SELECT store_id INTO v_store_id FROM public.auction_offers WHERE id = p_auction_id;
  IF v_store_id IS NULL THEN RETURN; END IF;

  IF p_session_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.offer_events
    WHERE offer_id = p_auction_id
      AND event_type = p_event_type
      AND session_id = p_session_id
      AND created_at > now() - interval '30 minutes'
  ) THEN RETURN; END IF;

  INSERT INTO public.offer_events (offer_id, store_id, event_type, session_id, user_agent, referrer)
  VALUES (p_auction_id, v_store_id, p_event_type, p_session_id, p_user_agent, p_referrer);
END $$;

-- Social proof for an auction
CREATE OR REPLACE FUNCTION public.auction_social_proof(p_auction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_now_window int;
  v_views_today int;
  v_viewers_now int;
  v_reserved int;
  v_total int;
BEGIN
  SELECT COALESCE(social_proof_now_window_minutes, 5) INTO v_now_window
  FROM public.app_settings WHERE id = true;

  SELECT count(DISTINCT COALESCE(session_id, id::text)) INTO v_views_today
  FROM public.offer_events
  WHERE offer_id = p_auction_id AND event_type = 'view'
    AND created_at >= (now() AT TIME ZONE 'America/Sao_Paulo')::date AT TIME ZONE 'America/Sao_Paulo';

  SELECT count(DISTINCT COALESCE(session_id, id::text)) INTO v_viewers_now
  FROM public.offer_events
  WHERE offer_id = p_auction_id AND event_type = 'view'
    AND created_at >= now() - make_interval(mins => v_now_window);

  SELECT reserved_quantity, total_quantity INTO v_reserved, v_total
  FROM public.auction_offers WHERE id = p_auction_id;

  RETURN jsonb_build_object(
    'views_today', COALESCE(v_views_today, 0),
    'viewers_now', COALESCE(v_viewers_now, 0),
    'reserved', COALESCE(v_reserved, 0),
    'total', COALESCE(v_total, 0)
  );
END $$;