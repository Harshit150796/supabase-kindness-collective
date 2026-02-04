-- Create storage bucket for fundraiser cover photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('fundraiser-covers', 'fundraiser-covers', true);

-- Allow anyone to view cover photos (public bucket)
CREATE POLICY "Public can view cover photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'fundraiser-covers');

-- Allow authenticated users to upload their own cover photos
CREATE POLICY "Users can upload cover photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'fundraiser-covers' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own cover photos
CREATE POLICY "Users can update own cover photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'fundraiser-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own cover photos
CREATE POLICY "Users can delete own cover photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'fundraiser-covers' AND auth.uid()::text = (storage.foldername(name))[1]);