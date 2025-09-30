-- =====================================================
-- STORAGE BUCKET FOR STORE LOGOS
-- Create public storage bucket for store logos
-- =====================================================

-- Create storage bucket for store logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-logos', 'store-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for store logos
CREATE POLICY "Public Access to Store Logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'store-logos');

CREATE POLICY "Authenticated users can upload store logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'store-logos');

CREATE POLICY "Users can update their organization logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'store-logos');

CREATE POLICY "Users can delete their organization logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'store-logos');

SELECT 'Storage bucket for store logos created' as message;
