-- Add image_url column to product_variants table
ALTER TABLE public.product_variants 
ADD COLUMN image_url text;

-- Create index for better performance when querying variants by product
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);

-- Create index for active variants
CREATE INDEX IF NOT EXISTS idx_product_variants_active ON public.product_variants(product_id, is_active) WHERE is_active = true;