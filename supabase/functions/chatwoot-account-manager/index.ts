import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const chatwootBaseUrl = Deno.env.get('CHATWOOT_BASE_URL') || 'https://chatwoot.aurelioliving.nl';
const chatwootPlatformToken = Deno.env.get('CHATWOOT_PLATFORM_TOKEN');

const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateAccountRequest {
  organizationId: string;
  organizationData: {
    name: string;
    slug: string;
    email?: string;
    domain?: string;
    subdomain?: string;
    locale?: string;
    timezone?: string;
  };
}

interface UpdateAccountRequest {
  organizationId: string;
  updates: {
    branding?: any;
    settings?: any;
    status?: 'active' | 'suspended';
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'create':
        return await createChatwootAccount(req);
      case 'update':
        return await updateChatwootAccount(req);
      case 'suspend':
        return await suspendChatwootAccount(req);
      case 'regenerate-tokens':
        return await regenerateTokens(req);
      default:
        throw new Error('Invalid action specified');
    }
  } catch (error: any) {
    console.error("Error in chatwoot-account-manager:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to process request' 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

async function createChatwootAccount(req: Request): Promise<Response> {
  const { organizationId, organizationData }: CreateAccountRequest = await req.json();

  console.log('Creating Chatwoot account for organization:', organizationId);

  // Check if account already exists
  const { data: existingAccount } = await supabase
    .from('chatwoot_accounts')
    .select('*')
    .eq('organization_id', organizationId)
    .single();

  if (existingAccount) {
    return new Response(
      JSON.stringify({ 
        success: true, 
        account: existingAccount,
        message: 'Account already exists' 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }

  // Generate unique account name
  const accountName = `aurelio-${organizationData.slug}`;
  const supportEmail = organizationData.email || `support@${organizationData.domain || 'aurelioliving.nl'}`;

  // Create Chatwoot account via Platform API
  const chatwootAccount = await createChatwootAccountAPI({
    account_name: accountName,
    email: supportEmail,
    locale: organizationData.locale || 'nl',
    timezone: organizationData.timezone || 'Europe/Amsterdam'
  });

  // Generate API tokens
  const tokens = await generateChatwootTokens(chatwootAccount.id, supportEmail);

  // Store mapping in database
  const { data: accountRecord, error } = await supabase
    .from('chatwoot_accounts')
    .insert({
      organization_id: organizationId,
      chatwoot_account_id: chatwootAccount.id,
      account_name: accountName,
      api_access_token: tokens.access_token,
      website_token: tokens.website_token,
      locale: organizationData.locale || 'nl',
      timezone: organizationData.timezone || 'Europe/Amsterdam',
      support_email: supportEmail,
      account_status: 'active',
      sync_status: 'active'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to store account mapping: ${error.message}`);
  }

  // Setup default inboxes
  await setupDefaultInboxes(chatwootAccount.id, tokens.access_token, organizationData.name);

  console.log('Successfully created Chatwoot account:', accountRecord);

  return new Response(
    JSON.stringify({ 
      success: true, 
      account: accountRecord,
      message: 'Chatwoot account created successfully' 
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    }
  );
}

async function createChatwootAccountAPI(accountData: any) {
  if (!chatwootPlatformToken) {
    throw new Error('CHATWOOT_PLATFORM_TOKEN not configured');
  }

  const response = await fetch(`${chatwootBaseUrl}/platform/api/v1/accounts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api_access_token': chatwootPlatformToken
    },
    body: JSON.stringify(accountData)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create Chatwoot account: ${error}`);
  }

  return await response.json();
}

async function generateChatwootTokens(accountId: number, email: string) {
  if (!chatwootPlatformToken) {
    throw new Error('CHATWOOT_PLATFORM_TOKEN not configured');
  }

  const response = await fetch(`${chatwootBaseUrl}/platform/api/v1/accounts/${accountId}/account_users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api_access_token': chatwootPlatformToken
    },
    body: JSON.stringify({
      user_id: 1, // Platform admin user
      role: 'administrator'
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to generate tokens: ${error}`);
  }

  const userData = await response.json();
  
  // Generate website token
  const websiteTokenResponse = await fetch(`${chatwootBaseUrl}/api/v1/accounts/${accountId}/inboxes`, {
    method: 'GET',
    headers: {
      'api_access_token': userData.access_token
    }
  });

  let websiteToken = 'temp-token';
  if (websiteTokenResponse.ok) {
    const inboxes = await websiteTokenResponse.json();
    websiteToken = inboxes[0]?.website_token || 'temp-token';
  }

  return {
    access_token: userData.access_token,
    website_token: websiteToken
  };
}

async function setupDefaultInboxes(accountId: number, accessToken: string, storeName: string) {
  console.log('Setting up default inboxes for account:', accountId);

  // Create Website inbox
  await createInbox(accountId, accessToken, {
    name: `${storeName} - Website Chat`,
    channel: {
      type: 'Channel::WebWidget',
      website_url: 'https://aurelioliving.nl',
      widget_color: '#1f2937',
      welcome_title: `Welkom bij ${storeName}`,
      welcome_tagline: 'Hoe kunnen we je helpen?',
      agent_away_message: 'We zijn momenteel niet beschikbaar. Laat een bericht achter!',
      working_hours_enabled: false
    }
  });

  // Create Email inbox
  await createInbox(accountId, accessToken, {
    name: `${storeName} - Email Support`,
    channel: {
      type: 'Channel::Email',
      email: `support@${storeName.toLowerCase().replace(/\s+/g, '')}.aurelioliving.nl`,
      forward_to_email: `support@aurelioliving.nl`
    }
  });

  console.log('Default inboxes created successfully');
}

async function createInbox(accountId: number, accessToken: string, inboxData: any) {
  try {
    const response = await fetch(`${chatwootBaseUrl}/api/v1/accounts/${accountId}/inboxes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_access_token': accessToken
      },
      body: JSON.stringify(inboxData)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`Failed to create inbox: ${error}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating inbox:', error);
    return null;
  }
}

async function updateChatwootAccount(req: Request): Promise<Response> {
  const { organizationId, updates }: UpdateAccountRequest = await req.json();

  const { data: account, error } = await supabase
    .from('chatwoot_accounts')
    .update({
      account_status: updates.status,
      updated_at: new Date().toISOString()
    })
    .eq('organization_id', organizationId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update account: ${error.message}`);
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      account,
      message: 'Account updated successfully' 
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    }
  );
}

async function suspendChatwootAccount(req: Request): Promise<Response> {
  const { organizationId } = await req.json();

  const { data: account, error } = await supabase
    .from('chatwoot_accounts')
    .update({
      account_status: 'suspended',
      updated_at: new Date().toISOString()
    })
    .eq('organization_id', organizationId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to suspend account: ${error.message}`);
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      account,
      message: 'Account suspended successfully' 
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    }
  );
}

async function regenerateTokens(req: Request): Promise<Response> {
  const { organizationId } = await req.json();

  // Get existing account
  const { data: account } = await supabase
    .from('chatwoot_accounts')
    .select('*')
    .eq('organization_id', organizationId)
    .single();

  if (!account) {
    throw new Error('Account not found');
  }

  // Generate new tokens
  const tokens = await generateChatwootTokens(account.chatwoot_account_id, account.support_email);

  // Update database
  const { data: updatedAccount, error } = await supabase
    .from('chatwoot_accounts')
    .update({
      api_access_token: tokens.access_token,
      website_token: tokens.website_token,
      updated_at: new Date().toISOString()
    })
    .eq('organization_id', organizationId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update tokens: ${error.message}`);
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      account: updatedAccount,
      message: 'Tokens regenerated successfully' 
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    }
  );
}

serve(handler);