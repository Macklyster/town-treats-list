CREATE POLICY "users upload pending store images" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id IN ('store-logos','offer-images') AND (storage.foldername(name))[1] = 'pending' AND (storage.foldername(name))[2] = auth.uid()::text);
CREATE POLICY "users delete pending store images" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id IN ('store-logos','offer-images') AND (storage.foldername(name))[1] = 'pending' AND (storage.foldername(name))[2] = auth.uid()::text);