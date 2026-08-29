-- ============================================================
-- FlyPontos: funções e triggers
-- ============================================================

CREATE OR REPLACE FUNCTION public.loyalty_rules(_store_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    '{"follow":20,"favorite":5,"review":30,"review_photo":15,"share":5,"checkin":15,"coupon":10,"purchase_per_real":1,"referral":50}'::jsonb
      || COALESCE((SELECT rules FROM public.loyalty_programs WHERE store_id = _store_id), '{}'::jsonb),
    '{}'::jsonb);
$$;

CREATE OR REPLACE FUNCTION public.loyalty_reason_points(_store_id uuid, _reason text)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((public.loyalty_rules(_store_id) ->> _reason)::numeric, 0)::int;
$$;

-- recalcula o nível considerando pontos ganhos nos últimos 12 meses
CREATE OR REPLACE FUNCTION public.loyalty_recalc_tier(_membership_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_m public.loyalty_memberships;
  v_pts int;
  v_tier uuid;
BEGIN
  SELECT * INTO v_m FROM public.loyalty_memberships WHERE id = _membership_id;
  IF NOT FOUND THEN RETURN; END IF;
  SELECT COALESCE(SUM(points), 0) INTO v_pts
    FROM public.loyalty_ledger
    WHERE membership_id = _membership_id AND kind = 'credit' AND created_at >= now() - interval '12 months';
  SELECT id INTO v_tier FROM public.loyalty_tiers
    WHERE store_id = v_m.store_id AND min_points <= v_pts
    ORDER BY min_points DESC LIMIT 1;
  UPDATE public.loyalty_memberships SET tier_id = v_tier, updated_at = now() WHERE id = _membership_id;
END $$;

-- progresso de missões
CREATE OR REPLACE FUNCTION public.loyalty_progress_missions(_user_id uuid, _store_id uuid, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  m RECORD;
  v_start date;
  v_prog public.loyalty_mission_progress;
BEGIN
  FOR m IN
    SELECT * FROM public.loyalty_missions
    WHERE active AND goal_type = _reason AND (store_id = _store_id OR store_id IS NULL)
  LOOP
    v_start := CASE m.period
      WHEN 'week' THEN date_trunc('week', now())::date
      WHEN 'month' THEN date_trunc('month', now())::date
      ELSE '1970-01-01'::date END;
    INSERT INTO public.loyalty_mission_progress (mission_id, user_id, store_id, period_start, progress)
      VALUES (m.id, _user_id, COALESCE(m.store_id, _store_id), v_start, 1)
      ON CONFLICT (mission_id, user_id, period_start)
      DO UPDATE SET progress = public.loyalty_mission_progress.progress + 1;
    SELECT * INTO v_prog FROM public.loyalty_mission_progress
      WHERE mission_id = m.id AND user_id = _user_id AND period_start = v_start;
    IF v_prog.completed_at IS NULL AND v_prog.progress >= m.goal_count THEN
      UPDATE public.loyalty_mission_progress SET completed_at = now() WHERE id = v_prog.id;
      IF m.reward_points > 0 AND COALESCE(m.store_id, _store_id) IS NOT NULL THEN
        PERFORM public.loyalty_award(_user_id, COALESCE(m.store_id, _store_id), 'mission', m.reward_points,
          'mission', m.id, 'mission:' || m.id || ':' || _user_id || ':' || v_start);
      END IF;
      IF m.badge_slug IS NOT NULL THEN
        INSERT INTO public.loyalty_user_badges (user_id, badge_slug, store_id)
          VALUES (_user_id, m.badge_slug, m.store_id) ON CONFLICT DO NOTHING;
      END IF;
    END IF;
  END LOOP;
END $$;

-- crédito de pontos (idempotente, com limite diário e multiplicador de nível)
CREATE OR REPLACE FUNCTION public.loyalty_award(
  _user_id uuid,
  _store_id uuid,
  _reason text,
  _points integer,
  _ref_type text DEFAULT NULL,
  _ref_id uuid DEFAULT NULL,
  _idem text DEFAULT NULL,
  _credit_cents integer DEFAULT 0,
  _daily_cap integer DEFAULT NULL,
  _amount_cents integer DEFAULT 0,
  _apply_multiplier boolean DEFAULT false
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_prog public.loyalty_programs;
  v_m public.loyalty_memberships;
  v_key text;
  v_mult numeric := 1;
  v_pts int;
  v_id uuid;
BEGIN
  IF _user_id IS NULL OR _store_id IS NULL THEN RETURN NULL; END IF;
  SELECT * INTO v_prog FROM public.loyalty_programs WHERE store_id = _store_id AND active;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT * INTO v_m FROM public.loyalty_memberships WHERE store_id = _store_id AND user_id = _user_id;
  IF NOT FOUND THEN
    INSERT INTO public.loyalty_memberships (store_id, user_id) VALUES (_store_id, _user_id)
      ON CONFLICT (store_id, user_id) DO NOTHING;
    SELECT * INTO v_m FROM public.loyalty_memberships WHERE store_id = _store_id AND user_id = _user_id;
    SELECT id INTO v_m.tier_id FROM public.loyalty_tiers WHERE store_id = _store_id ORDER BY min_points LIMIT 1;
    UPDATE public.loyalty_memberships SET tier_id = v_m.tier_id WHERE id = v_m.id;
  END IF;

  v_key := COALESCE(_idem, _reason || ':' || _store_id || ':' || _user_id || ':' ||
    COALESCE(_ref_id::text, to_char(clock_timestamp(), 'YYYYMMDDHH24MISSUS')));
  IF EXISTS (SELECT 1 FROM public.loyalty_ledger WHERE idempotency_key = v_key) THEN RETURN NULL; END IF;

  IF _daily_cap IS NOT NULL AND (
    SELECT count(*) FROM public.loyalty_ledger
    WHERE user_id = _user_id AND store_id = _store_id AND reason = _reason
      AND created_at >= date_trunc('day', now())) >= _daily_cap THEN
    RETURN NULL;
  END IF;

  IF _apply_multiplier THEN
    SELECT COALESCE(multiplier, 1) INTO v_mult FROM public.loyalty_tiers WHERE id = v_m.tier_id;
    v_mult := COALESCE(v_mult, 1);
  END IF;
  v_pts := GREATEST(0, ROUND(COALESCE(_points, 0) * v_mult))::int;

  INSERT INTO public.loyalty_ledger (store_id, user_id, membership_id, kind, points, credit_cents,
      amount_cents, reason, ref_type, ref_id, idempotency_key, expires_at)
    VALUES (_store_id, _user_id, v_m.id, 'credit', v_pts, COALESCE(_credit_cents, 0),
      COALESCE(_amount_cents, 0), _reason, _ref_type, _ref_id, v_key,
      now() + (COALESCE(v_prog.points_expire_months, 12) || ' months')::interval)
    RETURNING id INTO v_id;

  UPDATE public.loyalty_memberships
    SET points_balance = points_balance + v_pts,
        points_lifetime = points_lifetime + v_pts,
        credit_cents = credit_cents + COALESCE(_credit_cents, 0),
        updated_at = now()
    WHERE id = v_m.id;

  PERFORM public.loyalty_recalc_tier(v_m.id);
  IF _reason <> 'mission' THEN
    PERFORM public.loyalty_progress_missions(_user_id, _store_id, _reason);
  END IF;
  RETURN v_id;
END $$;

-- adesão explícita
CREATE OR REPLACE FUNCTION public.loyalty_join(p_store_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_m public.loyalty_memberships;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'auth_required'); END IF;
  IF NOT EXISTS (SELECT 1 FROM public.loyalty_programs WHERE store_id = p_store_id AND active) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'program_inactive');
  END IF;
  INSERT INTO public.loyalty_memberships (store_id, user_id) VALUES (p_store_id, v_uid)
    ON CONFLICT (store_id, user_id) DO NOTHING;
  SELECT * INTO v_m FROM public.loyalty_memberships WHERE store_id = p_store_id AND user_id = v_uid;
  PERFORM public.loyalty_recalc_tier(v_m.id);
  PERFORM public.loyalty_award(v_uid, p_store_id, 'join', 0, 'store', p_store_id,
    'join:' || p_store_id || ':' || v_uid);
  RETURN jsonb_build_object('ok', true, 'membership_id', v_m.id);
END $$;

-- ações do consumidor com limite diário (share)
CREATE OR REPLACE FUNCTION public.loyalty_track_action(p_store_id uuid, p_reason text, p_ref_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_pts int; v_id uuid;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'auth_required'); END IF;
  IF p_reason NOT IN ('share') THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_reason'); END IF;
  v_pts := public.loyalty_reason_points(p_store_id, p_reason);
  v_id := public.loyalty_award(v_uid, p_store_id, p_reason, v_pts, 'offer', p_ref_id, NULL, 0, 3);
  RETURN jsonb_build_object('ok', v_id IS NOT NULL, 'points', CASE WHEN v_id IS NULL THEN 0 ELSE v_pts END);
END $$;

-- check-in por geolocalização
CREATE OR REPLACE FUNCTION public.loyalty_checkin(p_store_id uuid, p_lat double precision, p_lng double precision)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_store public.stores;
  v_prog public.loyalty_programs;
  v_dist double precision;
  v_pts int;
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'auth_required'); END IF;
  SELECT * INTO v_store FROM public.stores WHERE id = p_store_id;
  SELECT * INTO v_prog FROM public.loyalty_programs WHERE store_id = p_store_id AND active;
  IF v_store.latitude IS NULL OR v_prog.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unavailable');
  END IF;
  v_dist := public.haversine_meters(p_lat, p_lng, v_store.latitude, v_store.longitude);
  IF v_dist > v_prog.checkin_radius_meters THEN
    RETURN jsonb_build_object('ok', false, 'error', 'too_far', 'distance', round(v_dist));
  END IF;
  v_pts := public.loyalty_reason_points(p_store_id, 'checkin');
  v_id := public.loyalty_award(v_uid, p_store_id, 'checkin', v_pts, 'store', p_store_id,
    'checkin:' || p_store_id || ':' || v_uid || ':' || to_char(now(), 'YYYYMMDD'));
  IF v_id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'already_today'); END IF;
  RETURN jsonb_build_object('ok', true, 'points', v_pts);
