-- Create email marketing tables for comprehensive email automation

-- Email Templates table
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content JSONB NOT NULL, -- Stores the visual builder content structure
  html_content TEXT, -- Rendered HTML version
  template_type TEXT NOT NULL DEFAULT 'custom', -- custom, welcome, cart_abandonment, etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Email Workflows table (automation flows)
CREATE TABLE public.email_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  workflow_type TEXT NOT NULL, -- welcome_series, cart_abandonment, browse_abandonment, etc.
  is_active BOOLEAN DEFAULT true,
  trigger_event TEXT NOT NULL, -- subscriber_added, cart_abandoned, order_placed, etc.
  trigger_conditions JSONB, -- Additional conditions for triggering
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Email Campaigns table (individual emails in workflows)
CREATE TABLE public.email_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  workflow_id UUID REFERENCES email_workflows(id) ON DELETE CASCADE,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  delay_hours INTEGER DEFAULT 0, -- Delay from previous email or trigger
  is_active BOOLEAN DEFAULT true,
  sequence_order INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Email Subscribers table
CREATE TABLE public.email_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  subscription_source TEXT DEFAULT 'manual', -- manual, checkout, popup, etc.
  is_active BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, email)
);

-- Email Sends table (track sent emails)
CREATE TABLE public.email_sends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  subscriber_id UUID NOT NULL REFERENCES email_subscribers(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,
  workflow_id UUID REFERENCES email_workflows(id) ON DELETE SET NULL,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  resend_email_id TEXT, -- ID from Resend API
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'sent', -- sent, delivered, bounced, failed
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Email Events table (opens, clicks, unsubscribes)
CREATE TABLE public.email_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  send_id UUID NOT NULL REFERENCES email_sends(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- open, click, unsubscribe, bounce, complaint
  event_data JSONB, -- Additional event data (clicked URL, etc.)
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Workflow Triggers table (track automation state)
CREATE TABLE public.workflow_triggers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  workflow_id UUID NOT NULL REFERENCES email_workflows(id) ON DELETE CASCADE,
  subscriber_id UUID NOT NULL REFERENCES email_subscribers(id) ON DELETE CASCADE,
  trigger_data JSONB, -- Data that triggered the workflow (order_id, product_id, etc.)
  current_step INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  next_send_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Email Segments table
CREATE TABLE public.email_segments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  conditions JSONB NOT NULL, -- Segmentation rules
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_segments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_templates
CREATE POLICY "Users can manage templates in their organizations" 
ON public.email_templates FOR ALL 
USING (get_user_role_in_organization(organization_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text]));

-- RLS Policies for email_workflows
CREATE POLICY "Users can manage workflows in their organizations" 
ON public.email_workflows FOR ALL 
USING (get_user_role_in_organization(organization_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text]));

-- RLS Policies for email_campaigns
CREATE POLICY "Users can manage campaigns in their organizations" 
ON public.email_campaigns FOR ALL 
USING (get_user_role_in_organization(organization_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text]));

-- RLS Policies for email_subscribers
CREATE POLICY "Users can manage subscribers in their organizations" 
ON public.email_subscribers FOR ALL 
USING (get_user_role_in_organization(organization_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'staff'::text]));

-- RLS Policies for email_sends
CREATE POLICY "Users can view sends in their organizations" 
ON public.email_sends FOR SELECT 
USING (get_user_role_in_organization(organization_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'staff'::text]));

CREATE POLICY "Users can create sends in their organizations" 
ON public.email_sends FOR INSERT 
WITH CHECK (get_user_role_in_organization(organization_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text]));

-- RLS Policies for email_events
CREATE POLICY "Users can view events in their organizations" 
ON public.email_events FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM email_sends es 
  WHERE es.id = email_events.send_id 
  AND get_user_role_in_organization(es.organization_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'staff'::text])
));

CREATE POLICY "System can insert events" 
ON public.email_events FOR INSERT 
WITH CHECK (true);

-- RLS Policies for workflow_triggers
CREATE POLICY "Users can manage triggers in their organizations" 
ON public.workflow_triggers FOR ALL 
USING (get_user_role_in_organization(organization_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text]));

-- RLS Policies for email_segments
CREATE POLICY "Users can manage segments in their organizations" 
ON public.email_segments FOR ALL 
USING (get_user_role_in_organization(organization_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text]));

-- Create indexes for better performance
CREATE INDEX idx_email_templates_organization ON email_templates(organization_id);
CREATE INDEX idx_email_workflows_organization ON email_workflows(organization_id);
CREATE INDEX idx_email_campaigns_workflow ON email_campaigns(workflow_id);
CREATE INDEX idx_email_subscribers_organization ON email_subscribers(organization_id);
CREATE INDEX idx_email_subscribers_email ON email_subscribers(email);
CREATE INDEX idx_email_sends_organization ON email_sends(organization_id);
CREATE INDEX idx_email_sends_subscriber ON email_sends(subscriber_id);
CREATE INDEX idx_email_events_send ON email_events(send_id);
CREATE INDEX idx_workflow_triggers_workflow ON workflow_triggers(workflow_id);
CREATE INDEX idx_workflow_triggers_subscriber ON workflow_triggers(subscriber_id);
CREATE INDEX idx_workflow_triggers_next_send ON workflow_triggers(next_send_at) WHERE is_active = true;

-- Create trigger for updated_at columns
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_workflows_updated_at
  BEFORE UPDATE ON email_workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_campaigns_updated_at
  BEFORE UPDATE ON email_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_subscribers_updated_at
  BEFORE UPDATE ON email_subscribers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_segments_updated_at
  BEFORE UPDATE ON email_segments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default workflow templates for each organization
INSERT INTO public.email_workflows (organization_id, name, workflow_type, trigger_event, trigger_conditions) 
SELECT 
  o.id,
  'Welcome Series',
  'welcome_series',
  'subscriber_added',
  '{"delay_between_emails": 24}'
FROM organizations o WHERE o.is_active = true;

INSERT INTO public.email_workflows (organization_id, name, workflow_type, trigger_event, trigger_conditions) 
SELECT 
  o.id,
  'Cart Abandonment',
  'cart_abandonment', 
  'cart_abandoned',
  '{"delay_hours": 1, "minimum_cart_value": 20}'
FROM organizations o WHERE o.is_active = true;

INSERT INTO public.email_workflows (organization_id, name, workflow_type, trigger_event, trigger_conditions) 
SELECT 
  o.id,
  'Browse Abandonment',
  'browse_abandonment',
  'product_viewed',
  '{"delay_hours": 24}'
FROM organizations o WHERE o.is_active = true;