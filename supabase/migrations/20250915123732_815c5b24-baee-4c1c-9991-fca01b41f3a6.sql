-- Create event tracking table for customer behavior
CREATE TABLE public.customer_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  user_id UUID,
  session_id TEXT,
  event_type TEXT NOT NULL, -- 'order_placed', 'cart_add', 'cart_abandon', 'product_view', 'email_open', 'email_click'
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_events ENABLE ROW LEVEL SECURITY;

-- RLS policy
CREATE POLICY "Users can manage events in their organizations"
ON public.customer_events
FOR ALL
USING (get_user_role_in_organization(organization_id) = ANY(ARRAY['owner', 'admin', 'manager', 'staff']));

-- Add indexes
CREATE INDEX idx_customer_events_org_type ON public.customer_events(organization_id, event_type);
CREATE INDEX idx_customer_events_user ON public.customer_events(user_id);
CREATE INDEX idx_customer_events_created ON public.customer_events(created_at);

-- Create workflow queue table for scheduled emails
CREATE TABLE public.workflow_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  workflow_trigger_id UUID NOT NULL,
  subscriber_id UUID NOT NULL,
  campaign_id UUID NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'cancelled'
  attempts INTEGER DEFAULT 0,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workflow_queue ENABLE ROW LEVEL SECURITY;

-- RLS policy
CREATE POLICY "Users can manage queue items in their organizations"
ON public.workflow_queue
FOR ALL
USING (get_user_role_in_organization(organization_id) = ANY(ARRAY['owner', 'admin', 'manager', 'staff']));

-- Add indexes
CREATE INDEX idx_workflow_queue_scheduled ON public.workflow_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_workflow_queue_org ON public.workflow_queue(organization_id);

