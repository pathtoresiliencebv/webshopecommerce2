-- Create product variants table for Shopify-like variant management
CREATE TABLE public.product_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  option_values JSONB NOT NULL DEFAULT '{}',
  sku TEXT,
  price NUMERIC NOT NULL,
  compare_at_price NUMERIC,
  inventory_quantity INTEGER DEFAULT 0,
  weight NUMERIC,
  barcode TEXT,
  position INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product options table (like Size, Color, etc.)
CREATE TABLE public.product_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  name TEXT NOT NULL,
  position INTEGER DEFAULT 1,
  values TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add vendor field to products table
ALTER TABLE public.products 
ADD COLUMN vendor TEXT,
ADD COLUMN product_type TEXT;

-- Enable RLS on new tables
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_options ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for product_variants
CREATE POLICY "Anyone can view product variants" 
ON public.product_variants 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert product variants" 
ON public.product_variants 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update product variants" 
ON public.product_variants 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete product variants" 
ON public.product_variants 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create RLS policies for product_options
CREATE POLICY "Anyone can view product options" 
ON public.product_options 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert product options" 
ON public.product_options 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update product options" 
ON public.product_options 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete product options" 
ON public.product_options 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Add triggers for updated_at
CREATE TRIGGER update_product_variants_updated_at
BEFORE UPDATE ON public.product_variants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_options_updated_at
BEFORE UPDATE ON public.product_options
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();