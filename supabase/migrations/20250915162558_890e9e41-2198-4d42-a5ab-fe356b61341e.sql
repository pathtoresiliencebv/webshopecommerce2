-- Create custom_domains table for domain management
CREATE TABLE public.custom_domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  domain TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
  ssl_status TEXT DEFAULT 'pending' CHECK (ssl_status IN ('pending', 'active', 'failed')),
  dns_verified_at TIMESTAMP WITH TIME ZONE,
  ssl_issued_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(domain)
);

-- Enable RLS
ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;

-- Create policies for custom domains
CREATE POLICY "Users can manage custom domains in their organizations" 
ON public.custom_domains 
FOR ALL
USING (get_user_role_in_organization(organization_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text]));

-- Create trigger for updated_at
CREATE TRIGGER update_custom_domains_updated_at
BEFORE UPDATE ON public.custom_domains
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_custom_domains_organization_id ON public.custom_domains(organization_id);
CREATE INDEX idx_custom_domains_verification_status ON public.custom_domains(verification_status);

-- Create domain_verification_records table for DNS verification
CREATE TABLE public.domain_verification_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  custom_domain_id UUID NOT NULL,
  record_type TEXT NOT NULL CHECK (record_type IN ('A', 'CNAME', 'TXT')),
  record_name TEXT NOT NULL,
  record_value TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.domain_verification_records ENABLE ROW LEVEL SECURITY;

-- Create policies for verification records
CREATE POLICY "Users can view verification records for their domains" 
ON public.domain_verification_records 
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.custom_domains cd 
  WHERE cd.id = domain_verification_records.custom_domain_id 
  AND get_user_role_in_organization(cd.organization_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text])
));

-- Create trigger for updated_at
CREATE TRIGGER update_domain_verification_records_updated_at
BEFORE UPDATE ON public.domain_verification_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();