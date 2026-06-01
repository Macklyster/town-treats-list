
-- Frente 6: fix Security Definer view and function search_path warnings

-- 1) Recreate public_profiles as SECURITY INVOKER view
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT id, full_name, avatar_url FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 2) Set search_path on the two flagged functions
ALTER FUNCTION public.auction_current_price(public.auction_offers) SET search_path = public;
ALTER FUNCTION public.haversine_meters(double precision, double precision, double precision, double precision) SET search_path = public;
