
-- 1. app_settings: hours window
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS review_prompt_hours integer NOT NULL DEFAULT 3;

-- 2. enums
DO $$ BEGIN
  CREATE TYPE public.review_status AS ENUM ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. offer_reviews
CREATE TABLE IF NOT EXISTS public.offer_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL,
  store_id uuid NOT NULL,
  user_id uuid NOT NULL,
  rating smallint NOT NULL,
  comment text,
  status public.review_status NOT NULL DEFAULT 'pending',
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (offer_id, user_id)
);

-- validate rating range via trigger (avoid CHECK to be safe-immutable)
CREATE OR REPLACE FUNCTION public.validate_offer_review()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'rating must be between 1 and 5';
  END IF;
  IF NEW.comment IS NOT NULL AND length(NEW.comment) > 280 THEN
    RAISE EXCEPTION 'comment exceeds 280 characters';
  END IF;
  -- ensure store_id matches offer
  IF TG_OP = 'INSERT' OR NEW.offer_id <> OLD.offer_id THEN
    SELECT store_id INTO NEW.store_id FROM public.offers WHERE id = NEW.offer_id;
    IF NEW.store_id IS NULL THEN RAISE EXCEPTION 'offer not found'; END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_validate_offer_review ON public.offer_reviews;
CREATE TRIGGER trg_validate_offer_review
BEFORE INSERT OR UPDATE ON public.offer_reviews
FOR EACH ROW EXECUTE FUNCTION public.validate_offer_review();

DROP TRIGGER IF EXISTS trg_offer_reviews_updated ON public.offer_reviews;
CREATE TRIGGER trg_offer_reviews_updated
BEFORE UPDATE ON public.offer_reviews
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.offer_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "approved reviews public read"
ON public.offer_reviews FOR SELECT
USING (
  status = 'approved'
  OR auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = offer_reviews.store_id AND s.owner_id = auth.uid())
  OR public.has_role(auth.uid(),'admin')
);

CREATE POLICY "users insert own reviews"
ON public.offer_reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users update own pending reviews"
ON public.offer_reviews FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins manage reviews"
ON public.offer_reviews FOR ALL
USING (public.has_role(auth.uid(),'admin'))
WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 4. offer_review_photos
CREATE TABLE IF NOT EXISTS public.offer_review_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.offer_reviews(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.offer_review_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "review photos read"
ON public.offer_review_photos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.offer_reviews r
    WHERE r.id = offer_review_photos.review_id
      AND (
        r.status = 'approved'
        OR r.user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = r.store_id AND s.owner_id = auth.uid())
        OR public.has_role(auth.uid(),'admin')
      )
  )
);

CREATE POLICY "users insert own review photos"
ON public.offer_review_photos FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.offer_reviews r WHERE r.id = review_id AND r.user_id = auth.uid())
);

CREATE POLICY "users delete own review photos"
ON public.offer_review_photos FOR DELETE
USING (
  EXISTS (SELECT 1 FROM public.offer_reviews r WHERE r.id = review_id AND r.user_id = auth.uid())
  OR public.has_role(auth.uid(),'admin')
);

-- 5. review_prompts
CREATE TABLE IF NOT EXISTS public.review_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  offer_id uuid NOT NULL,
  store_id uuid NOT NULL,
  triggered_event_type text NOT NULL,
  eligible_at timestamptz NOT NULL,
  notified_at timestamptz,
  dismissed_at timestamptz,
  dismissed_permanently boolean NOT NULL DEFAULT false,
  remind_after timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, offer_id)
);

ALTER TABLE public.review_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own prompts"
ON public.review_prompts FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins manage prompts"
ON public.review_prompts FOR ALL
USING (public.has_role(auth.uid(),'admin'))
WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE INDEX IF NOT EXISTS idx_review_prompts_user_eligible
  ON public.review_prompts (user_id, eligible_at)
  WHERE dismissed_permanently = false;

-- 6. auto-approve trigger (≥4 stars, no photos, comment short or empty)
CREATE OR REPLACE FUNCTION public.auto_approve_review()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status = 'pending'
     AND NEW.rating >= 4
     AND (NEW.comment IS NULL OR length(NEW.comment) <= 200)
  THEN
    NEW.status := 'approved';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_auto_approve_review ON public.offer_reviews;
CREATE TRIGGER trg_auto_approve_review
BEFORE INSERT ON public.offer_reviews
FOR EACH ROW EXECUTE FUNCTION public.auto_approve_review();

-- 7. RPCs
CREATE OR REPLACE FUNCTION public.pending_reviews_for_user()
RETURNS TABLE (
  prompt_id uuid,
  offer_id uuid,
  store_id uuid,
  offer_title text,
  offer_image text,
  store_name text,
  store_logo text,
  eligible_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT rp.id, rp.offer_id, rp.store_id, o.title, o.image_url, s.name, s.logo_url, rp.eligible_at
  FROM public.review_prompts rp
  JOIN public.offers o ON o.id = rp.offer_id
  JOIN public.stores s ON s.id = rp.store_id
  WHERE rp.user_id = auth.uid()
    AND rp.dismissed_permanently = false
    AND rp.eligible_at <= now()
    AND (rp.remind_after IS NULL OR rp.remind_after <= now())
    AND NOT EXISTS (
      SELECT 1 FROM public.offer_reviews r
      WHERE r.offer_id = rp.offer_id AND r.user_id = auth.uid()
    )
  ORDER BY rp.eligible_at ASC
  LIMIT 5;
$$;

CREATE OR REPLACE FUNCTION public.offer_rating_summary(p_offer_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'count', count(*),
    'avg', coalesce(round(avg(rating)::numeric, 2), 0),
    'distribution', jsonb_build_object(
      '1', count(*) FILTER (WHERE rating = 1),
      '2', count(*) FILTER (WHERE rating = 2),
      '3', count(*) FILTER (WHERE rating = 3),
      '4', count(*) FILTER (WHERE rating = 4),
      '5', count(*) FILTER (WHERE rating = 5)
    )
  )
  FROM public.offer_reviews
  WHERE offer_id = p_offer_id AND status = 'approved';
$$;

CREATE OR REPLACE FUNCTION public.store_rating_summary(p_store_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'count', count(*),
    'avg', coalesce(round(avg(rating)::numeric, 2), 0)
  )
  FROM public.offer_reviews
  WHERE store_id = p_store_id AND status = 'approved';
$$;

-- 8. Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-photos','review-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "review photos public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'review-photos');

CREATE POLICY "users upload own review photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'review-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "users delete own review photos storage"
ON storage.objects FOR DELETE
USING (bucket_id = 'review-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
