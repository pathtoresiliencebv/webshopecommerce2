-- =====================================================
-- ADD SENSATIONALS STORE & THEME SYSTEM
-- Create Sensationals store + implement theme export/import
-- =====================================================

-- 1. ENSURE SENSATIONALS STORE EXISTS
-- First check if it exists, if not create it
DO $$
DECLARE
  v_org_id UUID;
  v_user_id UUID;
BEGIN
  -- Check if Sensationals exists
  SELECT id INTO v_org_id
  FROM public.organizations
  WHERE subdomain = 'sensationals'
  LIMIT 1;

  -- If not found, create it
  IF v_org_id IS NULL THEN
    INSERT INTO public.organizations (
      name,
      slug,
      subdomain,
      description,
      subscription_status,
      subscription_plan,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      'Sensationals',
      'sensationals',
      'sensationals',
      'Discover amazing products for a sensational life',
      'active',
      'professional',
      true,
      NOW(),
      NOW()
    )
    RETURNING id INTO v_org_id;

    -- Get the first admin user (or use a specific user)
    SELECT id INTO v_user_id
    FROM auth.users
    LIMIT 1;

    -- If we have a user, add them as owner of Sensationals
    IF v_user_id IS NOT NULL THEN
      INSERT INTO public.organization_users (
        user_id,
        organization_id,
        role,
        is_active,
        joined_at,
        created_at,
        updated_at
      ) VALUES (
        v_user_id,
        v_org_id,
        'owner',
        true,
        NOW(),
        NOW(),
        NOW()
      );
    END IF;

    RAISE NOTICE '✅ Sensationals store created with ID: %', v_org_id;
  ELSE
    RAISE NOTICE '✅ Sensationals store already exists with ID: %', v_org_id;
  END IF;
END $$;

-- 2. THEME TEMPLATES (CENTRAL DATABASE)
-- Global theme template library
CREATE TABLE IF NOT EXISTS public.theme_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'custom', -- modern, minimal, colorful, professional, custom
  
  -- Preview
  preview_image_url TEXT,
  demo_url TEXT,
  screenshots JSONB DEFAULT '[]',
  
  -- Template data (full theme config)
  theme_config JSONB NOT NULL,
  
  -- Marketplace
  is_public BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  price DECIMAL(10,2) DEFAULT 0,
  
  -- Stats
  download_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  
  -- Author
  created_by UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES public.organizations(id), -- Store that created it
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User theme library (saved/favorited templates)
CREATE TABLE IF NOT EXISTS public.user_theme_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  template_id UUID REFERENCES public.theme_templates(id) ON DELETE CASCADE,
  is_favorite BOOLEAN DEFAULT false,
  notes TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_theme_templates_category ON public.theme_templates(category);
CREATE INDEX IF NOT EXISTS idx_theme_templates_public ON public.theme_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_theme_templates_org ON public.theme_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_theme_library_user ON public.user_theme_library(user_id);

-- Enable RLS
ALTER TABLE public.theme_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_theme_library ENABLE ROW LEVEL SECURITY;

-- RLS Policies for theme_templates
CREATE POLICY "Public templates are viewable by all" ON public.theme_templates
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own templates" ON public.theme_templates
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create templates" ON public.theme_templates
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own templates" ON public.theme_templates
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own templates" ON public.theme_templates
  FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for user_theme_library
CREATE POLICY "Users can view their own theme library" ON public.user_theme_library
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their theme library" ON public.user_theme_library
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their theme library" ON public.user_theme_library
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their theme library" ON public.user_theme_library
  FOR DELETE USING (auth.uid() = user_id);

-- 3. DEFAULT THEME TEMPLATES
-- Insert some default theme templates
INSERT INTO public.theme_templates (
  name,
  slug,
  description,
  category,
  is_public,
  theme_config,
  preview_image_url
) VALUES
(
  'Modern Minimal',
  'modern-minimal',
  'Clean and minimal design with focus on product imagery',
  'minimal',
  true,
  '{
    "colors": {
      "primary": "#000000",
      "secondary": "#666666",
      "accent": "#FF6B6B",
      "background": "#FFFFFF",
      "surface": "#F5F5F5",
      "text": "#1A1A1A",
      "textSecondary": "#666666",
      "border": "#E5E5E5"
    },
    "typography": {
      "headingFont": "Inter",
      "bodyFont": "Inter",
      "fontSize": {"base": "1rem", "lg": "1.125rem"}
    },
    "layout": {
      "borderRadius": "0.5rem",
      "maxWidth": "1280px"
    }
  }'::jsonb,
  null
),
(
  'Bold & Colorful',
  'bold-colorful',
  'Vibrant colors and bold typography for modern brands',
  'colorful',
  true,
  '{
    "colors": {
      "primary": "#8B5CF6",
      "secondary": "#EC4899",
      "accent": "#F59E0B",
      "background": "#FFFFFF",
      "surface": "#F9FAFB",
      "text": "#111827",
      "textSecondary": "#6B7280",
      "border": "#E5E7EB"
    },
    "typography": {
      "headingFont": "Poppins",
      "bodyFont": "Inter",
      "fontSize": {"base": "1rem", "lg": "1.125rem"}
    },
    "layout": {
      "borderRadius": "1rem",
      "maxWidth": "1280px"
    }
  }'::jsonb,
  null
),
(
  'Professional Business',
  'professional-business',
  'Corporate and professional design for B2B stores',
  'professional',
  true,
  '{
    "colors": {
      "primary": "#1E40AF",
      "secondary": "#64748B",
      "accent": "#0EA5E9",
      "background": "#FFFFFF",
      "surface": "#F8FAFC",
      "text": "#0F172A",
      "textSecondary": "#475569",
      "border": "#CBD5E1"
    },
    "typography": {
      "headingFont": "Roboto",
      "bodyFont": "Open Sans",
      "fontSize": {"base": "1rem", "lg": "1.125rem"}
    },
    "layout": {
      "borderRadius": "0.375rem",
      "maxWidth": "1440px"
    }
  }'::jsonb,
  null
)
ON CONFLICT (slug) DO NOTHING;

-- Show results
SELECT 
  'Theme System Setup Complete!' as message,
  (SELECT COUNT(*) FROM public.organizations WHERE subdomain IN ('aurelioliving', 'sensationals')) as store_count,
  (SELECT COUNT(*) FROM public.theme_templates) as template_count;

-- List stores
SELECT 
  id,
  name,
  slug,
  subdomain,
  subscription_plan,
  is_active,
  created_at
FROM public.organizations
WHERE subdomain IN ('aurelioliving', 'sensationals')
ORDER BY created_at;
