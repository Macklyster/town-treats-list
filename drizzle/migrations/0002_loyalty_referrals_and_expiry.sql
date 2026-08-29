-- ---------- indicações ----------
CREATE TABLE public.loyalty_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  referrer_user_id uuid NOT NULL,
  invited_user_id uuid NOT NULL,
  credited_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, invited_user_id)
);
GRANT SELECT ON public.loyalty_referrals TO authenticated;
GRANT ALL ON public.loyalty_referrals TO service_role;
ALTER TABLE public.loyalty_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own referrals" ON public.loyalty_referrals FOR SELECT TO authenticated
  USING (referrer_user_id = auth.uid() OR invited_user_id = auth.uid());
CREATE POLICY "Owner reads store referrals" ON public.loyalty_referrals FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.loyalty_register_referral(p_store_id uuid, p_referrer_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL OR p_referrer_id = v_uid THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.loyalty_memberships WHERE store_id = p_store_id AND user_id = p_referrer_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'referrer_not_member');
  END IF;
  IF EXISTS (SELECT 1 FROM public.loyalty_memberships WHERE store_id = p_store_id AND user_id = v_uid) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_member');
  END IF;
  INSERT INTO public.loyalty_referrals (store_id, referrer_user_id, invited_user_id)
    VALUES (p_store_id, p_referrer_id, v_uid) ON CONFLICT DO NOTHING;
  PERFORM public.loyalty_join(p_store_id);
  RETURN jsonb_build_object('ok', true);
END $$;

-- crédito da indicação na primeira compra validada
CREATE OR REPLACE FUNCTION public.trg_loyalty_referral_credit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_ref public.loyalty_referrals;
BEGIN
  IF NEW.reason <> 'purchase' THEN RETURN NEW; END IF;
  SELECT * INTO v_ref FROM public.loyalty_referrals
    WHERE store_id = NEW.store_id AND invited_user_id = NEW.user_id AND credited_at IS NULL;
  IF NOT FOUND THEN RETURN NEW; END IF;
  UPDATE public.loyalty_referrals SET credited_at = now() WHERE id = v_ref.id;
  PERFORM public.loyalty_award(v_ref.referrer_user_id, NEW.store_id, 'referral',
    public.loyalty_reason_points(NEW.store_id, 'referral'), 'referral', v_ref.id,
    'referral:' || v_ref.id);
  INSERT INTO public.loyalty_user_badges (user_id, badge_slug, store_id)
    VALUES (v_ref.referrer_user_id, 'embaixador', NEW.store_id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER loyalty_referral_credit AFTER INSERT ON public.loyalty_ledger
  FOR EACH ROW EXECUTE FUNCTION public.trg_loyalty_referral_credit();

-- ---------- expiração de pontos e crédito ----------
CREATE OR REPLACE FUNCTION public.loyalty_expire_points()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r RECORD; v_count int := 0; v_points int := 0;
BEGIN
  FOR r IN
    SELECT id, store_id, user_id, membership_id, points
    FROM public.loyalty_ledger
    WHERE kind = 'credit' AND expired_at IS NULL AND expires_at IS NOT NULL AND expires_at <= now()
    LIMIT 5000
  LOOP
    UPDATE public.loyalty_ledger SET expired_at = now() WHERE id = r.id;
    IF r.points > 0 AND r.membership_id IS NOT NULL THEN
      INSERT INTO public.loyalty_ledger (store_id, user_id, membership_id, kind, points, reason,
          ref_type, ref_id, idempotency_key)
        VALUES (r.store_id, r.user_id, r.membership_id, 'expire', -r.points, 'expire', 'ledger', r.id,
          'expire:' || r.id)
        ON CONFLICT (idempotency_key) DO NOTHING;
      UPDATE public.loyalty_memberships
        SET points_balance = GREATEST(0, points_balance - r.points), updated_at = now()
        WHERE id = r.membership_id;
      PERFORM public.loyalty_recalc_tier(r.membership_id);
      v_points := v_points + r.points;
    END IF;
    v_count := v_count + 1;
  END LOOP;
  RETURN jsonb_build_object('processed', v_count, 'points_expired', v_points);
END $$;

-- pontos prestes a expirar (para notificações)
CREATE OR REPLACE FUNCTION public.loyalty_expiring_soon(p_days integer DEFAULT 7)
RETURNS TABLE (user_id uuid, store_id uuid, store_name text, points bigint, expires_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT l.user_id, l.store_id, s.name, SUM(l.points)::bigint, MIN(l.expires_at)
  FROM public.loyalty_ledger l
  JOIN public.stores s ON s.id = l.store_id
  WHERE l.kind = 'credit' AND l.expired_at IS NULL AND l.points > 0
    AND l.expires_at BETWEEN now() AND now() + (GREATEST(p_days, 1) || ' days')::interval
  GROUP BY l.user_id, l.store_id, s.name
  HAVING SUM(l.points) > 0;
$$;