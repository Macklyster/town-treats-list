CREATE OR REPLACE FUNCTION public.duty_schedule_create(p_store_id uuid, p_category text, p_starts timestamptz, p_ends timestamptz)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_store record; v_limit int; v_count int; v_names text; v_id uuid; v_peak_at timestamptz;
BEGIN
  SELECT * INTO v_store FROM public.stores WHERE id = p_store_id;
  IF v_store IS NULL THEN RETURN jsonb_build_object('ok',false,'error','store_not_found'); END IF;
  IF v_store.owner_id <> auth.uid() AND NOT public.has_role(auth.uid(),'admin') THEN
    RETURN jsonb_build_object('ok',false,'error','forbidden');
  END IF;
  IF p_ends <= p_starts THEN RETURN jsonb_build_object('ok',false,'error','invalid_range'); END IF;
  IF p_ends < now() THEN RETURN jsonb_build_object('ok',false,'error','past_range'); END IF;
  IF p_ends - p_starts > interval '31 days' THEN RETURN jsonb_build_object('ok',false,'error','too_long'); END IF;
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = p_category) THEN
    RETURN jsonb_build_object('ok',false,'error','invalid_category');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(lower(v_store.city)||'|'||upper(v_store.state)||'|'||p_category));

  IF EXISTS (SELECT 1 FROM public.store_duty_schedules WHERE store_id = p_store_id AND active
             AND starts_at < p_ends AND ends_at > p_starts) THEN
    RETURN jsonb_build_object('ok',false,'error','own_overlap');
  END IF;

  v_limit := public.duty_limit_for(p_category);

  -- Peak simultaneous concurrency: max overlap always occurs at some interval start
  WITH others AS (
    SELECT d.store_id, d.starts_at, d.ends_at
    FROM public.store_duty_schedules d
    WHERE d.active AND d.store_id <> p_store_id
      AND lower(d.city) = lower(v_store.city) AND upper(d.state) = upper(v_store.state)
      AND d.category_slug = p_category
      AND d.starts_at < p_ends AND d.ends_at > p_starts
  ), points AS (
    SELECT p_starts AS t UNION SELECT starts_at FROM others WHERE starts_at > p_starts
  )
  SELECT p.t, count(DISTINCT o.store_id) INTO v_peak_at, v_count
  FROM points p JOIN others o ON o.starts_at <= p.t AND o.ends_at > p.t
  GROUP BY p.t ORDER BY count(DISTINCT o.store_id) DESC, p.t LIMIT 1;

  v_count := coalesce(v_count, 0);
  IF v_count >= v_limit THEN
    SELECT string_agg(DISTINCT s.name, ', ') INTO v_names
    FROM public.store_duty_schedules d JOIN public.stores s ON s.id = d.store_id
    WHERE d.active AND d.store_id <> p_store_id
      AND lower(d.city) = lower(v_store.city) AND upper(d.state) = upper(v_store.state)
      AND d.category_slug = p_category
      AND d.starts_at <= v_peak_at AND d.ends_at > v_peak_at;
    RETURN jsonb_build_object('ok',false,'error','limit_reached','limit',v_limit,'count',v_count,'stores',v_names,'at',v_peak_at);
  END IF;

  INSERT INTO public.store_duty_schedules(store_id, city, state, category_slug, starts_at, ends_at)
  VALUES (p_store_id, v_store.city, v_store.state, p_category, p_starts, p_ends)
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('ok',true,'id',v_id);
END $$;
GRANT EXECUTE ON FUNCTION public.duty_schedule_create(uuid,text,timestamptz,timestamptz) TO authenticated;