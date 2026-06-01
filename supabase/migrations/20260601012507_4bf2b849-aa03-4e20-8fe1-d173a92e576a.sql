ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS price_cents_yearly integer,
  ADD COLUMN IF NOT EXISTS stripe_price_id_yearly text;

UPDATE public.plans SET price_cents_yearly = 49000  WHERE slug = 'basico';
UPDATE public.plans SET price_cents_yearly = 129000 WHERE slug = 'destaque';
UPDATE public.plans SET price_cents_yearly = 249000 WHERE slug = 'plus';