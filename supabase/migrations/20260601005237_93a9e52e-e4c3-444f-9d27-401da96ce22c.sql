
-- 1. Restrict profiles SELECT to owner; expose safe fields via public view
DROP POLICY IF EXISTS "profiles public read" ON public.profiles;

CREATE POLICY "users read own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "admins read all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Public-safe view exposing only non-sensitive fields (used by reviews, etc.)
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT id, full_name, avatar_url
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Allow the view to bypass the strict profiles RLS for the safe columns
CREATE POLICY "public read safe profile fields via view"
ON public.profiles
FOR SELECT
USING (
  -- Only effective when explicitly selected through the view (security_invoker keeps auth context).
  -- This permits anyone to read the row, but the view restricts columns to id/full_name/avatar_url.
  current_setting('request.jwt.claims', true) IS NOT NULL
  OR current_setting('request.jwt.claims', true) IS NULL
);

-- Actually the above policy would still allow direct table reads. Drop it and instead make the view SECURITY DEFINER-style by querying with elevated rights via a function isn't needed; use security_invoker=false so view runs as owner.
DROP POLICY IF EXISTS "public read safe profile fields via view" ON public.profiles;

DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
WITH (security_invoker = false) AS
SELECT id, full_name, avatar_url
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 2. Fix group_offer_participants: remove public-approved branch
DROP POLICY IF EXISTS "participants read" ON public.group_offer_participants;

CREATE POLICY "participants read"
ON public.group_offer_participants
FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.group_offers go
    JOIN public.stores s ON s.id = go.store_id
    WHERE go.id = group_offer_participants.group_offer_id
      AND s.owner_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 3. Remove sensitive billing data from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.subscriptions;
ALTER PUBLICATION supabase_realtime DROP TABLE public.auction_reservations;
