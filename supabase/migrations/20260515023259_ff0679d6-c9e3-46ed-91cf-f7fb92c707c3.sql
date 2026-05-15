
-- Enum para status do leilão
DO $$ BEGIN
  CREATE TYPE public.auction_status AS ENUM ('pending','approved','sold_out','expired','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- App settings: limite de leilões ativos por loja
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS auction_max_active_per_store integer NOT NULL DEFAULT 1;

-- Tabela principal
CREATE TABLE IF NOT EXISTS public.auction_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  image_url text,
  category_slug text NOT NULL,
  conditions text,
  starting_price numeric NOT NULL,
  min_price numeric NOT NULL,
  decrement_amount numeric NOT NULL,
  decrement_interval_minutes integer NOT NULL DEFAULT 60,
  total_quantity integer NOT NULL DEFAULT 1,
  reserved_quantity integer NOT NULL DEFAULT 0,
  starts_at timestamptz,
  ends_at timestamptz,
  status public.auction_status NOT NULL DEFAULT 'pending',
  share_token text NOT NULL DEFAULT lower(substr(replace((gen_random_uuid())::text, '-', ''), 1, 10)),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT auction_offers_share_token_unique UNIQUE (share_token)
);

CREATE INDEX IF NOT EXISTS idx_auction_offers_store ON public.auction_offers(store_id);
CREATE INDEX IF NOT EXISTS idx_auction_offers_status ON public.auction_offers(status);

-- Tabela de reservas
CREATE TABLE IF NOT EXISTS public.auction_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id uuid NOT NULL REFERENCES public.auction_offers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reserved_price numeric NOT NULL,
  reserved_at timestamptz NOT NULL DEFAULT now(),
  whatsapp_clicked_at timestamptz,
  CONSTRAINT auction_reservations_unique_user UNIQUE (auction_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_auction_reservations_user ON public.auction_reservations(user_id);

-- Trigger updated_at
DROP TRIGGER IF EXISTS set_auction_offers_updated_at ON public.auction_offers;
CREATE TRIGGER set_auction_offers_updated_at
BEFORE UPDATE ON public.auction_offers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Validação
CREATE OR REPLACE FUNCTION public.validate_auction_offer()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
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
        AND sub.status = 'active'
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
END $$;

DROP TRIGGER IF EXISTS validate_auction_offer ON public.auction_offers;
CREATE TRIGGER validate_auction_offer
BEFORE INSERT OR UPDATE ON public.auction_offers
FOR EACH ROW EXECUTE FUNCTION public.validate_auction_offer();

-- Calcular janela quando aprovado
CREATE OR REPLACE FUNCTION public.set_auction_window()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_steps int;
BEGIN
  IF NEW.status = 'approved' THEN
    IF NEW.starts_at IS NULL OR (TG_OP = 'UPDATE' AND OLD.status <> 'approved') THEN
      NEW.starts_at := now();
    END IF;
    v_steps := ceil((NEW.starting_price - NEW.min_price) / NEW.decrement_amount)::int;
    NEW.ends_at := NEW.starts_at + make_interval(mins => v_steps * NEW.decrement_interval_minutes);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS set_auction_window ON public.auction_offers;
CREATE TRIGGER set_auction_window
BEFORE INSERT OR UPDATE ON public.auction_offers
FOR EACH ROW EXECUTE FUNCTION public.set_auction_window();

-- RLS
ALTER TABLE public.auction_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "approved auctions public read" ON public.auction_offers;
CREATE POLICY "approved auctions public read" ON public.auction_offers
FOR SELECT USING (
  status IN ('approved','sold_out','expired')
  OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "owners insert auctions" ON public.auction_offers;
CREATE POLICY "owners insert auctions" ON public.auction_offers
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid())
);

DROP POLICY IF EXISTS "owners update auctions" ON public.auction_offers;
CREATE POLICY "owners update auctions" ON public.auction_offers
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "owners delete auctions" ON public.auction_offers;
CREATE POLICY "owners delete auctions" ON public.auction_offers
FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- Reservations
DROP POLICY IF EXISTS "reservations read" ON public.auction_reservations;
CREATE POLICY "reservations read" ON public.auction_reservations
FOR SELECT USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.auction_offers a
    JOIN public.stores s ON s.id = a.store_id
    WHERE a.id = auction_id AND s.owner_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "reservations insert self" ON public.auction_reservations;
CREATE POLICY "reservations insert self" ON public.auction_reservations
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reservations update self" ON public.auction_reservations;
CREATE POLICY "reservations update self" ON public.auction_reservations
FOR UPDATE USING (auth.uid() = user_id);

