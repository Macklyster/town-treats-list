-- Indexes for analytics performance
CREATE INDEX IF NOT EXISTS idx_offer_events_store_created ON public.offer_events (store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_offer_events_offer_type ON public.offer_events (offer_id, event_type);

-- Per-store intelligence (owner or admin only)
CREATE OR REPLACE FUNCTION public.store_intelligence(p_store_id uuid, p_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_since timestamptz := now() - make_interval(days => greatest(p_days, 1));
  v_views int;
  v_contacts int;
  v_result jsonb;
BEGIN
  SELECT owner_id INTO v_owner FROM public.stores WHERE id = p_store_id;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'store not found';
  END IF;
  IF NOT (auth.uid() = v_owner OR public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT
    coalesce(sum(case when event_type = 'view' then 1 else 0 end), 0),
    coalesce(sum(case when event_type in ('whatsapp_click','phone_click') then 1 else 0 end), 0)
  INTO v_views, v_contacts
  FROM public.offer_events
  WHERE store_id = p_store_id AND created_at >= v_since;

  v_result := jsonb_build_object(
    'period_days', p_days,
    'views', v_views,
    'contacts', v_contacts,
    'conversion_rate', case when v_views > 0 then round((v_contacts::numeric / v_views) * 100, 2) else 0 end,
    'whatsapp_clicks', (
      SELECT count(*) FROM public.offer_events
      WHERE store_id = p_store_id AND created_at >= v_since AND event_type = 'whatsapp_click'
    ),
    'phone_clicks', (
      SELECT count(*) FROM public.offer_events
      WHERE store_id = p_store_id AND created_at >= v_since AND event_type = 'phone_click'
    ),
    'daily', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'date', d::date,
        'views', coalesce(v.views, 0),
        'contacts', coalesce(v.contacts, 0)
      ) ORDER BY d), '[]'::jsonb)
      FROM generate_series(date_trunc('day', v_since), date_trunc('day', now()), interval '1 day') d
      LEFT JOIN (
        SELECT date_trunc('day', created_at) AS day,
               sum(case when event_type = 'view' then 1 else 0 end) AS views,
               sum(case when event_type in ('whatsapp_click','phone_click') then 1 else 0 end) AS contacts
        FROM public.offer_events
        WHERE store_id = p_store_id AND created_at >= v_since
        GROUP BY 1
      ) v ON v.day = d
    ),
    'heatmap', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'dow', dow,
        'hour', hour,
        'count', cnt
      )), '[]'::jsonb)
      FROM (
        SELECT extract(dow from created_at)::int AS dow,
               extract(hour from created_at)::int AS hour,
               count(*) AS cnt
        FROM public.offer_events
        WHERE store_id = p_store_id AND created_at >= v_since
        GROUP BY 1, 2
      ) h
    ),
    'top_offers', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'offer_id', t.offer_id,
        'title', o.title,
        'views', t.views,
        'contacts', t.contacts,
        'conversion_rate', case when t.views > 0 then round((t.contacts::numeric / t.views) * 100, 2) else 0 end
      ) ORDER BY t.contacts DESC, t.views DESC), '[]'::jsonb)
      FROM (
        SELECT offer_id,
               sum(case when event_type = 'view' then 1 else 0 end) AS views,
               sum(case when event_type in ('whatsapp_click','phone_click') then 1 else 0 end) AS contacts
        FROM public.offer_events
        WHERE store_id = p_store_id AND created_at >= v_since
        GROUP BY offer_id
        ORDER BY contacts DESC, views DESC
        LIMIT 5
      ) t
      JOIN public.offers o ON o.id = t.offer_id
    )
  );

  RETURN v_result;
END;
$$;

