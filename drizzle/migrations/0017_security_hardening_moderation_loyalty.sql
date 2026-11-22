
-- 1) Internal functions: no direct client access
REVOKE EXECUTE ON FUNCTION public.loyalty_expiring_soon(int) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.loyalty_award(uuid,uuid,text,int,text,uuid,text,int,int,int,boolean) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.loyalty_progress_missions(uuid,uuid,text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.loyalty_recalc_tier(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recompute_flyscore(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calc_flyscore_pilares(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.loyalty_expiring_soon(int) TO service_role;
GRANT EXECUTE ON FUNCTION public.recompute_flyscore(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.recompute_my_flyscore(_store_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.stores WHERE id=_store_id AND owner_id=auth.uid())
  ) THEN RAISE EXCEPTION 'forbidden'; END IF;
  PERFORM public.recompute_flyscore(_store_id);
END $$;
REVOKE EXECUTE ON FUNCTION public.recompute_my_flyscore(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.recompute_my_flyscore(uuid) TO authenticated;

-- 2) has_role: clients can only ask about themselves
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN session_user IN ('anon','authenticated') OR current_setting('role', true) IN ('anon','authenticated')
      THEN (_user_id IS NOT DISTINCT FROM auth.uid()) AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role)
    ELSE EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role)
  END
$$;

-- 3) FlyScore and coupon redemptions: no direct client writes
DROP POLICY IF EXISTS "flyscore owner write" ON public.company_flyscore;
DROP POLICY IF EXISTS "Users insert own redemptions" ON public.coupon_redemptions;

-- 4) Moderation: only admins/system approve
CREATE OR REPLACE FUNCTION public.protect_moderation_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(),'admin') THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending';
  ELSIF NEW.status::text = 'approved' AND OLD.status::text IS DISTINCT FROM 'approved'
    AND NOT (TG_TABLE_NAME = 'offers' AND OLD.status::text = 'paused') THEN
    RAISE EXCEPTION 'Somente o administrador pode aprovar.';
  END IF;
  RETURN NEW;
END $$;

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['offers','auction_offers','group_offers','geo_offers','events'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS a00_protect_moderation ON public.%I', t);
    EXECUTE format('CREATE TRIGGER a00_protect_moderation BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.protect_moderation_status()', t);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.protect_store_approval()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(),'admin') THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN NEW.approved := false;
  ELSE NEW.approved := OLD.approved; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS a00_protect_store_approval ON public.stores;
CREATE TRIGGER a00_protect_store_approval BEFORE INSERT OR UPDATE ON public.stores
FOR EACH ROW EXECUTE FUNCTION public.protect_store_approval();

-- 5) Featured offers respect plan slots
CREATE OR REPLACE FUNCTION public.protect_offer_featured()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_slots int; v_used int;
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(),'admin') THEN RETURN NEW; END IF;
  IF NEW.featured AND (TG_OP='INSERT' OR NOT COALESCE(OLD.featured,false)) THEN
    SELECT p.featured_slots INTO v_slots FROM public.subscriptions s JOIN public.plans p ON p.id=s.plan_id
      WHERE s.store_id=NEW.store_id AND s.status IN ('active','trialing')
      ORDER BY s.updated_at DESC LIMIT 1;
    IF v_slots IS NULL THEN SELECT featured_slots INTO v_slots FROM public.plans WHERE slug='gratis'; END IF;
    SELECT count(*) INTO v_used FROM public.offers WHERE store_id=NEW.store_id AND featured AND id<>NEW.id;
    IF v_used >= COALESCE(v_slots,0) THEN
      RAISE EXCEPTION 'Seu plano não possui vagas de destaque disponíveis.';
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS a01_protect_offer_featured ON public.offers;
CREATE TRIGGER a01_protect_offer_featured BEFORE INSERT OR UPDATE ON public.offers
FOR EACH ROW EXECUTE FUNCTION public.protect_offer_featured();

