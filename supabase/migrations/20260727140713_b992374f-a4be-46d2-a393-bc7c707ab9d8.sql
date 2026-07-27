ALTER TABLE public.media_assets
  ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS duration_seconds integer,
  ADD COLUMN IF NOT EXISTS poster_url text;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'media_assets_media_type_check') THEN
    ALTER TABLE public.media_assets
      ADD CONSTRAINT media_assets_media_type_check CHECK (media_type IN ('image','video'));
  END IF;
END $$;