END $$;

-- QR rotativo do consumidor
CREATE OR REPLACE FUNCTION public.loyalty_issue_qr()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_code text;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'auth_required'); END IF;
  UPDATE public.loyalty_checkin_tokens SET expires_at = now()
    WHERE user_id = v_uid AND used_at IS NULL AND expires_at > now();
  LOOP
    v_code := lpad((floor(random() * 1000000))::int::text, 6, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.loyalty_checkin_tokens WHERE code = v_code AND expires_at > now());
  END LOOP;
  DELETE FROM public.loyalty_checkin_tokens WHERE code = v_code;
  INSERT INTO public.loyalty_checkin_tokens (user_id, code, expires_at)
    VALUES (v_uid, v_code, now() + interval '60 seconds');
  RETURN jsonb_build_object('ok', true, 'code', v_code, 'expires_at', now() + interval '60 seconds');
END $$;

-- validação de compra pelo lojista
CREATE OR REPLACE FUNCTION public.loyalty_validate_purchase(
  p_code text, p_amount_cents integer, p_use_credit_cents integer DEFAULT 0
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_store_id uuid;
  v_prog public.loyalty_programs;
  v_tok public.loyalty_checkin_tokens;
  v_m public.loyalty_memberships;
  v_pts int;
  v_cash int := 0;
  v_use int := 0;
  v_ledger uuid;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'auth_required'); END IF;
  IF p_amount_cents IS NULL OR p_amount_cents < 0 OR p_amount_cents > 100000000 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_amount');
  END IF;
  SELECT id INTO v_store_id FROM public.stores WHERE owner_id = v_uid ORDER BY created_at LIMIT 1;
  IF v_store_id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'no_store'); END IF;
  SELECT * INTO v_prog FROM public.loyalty_programs WHERE store_id = v_store_id AND active;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'program_inactive'); END IF;

  SELECT * INTO v_tok FROM public.loyalty_checkin_tokens
    WHERE code = p_code AND used_at IS NULL AND expires_at > now() FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_code'); END IF;

  UPDATE public.loyalty_checkin_tokens SET used_at = now(), used_by_store = v_store_id WHERE id = v_tok.id;

  SELECT * INTO v_m FROM public.loyalty_memberships WHERE store_id = v_store_id AND user_id = v_tok.user_id;
  v_use := LEAST(GREATEST(COALESCE(p_use_credit_cents, 0), 0), COALESCE(v_m.credit_cents, 0), p_amount_cents);

  v_pts := ROUND((p_amount_cents / 100.0) * public.loyalty_reason_points(v_store_id, 'purchase_per_real'))::int;
  v_cash := ROUND((p_amount_cents - v_use) * COALESCE(v_prog.cashback_percent, 0) / 100.0)::int;

  v_ledger := public.loyalty_award(v_tok.user_id, v_store_id, 'purchase', v_pts, 'token', v_tok.id,
    'purchase:' || v_tok.id, v_cash, NULL, p_amount_cents, true);

  SELECT * INTO v_m FROM public.loyalty_memberships WHERE store_id = v_store_id AND user_id = v_tok.user_id;

  IF v_use > 0 THEN
    INSERT INTO public.loyalty_ledger (store_id, user_id, membership_id, kind, points, credit_cents,
        amount_cents, reason, ref_type, ref_id, idempotency_key)
      VALUES (v_store_id, v_tok.user_id, v_m.id, 'debit', 0, -v_use, p_amount_cents, 'credit_used',
        'token', v_tok.id, 'credit_used:' || v_tok.id);
    UPDATE public.loyalty_memberships SET credit_cents = credit_cents - v_use, updated_at = now() WHERE id = v_m.id;
  END IF;

  UPDATE public.loyalty_memberships
    SET visits_count = visits_count + 1, last_visit_at = now(), updated_at = now()
    WHERE id = v_m.id;

  IF (SELECT count(*) FROM public.loyalty_ledger WHERE membership_id = v_m.id AND reason = 'purchase') >= 5 THEN
    INSERT INTO public.loyalty_user_badges (user_id, badge_slug, store_id)
      VALUES (v_tok.user_id, 'cliente-fiel', v_store_id) ON CONFLICT DO NOTHING;
  END IF;
  INSERT INTO public.loyalty_user_badges (user_id, badge_slug)
    VALUES (v_tok.user_id, 'primeiro-ponto') ON CONFLICT DO NOTHING;

  SELECT * INTO v_m FROM public.loyalty_memberships WHERE id = v_m.id;
  RETURN jsonb_build_object(
    'ok', true,
    'points_awarded', COALESCE((SELECT points FROM public.loyalty_ledger WHERE id = v_ledger), 0),
    'cashback_cents', v_cash,
    'credit_used_cents', v_use,
    'customer', (SELECT COALESCE(NULLIF(nickname, ''), full_name, 'Cliente') FROM public.profiles WHERE id = v_tok.user_id),
    'balance', v_m.points_balance,
    'credit_cents', v_m.credit_cents,
    'tier', (SELECT name FROM public.loyalty_tiers WHERE id = v_m.tier_id)
  );
