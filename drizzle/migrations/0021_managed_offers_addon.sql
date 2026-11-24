CREATE OR REPLACE FUNCTION public.store_has_paid_plan(p_store_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions su JOIN public.plans p ON p.id = su.plan_id
    WHERE su.store_id = p_store_id AND su.status IN ('active','trialing') AND p.slug <> 'gratis' AND p.price_cents > 0
  )
$$;
GRANT EXECUTE ON FUNCTION public.store_has_paid_plan(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.trg_sync_managed_offers_addon()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_active boolean;
BEGIN
  IF NEW.addon <> 'managed_offers' THEN RETURN NEW; END IF;
  v_active := NEW.status IN ('active','trialing');
  UPDATE public.stores SET managed_offers = v_active,
    managed_offers_since = CASE WHEN v_active THEN COALESCE(managed_offers_since, now()) ELSE managed_offers_since END,
    managed_offers_notes = CASE WHEN v_active AND managed_offers_notes IS NULL THEN 'Contratado via assinatura (R$ 59/mês)' ELSE managed_offers_notes END
  WHERE id = NEW.store_id AND managed_offers IS DISTINCT FROM v_active;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS sync_managed_offers_addon ON public.store_addons;
CREATE TRIGGER sync_managed_offers_addon AFTER INSERT OR UPDATE OF status ON public.store_addons
FOR EACH ROW EXECUTE FUNCTION public.trg_sync_managed_offers_addon();