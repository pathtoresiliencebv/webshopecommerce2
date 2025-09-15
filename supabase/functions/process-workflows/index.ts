import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface QueueItem {
  id: string;
  organization_id: string;
  workflow_trigger_id: string;
  subscriber_id: string;
  campaign_id: string;
  scheduled_for: string;
}

interface Subscriber {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  organization_id: string;
}

interface Campaign {
  id: string;
  name: string;
  subject: string;
  template_id?: string;
}

interface Template {
  id: string;
  name: string;
  subject: string;
  html_content?: string;
  content: any;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing scheduled workflows...');

    // Get pending queue items that are due
    const { data: queueItems, error: queueError } = await supabase
      .from('workflow_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .limit(50);

    if (queueError) {
      throw new Error(`Queue fetch error: ${queueError.message}`);
    }

    if (!queueItems || queueItems.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending workflows to process' }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Processing ${queueItems.length} workflow items`);

    const results = [];

    for (const item of queueItems as QueueItem[]) {
      try {
        // Get subscriber details
        const { data: subscriber, error: subError } = await supabase
          .from('email_subscribers')
          .select('*')
          .eq('id', item.subscriber_id)
          .single();

        if (subError || !subscriber) {
          console.error('Subscriber not found:', item.subscriber_id);
          continue;
        }

        // Get campaign details
        const { data: campaign, error: campError } = await supabase
          .from('email_campaigns')
          .select('*')
          .eq('id', item.campaign_id)
          .single();

        if (campError || !campaign) {
          console.error('Campaign not found:', item.campaign_id);
          continue;
        }

        // Get template if specified
        let template = null;
        if (campaign.template_id) {
          const { data: templateData, error: tempError } = await supabase
            .from('email_templates')
            .select('*')
            .eq('id', campaign.template_id)
            .single();

          if (!tempError && templateData) {
            template = templateData as Template;
          }
        }

        // Personalize email content
        const personalizedSubject = personalizeContent(campaign.subject, subscriber as Subscriber);
        const personalizedContent = template?.html_content 
          ? personalizeContent(template.html_content, subscriber as Subscriber)
          : generateDefaultTemplate(campaign as Campaign, subscriber as Subscriber);

        // Send email via send-marketing-email function
        const emailResponse = await supabase.functions.invoke('send-marketing-email', {
          body: {
            type: 'workflow',
            organizationId: item.organization_id,
            templateId: template?.id,
            subscriberId: item.subscriber_id,
            workflowId: item.workflow_trigger_id,
            subject: personalizedSubject,
            htmlContent: personalizedContent,
            toEmail: subscriber.email,
            toName: `${subscriber.first_name || ''} ${subscriber.last_name || ''}`.trim() || subscriber.email,
          }
        });

        if (emailResponse.error) {
          throw new Error(`Email send error: ${emailResponse.error.message}`);
        }

        // Mark as sent
        await supabase
          .from('workflow_queue')
          .update({ 
            status: 'sent', 
            sent_at: new Date().toISOString(),
            attempts: item.attempts + 1 
          })
          .eq('id', item.id);

        results.push({ id: item.id, status: 'sent' });
        console.log(`Sent email for queue item ${item.id}`);

      } catch (itemError: any) {
        console.error(`Error processing queue item ${item.id}:`, itemError);
        
        // Mark as failed and increment attempts
        await supabase
          .from('workflow_queue')
          .update({ 
            status: 'failed', 
            error_message: itemError.message,
            attempts: item.attempts + 1 
          })
          .eq('id', item.id);

        results.push({ id: item.id, status: 'failed', error: itemError.message });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        results 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in process-workflows function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to process workflows' 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function personalizeContent(content: string, subscriber: Subscriber): string {
  return content
    .replace(/\{\{first_name\}\}/g, subscriber.first_name || 'Valued Customer')
    .replace(/\{\{last_name\}\}/g, subscriber.last_name || '')
    .replace(/\{\{email\}\}/g, subscriber.email)
    .replace(/\{\{full_name\}\}/g, `${subscriber.first_name || ''} ${subscriber.last_name || ''}`.trim() || subscriber.email);
}

function generateDefaultTemplate(campaign: Campaign, subscriber: Subscriber): string {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">${campaign.name}</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="font-size: 18px; margin-bottom: 20px;">Hello ${subscriber.first_name || 'Valued Customer'},</p>
          <p style="margin-bottom: 20px;">Thank you for being part of our community. This automated message is part of our ${campaign.name.toLowerCase()} workflow.</p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; font-style: italic;">This is an automated message from our email marketing system.</p>
          </div>
          <p style="margin-bottom: 30px;">We appreciate your business and look forward to serving you better.</p>
          <div style="text-align: center;">
            <a href="#" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">Visit Our Store</a>
          </div>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
          <p>You're receiving this because you're subscribed to our updates.</p>
        </div>
      </body>
    </html>
  `;
}

serve(handler);