-- Create trigger for newsletter signup workflow
CREATE TRIGGER trigger_newsletter_events
AFTER INSERT ON email_subscribers
FOR EACH ROW
EXECUTE FUNCTION trigger_subscriber_events();

-- Function to trigger subscriber events
CREATE OR REPLACE FUNCTION public.trigger_subscriber_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Track newsletter signup event
  IF TG_OP = 'INSERT' THEN
    PERFORM public.track_customer_event(
      NEW.organization_id,
      NEW.user_id,
      NULL,
      'newsletter_signup',
      jsonb_build_object(
        'subscriber_id', NEW.id,
        'email', NEW.email,
        'source', NEW.subscription_source,
        'tags', NEW.tags
      )
    );
    RETURN NEW;
  END IF;
  
  RETURN NEW;
END;
$function$;