END $$;

-- resgate de recompensa
CREATE OR REPLACE FUNCTION public.loyalty_redeem_reward(p_reward_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_r public.loyalty_rewards;
  v_m public.loyalty_memberships;
  v_code text;
  v_red uuid;
  v_coupon jsonb;
  v_cr uuid;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'auth_required'); END IF;
  SELECT * INTO v_r FROM public.loyalty_rewards WHERE id = p_reward_id AND active FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'reward_unavailable'); END IF;
  IF v_r.valid_until IS NOT NULL AND v_r.valid_until < CURRENT_DATE THEN
    RETURN jsonb_build_object('ok', false, 'error', 'reward_expired');
  END IF;
  IF v_r.stock IS NOT NULL AND v_r.stock <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'out_of_stock');
  END IF;
  SELECT * INTO v_m FROM public.loyalty_memberships WHERE store_id = v_r.store_id AND user_id = v_uid FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'not_member'); END IF;
  IF v_m.points_balance < v_r.points_cost THEN
    RETURN jsonb_build_object('ok', false, 'error', 'insufficient_points');
  END IF;
  IF v_r.min_tier_id IS NOT NULL AND (
      SELECT COALESCE((SELECT min_points FROM public.loyalty_tiers WHERE id = v_m.tier_id), -1)
        < (SELECT min_points FROM public.loyalty_tiers WHERE id = v_r.min_tier_id)) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'tier_required');
  END IF;

  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  INSERT INTO public.loyalty_redemptions (store_id, user_id, reward_id, points_spent, code, status)
    VALUES (v_r.store_id, v_uid, v_r.id, v_r.points_cost, v_code,
      CASE WHEN v_r.kind = 'credit' THEN 'fulfilled' ELSE 'pending' END)
    RETURNING id INTO v_red;

  INSERT INTO public.loyalty_ledger (store_id, user_id, membership_id, kind, points, reason, ref_type, ref_id, idempotency_key)
    VALUES (v_r.store_id, v_uid, v_m.id, 'debit', -v_r.points_cost, 'redeem', 'reward', v_r.id, 'redeem:' || v_red);

  UPDATE public.loyalty_memberships
    SET points_balance = points_balance - v_r.points_cost,
        credit_cents = credit_cents + CASE WHEN v_r.kind = 'credit' THEN v_r.credit_cents ELSE 0 END,
        updated_at = now()
    WHERE id = v_m.id;

  IF v_r.stock IS NOT NULL THEN
    UPDATE public.loyalty_rewards SET stock = stock - 1 WHERE id = v_r.id;
  END IF;

  IF v_r.kind = 'coupon' AND v_r.coupon_id IS NOT NULL THEN
    INSERT INTO public.coupon_redemptions (coupon_id, user_id, unique_code)
      VALUES (v_r.coupon_id, v_uid, v_code) RETURNING id INTO v_cr;
    UPDATE public.coupons SET uses_count = uses_count + 1 WHERE id = v_r.coupon_id;
    UPDATE public.loyalty_redemptions SET coupon_redemption_id = v_cr WHERE id = v_red;
  END IF;

  RETURN jsonb_build_object('ok', true, 'redemption_id', v_red, 'code', v_code, 'kind', v_r.kind);
