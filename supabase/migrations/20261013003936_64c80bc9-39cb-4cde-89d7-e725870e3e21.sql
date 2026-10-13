DROP POLICY IF EXISTS "Users can upload cover photos" ON storage.objects;
CREATE POLICY "Users can upload cover photos" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'fundraiser-covers' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.is_admin_any(auth.uid())
    OR EXISTS (SELECT 1 FROM public.fundraisers f WHERE f.id::text = (storage.foldername(name))[1] AND f.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.fundraiser_team t WHERE t.fundraiser_id::text = (storage.foldername(name))[1] AND t.user_id = auth.uid() AND t.status = 'active')
  )
);

-- Public buckets serve files by public URL without a SELECT policy; these only enabled listing every file.
DROP POLICY IF EXISTS "Public can view email assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view cms images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view cover photos" ON storage.objects;
CREATE POLICY "Owners can see own cover photos" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'fundraiser-covers' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin_any(auth.uid())));