-- Function to track customer events
CREATE OR REPLACE FUNCTION public.track_customer_event(
  _organization_id UUID,
  _user_id UUID,
  _session_id TEXT,
  _event_type TEXT,
  _event_data JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_id UUID;
BEGIN
  -- Insert the event
  INSERT INTO public.customer_events (organization_id, user_id, session_id, event_type, event_data)
  VALUES (_organization_id, _user_id, _session_id, _event_type, _event_data)
  RETURNING id INTO event_id;
  
  -- Trigger workflows based on the event
  PERFORM public.process_workflow_triggers(_organization_id, _event_type, _user_id, _event_data);
  
  RETURN event_id;
END;
$$;

-- Function to process workflow triggers
CREATE OR REPLACE FUNCTION public.process_workflow_triggers(
  _organization_id UUID,
  _event_type TEXT,
  _user_id UUID,
  _event_data JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  workflow_rec RECORD;
  subscriber_rec RECORD;
  campaign_rec RECORD;
  trigger_id UUID;
  send_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Find matching workflows for this event type
  FOR workflow_rec IN 
    SELECT * FROM public.email_workflows 
    WHERE organization_id = _organization_id 
    AND trigger_event = _event_type 
    AND is_active = true
  LOOP
    -- Find or create subscriber from user
    SELECT * INTO subscriber_rec 
    FROM public.email_subscribers 
    WHERE organization_id = _organization_id 
    AND user_id = _user_id 
    LIMIT 1;
    
    -- If no subscriber exists, create one from user profile
    IF subscriber_rec IS NULL AND _user_id IS NOT NULL THEN
      INSERT INTO public.email_subscribers (organization_id, user_id, email, first_name, last_name, subscription_source)
      SELECT 
        _organization_id,
        _user_id,
        auth.users.email,
        p.first_name,
        p.last_name,
        'auto_workflow'
      FROM auth.users
      LEFT JOIN public.profiles p ON p.user_id = auth.users.id
      WHERE auth.users.id = _user_id
      RETURNING * INTO subscriber_rec;
    END IF;
    
    -- Skip if no subscriber found
    IF subscriber_rec IS NULL THEN
      CONTINUE;
    END IF;
    
    -- Create workflow trigger record
    INSERT INTO public.workflow_triggers (
      organization_id, workflow_id, subscriber_id, trigger_data, started_at
    ) VALUES (
      _organization_id, workflow_rec.id, subscriber_rec.id, _event_data, now()
    ) RETURNING id INTO trigger_id;
    
    -- Schedule all campaigns in this workflow
    FOR campaign_rec IN 
      SELECT * FROM public.email_campaigns 
      WHERE workflow_id = workflow_rec.id 
      AND is_active = true 
      ORDER BY sequence_order
    LOOP
      -- Calculate send time (delay from trigger)
      send_time := now() + (campaign_rec.delay_hours || ' hours')::INTERVAL;
      
      -- Add to queue
      INSERT INTO public.workflow_queue (
        organization_id, workflow_trigger_id, subscriber_id, campaign_id, scheduled_for
      ) VALUES (
        _organization_id, trigger_id, subscriber_rec.id, campaign_rec.id, send_time
      );
    END LOOP;
  END LOOP;
END;
$$;

-- Trigger function for order events
CREATE OR REPLACE FUNCTION public.trigger_order_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Track order placed event
  IF TG_OP = 'INSERT' THEN
    PERFORM public.track_customer_event(
      NEW.organization_id,
      NEW.user_id,
      NULL,
      'order_placed',
      jsonb_build_object(
        'order_id', NEW.id,
        'order_number', NEW.order_number,
        'total_amount', NEW.total_amount,
        'status', NEW.status
      )
    );
    RETURN NEW;
  END IF;
  
  -- Track order status changes
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    PERFORM public.track_customer_event(
      NEW.organization_id,
      NEW.user_id,
      NULL,
      'order_status_changed',
      jsonb_build_object(
        'order_id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
    RETURN NEW;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger function for cart events
CREATE OR REPLACE FUNCTION public.trigger_cart_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Track item added to cart
    PERFORM public.track_customer_event(
      NEW.organization_id,
      NEW.user_id,
      NULL,
      'cart_add',
      jsonb_build_object(
        'product_id', NEW.product_id,
        'quantity', NEW.quantity
      )
    );
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'UPDATE' AND OLD.quantity != NEW.quantity THEN
    -- Track cart quantity change
    PERFORM public.track_customer_event(
      NEW.organization_id,
      NEW.user_id,
      NULL,
      'cart_update',
      jsonb_build_object(
        'product_id', NEW.product_id,
        'old_quantity', OLD.quantity,
        'new_quantity', NEW.quantity
      )
    );
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    -- Track item removed from cart
    PERFORM public.track_customer_event(
      OLD.organization_id,
      OLD.user_id,
      NULL,
      'cart_remove',
      jsonb_build_object(
        'product_id', OLD.product_id,
        'quantity', OLD.quantity
      )
    );
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER trigger_orders_events
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.trigger_order_events();

CREATE TRIGGER trigger_cart_events
  AFTER INSERT OR UPDATE OR DELETE ON public.shopping_cart
  FOR EACH ROW EXECUTE FUNCTION public.trigger_cart_events();

-- Add user_id to email_subscribers for linking
ALTER TABLE public.email_subscribers ADD COLUMN user_id UUID;

-- Update existing workflow types with real triggers
UPDATE public.email_workflows SET 
  trigger_event = 'order_placed',
  trigger_conditions = jsonb_build_object('min_amount', 0)
WHERE workflow_type = 'welcome';

UPDATE public.email_workflows SET 
  trigger_event = 'cart_add',
  trigger_conditions = jsonb_build_object('delay_hours', 1)
WHERE workflow_type = 'abandoned_cart';

UPDATE public.email_workflows SET 
  trigger_event = 'order_placed',
  trigger_conditions = jsonb_build_object('days_after', 30)
WHERE workflow_type = 'win_back';