END $$;

-- confirmação da entrega pelo lojista
CREATE OR REPLACE FUNCTION public.loyalty_fulfill_redemption(p_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_store_id uuid; v_red public.loyalty_redemptions;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'auth_required'); END IF;
  SELECT id INTO v_store_id FROM public.stores WHERE owner_id = v_uid ORDER BY created_at LIMIT 1;
  SELECT * INTO v_red FROM public.loyalty_redemptions
    WHERE store_id = v_store_id AND upper(code) = upper(p_code) AND status = 'pending';
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'not_found'); END IF;
  UPDATE public.loyalty_redemptions SET status = 'fulfilled', fulfilled_at = now() WHERE id = v_red.id;
  RETURN jsonb_build_object('ok', true, 'reward', (SELECT title FROM public.loyalty_rewards WHERE id = v_red.reward_id));
END $$;

-- estado do programa de uma loja para o consumidor
CREATE OR REPLACE FUNCTION public.loyalty_state(p_store_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_prog public.loyalty_programs; v_m public.loyalty_memberships;
BEGIN
  SELECT * INTO v_prog FROM public.loyalty_programs WHERE store_id = p_store_id AND active;
  IF NOT FOUND THEN RETURN jsonb_build_object('active', false); END IF;
  SELECT * INTO v_m FROM public.loyalty_memberships WHERE store_id = p_store_id AND user_id = v_uid;
  RETURN jsonb_build_object(
    'active', true,
    'store', (SELECT jsonb_build_object('id', id, 'name', name, 'slug', slug, 'logo_url', logo_url,
                'city', city, 'state', state, 'latitude', latitude, 'longitude', longitude)
              FROM public.stores WHERE id = p_store_id),
    'program', jsonb_build_object('rules', public.loyalty_rules(p_store_id),
      'cashback_percent', v_prog.cashback_percent, 'terms', v_prog.terms,
      'points_expire_months', v_prog.points_expire_months,
      'checkin_radius_meters', v_prog.checkin_radius_meters),
    'tiers', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', id, 'name', name, 'min_points', min_points,
                'multiplier', multiplier, 'perks', perks, 'early_access', early_access,
                'extra_discount_percent', extra_discount_percent) ORDER BY min_points)
              FROM public.loyalty_tiers WHERE store_id = p_store_id), '[]'::jsonb),
    'membership', CASE WHEN v_m.id IS NULL THEN NULL ELSE jsonb_build_object(
        'id', v_m.id, 'points_balance', v_m.points_balance, 'points_lifetime', v_m.points_lifetime,
        'credit_cents', v_m.credit_cents, 'visits_count', v_m.visits_count, 'joined_at', v_m.joined_at,
        'tier', (SELECT jsonb_build_object('id', id, 'name', name, 'multiplier', multiplier,
                   'min_points', min_points, 'perks', perks) FROM public.loyalty_tiers WHERE id = v_m.tier_id)) END,
    'rewards', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', id, 'title', title, 'description', description,
                'image_url', image_url, 'kind', kind, 'points_cost', points_cost, 'credit_cents', credit_cents,
                'stock', stock, 'valid_until', valid_until, 'min_tier_id', min_tier_id) ORDER BY points_cost)
              FROM public.loyalty_rewards WHERE store_id = p_store_id AND active
                AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)), '[]'::jsonb),
    'missions', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', m.id, 'title', m.title,
                'description', m.description, 'goal_type', m.goal_type, 'goal_count', m.goal_count,
                'reward_points', m.reward_points, 'period', m.period,
                'progress', COALESCE(p.progress, 0), 'completed_at', p.completed_at))
              FROM public.loyalty_missions m
              LEFT JOIN public.loyalty_mission_progress p
                ON p.mission_id = m.id AND p.user_id = v_uid
                AND p.period_start = CASE m.period
                  WHEN 'week' THEN date_trunc('week', now())::date
                  WHEN 'month' THEN date_trunc('month', now())::date
                  ELSE '1970-01-01'::date END
              WHERE m.active AND m.store_id = p_store_id), '[]'::jsonb),
    'ledger', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', id, 'points', points, 'credit_cents', credit_cents,
                'reason', reason, 'created_at', created_at, 'kind', kind) ORDER BY created_at DESC)
              FROM (SELECT * FROM public.loyalty_ledger WHERE store_id = p_store_id AND user_id = v_uid
                    ORDER BY created_at DESC LIMIT 30) l), '[]'::jsonb),
    'redemptions', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', r.id, 'code', r.code, 'status', r.status,
                'points_spent', r.points_spent, 'created_at', r.created_at,
                'reward', (SELECT title FROM public.loyalty_rewards WHERE id = r.reward_id)) ORDER BY r.created_at DESC)
              FROM public.loyalty_redemptions r WHERE r.store_id = p_store_id AND r.user_id = v_uid), '[]'::jsonb)
  );
