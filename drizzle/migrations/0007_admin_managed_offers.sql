ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS managed_offers boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS managed_offers_since timestamptz,
  ADD COLUMN IF NOT EXISTS managed_offers_notes text;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS created_by_admin boolean NOT NULL DEFAULT false;
ALTER TABLE public.group_offers ADD COLUMN IF NOT EXISTS created_by_admin boolean NOT NULL DEFAULT false;
ALTER TABLE public.auction_offers ADD COLUMN IF NOT EXISTS created_by_admin boolean NOT NULL DEFAULT false;
ALTER TABLE public.geo_offers ADD COLUMN IF NOT EXISTS created_by_admin boolean NOT NULL DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS created_by_admin boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.is_managed_store(_store_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.stores WHERE id = _store_id AND managed_offers);
$$;

CREATE POLICY "admins insert managed offers" ON public.offers FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') AND public.is_managed_store(store_id));
CREATE POLICY "admins insert managed group offers" ON public.group_offers FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') AND public.is_managed_store(store_id));
CREATE POLICY "admins insert managed auctions" ON public.auction_offers FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') AND public.is_managed_store(store_id));
CREATE POLICY "admins insert managed geo offers" ON public.geo_offers FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') AND public.is_managed_store(store_id));

CREATE OR REPLACE FUNCTION public.trg_admin_offer_audit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_owner uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RETURN NEW; END IF;
  SELECT owner_id INTO v_owner FROM public.stores WHERE id = NEW.store_id;
  IF v_owner = auth.uid() THEN RETURN NEW; END IF;
  INSERT INTO public.admin_audit_log(admin_id, store_id, section, changes)
  VALUES (auth.uid(), NEW.store_id, 'managed_' || TG_TABLE_NAME,
    jsonb_build_object('op', TG_OP, 'id', NEW.id, 'title', NEW.title));
  RETURN NEW;
END $$;

CREATE TRIGGER admin_audit_offers AFTER INSERT OR UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION public.trg_admin_offer_audit();
CREATE TRIGGER admin_audit_group_offers AFTER INSERT OR UPDATE ON public.group_offers FOR EACH ROW EXECUTE FUNCTION public.trg_admin_offer_audit();
CREATE TRIGGER admin_audit_auctions AFTER INSERT OR UPDATE ON public.auction_offers FOR EACH ROW EXECUTE FUNCTION public.trg_admin_offer_audit();
CREATE TRIGGER admin_audit_geo_offers AFTER INSERT OR UPDATE ON public.geo_offers FOR EACH ROW EXECUTE FUNCTION public.trg_admin_offer_audit();
CREATE TRIGGER admin_audit_events AFTER INSERT OR UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.trg_admin_offer_audit();