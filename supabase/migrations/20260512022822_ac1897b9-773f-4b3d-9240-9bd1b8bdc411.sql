INSERT INTO public.plans (slug, name, price_cents, max_offers, featured_slots, sort_order, active, features)
VALUES ('gratis', 'Grátis', 0, 1, 0, 0, true, '[]'::jsonb)
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, price_cents=EXCLUDED.price_cents, max_offers=EXCLUDED.max_offers, featured_slots=EXCLUDED.featured_slots, sort_order=EXCLUDED.sort_order, active=EXCLUDED.active;