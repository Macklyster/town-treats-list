DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'group_offers_store_id_fkey') THEN
    ALTER TABLE public.group_offers
      ADD CONSTRAINT group_offers_store_id_fkey
      FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'group_offer_participants_user_id_fkey') THEN
    ALTER TABLE public.group_offer_participants
      ADD CONSTRAINT group_offer_participants_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_group_offers_store_id ON public.group_offers(store_id);
CREATE INDEX IF NOT EXISTS idx_group_offer_participants_user_id ON public.group_offer_participants(user_id);