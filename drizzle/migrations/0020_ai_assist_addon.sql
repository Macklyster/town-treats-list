CREATE TABLE public.store_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  addon text NOT NULL CHECK (addon IN ('ai_assist')),
  status text NOT NULL DEFAULT 'incomplete',
  stripe_customer_id text,
  stripe_subscription_id text UNIQUE,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX store_addons_store_idx ON public.store_addons(store_id, addon);
GRANT SELECT ON public.store_addons TO authenticated;
GRANT ALL ON public.store_addons TO service_role;
ALTER TABLE public.store_addons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners and admins read addons" ON public.store_addons FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()));
CREATE TRIGGER store_addons_updated_at BEFORE UPDATE ON public.store_addons FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.store_has_ai_assist(p_store_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions su JOIN public.plans p ON p.id = su.plan_id
    WHERE su.store_id = p_store_id AND su.status IN ('active','trialing') AND p.slug IN ('destaque','plus')
  ) OR EXISTS (
    SELECT 1 FROM public.store_addons a
    WHERE a.store_id = p_store_id AND a.addon = 'ai_assist' AND a.status IN ('active','trialing')
      AND (a.current_period_end IS NULL OR a.current_period_end > now())
  )
$$;
GRANT EXECUTE ON FUNCTION public.store_has_ai_assist(uuid) TO authenticated, service_role;