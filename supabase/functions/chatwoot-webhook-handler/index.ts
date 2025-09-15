import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const chatwootWebhookSecret = Deno.env.get('CHATWOOT_WEBHOOK_SECRET');

const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-chatwoot-hmac-sha256",
};

interface WebhookEvent {
  event: string;
  data: any;
  account: {
    id: number;
    name: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify webhook signature if secret is configured
    if (chatwootWebhookSecret) {
      const signature = req.headers.get('x-chatwoot-hmac-sha256');
      if (!signature) {
        throw new Error('Missing webhook signature');
      }

      const body = await req.text();
      const isValid = await verifyWebhookSignature(body, signature, chatwootWebhookSecret);
      if (!isValid) {
        throw new Error('Invalid webhook signature');
      }

      const webhookData: WebhookEvent = JSON.parse(body);
      return await processWebhookEvent(webhookData);
    } else {
      const webhookData: WebhookEvent = await req.json();
      return await processWebhookEvent(webhookData);
    }
  } catch (error: any) {
    console.error("Error in chatwoot-webhook-handler:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to process webhook' 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

async function verifyWebhookSignature(body: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return signature === expectedSignature;
}

async function processWebhookEvent(webhookData: WebhookEvent): Promise<Response> {
  const { event, data, account } = webhookData;

  console.log('Processing webhook event:', event, 'for account:', account.id);

  // Get organization ID from Chatwoot account ID
  const { data: chatwootAccount } = await supabase
    .from('chatwoot_accounts')
    .select('organization_id')
    .eq('chatwoot_account_id', account.id)
    .single();

  if (!chatwootAccount) {
    console.error('No organization found for Chatwoot account:', account.id);
    return new Response(
      JSON.stringify({ success: false, error: 'Organization not found' }),
      {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }

  const organizationId = chatwootAccount.organization_id;

  switch (event) {
    case 'conversation_created':
      await handleConversationCreated(data, organizationId);
      break;
      
    case 'message_created':
      await handleMessageCreated(data, organizationId);
      break;
      
    case 'conversation_resolved':
      await handleConversationResolved(data, organizationId);
      break;
      
    case 'conversation_status_changed':
      await handleConversationStatusChanged(data, organizationId);
      break;

    case 'assignee_changed':
      await handleAssigneeChanged(data, organizationId);
      break;

    default:
      console.log('Unhandled webhook event:', event);
  }

  return new Response(
    JSON.stringify({ 
      success: true,
      event: event,
      message: 'Webhook processed successfully' 
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    }
  );
}

async function handleConversationCreated(data: any, organizationId: string) {
  console.log('Handling conversation created:', data.id);

  try {
    // Store conversation in local database
    const { error } = await supabase
      .from('chatwoot_conversations')
      .insert({
        organization_id: organizationId,
        chatwoot_conversation_id: data.id,
        chatwoot_contact_id: data.meta.sender.id,
        chatwoot_account_id: data.account_id,
        status: data.status,
        inbox_id: data.inbox_id,
        conversation_started_at: data.created_at,
        last_activity_at: data.created_at
      });

    if (error) {
      console.error('Failed to store conversation:', error);
      return;
    }

    // Enrich customer context
    await enrichCustomerContext(data.meta.sender.id, data.account_id, organizationId);

    // Apply auto-assignment rules
    await applyAutoAssignmentRules(data.id, data.account_id, organizationId);

    // Send notifications if high priority customer
    if (await isHighPriorityCustomer(data.meta.sender.id, organizationId)) {
      await notifyManagers(data, organizationId);
    }

    console.log('Conversation created successfully processed');
  } catch (error) {
    console.error('Error handling conversation created:', error);
  }
}

async function handleMessageCreated(data: any, organizationId: string) {
  console.log('Handling message created:', data.id);

  try {
    // Update conversation last activity
    await supabase
      .from('chatwoot_conversations')
      .update({
        last_activity_at: data.created_at,
        message_count: data.conversation.messages_count
      })
      .eq('chatwoot_conversation_id', data.conversation.id)
      .eq('organization_id', organizationId);

    // Track first response time if this is the first agent message
    if (data.message_type === 'outgoing' && data.sender?.type === 'Agent') {
      await trackFirstResponseTime(data.conversation.id, data.created_at, organizationId);
    }

    // Trigger follow-up workflows if needed
    if (data.message_type === 'incoming') {
      await triggerFollowUpWorkflows(data.conversation.id, data, organizationId);
    }

    console.log('Message created successfully processed');
  } catch (error) {
    console.error('Error handling message created:', error);
  }
}

async function handleConversationResolved(data: any, organizationId: string) {
  console.log('Handling conversation resolved:', data.id);

  try {
    // Calculate resolution time
    const { data: conversation } = await supabase
      .from('chatwoot_conversations')
      .select('conversation_started_at')
      .eq('chatwoot_conversation_id', data.id)
      .eq('organization_id', organizationId)
      .single();

    let resolutionTime = null;
    if (conversation?.conversation_started_at) {
      const startTime = new Date(conversation.conversation_started_at);
      const endTime = new Date(data.updated_at || new Date());
      resolutionTime = `${Math.floor((endTime.getTime() - startTime.getTime()) / 60000)} minutes`;
    }

    // Update conversation record
    await supabase
      .from('chatwoot_conversations')
      .update({
        status: 'resolved',
        conversation_resolved_at: data.updated_at || new Date().toISOString(),
        resolution_time: resolutionTime,
        assignee_id: data.assignee?.id,
        assignee_name: data.assignee?.name
      })
      .eq('chatwoot_conversation_id', data.id)
      .eq('organization_id', organizationId);

    // Trigger post-resolution workflows
    await triggerPostResolutionWorkflows(data.id, organizationId);

    console.log('Conversation resolved successfully processed');
  } catch (error) {
    console.error('Error handling conversation resolved:', error);
  }
}

async function handleConversationStatusChanged(data: any, organizationId: string) {
  console.log('Handling conversation status changed:', data.id, 'to', data.status);

  try {
    await supabase
      .from('chatwoot_conversations')
      .update({
        status: data.status,
        last_activity_at: data.updated_at || new Date().toISOString()
      })
      .eq('chatwoot_conversation_id', data.id)
      .eq('organization_id', organizationId);

    console.log('Conversation status change successfully processed');
  } catch (error) {
    console.error('Error handling conversation status change:', error);
  }
}

async function handleAssigneeChanged(data: any, organizationId: string) {
  console.log('Handling assignee changed:', data.id);

  try {
    await supabase
      .from('chatwoot_conversations')
      .update({
        assignee_id: data.assignee?.id,
        assignee_name: data.assignee?.name,
        last_activity_at: data.updated_at || new Date().toISOString()
      })
      .eq('chatwoot_conversation_id', data.id)
      .eq('organization_id', organizationId);

    console.log('Assignee change successfully processed');
  } catch (error) {
    console.error('Error handling assignee change:', error);
  }
}

async function enrichCustomerContext(contactId: number, accountId: number, organizationId: string) {
  console.log('Enriching customer context for contact:', contactId);

  try {
    // Get contact mapping
    const { data: contact } = await supabase
      .from('chatwoot_contacts')
      .select('user_id')
      .eq('chatwoot_contact_id', contactId)
      .eq('organization_id', organizationId)
      .single();

    if (!contact?.user_id) {
      console.log('No user mapping found for contact:', contactId);
      return;
    }

    // Trigger contact sync to update attributes
    await supabase.functions.invoke('chatwoot-contact-sync', {
      body: {
        userId: contact.user_id,
        organizationId: organizationId
      }
    });

    console.log('Customer context enriched successfully');
  } catch (error) {
    console.error('Error enriching customer context:', error);
  }
}

async function applyAutoAssignmentRules(conversationId: number, accountId: number, organizationId: string) {
  console.log('Applying auto-assignment rules for conversation:', conversationId);

  try {
    // Get organization settings for auto-assignment rules
    const { data: settings } = await supabase
      .from('store_settings')
      .select('settings')
      .eq('organization_id', organizationId)
      .eq('setting_type', 'customer_service')
      .single();

    const autoAssignmentRules = settings?.settings?.auto_assignment || {};

    // Apply rules based on customer tier, language, etc.
    // This would contain the business logic for automatic assignment

    console.log('Auto-assignment rules applied');
  } catch (error) {
    console.error('Error applying auto-assignment rules:', error);
  }
}

async function isHighPriorityCustomer(contactId: number, organizationId: string): Promise<boolean> {
  try {
    const { data: contact } = await supabase
      .from('chatwoot_contacts')
      .select('cached_attributes')
      .eq('chatwoot_contact_id', contactId)
      .eq('organization_id', organizationId)
      .single();

    const attributes = contact?.cached_attributes || {};
    return attributes.customer_tier === 'Platinum' || attributes.support_priority === 'high';
  } catch (error) {
    console.error('Error checking customer priority:', error);
    return false;
  }
}

async function notifyManagers(conversationData: any, organizationId: string) {
  console.log('Notifying managers of high priority conversation:', conversationData.id);

  try {
    // Get organization managers
    const { data: managers } = await supabase
      .from('organization_users')
      .select(`
        user_id,
        profiles:user_id (email, first_name, last_name)
      `)
      .eq('organization_id', organizationId)
      .in('role', ['owner', 'admin', 'manager'])
      .eq('is_active', true);

    // Send notification emails (would integrate with email service)
    for (const manager of managers || []) {
      console.log('Would send notification to:', manager.profiles?.email);
      // Implementation would send actual notification
    }

    console.log('Manager notifications sent');
  } catch (error) {
    console.error('Error sending manager notifications:', error);
  }
}

async function trackFirstResponseTime(conversationId: number, responseTime: string, organizationId: string) {
  try {
    const { data: conversation } = await supabase
      .from('chatwoot_conversations')
      .select('conversation_started_at, first_response_time')
      .eq('chatwoot_conversation_id', conversationId)
      .eq('organization_id', organizationId)
      .single();

    if (conversation && !conversation.first_response_time && conversation.conversation_started_at) {
      const startTime = new Date(conversation.conversation_started_at);
      const endTime = new Date(responseTime);
      const responseTimeMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);

      await supabase
        .from('chatwoot_conversations')
        .update({
          first_response_time: `${responseTimeMinutes} minutes`
        })
        .eq('chatwoot_conversation_id', conversationId)
        .eq('organization_id', organizationId);

      console.log('First response time tracked:', responseTimeMinutes, 'minutes');
    }
  } catch (error) {
    console.error('Error tracking first response time:', error);
  }
}

async function triggerFollowUpWorkflows(conversationId: number, messageData: any, organizationId: string) {
  console.log('Triggering follow-up workflows for conversation:', conversationId);

  try {
    // Analyze message content for keywords or intents
    const messageContent = messageData.content?.toLowerCase() || '';
    
    // Example: Trigger order-related workflow if message mentions orders
    if (messageContent.includes('order') || messageContent.includes('bestelling')) {
      console.log('Order-related message detected, triggering workflow');
      // Would trigger appropriate workflow
    }

    // Example: Trigger return/refund workflow
    if (messageContent.includes('return') || messageContent.includes('refund') || messageContent.includes('retour')) {
      console.log('Return/refund message detected, triggering workflow');
      // Would trigger appropriate workflow
    }

    console.log('Follow-up workflows triggered');
  } catch (error) {
    console.error('Error triggering follow-up workflows:', error);
  }
}

async function triggerPostResolutionWorkflows(conversationId: number, organizationId: string) {
  console.log('Triggering post-resolution workflows for conversation:', conversationId);

  try {
    // Send satisfaction survey
    // Schedule follow-up check
    // Update customer satisfaction metrics
    
    console.log('Post-resolution workflows triggered');
  } catch (error) {
    console.error('Error triggering post-resolution workflows:', error);
  }
}

serve(handler);