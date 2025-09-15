import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TrackEventRequest {
  organizationId: string;
  userId?: string;
  sessionId?: string;
  eventType: string;
  eventData?: any;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      organizationId, 
      userId, 
      sessionId, 
      eventType, 
      eventData = {} 
    }: TrackEventRequest = await req.json();

    console.log('Tracking event:', { organizationId, userId, eventType, eventData });

    // Validate required fields
    if (!organizationId || !eventType) {
      throw new Error('Missing required fields: organizationId and eventType');
    }

    // Call the database function to track the event and trigger workflows
    const { data, error } = await supabase.rpc('track_customer_event', {
      _organization_id: organizationId,
      _user_id: userId || null,
      _session_id: sessionId || null,
      _event_type: eventType,
      _event_data: eventData
    });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('Event tracked successfully:', data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        eventId: data,
        message: 'Event tracked and workflows triggered' 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in track-events function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to track event' 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);