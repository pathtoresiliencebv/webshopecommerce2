import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const event = url.searchParams.get('event'); // 'open' or 'click'
    const trackingId = url.searchParams.get('id');
    const clickUrl = url.searchParams.get('url'); // For click tracking

    if (!event || !trackingId) {
      return new Response('Missing parameters', { status: 400 });
    }

    // Find the send record by tracking ID
    const { data: eventRecord } = await supabase
      .from('email_events')
      .select('send_id')
      .eq('event_data->tracking_id', trackingId)
      .eq('event_type', 'sent')
      .single();

    if (!eventRecord) {
      console.log('No send record found for tracking ID:', trackingId);
      return new Response(event === 'open' ? transparentPixel() : '', { 
        status: 200,
        headers: { 'Content-Type': event === 'open' ? 'image/gif' : 'text/plain' }
      });
    }

    // Record the event
    await supabase
      .from('email_events')
      .insert({
        send_id: eventRecord.send_id,
        event_type: event,
        event_data: clickUrl ? { clicked_url: clickUrl } : {},
        user_agent: req.headers.get('User-Agent'),
        ip_address: req.headers.get('CF-Connecting-IP') || req.headers.get('X-Forwarded-For')
      });

    console.log(`Recorded ${event} event for tracking ID: ${trackingId}`);

    if (event === 'open') {
      // Return a 1x1 transparent GIF pixel
      return new Response(transparentPixel(), {
        status: 200,
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          ...corsHeaders
        }
      });
    } else if (event === 'click' && clickUrl) {
      // Redirect to the clicked URL
      return Response.redirect(clickUrl, 302);
    }

    return new Response('OK', { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error("Error in email-track function:", error);
    return new Response('Error', { 
      status: 500, 
      headers: event === 'open' ? { 'Content-Type': 'image/gif' } : { 'Content-Type': 'text/plain' }
    });
  }
};

function transparentPixel(): Uint8Array {
  // 1x1 transparent GIF in base64: R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7
  const base64 = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

serve(handler);