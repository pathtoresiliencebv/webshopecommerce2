import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const track123ApiKey = Deno.env.get('TRACK123_API')!;

const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TrackingRequest {
  action: 'track' | 'register' | 'carriers';
  trackingNumber?: string;
  carrierCode?: string;
  customerEmail?: string;
  customerName?: string;
  organizationId: string;
}

interface CarrierInfo {
  courierCode: string;
  courierNameEN: string;
  courierNameCN: string;
  courierHomePage: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: TrackingRequest = await req.json();
    console.log('Track123 API request:', requestData);

    if (!track123ApiKey) {
      throw new Error('Track123 API key not configured');
    }

    switch (requestData.action) {
      case 'carriers':
        return await getCarriers();
      
      case 'register':
        return await registerTracking(requestData);
      
      case 'track':
        return await getTrackingInfo(requestData);
      
      default:
        throw new Error('Invalid action specified');
    }

  } catch (error: any) {
    console.error("Error in track123-api function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to process tracking request' 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

async function getCarriers(): Promise<Response> {
  try {
    const response = await fetch('https://api.track123.com/gateway/open-api/tk/v2.1/courier/list', {
      method: 'GET',
      headers: {
        'Track123-Api-Secret': track123ApiKey,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Track123 API error: ${data.msg || 'Unknown error'}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        carriers: data.data || []
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error fetching carriers:", error);
    throw error;
  }
}

async function registerTracking(requestData: TrackingRequest): Promise<Response> {
  try {
    const { trackingNumber, carrierCode, customerEmail, customerName, organizationId } = requestData;

    if (!trackingNumber || !carrierCode) {
      throw new Error('Tracking number and carrier code are required');
    }

    // Register with Track123
    const track123Response = await fetch('https://api.track123.com/gateway/open-api/tk/v2.1/track/import', {
      method: 'POST',
      headers: {
        'Track123-Api-Secret': track123ApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{
        trackingNo: trackingNumber,
        carrierCode: carrierCode,
        customerEmail: customerEmail || '',
      }]),
    });

    const track123Data = await track123Response.json();
    
    if (!track123Response.ok) {
      throw new Error(`Track123 API error: ${track123Data.msg || 'Registration failed'}`);
    }

    // Save to database
    const { data: tracking, error: dbError } = await supabase
      .from('trackings')
      .insert({
        organization_id: organizationId,
        tracking_number: trackingNumber,
        carrier_code: carrierCode,
        customer_email: customerEmail,
        customer_name: customerName,
        status: 'registered'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save tracking to database');
    }

    return new Response(
      JSON.stringify({
        success: true,
        tracking: tracking,
        track123Response: track123Data
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error registering tracking:", error);
    throw error;
  }
}

async function getTrackingInfo(requestData: TrackingRequest): Promise<Response> {
  try {
    const { trackingNumber, carrierCode } = requestData;

    if (!trackingNumber) {
      throw new Error('Tracking number is required');
    }

    // Get tracking info from Track123
    const track123Response = await fetch(`https://api.track123.com/gateway/open-api/tk/v2.1/track/query?trackingNo=${trackingNumber}&carrierCode=${carrierCode || ''}`, {
      method: 'GET',
      headers: {
        'Track123-Api-Secret': track123ApiKey,
        'Content-Type': 'application/json',
      },
    });

    const track123Data = await track123Response.json();
    
    if (!track123Response.ok) {
      throw new Error(`Track123 API error: ${track123Data.msg || 'Tracking query failed'}`);
    }

    // Update database if tracking exists
    if (requestData.organizationId) {
      const { error: updateError } = await supabase
        .from('trackings')
        .update({
          status: track123Data.data?.status || 'unknown',
          sub_status: track123Data.data?.subStatus || null,
          tracking_events: track123Data.data?.events || [],
          last_updated_at: new Date().toISOString()
        })
        .match({
          tracking_number: trackingNumber,
          organization_id: requestData.organizationId
        });

      if (updateError) {
        console.error('Failed to update tracking in database:', updateError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        tracking: track123Data.data || null
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error getting tracking info:", error);
    throw error;
  }
}

serve(handler);