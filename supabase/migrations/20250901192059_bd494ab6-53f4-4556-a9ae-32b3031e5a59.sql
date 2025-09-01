-- Phase 1: Multi-Tenant Database Foundation
-- Create organizations table (stores/companies)
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  domain TEXT UNIQUE, -- for custom domains
  subdomain TEXT UNIQUE, -- for subdomain.platform.com
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  phone TEXT,
  email TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Netherlands',
  timezone TEXT DEFAULT 'Europe/Amsterdam',
  currency TEXT DEFAULT 'EUR',
  is_active BOOLEAN DEFAULT true,
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'expired')),
  subscription_plan TEXT DEFAULT 'starter' CHECK (subscription_plan IN ('starter', 'professional', 'enterprise')),
  trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '14 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create organization_users table for multi-tenant user management
CREATE TABLE public.organization_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'manager', 'staff', 'viewer')),
  is_active BOOLEAN DEFAULT true,
  invited_by UUID,
  invited_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

-- Create subscriptions table for billing management
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  plan TEXT NOT NULL CHECK (plan IN ('starter', 'professional', 'enterprise')),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'past_due', 'unpaid', 'incomplete')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create store_templates table for store themes
CREATE TABLE public.store_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  preview_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_premium BOOLEAN DEFAULT false,
  config JSONB, -- Store theme configuration
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_templates ENABLE ROW LEVEL SECURITY;

-- Add organization_id to existing tables
ALTER TABLE public.products ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.categories ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.collections ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.orders ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.discount_codes ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.shopping_cart ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.tags ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Create default organization for existing data
INSERT INTO public.organizations (name, slug, subdomain, description)
VALUES ('Default Store', 'default-store', 'default', 'Default organization for existing data');

-- Get the default organization ID
DO $$
DECLARE
    default_org_id UUID;
BEGIN
    SELECT id INTO default_org_id FROM public.organizations WHERE slug = 'default-store';
    
    -- Update existing data to belong to default organization
    UPDATE public.products SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.categories SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.collections SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.orders SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.reviews SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.discount_codes SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.shopping_cart SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.tags SET organization_id = default_org_id WHERE organization_id IS NULL;
END $$;

-- Make organization_id NOT NULL after data migration
ALTER TABLE public.products ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.categories ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.collections ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.orders ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.reviews ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.discount_codes ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.shopping_cart ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.tags ALTER COLUMN organization_id SET NOT NULL;

-- Create indexes for performance
CREATE INDEX idx_products_organization_id ON public.products(organization_id);
CREATE INDEX idx_categories_organization_id ON public.categories(organization_id);
CREATE INDEX idx_collections_organization_id ON public.collections(organization_id);
CREATE INDEX idx_orders_organization_id ON public.orders(organization_id);
CREATE INDEX idx_reviews_organization_id ON public.reviews(organization_id);
CREATE INDEX idx_discount_codes_organization_id ON public.discount_codes(organization_id);
CREATE INDEX idx_shopping_cart_organization_id ON public.shopping_cart(organization_id);
CREATE INDEX idx_tags_organization_id ON public.tags(organization_id);
CREATE INDEX idx_organization_users_user_id ON public.organization_users(user_id);
CREATE INDEX idx_organization_users_organization_id ON public.organization_users(organization_id);

-- Add triggers for updated_at columns
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_users_updated_at
  BEFORE UPDATE ON public.organization_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_store_templates_updated_at
  BEFORE UPDATE ON public.store_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default store templates
INSERT INTO public.store_templates (name, slug, description, config) VALUES
('Modern Minimal', 'modern-minimal', 'Clean and minimal design perfect for any product type', '{"theme": "minimal", "colors": {"primary": "#000000", "secondary": "#666666"}}'),
('Colorful Creative', 'colorful-creative', 'Vibrant and creative design for artistic brands', '{"theme": "creative", "colors": {"primary": "#FF6B6B", "secondary": "#4ECDC4"}}'),
('Professional Business', 'professional-business', 'Professional and trustworthy design for B2B stores', '{"theme": "professional", "colors": {"primary": "#2C3E50", "secondary": "#3498DB"}}');

