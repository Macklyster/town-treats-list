
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS social_proof_min_views_today integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS social_proof_min_viewers_now integer NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS social_proof_now_window_minutes integer NOT NULL DEFAULT 5;

CREATE INDEX IF NOT EXISTS idx_offer_events_offer_created
  ON public.offer_events (offer_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.offer_social_proof(p_offer_ids uuid[])
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ids uuid[];
  v_now_window int;
  v_result jsonb;
BEGIN
  IF p_offer_ids IS NULL OR array_length(p_offer_ids, 1) IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;
  -- cap to 60 ids
  v_ids := (SELECT array_agg(x) FROM (SELECT unnest(p_offer_ids) x LIMIT 60) s);

  SELECT COALESCE(social_proof_now_window_minutes, 5) INTO v_now_window
  FROM public.app_settings WHERE id = true;

  WITH eligible AS (
    SELECT o.id AS offer_id, o.store_id,
      EXISTS (
        SELECT 1 FROM public.subscriptions sub
        JOIN public.plans p ON p.id = sub.plan_id
        WHERE sub.store_id = o.store_id
          AND sub.status = 'active'
          AND p.slug IN ('destaque','plus')
      ) AS eligible
    FROM public.offers o
    WHERE o.id = ANY(v_ids)
  ),
  today_views AS (
    SELECT offer_id, count(DISTINCT COALESCE(session_id, id::text)) AS c
    FROM public.offer_events
    WHERE offer_id = ANY(v_ids)
      AND event_type = 'view'
      AND created_at >= (now() AT TIME ZONE 'America/Sao_Paulo')::date AT TIME ZONE 'America/Sao_Paulo'
    GROUP BY offer_id
  ),
  today_contacts AS (
    SELECT offer_id, count(*) AS c
    FROM public.offer_events
    WHERE offer_id = ANY(v_ids)
      AND event_type IN ('whatsapp_click','phone_click')
      AND created_at >= (now() AT TIME ZONE 'America/Sao_Paulo')::date AT TIME ZONE 'America/Sao_Paulo'
    GROUP BY offer_id
  ),
  viewers_now AS (
    SELECT offer_id, count(DISTINCT COALESCE(session_id, id::text)) AS c
    FROM public.offer_events
    WHERE offer_id = ANY(v_ids)
      AND event_type = 'view'
      AND created_at >= now() - make_interval(mins => v_now_window)
    GROUP BY offer_id
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'offer_id', e.offer_id,
    'eligible', e.eligible,
    'views_today', CASE WHEN e.eligible THEN COALESCE(tv.c, 0) ELSE 0 END,
    'contacts_today', CASE WHEN e.eligible THEN COALESCE(tc.c, 0) ELSE 0 END,
    'viewers_now', CASE WHEN e.eligible THEN COALESCE(vn.c, 0) ELSE 0 END
  )), '[]'::jsonb) INTO v_result
  FROM eligible e
  LEFT JOIN today_views tv ON tv.offer_id = e.offer_id
  LEFT JOIN today_contacts tc ON tc.offer_id = e.offer_id
  LEFT JOIN viewers_now vn ON vn.offer_id = e.offer_id;

  RETURN v_result;
END $$;

ALTER TABLE public.offer_events REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'offer_events'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.offer_events';
  END IF;
END $$;
