-- Fix 1: permitir features exclusivas Plus durante o trial (status='trialing'), não só 'active'.
-- Alinha com validate_offer_schedule que já aceita ambos.

CREATE OR REPLACE FUNCTION public.validate_geo_offer()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare v_count int; v_max int; v_is_plus boolean;
begin
  if NEW.radius_meters < 50 or NEW.radius_meters > 5000 then
    raise exception 'radius_meters must be between 50 and 5000';
  end if;
  if NEW.promo_price >= NEW.original_price then
    raise exception 'promo_price must be less than original_price';
  end if;
  if NEW.time_end <= NEW.time_start then
    raise exception 'time_end must be greater than time_start';
  end if;

  if (TG_OP = 'INSERT') or (NEW.status in ('pending','approved') and TG_OP='UPDATE' and OLD.status not in ('pending','approved')) then
    select exists (
      select 1 from public.subscriptions sub
      join public.plans p on p.id = sub.plan_id
      where sub.store_id = NEW.store_id and sub.status in ('active','trialing') and p.slug = 'plus'
    ) into v_is_plus;
    if not v_is_plus and not public.has_role(auth.uid(),'admin') then
      raise exception 'geo offers are exclusive to the Plus plan';
    end if;

    select coalesce(geo_offer_max_active_per_store, 1) into v_max from public.app_settings where id = true;
    select count(*) into v_count from public.geo_offers
      where store_id = NEW.store_id and status in ('pending','approved')
        and (NEW.id is null or id <> NEW.id);
    if v_count >= v_max then
      raise exception 'store reached the maximum active geo offers limit (%)', v_max;
    end if;
  end if;

  return NEW;
end $function$;

CREATE OR REPLACE FUNCTION public.validate_auction_offer()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count int;
  v_max_active int;
  v_is_plus boolean;
BEGIN
  IF NEW.starting_price IS NULL OR NEW.min_price IS NULL OR NEW.decrement_amount IS NULL THEN
    RAISE EXCEPTION 'starting_price, min_price and decrement_amount are required';
  END IF;
  IF NEW.min_price >= NEW.starting_price THEN
    RAISE EXCEPTION 'min_price must be less than starting_price';
  END IF;
  IF NEW.decrement_amount <= 0 THEN
    RAISE EXCEPTION 'decrement_amount must be greater than zero';
  END IF;
  IF NEW.decrement_interval_minutes < 5 THEN
    RAISE EXCEPTION 'decrement_interval_minutes must be at least 5';
  END IF;
  IF NEW.total_quantity < 1 THEN
    RAISE EXCEPTION 'total_quantity must be at least 1';
  END IF;
  IF NEW.reserved_quantity < 0 OR NEW.reserved_quantity > NEW.total_quantity THEN
    RAISE EXCEPTION 'reserved_quantity out of bounds';
  END IF;

  IF (TG_OP = 'INSERT')
     OR (NEW.status IN ('pending','approved') AND TG_OP = 'UPDATE' AND OLD.status NOT IN ('pending','approved')) THEN
    SELECT EXISTS (
      SELECT 1 FROM public.subscriptions sub
      JOIN public.plans p ON p.id = sub.plan_id
      WHERE sub.store_id = NEW.store_id
        AND sub.status IN ('active','trialing')
        AND p.slug = 'plus'
    ) INTO v_is_plus;
    IF NOT v_is_plus AND NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'auction offers are exclusive to the Plus plan';
    END IF;

    SELECT COALESCE(auction_max_active_per_store, 1) INTO v_max_active
    FROM public.app_settings WHERE id = true;
    SELECT count(*) INTO v_count FROM public.auction_offers
      WHERE store_id = NEW.store_id
        AND status IN ('pending','approved')
        AND (NEW.id IS NULL OR id <> NEW.id);
    IF v_count >= v_max_active THEN
      RAISE EXCEPTION 'store reached the maximum active auctions limit (%)', v_max_active;
    END IF;
  END IF;

  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION public.validate_group_offer()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_tier jsonb;
  v_prev_people int := 0;
  v_prev_price numeric := NULL;
  v_count int;
  v_first_people int;
  v_max_active int;
  v_is_plus boolean;
BEGIN
  IF NEW.tiers IS NULL OR jsonb_typeof(NEW.tiers) <> 'array' OR jsonb_array_length(NEW.tiers) = 0 THEN
    RAISE EXCEPTION 'tiers must be a non-empty array';
  END IF;

  v_first_people := (NEW.tiers->0->>'min_people')::int;
  IF v_first_people IS NULL OR v_first_people <> 1 THEN
    RAISE EXCEPTION 'first tier must have min_people = 1';
  END IF;

  FOR v_tier IN SELECT * FROM jsonb_array_elements(NEW.tiers) LOOP
    IF (v_tier->>'min_people')::int IS NULL OR (v_tier->>'price')::numeric IS NULL THEN
      RAISE EXCEPTION 'each tier must have min_people and price';
    END IF;
    IF v_prev_price IS NOT NULL THEN
      IF (v_tier->>'min_people')::int <= v_prev_people THEN
        RAISE EXCEPTION 'tiers must be in increasing min_people order';
      END IF;
      IF (v_tier->>'price')::numeric >= v_prev_price THEN
        RAISE EXCEPTION 'tiers must have strictly decreasing prices';
      END IF;
    END IF;
    v_prev_people := (v_tier->>'min_people')::int;
    v_prev_price := (v_tier->>'price')::numeric;
  END LOOP;

  IF (TG_OP = 'INSERT') OR (NEW.status IN ('pending','approved') AND (TG_OP = 'UPDATE' AND OLD.status NOT IN ('pending','approved'))) THEN
    SELECT EXISTS (
      SELECT 1 FROM public.subscriptions sub
      JOIN public.plans p ON p.id = sub.plan_id
      WHERE sub.store_id = NEW.store_id
        AND sub.status IN ('active','trialing')
        AND p.slug = 'plus'
    ) INTO v_is_plus;
    IF NOT v_is_plus AND NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'group offers are exclusive to the Plus plan';
    END IF;

    SELECT COALESCE(group_offer_max_active_per_store, 1) INTO v_max_active FROM public.app_settings WHERE id = true;
    SELECT count(*) INTO v_count FROM public.group_offers
      WHERE store_id = NEW.store_id
        AND status IN ('pending','approved')
        AND (NEW.id IS NULL OR id <> NEW.id);
    IF v_count >= v_max_active THEN
      RAISE EXCEPTION 'store reached the maximum active group offers limit (%)', v_max_active;
    END IF;
  END IF;

  RETURN NEW;
END $function$;

-- Fix 2: alinhar limites do DB com o que o catálogo do front promete
-- Starter: front "Até 3 ofertas ativas" — DB estava 5
-- Destaque: front "Até 10 ofertas ativas" — DB estava 15
UPDATE public.plans SET max_offers = 3 WHERE slug = 'basico';
UPDATE public.plans SET max_offers = 10 WHERE slug = 'destaque';
-- Plus mantém 9999 (efetivamente ilimitado)