
-- Add per-user limit to coupons
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS max_per_user integer NOT NULL DEFAULT 1;

-- Unified redeem RPC: validates eligibility, enforces global + per-user limits,
-- generates unique code for 'unique' kind, returns full redemption details.
CREATE OR REPLACE FUNCTION public.redeem_coupon(p_coupon_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v public.coupons;
  v_uid uuid := auth.uid();
  v_user_count int;
  v_code text;
  v_redemption public.coupon_redemptions;
  v_store_approved boolean;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;

  SELECT * INTO v FROM public.coupons WHERE id = p_coupon_id FOR UPDATE;
  IF v.id IS NULL THEN RAISE EXCEPTION 'not_found'; END IF;
  IF NOT v.active THEN RAISE EXCEPTION 'inactive'; END IF;

  SELECT approved INTO v_store_approved FROM public.stores WHERE id = v.store_id;
  IF NOT COALESCE(v_store_approved, false) THEN RAISE EXCEPTION 'store_unavailable'; END IF;

  IF v.valid_until IS NOT NULL AND v.valid_until < current_date THEN
    RAISE EXCEPTION 'expired';
  END IF;
  IF v.max_uses IS NOT NULL AND v.uses_count >= v.max_uses THEN
    RAISE EXCEPTION 'no_uses_left';
  END IF;

  SELECT count(*) INTO v_user_count
  FROM public.coupon_redemptions
  WHERE coupon_id = p_coupon_id AND user_id = v_uid;

  IF v_user_count >= COALESCE(v.max_per_user, 1) THEN
    -- Return existing redemption (most recent) instead of failing, for idempotency
    SELECT * INTO v_redemption FROM public.coupon_redemptions
    WHERE coupon_id = p_coupon_id AND user_id = v_uid
    ORDER BY created_at DESC LIMIT 1;
    RETURN jsonb_build_object(
      'ok', true,
      'already', true,
      'redemption_id', v_redemption.id,
      'unique_code', v_redemption.unique_code,
      'redeemed_at', v_redemption.redeemed_at,
      'created_at', v_redemption.created_at
    );
  END IF;

  IF v.kind = 'unique' THEN
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  ELSE
    v_code := v.code;
  END IF;

  INSERT INTO public.coupon_redemptions (coupon_id, user_id, unique_code)
  VALUES (p_coupon_id, v_uid, v_code)
  RETURNING * INTO v_redemption;

  UPDATE public.coupons SET uses_count = uses_count + 1 WHERE id = p_coupon_id;

  RETURN jsonb_build_object(
    'ok', true,
    'already', false,
    'redemption_id', v_redemption.id,
    'unique_code', v_redemption.unique_code,
    'redeemed_at', v_redemption.redeemed_at,
    'created_at', v_redemption.created_at
  );
END $function$;
