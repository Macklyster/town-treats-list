-- 1. App settings
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS group_offer_max_active_per_store INT NOT NULL DEFAULT 1;

-- 2. Status enum
DO $$ BEGIN
  CREATE TYPE public.group_offer_status AS ENUM ('pending','approved','rejected','expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. group_offers
CREATE TABLE IF NOT EXISTS public.group_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  category_slug TEXT NOT NULL,
  conditions TEXT,
  original_price NUMERIC NOT NULL DEFAULT 0,
  tiers JSONB NOT NULL DEFAULT '[]'::jsonb,
  duration_hours INT NOT NULL DEFAULT 12 CHECK (duration_hours BETWEEN 1 AND 168),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  status public.group_offer_status NOT NULL DEFAULT 'pending',
  share_token TEXT NOT NULL UNIQUE DEFAULT lower(substr(replace(gen_random_uuid()::text,'-',''),1,10)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_group_offers_store ON public.group_offers(store_id);
CREATE INDEX IF NOT EXISTS idx_group_offers_status ON public.group_offers(status);
CREATE INDEX IF NOT EXISTS idx_group_offers_token ON public.group_offers(share_token);

-- 4. participants
CREATE TABLE IF NOT EXISTS public.group_offer_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_offer_id UUID NOT NULL REFERENCES public.group_offers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  referrer_user_id UUID,
  whatsapp_clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_offer_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_group_part_offer ON public.group_offer_participants(group_offer_id);
CREATE INDEX IF NOT EXISTS idx_group_part_user ON public.group_offer_participants(user_id);

-- 5. updated_at trigger
DROP TRIGGER IF EXISTS group_offers_updated_at ON public.group_offers;
CREATE TRIGGER group_offers_updated_at
BEFORE UPDATE ON public.group_offers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. validation trigger
CREATE OR REPLACE FUNCTION public.validate_group_offer()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_tier jsonb;
  v_prev_people int := 0;
  v_prev_price numeric := NULL;
  v_count int;
  v_first_people int;
  v_max_active int;
  v_is_plus boolean;
BEGIN
  -- tiers must be a non-empty array
  IF NEW.tiers IS NULL OR jsonb_typeof(NEW.tiers) <> 'array' OR jsonb_array_length(NEW.tiers) = 0 THEN
    RAISE EXCEPTION 'tiers must be a non-empty array';
  END IF;

  -- first tier min_people = 1
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

  -- only on insert / when not yet expired or rejected, enforce plan + active limit
  IF (TG_OP = 'INSERT') OR (NEW.status IN ('pending','approved') AND (TG_OP = 'UPDATE' AND OLD.status NOT IN ('pending','approved'))) THEN
    -- plus check
    SELECT EXISTS (
      SELECT 1 FROM public.subscriptions sub
      JOIN public.plans p ON p.id = sub.plan_id
      WHERE sub.store_id = NEW.store_id
        AND sub.status = 'active'
        AND p.slug = 'plus'
    ) INTO v_is_plus;
    IF NOT v_is_plus AND NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'group offers are exclusive to the Plus plan';
    END IF;

    -- active limit
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
END $$;

DROP TRIGGER IF EXISTS validate_group_offer_trigger ON public.group_offers;
CREATE TRIGGER validate_group_offer_trigger
BEFORE INSERT OR UPDATE ON public.group_offers
FOR EACH ROW EXECUTE FUNCTION public.validate_group_offer();

-- 7. window trigger
CREATE OR REPLACE FUNCTION public.set_group_offer_window()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status = 'approved' THEN
    IF NEW.starts_at IS NULL OR (TG_OP = 'UPDATE' AND OLD.status <> 'approved') THEN
      NEW.starts_at := now();
    END IF;
    NEW.ends_at := NEW.starts_at + make_interval(hours => NEW.duration_hours);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS set_group_offer_window_trigger ON public.group_offers;
CREATE TRIGGER set_group_offer_window_trigger
BEFORE INSERT OR UPDATE ON public.group_offers
FOR EACH ROW EXECUTE FUNCTION public.set_group_offer_window();

-- 8. RPC: state by token
CREATE OR REPLACE FUNCTION public.group_offer_state(p_token TEXT)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_offer public.group_offers;
  v_count int;
  v_current jsonb;
  v_next jsonb;
  v_tier jsonb;
  v_avatars jsonb;
BEGIN
  SELECT * INTO v_offer FROM public.group_offers WHERE share_token = p_token;
  IF v_offer.id IS NULL THEN RETURN jsonb_build_object('found', false); END IF;

  SELECT count(*) INTO v_count FROM public.group_offer_participants WHERE group_offer_id = v_offer.id;

  -- find current tier (highest min_people <= count)
  FOR v_tier IN SELECT * FROM jsonb_array_elements(v_offer.tiers) LOOP
    IF (v_tier->>'min_people')::int <= GREATEST(v_count,1) THEN
      v_current := v_tier;
    ELSIF v_next IS NULL THEN
      v_next := v_tier;
    END IF;
  END LOOP;

  SELECT jsonb_agg(jsonb_build_object('user_id', p.user_id, 'avatar_url', pr.avatar_url, 'name', pr.full_name) ORDER BY p.created_at DESC)
    INTO v_avatars
  FROM (SELECT * FROM public.group_offer_participants WHERE group_offer_id = v_offer.id ORDER BY created_at DESC LIMIT 12) p
  LEFT JOIN public.profiles pr ON pr.id = p.user_id;

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
      'original_price', v_offer.original_price,
      'tiers', v_offer.tiers,
      'duration_hours', v_offer.duration_hours,
      'starts_at', v_offer.starts_at,
      'ends_at', v_offer.ends_at,
      'status', v_offer.status,
      'share_token', v_offer.share_token
    ),
    'participants_count', v_count,
    'current_tier', v_current,
    'next_tier', v_next,
    'seconds_remaining', GREATEST(0, EXTRACT(EPOCH FROM (v_offer.ends_at - now()))::int),
    'avatars', COALESCE(v_avatars, '[]'::jsonb)
  );
END $$;

-- 9. RLS
ALTER TABLE public.group_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_offer_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "approved group offers public read" ON public.group_offers;
CREATE POLICY "approved group offers public read" ON public.group_offers
  FOR SELECT USING (
    status = 'approved'
    OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = group_offers.store_id AND s.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "owners insert group offers" ON public.group_offers;
CREATE POLICY "owners insert group offers" ON public.group_offers
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.stores s WHERE s.id = group_offers.store_id AND s.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "owners update group offers" ON public.group_offers;
CREATE POLICY "owners update group offers" ON public.group_offers
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.stores s WHERE s.id = group_offers.store_id AND s.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "owners delete group offers" ON public.group_offers;
CREATE POLICY "owners delete group offers" ON public.group_offers
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.stores s WHERE s.id = group_offers.store_id AND s.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "participants read" ON public.group_offer_participants;
CREATE POLICY "participants read" ON public.group_offer_participants
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.group_offers go JOIN public.stores s ON s.id = go.store_id
               WHERE go.id = group_offer_participants.group_offer_id AND s.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.group_offers go WHERE go.id = group_offer_participants.group_offer_id AND go.status = 'approved')
  );

DROP POLICY IF EXISTS "participants insert self" ON public.group_offer_participants;
CREATE POLICY "participants insert self" ON public.group_offer_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "participants update self" ON public.group_offer_participants;
CREATE POLICY "participants update self" ON public.group_offer_participants
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admins manage participants" ON public.group_offer_participants;
CREATE POLICY "admins manage participants" ON public.group_offer_participants
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));