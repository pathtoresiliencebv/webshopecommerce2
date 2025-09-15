-- Create shopping feeds table for platform configurations per organization
CREATE TABLE public.shopping_feeds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('google', 'facebook', 'tiktok')),
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  product_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  config JSONB DEFAULT '{}' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, platform)
);

-- Create feed products table for tracking product inclusion in feeds
CREATE TABLE public.feed_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feed_id UUID NOT NULL REFERENCES public.shopping_feeds(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'excluded', 'error')),
  last_synced_at TIMESTAMP WITH TIME ZONE,
  sync_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(feed_id, product_id)
);

-- Create feed sync logs for tracking synchronization history
CREATE TABLE public.feed_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feed_id UUID NOT NULL REFERENCES public.shopping_feeds(id) ON DELETE CASCADE,
  sync_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sync_completed_at TIMESTAMP WITH TIME ZONE,
  products_synced INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  log_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.shopping_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_sync_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for shopping_feeds
CREATE POLICY "Users can manage shopping feeds in their organizations"
ON public.shopping_feeds
FOR ALL
USING (get_user_role_in_organization(organization_id) = ANY (ARRAY['owner', 'admin', 'manager']));

-- Create RLS policies for feed_products
CREATE POLICY "Users can manage feed products in their organizations"
ON public.feed_products
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.shopping_feeds sf 
  WHERE sf.id = feed_products.feed_id 
  AND get_user_role_in_organization(sf.organization_id) = ANY (ARRAY['owner', 'admin', 'manager'])
));

-- Create RLS policies for feed_sync_logs
CREATE POLICY "Users can view sync logs for their organization feeds"
ON public.feed_sync_logs
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.shopping_feeds sf 
  WHERE sf.id = feed_sync_logs.feed_id 
  AND get_user_role_in_organization(sf.organization_id) = ANY (ARRAY['owner', 'admin', 'manager', 'staff'])
));

-- Create indexes for performance
CREATE INDEX idx_shopping_feeds_organization_id ON public.shopping_feeds(organization_id);
CREATE INDEX idx_shopping_feeds_platform ON public.shopping_feeds(platform);
CREATE INDEX idx_feed_products_feed_id ON public.feed_products(feed_id);
CREATE INDEX idx_feed_products_product_id ON public.feed_products(product_id);
CREATE INDEX idx_feed_sync_logs_feed_id ON public.feed_sync_logs(feed_id);
CREATE INDEX idx_feed_sync_logs_created_at ON public.feed_sync_logs(created_at);

-- Add trigger for updated_at columns
CREATE TRIGGER update_shopping_feeds_updated_at
  BEFORE UPDATE ON public.shopping_feeds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feed_products_updated_at
  BEFORE UPDATE ON public.feed_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();