END $$;

-- carteira do consumidor (todas as lojas)
CREATE OR REPLACE FUNCTION public.loyalty_wallet()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('cards', '[]'::jsonb, 'badges', '[]'::jsonb); END IF;
  RETURN jsonb_build_object(
    'cards', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'store_id', s.id, 'store_name', s.name, 'store_slug', s.slug, 'logo_url', s.logo_url,
        'city', s.city, 'state', s.state,
        'points_balance', m.points_balance, 'points_lifetime', m.points_lifetime,
        'credit_cents', m.credit_cents, 'visits_count', m.visits_count,
        'tier_name', t.name, 'tier_min_points', t.min_points, 'multiplier', t.multiplier,
        'next_tier_name', nt.name, 'next_tier_points', nt.min_points,
        'cheapest_reward', (SELECT MIN(points_cost) FROM public.loyalty_rewards r
                            WHERE r.store_id = s.id AND r.active),
        'open_missions', (SELECT count(*) FROM public.loyalty_missions ms
                          WHERE ms.active AND ms.store_id = s.id)
      ) ORDER BY m.points_balance DESC)
      FROM public.loyalty_memberships m
      JOIN public.stores s ON s.id = m.store_id
      JOIN public.loyalty_programs pr ON pr.store_id = s.id AND pr.active
      LEFT JOIN public.loyalty_tiers t ON t.id = m.tier_id
      LEFT JOIN public.loyalty_tiers nt ON nt.store_id = s.id
        AND nt.min_points = (SELECT MIN(min_points) FROM public.loyalty_tiers x
                             WHERE x.store_id = s.id AND x.min_points > COALESCE(t.min_points, -1))
      WHERE m.user_id = v_uid), '[]'::jsonb),
    'badges', COALESCE((SELECT jsonb_agg(jsonb_build_object('slug', b.slug, 'name', b.name,
                'description', b.description, 'icon', b.icon, 'created_at', ub.created_at))
              FROM public.loyalty_user_badges ub JOIN public.loyalty_badges b ON b.slug = ub.badge_slug
              WHERE ub.user_id = v_uid), '[]'::jsonb),
    'total_points', COALESCE((SELECT SUM(points_balance) FROM public.loyalty_memberships WHERE user_id = v_uid), 0),
    'total_credit_cents', COALESCE((SELECT SUM(credit_cents) FROM public.loyalty_memberships WHERE user_id = v_uid), 0),
    'expiring_points', COALESCE((SELECT SUM(points) FROM public.loyalty_ledger
              WHERE user_id = v_uid AND kind = 'credit' AND expired_at IS NULL
                AND expires_at BETWEEN now() AND now() + interval '30 days'), 0)
  );
