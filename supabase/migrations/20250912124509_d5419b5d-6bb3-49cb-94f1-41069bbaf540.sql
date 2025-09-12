-- Allow anonymous users to view active organizations (for public storefronts)
CREATE POLICY "Anyone can view active organizations"
ON public.organizations
FOR SELECT
USING (is_active = true);

-- Allow anonymous users to view active products
DROP POLICY IF EXISTS "Users can view products from organizations they have access to" ON public.products;
CREATE POLICY "Anyone can view active products"
ON public.products
FOR SELECT
USING (is_active = true);

-- Allow anonymous users to view active collections
DROP POLICY IF EXISTS "Users can view collections from organizations they have access to" ON public.collections;
CREATE POLICY "Anyone can view active collections"
ON public.collections
FOR SELECT
USING (is_active = true);

-- Allow anonymous users to view active categories
DROP POLICY IF EXISTS "Users can view categories from organizations they have access t" ON public.categories;
CREATE POLICY "Anyone can view active categories"
ON public.categories
FOR SELECT
USING (is_active = true);

-- Allow anonymous users to view product images (already exists but ensuring it's correct)
-- Policy "Anyone can view product images" already exists

-- Allow anonymous users to view product attributes (already exists)
-- Policy "Anyone can view product attributes" already exists

-- Allow anonymous users to view product collections (already exists)
-- Policy "Anyone can view product collections" already exists

-- Allow anonymous users to view product tags (already exists)
-- Policy "Anyone can view product tags" already exists