-- Security definer functions for role checking
CREATE OR REPLACE FUNCTION public.get_user_role_in_organization(_organization_id UUID)
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.organization_users 
  WHERE user_id = auth.uid() 
  AND organization_id = _organization_id 
  AND is_active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.user_has_organization_access(_organization_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_users 
    WHERE user_id = auth.uid() 
    AND organization_id = _organization_id 
    AND is_active = true
  );
$$;

-- RLS Policies for organizations
CREATE POLICY "Users can view organizations they belong to"
  ON public.organizations FOR SELECT
  USING (public.user_has_organization_access(id));

CREATE POLICY "Organization owners can update their organization"
  ON public.organizations FOR UPDATE
  USING (public.get_user_role_in_organization(id) IN ('owner', 'admin'));

CREATE POLICY "Authenticated users can create organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for organization_users
CREATE POLICY "Users can view organization memberships they have access to"
  ON public.organization_users FOR SELECT
  USING (
    user_id = auth.uid() OR 
    public.get_user_role_in_organization(organization_id) IN ('owner', 'admin', 'manager')
  );

CREATE POLICY "Organization admins can manage users"
  ON public.organization_users FOR ALL
  USING (public.get_user_role_in_organization(organization_id) IN ('owner', 'admin'));

-- RLS Policies for subscriptions
CREATE POLICY "Organization owners can view their subscriptions"
  ON public.subscriptions FOR SELECT
  USING (public.get_user_role_in_organization(organization_id) IN ('owner', 'admin'));

CREATE POLICY "Organization owners can manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (public.get_user_role_in_organization(organization_id) = 'owner');

-- RLS Policies for store_templates
CREATE POLICY "Anyone can view active store templates"
  ON public.store_templates FOR SELECT
  USING (is_active = true);

-- Update existing RLS policies to be organization-aware
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
CREATE POLICY "Users can view products from organizations they have access to"
  ON public.products FOR SELECT
  USING (is_active = true AND public.user_has_organization_access(organization_id));

DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
CREATE POLICY "Users can create products in their organizations"
  ON public.products FOR INSERT
  WITH CHECK (public.get_user_role_in_organization(organization_id) IN ('owner', 'admin', 'manager'));

DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;
CREATE POLICY "Users can update products in their organizations"
  ON public.products FOR UPDATE
  USING (public.get_user_role_in_organization(organization_id) IN ('owner', 'admin', 'manager'));

DROP POLICY IF EXISTS "Authenticated users can delete products" ON public.products;
CREATE POLICY "Users can delete products in their organizations"
  ON public.products FOR DELETE
  USING (public.get_user_role_in_organization(organization_id) IN ('owner', 'admin', 'manager'));

-- Update categories RLS policies
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.categories;
CREATE POLICY "Users can view categories from organizations they have access to"
  ON public.categories FOR SELECT
  USING (is_active = true AND public.user_has_organization_access(organization_id));

DROP POLICY IF EXISTS "Authenticated users can insert categories" ON public.categories;
CREATE POLICY "Users can create categories in their organizations"
  ON public.categories FOR INSERT
  WITH CHECK (public.get_user_role_in_organization(organization_id) IN ('owner', 'admin', 'manager'));

DROP POLICY IF EXISTS "Authenticated users can update categories" ON public.categories;
CREATE POLICY "Users can update categories in their organizations"
  ON public.categories FOR UPDATE
  USING (public.get_user_role_in_organization(organization_id) IN ('owner', 'admin', 'manager'));

DROP POLICY IF EXISTS "Authenticated users can delete categories" ON public.categories;
CREATE POLICY "Users can delete categories in their organizations"
  ON public.categories FOR DELETE
  USING (public.get_user_role_in_organization(organization_id) IN ('owner', 'admin', 'manager'));

-- Update collections RLS policies
DROP POLICY IF EXISTS "Anyone can view active collections" ON public.collections;
CREATE POLICY "Users can view collections from organizations they have access to"
  ON public.collections FOR SELECT
  USING (is_active = true AND public.user_has_organization_access(organization_id));

DROP POLICY IF EXISTS "Authenticated users can insert collections" ON public.collections;
CREATE POLICY "Users can create collections in their organizations"
  ON public.collections FOR INSERT
  WITH CHECK (public.get_user_role_in_organization(organization_id) IN ('owner', 'admin', 'manager'));

