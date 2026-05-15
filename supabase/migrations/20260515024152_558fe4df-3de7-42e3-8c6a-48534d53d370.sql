DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'auction_offers_store_id_fkey'
  ) THEN
    ALTER TABLE public.auction_offers
      ADD CONSTRAINT auction_offers_store_id_fkey
      FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;
  END IF;
END $$;