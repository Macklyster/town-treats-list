
-- 1) Realtime: deny by default (app não usa channels privados ainda)
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deny realtime by default" ON realtime.messages;
CREATE POLICY "deny realtime by default"
ON realtime.messages
FOR SELECT
TO authenticated
USING (false);

-- 2) Política UPDATE faltando no bucket review-photos
DROP POLICY IF EXISTS "users update own review photos" ON storage.objects;
CREATE POLICY "users update own review photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'review-photos' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'review-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
