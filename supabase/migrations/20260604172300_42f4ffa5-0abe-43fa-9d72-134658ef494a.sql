
DO $$ BEGIN
  CREATE TYPE public.coupon_kind AS ENUM ('fixed', 'unique');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.discount_type AS ENUM ('percent', 'amount');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  offer_id uuid REFERENCES public.offers(id) ON DELETE SET NULL,
  title text NOT NULL,
  kind public.coupon_kind NOT NULL DEFAULT 'fixed',
  code text,
  discount_type public.discount_type NOT NULL,
  discount_value numeric NOT NULL CHECK (discount_value > 0),
  max_uses int,
  uses_count int NOT NULL DEFAULT 0,
  valid_until date,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX coupons_store_code_unique ON public.coupons(store_id, code) WHERE code IS NOT NULL;
CREATE INDEX coupons_store_id_idx ON public.coupons(store_id);

GRANT SELECT ON public.coupons TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active coupons of approved stores" ON public.coupons
  FOR SELECT USING (
    active = true AND EXISTS (
      SELECT 1 FROM public.stores s WHERE s.id = coupons.store_id AND s.approved = true
    )
  );

CREATE POLICY "Store owners manage coupons" ON public.coupons
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = coupons.store_id AND s.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = coupons.store_id AND s.owner_id = auth.uid()));

CREATE POLICY "Admins manage coupons" ON public.coupons
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER coupons_set_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  unique_code text,
  redeemed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX coupon_redemptions_user_unique ON public.coupon_redemptions(coupon_id, user_id) WHERE user_id IS NOT NULL;
CREATE INDEX coupon_redemptions_coupon_idx ON public.coupon_redemptions(coupon_id);

GRANT SELECT, INSERT, UPDATE ON public.coupon_redemptions TO authenticated;
GRANT ALL ON public.coupon_redemptions TO service_role;

ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own redemptions" ON public.coupon_redemptions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own redemptions" ON public.coupon_redemptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Store owners view coupon redemptions" ON public.coupon_redemptions
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.coupons c
      JOIN public.stores s ON s.id = c.store_id
      WHERE c.id = coupon_redemptions.coupon_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY "Store owners update coupon redemptions" ON public.coupon_redemptions
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.coupons c
      JOIN public.stores s ON s.id = c.store_id
      WHERE c.id = coupon_redemptions.coupon_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins view all redemptions" ON public.coupon_redemptions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.claim_unique_coupon(p_coupon_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v public.coupons;
  v_uid uuid := auth.uid();
  v_code text;
  v_existing text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;

  SELECT * INTO v FROM public.coupons WHERE id = p_coupon_id FOR UPDATE;
  IF v.id IS NULL OR NOT v.active OR v.kind <> 'unique' THEN
    RAISE EXCEPTION 'invalid coupon';
  END IF;
  IF v.valid_until IS NOT NULL AND v.valid_until < current_date THEN
    RAISE EXCEPTION 'expired';
  END IF;
  IF v.max_uses IS NOT NULL AND v.uses_count >= v.max_uses THEN
    RAISE EXCEPTION 'no_uses_left';
  END IF;

  SELECT unique_code INTO v_existing
  FROM public.coupon_redemptions
  WHERE coupon_id = p_coupon_id AND user_id = v_uid;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('code', v_existing, 'already', true);
  END IF;

  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  INSERT INTO public.coupon_redemptions (coupon_id, user_id, unique_code)
  VALUES (p_coupon_id, v_uid, v_code);
  UPDATE public.coupons SET uses_count = uses_count + 1 WHERE id = p_coupon_id;

  RETURN jsonb_build_object('code', v_code, 'already', false);
END $$;

GRANT EXECUTE ON FUNCTION public.claim_unique_coupon(uuid) TO authenticated;