-- Category/city benchmark (only aggregates, no other-store data exposed)
CREATE OR REPLACE FUNCTION public.category_benchmark(p_store_id uuid, p_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_city text;
  v_state text;
  v_since timestamptz := now() - make_interval(days => greatest(p_days, 1));
  v_categories text[];
  v_self jsonb;
  v_peers jsonb;
BEGIN
  SELECT owner_id, city, state INTO v_owner, v_city, v_state
  FROM public.stores WHERE id = p_store_id;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'store not found';
  END IF;
  IF NOT (auth.uid() = v_owner OR public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- Categories the store actually publishes in (limit benchmark scope)
  SELECT array_agg(DISTINCT category_slug) INTO v_categories
  FROM public.offers WHERE store_id = p_store_id AND status = 'approved';

  IF v_categories IS NULL OR array_length(v_categories, 1) = 0 THEN
    RETURN jsonb_build_object(
      'has_data', false,
      'reason', 'no_categories'
    );
  END IF;

  -- Per-store aggregates among peers (same city + categories), incl. self
  WITH peer_stores AS (
    SELECT DISTINCT s.id, s.id = p_store_id AS is_self
    FROM public.stores s
    JOIN public.offers o ON o.store_id = s.id AND o.status = 'approved'
    WHERE s.approved = true
      AND s.city = v_city AND s.state = v_state
      AND o.category_slug = ANY(v_categories)
  ),
  store_stats AS (
    SELECT
      ps.id AS store_id,
      ps.is_self,
      coalesce(sum(case when e.event_type = 'view' then 1 else 0 end), 0) AS views,
      coalesce(sum(case when e.event_type in ('whatsapp_click','phone_click') then 1 else 0 end), 0) AS contacts
    FROM peer_stores ps
    LEFT JOIN public.offer_events e
      ON e.store_id = ps.id AND e.created_at >= v_since
    GROUP BY ps.id, ps.is_self
  ),
  computed AS (
    SELECT
      store_id,
      is_self,
      views,
      contacts,
      case when views > 0 then (contacts::numeric / views) * 100 else 0 end AS conversion
    FROM store_stats
  )
  SELECT
    jsonb_build_object(
      'views', max(case when is_self then views end),
      'contacts', max(case when is_self then contacts end),
      'conversion', max(case when is_self then conversion end)
    ),
    jsonb_build_object(
      'peer_count', count(*) - 1,
      'avg_views', round(avg(views), 1),
      'avg_contacts', round(avg(contacts), 1),
      'avg_conversion', round(avg(conversion), 2),
      'median_conversion', round(percentile_cont(0.5) WITHIN GROUP (ORDER BY conversion)::numeric, 2),
      'self_percentile_conversion',
        round(
          (
            count(*) FILTER (WHERE conversion <= max(computed.conversion) FILTER (WHERE is_self) OVER ())::numeric
            / nullif(count(*), 0) * 100
          ), 0
        )
    )
  INTO v_self, v_peers
  FROM computed;

  -- Recompute percentile cleanly (window above is awkward in aggregate context)
  WITH peer_stores AS (
    SELECT DISTINCT s.id, s.id = p_store_id AS is_self
    FROM public.stores s
    JOIN public.offers o ON o.store_id = s.id AND o.status = 'approved'
    WHERE s.approved = true
      AND s.city = v_city AND s.state = v_state
      AND o.category_slug = ANY(v_categories)
  ),
  store_stats AS (
    SELECT
      ps.id AS store_id,
      ps.is_self,
      case when sum(case when e.event_type = 'view' then 1 else 0 end) > 0
        then sum(case when e.event_type in ('whatsapp_click','phone_click') then 1 else 0 end)::numeric
             / sum(case when e.event_type = 'view' then 1 else 0 end) * 100
        else 0
      end AS conversion
    FROM peer_stores ps
    LEFT JOIN public.offer_events e
      ON e.store_id = ps.id AND e.created_at >= v_since
    GROUP BY ps.id, ps.is_self
  ),
  self_val AS (SELECT conversion FROM store_stats WHERE is_self LIMIT 1),
  pct AS (
    SELECT
      round(
        (count(*) FILTER (WHERE conversion <= (SELECT conversion FROM self_val)))::numeric
        / nullif(count(*), 0) * 100
      , 0) AS percentile,
      count(*) - 1 AS peer_count
    FROM store_stats
  )
  SELECT jsonb_set(v_peers, '{self_percentile_conversion}', to_jsonb(percentile))
  INTO v_peers
  FROM pct;

  RETURN jsonb_build_object(
    'has_data', true,
    'period_days', p_days,
    'city', v_city,
    'state', v_state,
    'categories', to_jsonb(v_categories),
    'self', v_self,
    'peers', v_peers
  );
END;
$$;

-- Restrict execution to authenticated users (functions still enforce ownership internally)
REVOKE EXECUTE ON FUNCTION public.store_intelligence(uuid, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.category_benchmark(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.store_intelligence(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.category_benchmark(uuid, integer) TO authenticated;