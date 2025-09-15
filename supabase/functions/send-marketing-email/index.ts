import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendEmailRequest {
  type: 'single' | 'campaign' | 'workflow';
  organizationId: string;
  templateId?: string;
  subscriberId?: string;
  campaignId?: string;
  workflowId?: string;
  subject: string;
  htmlContent: string;
  toEmail: string;
  toName?: string;
  fromEmail?: string;
  fromName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: SendEmailRequest = await req.json();
    console.log('Send email request:', requestData);

    const {
      type,
      organizationId,
      templateId,
      subscriberId,
      campaignId,
      workflowId,
      subject,
      htmlContent,
      toEmail,
      toName,
      fromEmail = "noreply@resend.dev",
      fromName = "Store"
    } = requestData;

    // Add tracking pixels and unsubscribe links to HTML content
    const trackingPixelId = crypto.randomUUID();
    const unsubscribeUrl = `${supabaseUrl}/functions/v1/email-unsubscribe?id=${subscriberId}&org=${organizationId}`;
    
    const enhancedHtml = htmlContent
      .replace('</body>', `
        <img src="${supabaseUrl}/functions/v1/email-track?event=open&id=${trackingPixelId}" width="1" height="1" style="display:none;" />
        <div style="text-align: center; margin-top: 40px; padding: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888;">
          <p><a href="${unsubscribeUrl}" style="color: #888;">Unsubscribe</a> | <a href="#" style="color: #888;">Update Preferences</a></p>
        </div>
        </body>
      `);

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [toEmail],
      subject: subject,
      html: enhancedHtml,
    });

    console.log('Email sent via Resend:', emailResponse);

    if (emailResponse.error) {
      throw new Error(`Resend error: ${emailResponse.error.message}`);
    }

    // Record the send in our database
    const { data: sendRecord, error: sendError } = await supabase
      .from('email_sends')
      .insert({
        organization_id: organizationId,
        subscriber_id: subscriberId,
        campaign_id: campaignId,
        workflow_id: workflowId,
        template_id: templateId,
        resend_email_id: emailResponse.data?.id,
        subject: subject,
        status: 'sent'
      })
      .select()
      .single();

    if (sendError) {
      console.error('Error recording send:', sendError);
      // Continue anyway, email was sent
    }

    // Create tracking entry for opens/clicks
    if (sendRecord) {
      await supabase
        .from('email_events')
        .insert({
          send_id: sendRecord.id,
          event_type: 'sent',
          event_data: { 
            tracking_id: trackingPixelId,
            resend_id: emailResponse.data?.id 
          }
        });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResponse.data?.id,
        sendId: sendRecord?.id,
        message: 'Email sent successfully' 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-marketing-email function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to send email' 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);