END $$;

-- relatório para o lojista
CREATE OR REPLACE FUNCTION public.loyalty_store_report(p_store_id uuid, p_days integer DEFAULT 30)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_since timestamptz := now() - (GREATEST(p_days, 1) || ' days')::interval;
BEGIN
  IF NOT (EXISTS (SELECT 1 FROM public.stores WHERE id = p_store_id AND owner_id = v_uid)
          OR public.has_role(v_uid, 'admin')) THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;
  RETURN jsonb_build_object(
    'members', (SELECT count(*) FROM public.loyalty_memberships WHERE store_id = p_store_id),
    'new_members', (SELECT count(*) FROM public.loyalty_memberships WHERE store_id = p_store_id AND joined_at >= v_since),
    'points_issued', COALESCE((SELECT SUM(points) FROM public.loyalty_ledger
        WHERE store_id = p_store_id AND kind = 'credit' AND created_at >= v_since), 0),
    'points_redeemed', COALESCE((SELECT -SUM(points) FROM public.loyalty_ledger
        WHERE store_id = p_store_id AND kind = 'debit' AND created_at >= v_since), 0),
    'points_liability', COALESCE((SELECT SUM(points_balance) FROM public.loyalty_memberships WHERE store_id = p_store_id), 0),
    'credit_liability_cents', COALESCE((SELECT SUM(credit_cents) FROM public.loyalty_memberships WHERE store_id = p_store_id), 0),
    'validated_purchases', (SELECT count(*) FROM public.loyalty_ledger
        WHERE store_id = p_store_id AND reason = 'purchase' AND created_at >= v_since),
    'revenue_cents', COALESCE((SELECT SUM(amount_cents) FROM public.loyalty_ledger
        WHERE store_id = p_store_id AND reason = 'purchase' AND created_at >= v_since), 0),
    'avg_ticket_cents', COALESCE((SELECT AVG(amount_cents)::int FROM public.loyalty_ledger
        WHERE store_id = p_store_id AND reason = 'purchase' AND created_at >= v_since), 0),
    'returning_members', (SELECT count(*) FROM public.loyalty_memberships
        WHERE store_id = p_store_id AND visits_count > 1),
    'redemptions_pending', (SELECT count(*) FROM public.loyalty_redemptions
        WHERE store_id = p_store_id AND status = 'pending'),
    'top_members', COALESCE((SELECT jsonb_agg(x) FROM (
        SELECT COALESCE(NULLIF(p.nickname, ''), p.full_name, 'Cliente') AS name,
               m.points_balance, m.points_lifetime, m.visits_count,
               (SELECT name FROM public.loyalty_tiers WHERE id = m.tier_id) AS tier
        FROM public.loyalty_memberships m LEFT JOIN public.profiles p ON p.id = m.user_id
        WHERE m.store_id = p_store_id ORDER BY m.points_lifetime DESC LIMIT 10) x), '[]'::jsonb)
  );
