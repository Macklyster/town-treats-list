
-- Media library: reusable photos per store, linked to multiple offers
CREATE TABLE public.media_assets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  url text NOT NULL,
  storage_path text,
  filename text,
  alt_text text,
  width int,
  height int,
  bytes int,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_media_assets_store ON public.media_assets(store_id, created_at DESC);
CREATE INDEX idx_media_assets_tags ON public.media_assets USING GIN(tags);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_assets TO authenticated;
GRANT ALL ON public.media_assets TO service_role;

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners read own media"
ON public.media_assets FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = media_assets.store_id AND s.owner_id = auth.uid())
);

CREATE POLICY "Store owners insert own media"
ON public.media_assets FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = media_assets.store_id AND s.owner_id = auth.uid())
);

CREATE POLICY "Store owners update own media"
ON public.media_assets FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = media_assets.store_id AND s.owner_id = auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = media_assets.store_id AND s.owner_id = auth.uid())
);

CREATE POLICY "Store owners delete own media"
ON public.media_assets FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = media_assets.store_id AND s.owner_id = auth.uid())
);

CREATE TRIGGER set_media_assets_updated_at
BEFORE UPDATE ON public.media_assets
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Junction table: many media to many offers, with ordering and cover flag
CREATE TABLE public.offer_media (
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES public.media_assets(id) ON DELETE CASCADE,
  position int NOT NULL DEFAULT 0,
  is_cover boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (offer_id, media_id)
);

CREATE INDEX idx_offer_media_offer ON public.offer_media(offer_id, position);
CREATE INDEX idx_offer_media_media ON public.offer_media(media_id);
CREATE UNIQUE INDEX uniq_offer_media_cover ON public.offer_media(offer_id) WHERE is_cover;

GRANT SELECT ON public.offer_media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offer_media TO authenticated;
GRANT ALL ON public.offer_media TO service_role;

ALTER TABLE public.offer_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads offer media"
ON public.offer_media FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Store owners manage own offer media"
ON public.offer_media FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.offers o
    JOIN public.stores s ON s.id = o.store_id
    WHERE o.id = offer_media.offer_id AND s.owner_id = auth.uid()
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.offers o
    JOIN public.stores s ON s.id = o.store_id
    WHERE o.id = offer_media.offer_id AND s.owner_id = auth.uid()
  )
);

-- Backfill: each existing offer with an image_url gets a media_asset + cover link
INSERT INTO public.media_assets (store_id, url, filename)
SELECT DISTINCT o.store_id, o.image_url, regexp_replace(o.image_url, '.*/', '')
FROM public.offers o
WHERE o.image_url IS NOT NULL AND o.image_url <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.media_assets m
    WHERE m.store_id = o.store_id AND m.url = o.image_url
  );

INSERT INTO public.offer_media (offer_id, media_id, position, is_cover)
SELECT o.id, m.id, 0, true
FROM public.offers o
JOIN public.media_assets m ON m.store_id = o.store_id AND m.url = o.image_url
WHERE o.image_url IS NOT NULL AND o.image_url <> ''
  AND NOT EXISTS (SELECT 1 FROM public.offer_media om WHERE om.offer_id = o.id)
ON CONFLICT DO NOTHING;

-- RPC: duplicate offer as draft
CREATE OR REPLACE FUNCTION public.duplicate_offer(p_offer_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_id uuid;
  v_store uuid;
BEGIN
  SELECT store_id INTO v_store FROM public.offers WHERE id = p_offer_id;
  IF v_store IS NULL THEN RAISE EXCEPTION 'offer_not_found'; END IF;
  IF NOT public.has_role(auth.uid(), 'admin')
     AND NOT EXISTS (SELECT 1 FROM public.stores WHERE id = v_store AND owner_id = auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  INSERT INTO public.offers (
    store_id, category_slug, title, type, image_url, original_price, promo_price,
    description, conditions, valid_until, status, featured
  )
  SELECT store_id, category_slug, title || ' (cópia)', type, image_url, original_price, promo_price,
         description, conditions, valid_until, 'pending'::offer_status, false
  FROM public.offers WHERE id = p_offer_id
  RETURNING id INTO v_new_id;

  INSERT INTO public.offer_media (offer_id, media_id, position, is_cover)
  SELECT v_new_id, media_id, position, is_cover
  FROM public.offer_media WHERE offer_id = p_offer_id;

  RETURN v_new_id;
END $$;

GRANT EXECUTE ON FUNCTION public.duplicate_offer(uuid) TO authenticated;
