-- =====================================================
-- SETUP STORE SUBDOMAINS
-- Configure subdomain field for existing stores
-- =====================================================

-- First, ensure the subdomain column exists in organizations table
-- (It should already exist, but this is safe to run)
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS subdomain TEXT UNIQUE;

-- Add index for fast subdomain lookups
CREATE INDEX IF NOT EXISTS idx_organizations_subdomain ON public.organizations(subdomain);

-- Update Aurelio Living store with subdomain
-- This will match aurelioliving.myaurelio.com
UPDATE public.organizations
SET subdomain = 'aurelioliving'
WHERE slug = 'aurelio-living' 
   OR slug = 'aurelioliving'
   OR name ILIKE '%aurelio%living%'
   OR name ILIKE '%aurelio living%';

-- If no match found, create the store
INSERT INTO public.organizations (
  name,
  slug,
  subdomain,
  description,
  created_at,
  updated_at
)
SELECT 
  'Aurelio Living',
  'aurelioliving',
  'aurelioliving',
  'Premium furniture and home decor webshop',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.organizations WHERE subdomain = 'aurelioliving'
);

-- Create Sensationals store with subdomain
-- This will match sensationals.myaurelio.com
INSERT INTO public.organizations (
  name,
  slug,
  subdomain,
  description,
  created_at,
  updated_at
)
SELECT 
  'Sensationals',
  'sensationals',
  'sensationals',
  'New exciting webshop coming soon',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.organizations WHERE subdomain = 'sensationals'
);

-- Add comment explaining subdomain usage
COMMENT ON COLUMN public.organizations.subdomain IS 
  'Subdomain for store access (e.g., "aurelioliving" for aurelioliving.myaurelio.com)';

-- Show configured stores
SELECT 
  id,
  name,
  slug,
  subdomain,
  created_at
FROM public.organizations
WHERE subdomain IS NOT NULL
ORDER BY created_at;

SELECT '✅ Store subdomains configured successfully' as message;
