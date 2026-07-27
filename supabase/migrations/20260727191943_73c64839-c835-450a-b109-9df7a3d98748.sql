DROP POLICY IF EXISTS "Public reads media assets used by offers" ON public.media_assets;

CREATE POLICY "Public reads media assets used by approved offers"
ON public.media_assets
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.offer_media om
    JOIN public.offers o ON o.id = om.offer_id
    WHERE om.media_id = media_assets.id
      AND o.status = 'approved'
  )
);