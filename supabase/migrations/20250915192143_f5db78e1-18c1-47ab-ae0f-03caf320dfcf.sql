-- Create FAQs table for admin-managed frequently asked questions
CREATE TABLE public.faqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- Create policies for FAQs
CREATE POLICY "Users can manage FAQs in their organizations" 
ON public.faqs 
FOR ALL 
USING (get_user_role_in_organization(organization_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text]));

CREATE POLICY "Anyone can view active FAQs" 
ON public.faqs 
FOR SELECT 
USING (is_active = true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_faqs_updated_at
BEFORE UPDATE ON public.faqs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_faqs_organization_category ON public.faqs(organization_id, category);
CREATE INDEX idx_faqs_sort_order ON public.faqs(sort_order);