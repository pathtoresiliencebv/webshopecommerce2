-- Add missing RLS policies for collections table to allow admin users to manage collections
CREATE POLICY "Authenticated users can insert collections" 
ON public.collections 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update collections" 
ON public.collections 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete collections" 
ON public.collections 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Add missing RLS policies for products table
CREATE POLICY "Authenticated users can insert products" 
ON public.products 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update products" 
ON public.products 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete products" 
ON public.products 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Add missing RLS policies for product_images table
CREATE POLICY "Authenticated users can insert product images" 
ON public.product_images 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update product images" 
ON public.product_images 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete product images" 
ON public.product_images 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Add missing RLS policies for product_collections table
CREATE POLICY "Authenticated users can insert product collections" 
ON public.product_collections 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update product collections" 
ON public.product_collections 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete product collections" 
ON public.product_collections 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Add missing RLS policies for categories table
CREATE POLICY "Authenticated users can insert categories" 
ON public.categories 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update categories" 
ON public.categories 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete categories" 
ON public.categories 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Add missing RLS policies for tags table
CREATE POLICY "Authenticated users can insert tags" 
ON public.tags 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update tags" 
ON public.tags 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete tags" 
ON public.tags 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Add missing RLS policies for product_tags table
CREATE POLICY "Authenticated users can insert product tags" 
ON public.product_tags 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update product tags" 
ON public.product_tags 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete product tags" 
ON public.product_tags 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Add missing RLS policies for product_attributes table
CREATE POLICY "Authenticated users can insert product attributes" 
ON public.product_attributes 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update product attributes" 
ON public.product_attributes 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete product attributes" 
ON public.product_attributes 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Add missing RLS policies for discount_codes table
CREATE POLICY "Authenticated users can insert discount codes" 
ON public.discount_codes 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update discount codes" 
ON public.discount_codes 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete discount codes" 
ON public.discount_codes 
FOR DELETE 
USING (auth.uid() IS NOT NULL);