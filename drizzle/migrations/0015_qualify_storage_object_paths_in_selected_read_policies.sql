-- Qualify the object path so the inner stores.name column cannot shadow it.
ALTER POLICY "store logos public read" ON storage.objects
  TO authenticated
  USING (bucket_id = 'store-logos' AND (
    owner_id = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR ((storage.foldername(objects.name))[1] = 'pending' AND (storage.foldername(objects.name))[2] = auth.uid()::text)
    OR EXISTS (SELECT 1 FROM public.stores s
      WHERE s.id::text = (storage.foldername(objects.name))[1] AND s.owner_id = auth.uid())
  ));
ALTER POLICY "offer-images public read" ON storage.objects
  TO authenticated
  USING (bucket_id = 'offer-images' AND (
    owner_id = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR ((storage.foldername(objects.name))[1] = 'pending' AND (storage.foldername(objects.name))[2] = auth.uid()::text)
    OR EXISTS (SELECT 1 FROM public.stores s
      WHERE s.id::text = (storage.foldername(objects.name))[1] AND s.owner_id = auth.uid())
  ));