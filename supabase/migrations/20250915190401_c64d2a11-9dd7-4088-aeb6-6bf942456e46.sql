-- Create customers table for admin-created customers
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  email TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Netherlands',
  user_id UUID REFERENCES auth.users(id), -- Optional for registered customers
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create policies for customers
CREATE POLICY "Users can manage customers in their organizations" 
ON public.customers 
FOR ALL 
USING (get_user_role_in_organization(organization_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'staff'::text]));

-- Add customer_id to orders table
ALTER TABLE public.orders ADD COLUMN customer_id UUID REFERENCES public.customers(id);

-- Create index for better performance
CREATE INDEX idx_customers_organization_id ON public.customers(organization_id);
CREATE INDEX idx_orders_customer_id ON public.orders(customer_id);

-- Add trigger for updated_at
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();