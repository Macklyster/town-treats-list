ALTER TABLE public.geo_offers
  ADD CONSTRAINT geo_offers_store_id_fkey
  FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;