END $$;

-- ranking mensal por cidade (opt-in)
CREATE OR REPLACE FUNCTION public.loyalty_city_ranking(p_city text, p_limit integer DEFAULT 20)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(jsonb_agg(x ORDER BY x.points DESC), '[]'::jsonb) FROM (
    SELECT COALESCE(NULLIF(p.nickname, ''), split_part(COALESCE(p.full_name, 'Cliente'), ' ', 1)) AS name,
           p.avatar_url,
           SUM(l.points)::int AS points,
           (SELECT count(*) FROM public.loyalty_user_badges ub WHERE ub.user_id = p.id)::int AS badges
    FROM public.loyalty_ledger l
    JOIN public.stores s ON s.id = l.store_id
    JOIN public.profiles p ON p.id = l.user_id
    WHERE p.loyalty_ranking_opt_in
      AND l.kind = 'credit'
      AND l.created_at >= date_trunc('month', now())
      AND (p_city IS NULL OR s.city = p_city)
    GROUP BY p.id, p.nickname, p.full_name, p.avatar_url
    ORDER BY points DESC
    LIMIT GREATEST(p_limit, 1)
  ) x;
$$;

-- ---------- níveis padrão ao criar o programa ----------
CREATE OR REPLACE FUNCTION public.loyalty_seed_tiers()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.loyalty_tiers WHERE store_id = NEW.store_id) THEN
    INSERT INTO public.loyalty_tiers (store_id, name, min_points, multiplier, sort_order, early_access, extra_discount_percent)
    VALUES
      (NEW.store_id, 'Bronze', 0, 1, 1, false, 0),
      (NEW.store_id, 'Prata', 300, 1.2, 2, false, 0),
      (NEW.store_id, 'Ouro', 800, 1.5, 3, true, 5),
      (NEW.store_id, 'Diamante', 2000, 2, 4, true, 10);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER loyalty_programs_seed_tiers AFTER INSERT ON public.loyalty_programs
  FOR EACH ROW EXECUTE FUNCTION public.loyalty_seed_tiers();

