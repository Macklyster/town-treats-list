ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS trial_default_days integer NOT NULL DEFAULT 14;

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS trial_days_override integer,
  ADD COLUMN IF NOT EXISTS trial_granted_at timestamptz;

CREATE OR REPLACE FUNCTION public.trial_default_days()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT trial_default_days FROM public.app_settings WHERE id = true), 14);
$$;

GRANT EXECUTE ON FUNCTION public.trial_default_days() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.grant_store_trial(p_store_id uuid, p_plan_slug text, p_days integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan public.plans;
  v_end timestamptz;
  v_existing public.subscriptions;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF p_days IS NULL OR p_days < 1 OR p_days > 365 THEN
    RAISE EXCEPTION 'days must be between 1 and 365';
  END IF;
  SELECT * INTO v_plan FROM public.plans WHERE slug = p_plan_slug AND active = true;
  IF v_plan.id IS NULL THEN
    RAISE EXCEPTION 'plan not found';
  END IF;

  v_end := now() + make_interval(days => p_days);

  SELECT * INTO v_existing FROM public.subscriptions
  WHERE store_id = p_store_id
  ORDER BY created_at DESC LIMIT 1;

  IF v_existing.id IS NOT NULL THEN
    UPDATE public.subscriptions
      SET plan_id = v_plan.id,
          status = 'trialing',
          current_period_end = v_end,
          cancel_at_period_end = false,
          canceled_at = NULL,
          updated_at = now()
      WHERE id = v_existing.id;
  ELSE
    INSERT INTO public.subscriptions (store_id, plan_id, status, current_period_end)
    VALUES (p_store_id, v_plan.id, 'trialing', v_end);
  END IF;

  UPDATE public.stores
    SET trial_days_override = p_days,
        trial_granted_at = now()
    WHERE id = p_store_id;

  RETURN jsonb_build_object('ok', true, 'plan', v_plan.slug, 'days', p_days, 'ends_at', v_end);
END $$;

GRANT EXECUTE ON FUNCTION public.grant_store_trial(uuid, text, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_store_trial_override(p_store_id uuid, p_days integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF p_days IS NOT NULL AND (p_days < 1 OR p_days > 365) THEN
    RAISE EXCEPTION 'days must be between 1 and 365';
  END IF;
  UPDATE public.stores
    SET trial_days_override = p_days,
        trial_granted_at = CASE WHEN p_days IS NULL THEN NULL ELSE now() END
    WHERE id = p_store_id;
END $$;

GRANT EXECUTE ON FUNCTION public.set_store_trial_override(uuid, integer) TO authenticated;