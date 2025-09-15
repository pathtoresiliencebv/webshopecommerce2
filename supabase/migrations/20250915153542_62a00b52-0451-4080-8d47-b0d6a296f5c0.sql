-- Create store_settings table for payments, shipping, and general settings
CREATE TABLE public.store_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  setting_type TEXT NOT NULL CHECK (setting_type IN ('general', 'payments', 'shipping')),
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, setting_type)
);

-- Create theme_settings table for theme management
CREATE TABLE public.theme_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  theme_name TEXT NOT NULL DEFAULT 'Default Theme 1.0',
  is_active BOOLEAN DEFAULT true,
  appearance_settings JSONB NOT NULL DEFAULT '{}',
  seo_settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, theme_name)
);

-- Enable RLS on both tables
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for store_settings
CREATE POLICY "Users can manage store settings in their organizations" 
ON public.store_settings 
FOR ALL 
USING (get_user_role_in_organization(organization_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text]));

-- Create policies for theme_settings
CREATE POLICY "Users can view theme settings from organizations they have access to" 
ON public.theme_settings 
FOR SELECT 
USING (user_has_organization_access(organization_id));

CREATE POLICY "Users can manage theme settings in their organizations" 
ON public.theme_settings 
FOR ALL 
USING (get_user_role_in_organization(organization_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text]));

-- Create triggers for updated_at
CREATE TRIGGER update_store_settings_updated_at
BEFORE UPDATE ON public.store_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_theme_settings_updated_at
BEFORE UPDATE ON public.theme_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();