-- ---------- créditos automáticos de engajamento ----------
CREATE OR REPLACE FUNCTION public.trg_loyalty_follow()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.loyalty_award(NEW.user_id, NEW.store_id, 'follow',
    public.loyalty_reason_points(NEW.store_id, 'follow'), 'store', NEW.store_id,
    'follow:' || NEW.store_id || ':' || NEW.user_id);
  RETURN NEW;
END $$;
CREATE TRIGGER loyalty_from_follow AFTER INSERT ON public.store_followers
  FOR EACH ROW EXECUTE FUNCTION public.trg_loyalty_follow();

CREATE OR REPLACE FUNCTION public.trg_loyalty_favorite()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_store uuid;
BEGIN
  SELECT store_id INTO v_store FROM public.offers WHERE id = NEW.offer_id;
  PERFORM public.loyalty_award(NEW.user_id, v_store, 'favorite',
    public.loyalty_reason_points(v_store, 'favorite'), 'offer', NEW.offer_id,
    'favorite:' || NEW.offer_id || ':' || NEW.user_id, 0, 3);
  RETURN NEW;
END $$;
CREATE TRIGGER loyalty_from_favorite AFTER INSERT ON public.favorites
  FOR EACH ROW EXECUTE FUNCTION public.trg_loyalty_favorite();

CREATE OR REPLACE FUNCTION public.trg_loyalty_review()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status <> 'approved' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'approved' THEN RETURN NEW; END IF;
  PERFORM public.loyalty_award(NEW.user_id, NEW.store_id, 'review',
    public.loyalty_reason_points(NEW.store_id, 'review'), 'review', NEW.id,
    'review:' || NEW.id);
  IF EXISTS (SELECT 1 FROM public.offer_review_photos WHERE review_id = NEW.id) THEN
    PERFORM public.loyalty_award(NEW.user_id, NEW.store_id, 'review_photo',
      public.loyalty_reason_points(NEW.store_id, 'review_photo'), 'review', NEW.id,
      'review_photo:' || NEW.id);
    INSERT INTO public.loyalty_user_badges (user_id, badge_slug)
      VALUES (NEW.user_id, 'critico-gentil') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER loyalty_from_review AFTER INSERT OR UPDATE OF status ON public.offer_reviews
  FOR EACH ROW EXECUTE FUNCTION public.trg_loyalty_review();

CREATE OR REPLACE FUNCTION public.trg_loyalty_coupon()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_store uuid;
BEGIN
  IF NEW.user_id IS NULL THEN RETURN NEW; END IF;
  SELECT store_id INTO v_store FROM public.coupons WHERE id = NEW.coupon_id;
  PERFORM public.loyalty_award(NEW.user_id, v_store, 'coupon',
    public.loyalty_reason_points(v_store, 'coupon'), 'coupon', NEW.coupon_id,
    'coupon:' || NEW.id);
  RETURN NEW;
END $$;
CREATE TRIGGER loyalty_from_coupon AFTER INSERT ON public.coupon_redemptions
  FOR EACH ROW EXECUTE FUNCTION public.trg_loyalty_coupon();

-- selo de explorador (3 lojas)
CREATE OR REPLACE FUNCTION public.trg_loyalty_explorer()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT count(*) FROM public.loyalty_memberships WHERE user_id = NEW.user_id) >= 3 THEN
    INSERT INTO public.loyalty_user_badges (user_id, badge_slug)
      VALUES (NEW.user_id, 'explorador') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER loyalty_explorer_badge AFTER INSERT ON public.loyalty_memberships
  FOR EACH ROW EXECUTE FUNCTION public.trg_loyalty_explorer();