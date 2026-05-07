
DROP POLICY IF EXISTS "owners insert store logo" ON storage.objects;
DROP POLICY IF EXISTS "owners update store logo" ON storage.objects;
DROP POLICY IF EXISTS "owners delete store logo" ON storage.objects;

CREATE POLICY "owners insert store logo"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'store-logos'
  AND (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id::text = (storage.foldername(storage.objects.name))[1]
        AND s.owner_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "owners update store logo"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'store-logos'
  AND (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id::text = (storage.foldername(storage.objects.name))[1]
        AND s.owner_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  )
)
WITH CHECK (
  bucket_id = 'store-logos'
  AND (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id::text = (storage.foldername(storage.objects.name))[1]
        AND s.owner_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "owners delete store logo"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'store-logos'
  AND (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id::text = (storage.foldername(storage.objects.name))[1]
        AND s.owner_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  )
);