-- Helper: preço corrente
CREATE OR REPLACE FUNCTION public.auction_current_price(p_offer public.auction_offers)
RETURNS numeric
LANGUAGE sql
STABLE
AS $$
  SELECT GREATEST(
    p_offer.min_price,
    p_offer.starting_price - (
      FLOOR(EXTRACT(EPOCH FROM (now() - COALESCE(p_offer.starts_at, now()))) / (p_offer.decrement_interval_minutes * 60))
      * p_offer.decrement_amount
    )
  );
$$;

-- RPC: state by token
CREATE OR REPLACE FUNCTION public.auction_state(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer public.auction_offers;
  v_current_price numeric;
  v_seconds_next int;
  v_already boolean := false;
  v_store_name text;
  v_store_whatsapp text;
BEGIN
  SELECT * INTO v_offer FROM public.auction_offers WHERE share_token = p_token;
  IF v_offer.id IS NULL THEN RETURN jsonb_build_object('found', false); END IF;

  v_current_price := public.auction_current_price(v_offer);
  IF v_offer.starts_at IS NOT NULL THEN
    v_seconds_next := (v_offer.decrement_interval_minutes * 60)
      - (EXTRACT(EPOCH FROM (now() - v_offer.starts_at))::int % (v_offer.decrement_interval_minutes * 60));
  ELSE
    v_seconds_next := v_offer.decrement_interval_minutes * 60;
  END IF;

  IF auth.uid() IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.auction_reservations
      WHERE auction_id = v_offer.id AND user_id = auth.uid()
    ) INTO v_already;
  END IF;

  SELECT name, whatsapp INTO v_store_name, v_store_whatsapp
  FROM public.stores WHERE id = v_offer.store_id;

  RETURN jsonb_build_object(
    'found', true,
    'offer', jsonb_build_object(
      'id', v_offer.id,
      'store_id', v_offer.store_id,
      'title', v_offer.title,
      'description', v_offer.description,
      'image_url', v_offer.image_url,
      'category_slug', v_offer.category_slug,
      'conditions', v_offer.conditions,
      'starting_price', v_offer.starting_price,
      'min_price', v_offer.min_price,
      'decrement_amount', v_offer.decrement_amount,
      'decrement_interval_minutes', v_offer.decrement_interval_minutes,
      'total_quantity', v_offer.total_quantity,
      'reserved_quantity', v_offer.reserved_quantity,
      'starts_at', v_offer.starts_at,
      'ends_at', v_offer.ends_at,
      'status', v_offer.status,
      'share_token', v_offer.share_token
    ),
    'current_price', v_current_price,
    'seconds_to_next_decrement', GREATEST(v_seconds_next, 0),
    'seconds_remaining', GREATEST(0, EXTRACT(EPOCH FROM (COALESCE(v_offer.ends_at, now()) - now()))::int),
    'already_reserved', v_already,
    'store_name', v_store_name,
    'store_whatsapp', v_store_whatsapp
  );
END $$;

-- RPC: reservar
CREATE OR REPLACE FUNCTION public.reserve_auction(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer public.auction_offers;
  v_uid uuid := auth.uid();
  v_price numeric;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  SELECT * INTO v_offer FROM public.auction_offers WHERE share_token = p_token FOR UPDATE;
  IF v_offer.id IS NULL THEN
    RAISE EXCEPTION 'auction not found';
  END IF;
  IF v_offer.status <> 'approved' THEN
    RAISE EXCEPTION 'auction is not active';
  END IF;
  IF v_offer.reserved_quantity >= v_offer.total_quantity THEN
    RAISE EXCEPTION 'auction sold out';
  END IF;
  IF EXISTS (SELECT 1 FROM public.auction_reservations WHERE auction_id = v_offer.id AND user_id = v_uid) THEN
    RAISE EXCEPTION 'already reserved';
  END IF;

  v_price := public.auction_current_price(v_offer);

  INSERT INTO public.auction_reservations (auction_id, user_id, reserved_price)
  VALUES (v_offer.id, v_uid, v_price);

  UPDATE public.auction_offers
    SET reserved_quantity = reserved_quantity + 1,
        status = CASE WHEN reserved_quantity + 1 >= total_quantity THEN 'sold_out'::auction_status ELSE status END
    WHERE id = v_offer.id;

  RETURN jsonb_build_object(
    'ok', true,
    'reserved_price', v_price,
    'auction_id', v_offer.id
  );
END $$;

-- Realtime
ALTER TABLE public.auction_offers REPLICA IDENTITY FULL;
ALTER TABLE public.auction_reservations REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.auction_offers;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.auction_reservations;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