-- 6) Longer share tokens
ALTER TABLE public.geo_offers ALTER COLUMN share_token SET DEFAULT replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');
ALTER TABLE public.group_offers ALTER COLUMN share_token SET DEFAULT replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');
ALTER TABLE public.auction_offers ALTER COLUMN share_token SET DEFAULT replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');

-- 7) State RPCs hide unapproved items from non-owners
CREATE OR REPLACE FUNCTION public.can_manage_store(_store_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL AND (public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.stores WHERE id=_store_id AND owner_id=auth.uid()))
$$;

DO $$ DECLARE d text; BEGIN
  d := pg_get_functiondef('public.group_offer_state(text)'::regprocedure);
  d := replace(d, $r$IF v_offer.id IS NULL THEN RETURN jsonb_build_object('found', false); END IF;$r$,
    $r$IF v_offer.id IS NULL OR (v_offer.status::text NOT IN ('approved','expired') AND NOT public.can_manage_store(v_offer.store_id)) THEN RETURN jsonb_build_object('found', false); END IF;$r$);
  EXECUTE d;
  d := pg_get_functiondef('public.auction_state(text)'::regprocedure);
  d := replace(d, $r$IF v_offer.id IS NULL THEN RETURN jsonb_build_object('found', false); END IF;$r$,
    $r$IF v_offer.id IS NULL OR (v_offer.status::text NOT IN ('approved','sold_out','expired') AND NOT public.can_manage_store(v_offer.store_id)) THEN RETURN jsonb_build_object('found', false); END IF;$r$);
  EXECUTE d;
  d := pg_get_functiondef('public.geo_offer_state(text,double precision,double precision)'::regprocedure);
  d := replace(d, $r$if v.id is null then return jsonb_build_object('found', false); end if;$r$,
    $r$if v.id is null or (v.status::text not in ('approved','expired') and not public.can_manage_store(v.store_id)) then return jsonb_build_object('found', false); end if;$r$);
  EXECUTE d;
END $$;

CREATE OR REPLACE FUNCTION public.active_geo_offer_for_store(p_store_id uuid)
RETURNS SETOF geo_offers LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select * from public.geo_offers
  where store_id = p_store_id
    and (status = 'approved' or (status = 'pending' and public.can_manage_store(p_store_id)))
  order by created_at desc limit 1;
$$;

DO $$ DECLARE d text; BEGIN
  d := pg_get_functiondef('public.auction_social_proof(uuid)'::regprocedure);
  d := replace(d, $r$BEGIN
  SELECT COALESCE(social_proof_now_window_minutes, 5)$r$, $r$BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.auction_offers a WHERE a.id = p_auction_id
    AND (a.status::text IN ('approved','sold_out','expired') OR public.can_manage_store(a.store_id))) THEN
    RETURN jsonb_build_object('views_today',0,'viewers_now',0,'reserved',0,'total',0);
  END IF;
  SELECT COALESCE(social_proof_now_window_minutes, 5)$r$);
  EXECUTE d;
  d := pg_get_functiondef('public.loyalty_issue_qr()'::regprocedure);
  d := replace(d, $r$lpad((floor(random() * 1000000))::int::text, 6, '0')$r$,
    $r$lpad(((('x' || substr(replace(gen_random_uuid()::text,'-',''),1,8))::bit(32)::bigint) % 1000000)::text, 6, '0')$r$);
  EXECUTE d;
END $$;

-- 8) Cron jobs send the cron secret
DO $$ DECLARE v_secret text; j record; BEGIN
  SELECT substring(command from '"x-cron-secret"\s*:\s*"([^"]+)"') INTO v_secret FROM cron.job WHERE jobname='flash-expire-every-5min';
  IF v_secret IS NULL THEN RETURN; END IF;
  FOR j IN SELECT jobid, command FROM cron.job WHERE jobname IN ('backfill-geocode-stores-daily','generate-review-prompts-every-30min','notify-review-request-daily') AND command NOT LIKE '%x-cron-secret%' LOOP
    PERFORM cron.alter_job(j.jobid, command := replace(j.command, '"Content-Type":"application/json",', '"Content-Type":"application/json","x-cron-secret":"' || v_secret || '",'));
  END LOOP;
END $$;
