-- Restrict only the selected policies; preserve existing write policies and public image URLs.
ALTER POLICY "duty limits public read" ON public.duty_category_limits
  TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Public reads offer media" ON public.offer_media
  TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.offers o
    WHERE o.id = offer_media.offer_id
      AND o.status = 'approved'::public.offer_status
      AND (o.valid_until IS NULL OR o.valid_until >= (now() AT TIME ZONE 'America/Sao_Paulo')::date)
      AND (NOT o.is_scheduled OR (o.scheduled_start_at IS NOT NULL AND o.scheduled_start_at <= now()))
      AND (o.scheduled_end_at IS NULL OR o.scheduled_end_at > now())
  ));

ALTER POLICY "Public reads loyalty tiers" ON public.loyalty_tiers
  TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.stores s
    JOIN public.loyalty_programs lp ON lp.store_id = s.id
    WHERE s.id = loyalty_tiers.store_id AND s.approved AND lp.active
  ));

ALTER POLICY "store logos public read" ON storage.objects
  TO authenticated
  USING (bucket_id = 'store-logos' AND (
    owner_id = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR ((storage.foldername(name))[1] = 'pending' AND (storage.foldername(name))[2] = auth.uid()::text)
    OR EXISTS (SELECT 1 FROM public.stores s
      WHERE s.id::text = (storage.foldername(name))[1] AND s.owner_id = auth.uid())
  ));

ALTER POLICY "offer-images public read" ON storage.objects
  TO authenticated
  USING (bucket_id = 'offer-images' AND (
    owner_id = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR ((storage.foldername(name))[1] = 'pending' AND (storage.foldername(name))[2] = auth.uid()::text)
    OR EXISTS (SELECT 1 FROM public.stores s
      WHERE s.id::text = (storage.foldername(name))[1] AND s.owner_id = auth.uid())
  ));

ALTER POLICY "review photos public read" ON storage.objects
  TO authenticated
  USING (bucket_id = 'review-photos' AND (
    owner_id = auth.uid()::text
    OR (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  ));