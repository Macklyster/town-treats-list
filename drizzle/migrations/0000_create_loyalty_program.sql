-- ============================================================
-- FlyPontos: programa de fidelidade por lojista
-- ============================================================

CREATE TYPE public.loyalty_reward_kind AS ENUM ('coupon', 'credit', 'gift', 'tier_benefit');
CREATE TYPE public.loyalty_redemption_status AS ENUM ('pending', 'fulfilled', 'canceled');
CREATE TYPE public.loyalty_ledger_kind AS ENUM ('credit', 'debit', 'expire');

-- ---------- programas ----------
CREATE TABLE public.loyalty_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
  active boolean NOT NULL DEFAULT false,
  rules jsonb NOT NULL DEFAULT '{"follow":20,"favorite":5,"review":30,"review_photo":15,"share":5,"checkin":15,"coupon":10,"purchase_per_real":1,"referral":50}'::jsonb,
  points_expire_months integer NOT NULL DEFAULT 12,
  cashback_percent numeric NOT NULL DEFAULT 0,
  checkin_radius_meters integer NOT NULL DEFAULT 300,
  terms text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.loyalty_programs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loyalty_programs TO authenticated;
GRANT ALL ON public.loyalty_programs TO service_role;
ALTER TABLE public.loyalty_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active loyalty programs" ON public.loyalty_programs FOR SELECT USING (active = true);
CREATE POLICY "Owner manages own loyalty program" ON public.loyalty_programs FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()));
CREATE POLICY "Admins manage loyalty programs" ON public.loyalty_programs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------- níveis ----------
CREATE TABLE public.loyalty_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  min_points integer NOT NULL DEFAULT 0,
  multiplier numeric NOT NULL DEFAULT 1,
  perks jsonb NOT NULL DEFAULT '[]'::jsonb,
  early_access boolean NOT NULL DEFAULT false,
  extra_discount_percent numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, name)
);
GRANT SELECT ON public.loyalty_tiers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loyalty_tiers TO authenticated;
GRANT ALL ON public.loyalty_tiers TO service_role;
ALTER TABLE public.loyalty_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads loyalty tiers" ON public.loyalty_tiers FOR SELECT USING (true);
CREATE POLICY "Owner manages loyalty tiers" ON public.loyalty_tiers FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()));
CREATE POLICY "Admins manage loyalty tiers" ON public.loyalty_tiers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------- adesões ----------
CREATE TABLE public.loyalty_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  tier_id uuid REFERENCES public.loyalty_tiers(id) ON DELETE SET NULL,
  points_balance integer NOT NULL DEFAULT 0,
  points_lifetime integer NOT NULL DEFAULT 0,
  credit_cents integer NOT NULL DEFAULT 0,
  visits_count integer NOT NULL DEFAULT 0,
  last_visit_at timestamptz,
  joined_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, user_id)
);
GRANT SELECT ON public.loyalty_memberships TO authenticated;
GRANT ALL ON public.loyalty_memberships TO service_role;
ALTER TABLE public.loyalty_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read own membership" ON public.loyalty_memberships FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Store owner reads memberships" ON public.loyalty_memberships FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()));
CREATE POLICY "Admins read memberships" ON public.loyalty_memberships FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ---------- extrato ----------
CREATE TABLE public.loyalty_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  membership_id uuid REFERENCES public.loyalty_memberships(id) ON DELETE CASCADE,
  kind public.loyalty_ledger_kind NOT NULL DEFAULT 'credit',
  points integer NOT NULL DEFAULT 0,
  credit_cents integer NOT NULL DEFAULT 0,
  amount_cents integer NOT NULL DEFAULT 0,
  reason text NOT NULL,
  ref_type text,
  ref_id uuid,
  idempotency_key text UNIQUE,
  expires_at timestamptz,
  expired_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_loyalty_ledger_member ON public.loyalty_ledger (user_id, store_id, created_at DESC);
CREATE INDEX idx_loyalty_ledger_expiry ON public.loyalty_ledger (expires_at) WHERE expired_at IS NULL;
GRANT SELECT ON public.loyalty_ledger TO authenticated;
GRANT ALL ON public.loyalty_ledger TO service_role;
ALTER TABLE public.loyalty_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read own ledger" ON public.loyalty_ledger FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Store owner reads ledger" ON public.loyalty_ledger FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()));
CREATE POLICY "Admins read ledger" ON public.loyalty_ledger FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ---------- recompensas ----------
CREATE TABLE public.loyalty_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  image_url text,
  kind public.loyalty_reward_kind NOT NULL DEFAULT 'coupon',
  points_cost integer NOT NULL DEFAULT 100,
  coupon_id uuid REFERENCES public.coupons(id) ON DELETE SET NULL,
  credit_cents integer NOT NULL DEFAULT 0,
  stock integer,
  min_tier_id uuid REFERENCES public.loyalty_tiers(id) ON DELETE SET NULL,
  active boolean NOT NULL DEFAULT true,
  valid_until date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.loyalty_rewards TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loyalty_rewards TO authenticated;
