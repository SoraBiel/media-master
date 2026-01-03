-- Create storage bucket for smart link assets (avatars and button icons)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'smart-link-assets',
  'smart-link-assets',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow authenticated users to upload their own files
CREATE POLICY "Users can upload their own smart link assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'smart-link-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy to allow anyone to view smart link assets (public bucket)
CREATE POLICY "Anyone can view smart link assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'smart-link-assets');

-- Create policy to allow users to update their own files
CREATE POLICY "Users can update their own smart link assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'smart-link-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy to allow users to delete their own files
CREATE POLICY "Users can delete their own smart link assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'smart-link-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);