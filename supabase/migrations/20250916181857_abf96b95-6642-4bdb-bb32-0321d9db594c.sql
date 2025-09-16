-- Create trackings table for storing tracking data
CREATE TABLE public.trackings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  user_id UUID NULL,
  tracking_number TEXT NOT NULL,
  carrier_code TEXT NOT NULL,
  carrier_name TEXT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  sub_status TEXT NULL,
  estimated_delivery TIMESTAMP WITH TIME ZONE NULL,
  last_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  customer_name TEXT NULL,
  customer_email TEXT NULL,
  delivery_address JSONB NULL DEFAULT '{}',
  tracking_events JSONB NULL DEFAULT '[]',
  additional_fields JSONB NULL DEFAULT '{}'
);

-- Create track123_settings table for API configuration per organization  
CREATE TABLE public.track123_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL UNIQUE,
  api_key_configured BOOLEAN NOT NULL DEFAULT false,
  webhook_url TEXT NULL,
  default_carriers TEXT[] NULL DEFAULT '{}',
  rate_limit_settings JSONB NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tracking_webhooks table for webhook logs
CREATE TABLE public.tracking_webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tracking_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  webhook_signature TEXT NULL,
  source_ip TEXT NULL
);

-- Enable Row Level Security
ALTER TABLE public.trackings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track123_settings ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.tracking_webhooks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trackings
CREATE POLICY "Users can view trackings from organizations they have access to" 
ON public.trackings 
FOR SELECT 
USING (user_has_organization_access(organization_id));

CREATE POLICY "Users can create trackings in their organizations" 
ON public.trackings 
FOR INSERT 
WITH CHECK (user_has_organization_access(organization_id));

CREATE POLICY "Admins can manage trackings in their organizations" 
ON public.trackings 
FOR ALL
USING (get_user_role_in_organization(organization_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'staff'::text]));

-- RLS Policies for track123_settings
CREATE POLICY "Admins can manage track123 settings in their organizations" 
ON public.track123_settings 
FOR ALL
USING (get_user_role_in_organization(organization_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text]));

-- RLS Policies for tracking_webhooks
CREATE POLICY "Admins can view webhooks in their organizations" 
ON public.tracking_webhooks 
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.trackings t 
  WHERE t.id = tracking_webhooks.tracking_id 
  AND get_user_role_in_organization(t.organization_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'staff'::text])
));

CREATE POLICY "System can insert webhook data" 
ON public.tracking_webhooks 
FOR INSERT 
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_trackings_organization_id ON public.trackings(organization_id);
CREATE INDEX idx_trackings_tracking_number ON public.trackings(tracking_number);
CREATE INDEX idx_trackings_status ON public.trackings(status);
CREATE INDEX idx_trackings_user_id ON public.trackings(user_id);
CREATE INDEX idx_tracking_webhooks_tracking_id ON public.tracking_webhooks(tracking_id);
CREATE INDEX idx_tracking_webhooks_processed ON public.tracking_webhooks(processed);

-- Add trigger for updating updated_at timestamp
CREATE TRIGGER update_trackings_updated_at
BEFORE UPDATE ON public.trackings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_track123_settings_updated_at
BEFORE UPDATE ON public.track123_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();