GRANT ALL ON public.loyalty_rewards TO service_role;
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active rewards" ON public.loyalty_rewards FOR SELECT USING (active = true);
CREATE POLICY "Owner manages rewards" ON public.loyalty_rewards FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()));
CREATE POLICY "Admins manage rewards" ON public.loyalty_rewards FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------- resgates ----------
CREATE TABLE public.loyalty_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reward_id uuid NOT NULL REFERENCES public.loyalty_rewards(id) ON DELETE CASCADE,
  points_spent integer NOT NULL DEFAULT 0,
  status public.loyalty_redemption_status NOT NULL DEFAULT 'pending',
  code text NOT NULL,
  coupon_redemption_id uuid REFERENCES public.coupon_redemptions(id) ON DELETE SET NULL,
  fulfilled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, code)
);
GRANT SELECT, UPDATE ON public.loyalty_redemptions TO authenticated;
GRANT ALL ON public.loyalty_redemptions TO service_role;
ALTER TABLE public.loyalty_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read own redemptions" ON public.loyalty_redemptions FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Owner reads store redemptions" ON public.loyalty_redemptions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()));
CREATE POLICY "Owner updates store redemptions" ON public.loyalty_redemptions FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()));
CREATE POLICY "Admins read redemptions" ON public.loyalty_redemptions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ---------- missões ----------
CREATE TABLE public.loyalty_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  goal_type text NOT NULL,
  goal_count integer NOT NULL DEFAULT 1,
  reward_points integer NOT NULL DEFAULT 0,
  badge_slug text,
  period text NOT NULL DEFAULT 'week',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.loyalty_missions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loyalty_missions TO authenticated;
GRANT ALL ON public.loyalty_missions TO service_role;
ALTER TABLE public.loyalty_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active missions" ON public.loyalty_missions FOR SELECT USING (active = true);
CREATE POLICY "Owner manages store missions" ON public.loyalty_missions FOR ALL TO authenticated
  USING (store_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()))
  WITH CHECK (store_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()));
CREATE POLICY "Admins manage missions" ON public.loyalty_missions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.loyalty_mission_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES public.loyalty_missions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  period_start date NOT NULL DEFAULT CURRENT_DATE,
  progress integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mission_id, user_id, period_start)
);
GRANT SELECT ON public.loyalty_mission_progress TO authenticated;
GRANT ALL ON public.loyalty_mission_progress TO service_role;
ALTER TABLE public.loyalty_mission_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read own mission progress" ON public.loyalty_mission_progress FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Owner reads store mission progress" ON public.loyalty_mission_progress FOR SELECT TO authenticated
  USING (store_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()));

-- ---------- QR rotativo ----------
CREATE TABLE public.loyalty_checkin_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  used_by_store uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.loyalty_checkin_tokens TO authenticated;
GRANT ALL ON public.loyalty_checkin_tokens TO service_role;
ALTER TABLE public.loyalty_checkin_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read own tokens" ON public.loyalty_checkin_tokens FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ---------- selos ----------
CREATE TABLE public.loyalty_badges (
  slug text PRIMARY KEY,
  name text NOT NULL,
  description text,
  icon text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.loyalty_badges TO anon;
GRANT SELECT ON public.loyalty_badges TO authenticated;
GRANT ALL ON public.loyalty_badges TO service_role;
ALTER TABLE public.loyalty_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads badges" ON public.loyalty_badges FOR SELECT USING (true);

CREATE TABLE public.loyalty_user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_slug text NOT NULL REFERENCES public.loyalty_badges(slug) ON DELETE CASCADE,
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_slug)
);
GRANT SELECT ON public.loyalty_user_badges TO anon;
GRANT SELECT ON public.loyalty_user_badges TO authenticated;
GRANT ALL ON public.loyalty_user_badges TO service_role;
ALTER TABLE public.loyalty_user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads user badges" ON public.loyalty_user_badges FOR SELECT USING (true);

-- ---------- preferências do consumidor ----------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nickname text,
  ADD COLUMN IF NOT EXISTS loyalty_ranking_opt_in boolean NOT NULL DEFAULT false;

-- updated_at triggers
CREATE TRIGGER loyalty_programs_updated_at BEFORE UPDATE ON public.loyalty_programs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER loyalty_rewards_updated_at BEFORE UPDATE ON public.loyalty_rewards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- selos iniciais
INSERT INTO public.loyalty_badges (slug, name, description, icon) VALUES
  ('primeiro-ponto', 'Primeiro Ponto', 'Ganhou os primeiros pontos em uma loja parceira', 'Sparkles'),
  ('explorador', 'Explorador', 'Participou do programa de 3 lojas diferentes', 'Compass'),
  ('critico-gentil', 'Crítico Gentil', 'Publicou uma avaliação com foto', 'Camera'),
  ('cliente-fiel', 'Cliente Fiel', 'Teve 5 compras validadas na mesma loja', 'HeartHandshake'),
  ('embaixador', 'Embaixador', 'Indicou um amigo que comprou', 'Users')
ON CONFLICT (slug) DO NOTHING;