-- Auction reservations: only via reserve_auction RPC
DROP POLICY IF EXISTS "reservations insert self" ON public.auction_reservations;
CREATE OR REPLACE FUNCTION public.protect_auction_reservation() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  NEW.reserved_price := OLD.reserved_price; NEW.auction_id := OLD.auction_id;
  NEW.user_id := OLD.user_id; NEW.reserved_at := OLD.reserved_at;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_protect_auction_reservation ON public.auction_reservations;
CREATE TRIGGER trg_protect_auction_reservation BEFORE UPDATE ON public.auction_reservations FOR EACH ROW EXECUTE FUNCTION public.protect_auction_reservation();

-- Stores: owners cannot change trial / managed / badge fields
CREATE OR REPLACE FUNCTION public.protect_store_approval() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(),'admin') THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.approved := false; NEW.trial_days_override := NULL; NEW.trial_granted_at := NULL;
    NEW.managed_offers := false; NEW.managed_offers_since := NULL; NEW.managed_offers_notes := NULL;
    NEW.featured_badge := false;
  ELSE
    NEW.approved := OLD.approved; NEW.trial_days_override := OLD.trial_days_override;
    NEW.trial_granted_at := OLD.trial_granted_at; NEW.managed_offers := OLD.managed_offers;
    NEW.managed_offers_since := OLD.managed_offers_since; NEW.managed_offers_notes := OLD.managed_offers_notes;
    NEW.featured_badge := OLD.featured_badge;
  END IF;
  RETURN NEW;
END $function$;

-- Offer quota per plan
CREATE OR REPLACE FUNCTION public.enforce_offer_quota() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_max int; v_count int;
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(),'admin') THEN RETURN NEW; END IF;
  SELECT p.max_offers INTO v_max FROM public.subscriptions s JOIN public.plans p ON p.id = s.plan_id
   WHERE s.store_id = NEW.store_id AND s.status IN ('active','trialing') ORDER BY s.created_at DESC LIMIT 1;
  IF v_max IS NULL THEN SELECT max_offers INTO v_max FROM public.plans WHERE slug='gratis'; END IF;
  v_max := coalesce(v_max, 1);
  SELECT count(*) INTO v_count FROM public.offers WHERE store_id = NEW.store_id AND status IN ('pending','approved');
  IF v_count >= v_max THEN RAISE EXCEPTION 'Limite de ofertas do plano atingido'; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_enforce_offer_quota ON public.offers;
CREATE TRIGGER trg_enforce_offer_quota BEFORE INSERT ON public.offers FOR EACH ROW EXECUTE FUNCTION public.enforce_offer_quota();

-- Stronger check-in codes
CREATE OR REPLACE FUNCTION public.loyalty_issue_qr() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE v_uid uuid := auth.uid(); v_code text; v_alpha text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; v_bytes bytea; i int;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'auth_required'); END IF;
  UPDATE public.loyalty_checkin_tokens SET expires_at = now() WHERE user_id = v_uid AND used_at IS NULL AND expires_at > now();
  LOOP
    v_bytes := decode(replace(gen_random_uuid()::text,'-',''),'hex'); v_code := '';
    FOR i IN 0..7 LOOP v_code := v_code || substr(v_alpha, (get_byte(v_bytes, i) % 32) + 1, 1); END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.loyalty_checkin_tokens WHERE code = v_code AND expires_at > now());
  END LOOP;
  DELETE FROM public.loyalty_checkin_tokens WHERE code = v_code;
  INSERT INTO public.loyalty_checkin_tokens (user_id, code, expires_at) VALUES (v_uid, v_code, now() + interval '60 seconds');
  RETURN jsonb_build_object('ok', true, 'code', v_code, 'expires_at', now() + interval '60 seconds');
END $function$;

-- Patch existing functions in place
DO $do$
DECLARE d text;
BEGIN
  -- owners never earn points at their own store
  d := pg_get_functiondef('public.loyalty_award(uuid,uuid,text,integer,text,uuid,text,integer,integer,integer,boolean)'::regprocedure);
  IF position('owner_self_block' in d) = 0 THEN
    d := regexp_replace(d, '\mBEGIN\M', E'BEGIN\n  /* owner_self_block */ IF EXISTS (SELECT 1 FROM public.stores WHERE id = _store_id AND owner_id = _user_id) THEN RETURN NULL; END IF;', '');
    EXECUTE d;
  END IF;

  d := pg_get_functiondef('public.claim_unique_coupon(uuid)'::regprocedure);
  IF position('store_approved_check' in d) = 0 THEN
    d := replace(d, E'RAISE EXCEPTION ''invalid coupon'';\n  END IF;', E'RAISE EXCEPTION ''invalid coupon'';\n  END IF;\n  /* store_approved_check */ IF NOT EXISTS (SELECT 1 FROM public.stores WHERE id = v.store_id AND approved) THEN RAISE EXCEPTION ''invalid coupon''; END IF;');
    IF position('store_approved_check' in d) = 0 THEN RAISE EXCEPTION 'patch claim_unique_coupon failed'; END IF;
    EXECUTE d;
  END IF;

  d := pg_get_functiondef('public.store_intelligence(uuid,integer)'::regprocedure);
  IF position('plan_check' in d) = 0 THEN
    d := replace(d, E'RAISE EXCEPTION ''forbidden'';\n  END IF;', E'RAISE EXCEPTION ''forbidden'';\n  END IF;\n  /* plan_check */ IF NOT public.has_role(v_caller,''admin'') AND NOT EXISTS (SELECT 1 FROM public.subscriptions s JOIN public.plans p ON p.id=s.plan_id WHERE s.store_id=p_store_id AND s.status IN (''active'',''trialing'') AND p.slug IN (''destaque'',''plus'')) THEN RAISE EXCEPTION ''plan_required''; END IF;');
    IF position('plan_check' in d) = 0 THEN RAISE EXCEPTION 'patch store_intelligence failed'; END IF;
    EXECUTE d;
  END IF;

  d := pg_get_functiondef('public.category_benchmark(uuid,integer)'::regprocedure);
  IF position('plan_check' in d) = 0 THEN
    d := replace(d, E'RAISE EXCEPTION ''forbidden'';\n  END IF;', E'RAISE EXCEPTION ''forbidden'';\n  END IF;\n  /* plan_check */ IF NOT public.has_role(v_caller,''admin'') AND NOT EXISTS (SELECT 1 FROM public.subscriptions s JOIN public.plans p ON p.id=s.plan_id WHERE s.store_id=p_store_id AND s.status IN (''active'',''trialing'') AND p.slug = ''plus'') THEN RAISE EXCEPTION ''plan_required''; END IF;');
    IF position('plan_check' in d) = 0 THEN RAISE EXCEPTION 'patch category_benchmark failed'; END IF;
    EXECUTE d;
  END IF;
END $do$;