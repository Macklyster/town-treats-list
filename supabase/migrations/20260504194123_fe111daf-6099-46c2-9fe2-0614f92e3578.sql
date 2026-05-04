ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS state text NOT NULL DEFAULT '';

UPDATE public.stores SET city = 'Não informado' WHERE city = '';

CREATE INDEX IF NOT EXISTS idx_stores_city_state ON public.stores (city, state);