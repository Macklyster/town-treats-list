CREATE OR REPLACE FUNCTION public.offer_social_proof(p_offer_ids uuid[])
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_ids uuid[];
  v_now_window int;
  v_result jsonb;
BEGIN
  IF p_offer_ids IS NULL OR array_length(p_offer_ids, 1) IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;
  v_ids := (SELECT array_agg(x) FROM (SELECT unnest(p_offer_ids) x LIMIT 60) s);

  SELECT COALESCE(social_proof_now_window_minutes, 5) INTO v_now_window
  FROM public.app_settings WHERE id = true;

  WITH base AS (
    SELECT o.id AS offer_id FROM public.offers o WHERE o.id = ANY(v_ids)
  ),
  today_views AS (
    SELECT offer_id, count(DISTINCT COALESCE(session_id, id::text)) AS c
    FROM public.offer_events
    WHERE offer_id = ANY(v_ids) AND event_type = 'view'
      AND created_at >= (now() AT TIME ZONE 'America/Sao_Paulo')::date AT TIME ZONE 'America/Sao_Paulo'
    GROUP BY offer_id
  ),
  today_contacts AS (
    SELECT offer_id, count(*) AS c
    FROM public.offer_events
    WHERE offer_id = ANY(v_ids) AND event_type IN ('whatsapp_click','phone_click')
      AND created_at >= (now() AT TIME ZONE 'America/Sao_Paulo')::date AT TIME ZONE 'America/Sao_Paulo'
    GROUP BY offer_id
  ),
  viewers_now AS (
    SELECT offer_id, count(DISTINCT COALESCE(session_id, id::text)) AS c
    FROM public.offer_events
    WHERE offer_id = ANY(v_ids) AND event_type = 'view'
      AND created_at >= now() - make_interval(mins => v_now_window)
    GROUP BY offer_id
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'offer_id', b.offer_id,
    'eligible', true,
    'views_today', COALESCE(tv.c, 0),
    'contacts_today', COALESCE(tc.c, 0),
    'viewers_now', COALESCE(vn.c, 0)
  )), '[]'::jsonb) INTO v_result
  FROM base b
  LEFT JOIN today_views tv ON tv.offer_id = b.offer_id
  LEFT JOIN today_contacts tc ON tc.offer_id = b.offer_id
  LEFT JOIN viewers_now vn ON vn.offer_id = b.offer_id;

  RETURN v_result;
END $function$;