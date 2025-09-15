-- Create storage bucket for theme assets
INSERT INTO storage.buckets (id, name, public) VALUES ('theme-assets', 'theme-assets', true);

-- Create policies for theme asset uploads
CREATE POLICY "Theme assets are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'theme-assets');

CREATE POLICY "Authenticated users can upload theme assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'theme-assets' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update theme assets" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'theme-assets' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete theme assets" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'theme-assets' AND auth.uid() IS NOT NULL);