DROP POLICY IF EXISTS "Authenticated users can update collections" ON public.collections;
CREATE POLICY "Users can update collections in their organizations"
  ON public.collections FOR UPDATE
  USING (public.get_user_role_in_organization(organization_id) IN ('owner', 'admin', 'manager'));

DROP POLICY IF EXISTS "Authenticated users can delete collections" ON public.collections;
CREATE POLICY "Users can delete collections in their organizations"
  ON public.collections FOR DELETE
  USING (public.get_user_role_in_organization(organization_id) IN ('owner', 'admin', 'manager'));

-- Update orders RLS policies
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view orders in their organizations"
  ON public.orders FOR SELECT
  USING (
    auth.uid() = user_id OR 
    public.get_user_role_in_organization(organization_id) IN ('owner', 'admin', 'manager', 'staff')
  );

DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
CREATE POLICY "Users can create orders in organizations they have access to"
  ON public.orders FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND 
    public.user_has_organization_access(organization_id)
  );

DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
CREATE POLICY "Users can update orders in their organizations"
  ON public.orders FOR UPDATE
  USING (
    auth.uid() = user_id OR 
    public.get_user_role_in_organization(organization_id) IN ('owner', 'admin', 'manager', 'staff')
  );

-- Update shopping cart RLS policies
DROP POLICY IF EXISTS "Users can manage their own cart" ON public.shopping_cart;
CREATE POLICY "Users can manage their cart in organizations they have access to"
  ON public.shopping_cart FOR ALL
  USING (
    auth.uid() = user_id AND 
    public.user_has_organization_access(organization_id)
  );

-- Update reviews RLS policies
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.reviews;
CREATE POLICY "Users can view approved reviews from organizations they have access to"
  ON public.reviews FOR SELECT
  USING (
    is_approved = true AND 
    public.user_has_organization_access(organization_id)
  );

DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
CREATE POLICY "Users can create reviews in organizations they have access to"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND 
    public.user_has_organization_access(organization_id)
  );

-- Update discount codes RLS policies
DROP POLICY IF EXISTS "Anyone can view active discount codes" ON public.discount_codes;
CREATE POLICY "Users can view discount codes from organizations they have access to"
  ON public.discount_codes FOR SELECT
  USING (
    is_active = true AND 
    public.user_has_organization_access(organization_id)
  );

DROP POLICY IF EXISTS "Authenticated users can insert discount codes" ON public.discount_codes;
CREATE POLICY "Users can create discount codes in their organizations"
  ON public.discount_codes FOR INSERT
  WITH CHECK (public.get_user_role_in_organization(organization_id) IN ('owner', 'admin', 'manager'));

DROP POLICY IF EXISTS "Authenticated users can update discount codes" ON public.discount_codes;
CREATE POLICY "Users can update discount codes in their organizations"
  ON public.discount_codes FOR UPDATE
  USING (public.get_user_role_in_organization(organization_id) IN ('owner', 'admin', 'manager'));

DROP POLICY IF EXISTS "Authenticated users can delete discount codes" ON public.discount_codes;
CREATE POLICY "Users can delete discount codes in their organizations"
  ON public.discount_codes FOR DELETE
  USING (public.get_user_role_in_organization(organization_id) IN ('owner', 'admin', 'manager'));

-- Update tags RLS policies
DROP POLICY IF EXISTS "Anyone can view tags" ON public.tags;
CREATE POLICY "Users can view tags from organizations they have access to"
  ON public.tags FOR SELECT
  USING (public.user_has_organization_access(organization_id));

DROP POLICY IF EXISTS "Authenticated users can insert tags" ON public.tags;
CREATE POLICY "Users can create tags in their organizations"
  ON public.tags FOR INSERT
  WITH CHECK (public.get_user_role_in_organization(organization_id) IN ('owner', 'admin', 'manager'));

DROP POLICY IF EXISTS "Authenticated users can update tags" ON public.tags;
CREATE POLICY "Users can update tags in their organizations"
  ON public.tags FOR UPDATE
  USING (public.get_user_role_in_organization(organization_id) IN ('owner', 'admin', 'manager'));

DROP POLICY IF EXISTS "Authenticated users can delete tags" ON public.tags;
CREATE POLICY "Users can delete tags in their organizations"
  ON public.tags FOR DELETE
  USING (public.get_user_role_in_organization(organization_id) IN ('owner', 'admin', 'manager'));