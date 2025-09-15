-- Create media_library table for better content organization
CREATE TABLE IF NOT EXISTS public.media_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  filename text NOT NULL,
  original_filename text,
  file_url text NOT NULL,
  file_type text,
  file_size integer DEFAULT 0,
  alt_text text,
  caption text,
  tags text[] DEFAULT '{}',
  category text DEFAULT 'general',
  bucket_name text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on media_library
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;

-- Create policies for media_library
CREATE POLICY "Users can manage media in their organizations" 
ON public.media_library 
FOR ALL 
USING (get_user_role_in_organization(organization_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text]));

CREATE POLICY "Users can view media from organizations they have access to" 
ON public.media_library 
FOR SELECT 
USING (user_has_organization_access(organization_id));

-- Add update trigger for media_library
CREATE TRIGGER update_media_library_updated_at
BEFORE UPDATE ON public.media_library
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_media_library_organization_id ON public.media_library(organization_id);
CREATE INDEX idx_media_library_bucket_name ON public.media_library(bucket_name);
CREATE INDEX idx_media_library_category ON public.media_library(category);
CREATE INDEX idx_media_library_tags ON public.media_library USING GIN(tags);