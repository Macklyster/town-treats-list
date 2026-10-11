ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS duty_max_concurrent_default integer NOT NULL DEFAULT 1;

CREATE TABLE public.duty_category_limits (
  category_slug text PRIMARY KEY REFERENCES public.categories(slug) ON DELETE CASCADE,
  max_concurrent integer NOT NULL DEFAULT 1 CHECK (max_concurrent BETWEEN 1 AND 50),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.duty_category_limits TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.duty_category_limits TO authenticated;
GRANT ALL ON public.duty_category_limits TO service_role;
ALTER TABLE public.duty_category_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "duty limits public read" ON public.duty_category_limits FOR SELECT USING (true);
CREATE POLICY "duty limits admin write" ON public.duty_category_limits FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.store_duty_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  city text NOT NULL,
  state text NOT NULL,
  category_slug text NOT NULL REFERENCES public.categories(slug),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);
CREATE INDEX store_duty_lookup ON public.store_duty_schedules (city, state, category_slug, starts_at, ends_at) WHERE active;
CREATE INDEX store_duty_store ON public.store_duty_schedules (store_id);
GRANT SELECT ON public.store_duty_schedules TO anon, authenticated;
GRANT UPDATE, DELETE ON public.store_duty_schedules TO authenticated;
GRANT ALL ON public.store_duty_schedules TO service_role;
ALTER TABLE public.store_duty_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "duty public read" ON public.store_duty_schedules FOR SELECT USING (true);
CREATE POLICY "duty owner or admin update" ON public.store_duty_schedules FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()));
CREATE POLICY "duty owner or admin delete" ON public.store_duty_schedules FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.duty_limit_for(p_category text)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT max_concurrent FROM public.duty_category_limits WHERE category_slug = p_category),
    (SELECT duty_max_concurrent_default FROM public.app_settings WHERE id = true),
    1)
$$;

CREATE OR REPLACE FUNCTION public.duty_schedule_create(p_store_id uuid, p_category text, p_starts timestamptz, p_ends timestamptz)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_store record; v_limit int; v_count int; v_names text; v_id uuid;
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
  SELECT count(DISTINCT d.store_id), string_agg(DISTINCT s.name, ', ')
    INTO v_count, v_names
  FROM public.store_duty_schedules d JOIN public.stores s ON s.id = d.store_id
  WHERE d.active AND d.store_id <> p_store_id
    AND lower(d.city) = lower(v_store.city) AND upper(d.state) = upper(v_store.state)
    AND d.category_slug = p_category
    AND d.starts_at < p_ends AND d.ends_at > p_starts;

  IF v_count >= v_limit THEN
    RETURN jsonb_build_object('ok',false,'error','limit_reached','limit',v_limit,'count',v_count,'stores',v_names);
  END IF;

  INSERT INTO public.store_duty_schedules(store_id, city, state, category_slug, starts_at, ends_at)
  VALUES (p_store_id, v_store.city, v_store.state, p_category, p_starts, p_ends)
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('ok',true,'id',v_id);
END $$;
GRANT EXECUTE ON FUNCTION public.duty_schedule_create(uuid,text,timestamptz,timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.duty_limit_for(text) TO anon, authenticated;