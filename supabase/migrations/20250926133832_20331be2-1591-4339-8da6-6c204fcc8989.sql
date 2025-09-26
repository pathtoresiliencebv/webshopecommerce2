-- Create Chrome Extension API tables for SHEIN import

-- Table for managing Chrome extension API tokens
CREATE TABLE public.chrome_extension_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for tracking import jobs
CREATE TABLE public.import_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_platform TEXT NOT NULL DEFAULT 'shein',
  total_products INTEGER NOT NULL DEFAULT 0,
  processed_products INTEGER NOT NULL DEFAULT 0,
  successful_imports INTEGER NOT NULL DEFAULT 0,
  failed_imports INTEGER NOT NULL DEFAULT 0,
  import_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_log JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for tracking individual imported products
CREATE TABLE public.imported_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  import_job_id UUID NOT NULL REFERENCES public.import_jobs(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  source_url TEXT NOT NULL,
  source_product_id TEXT NOT NULL,
  raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'needs_review')),
  error_message TEXT,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for import templates
CREATE TABLE public.import_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  platform TEXT NOT NULL DEFAULT 'shein',
  template_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chrome_extension_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imported_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chrome_extension_tokens
CREATE POLICY "Admins can manage extension tokens in their organizations"
ON public.chrome_extension_tokens
FOR ALL
USING (get_user_role_in_organization(organization_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text]));

-- RLS Policies for import_jobs
CREATE POLICY "Users can manage import jobs in their organizations"
ON public.import_jobs
FOR ALL
USING (get_user_role_in_organization(organization_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'staff'::text]));

-- RLS Policies for imported_products
CREATE POLICY "Users can view imported products in their organizations"
ON public.imported_products
FOR SELECT
USING (get_user_role_in_organization(organization_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'staff'::text]));

CREATE POLICY "Admins can manage imported products in their organizations"
ON public.imported_products
FOR ALL
USING (get_user_role_in_organization(organization_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text]));

-- RLS Policies for import_templates
CREATE POLICY "Users can manage import templates in their organizations"
ON public.import_templates
FOR ALL
USING (get_user_role_in_organization(organization_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text]));

-- Create indexes for performance
CREATE INDEX idx_chrome_extension_tokens_organization_id ON public.chrome_extension_tokens(organization_id);
CREATE INDEX idx_chrome_extension_tokens_user_id ON public.chrome_extension_tokens(user_id);
CREATE INDEX idx_chrome_extension_tokens_token_hash ON public.chrome_extension_tokens(token_hash);
CREATE INDEX idx_import_jobs_organization_id ON public.import_jobs(organization_id);
CREATE INDEX idx_import_jobs_status ON public.import_jobs(status);
CREATE INDEX idx_imported_products_import_job_id ON public.imported_products(import_job_id);
CREATE INDEX idx_imported_products_organization_id ON public.imported_products(organization_id);
CREATE INDEX idx_imported_products_approval_status ON public.imported_products(approval_status);
CREATE INDEX idx_import_templates_organization_id ON public.import_templates(organization_id);

-- Create function to generate API tokens
CREATE OR REPLACE FUNCTION public.generate_chrome_extension_token()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'ext_' || encode(gen_random_bytes(32), 'base64url');
END;
$$;

-- Create function to update import job progress
CREATE OR REPLACE FUNCTION public.update_import_job_progress(_job_id UUID, _processed INTEGER, _successful INTEGER, _failed INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.import_jobs 
  SET 
    processed_products = _processed,
    successful_imports = _successful,
    failed_imports = _failed,
    status = CASE 
      WHEN _processed >= total_products THEN 'completed'
      WHEN _processed > 0 THEN 'processing'
      ELSE status
    END,
    completed_at = CASE 
      WHEN _processed >= total_products THEN now()
      ELSE completed_at
    END,
    updated_at = now()
  WHERE id = _job_id;
END;
$$;

-- Add updated_at triggers
CREATE TRIGGER update_chrome_extension_tokens_updated_at
  BEFORE UPDATE ON public.chrome_extension_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_import_jobs_updated_at
  BEFORE UPDATE ON public.import_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_imported_products_updated_at
  BEFORE UPDATE ON public.imported_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_import_templates_updated_at
  BEFORE UPDATE ON public.import_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();