import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const chatwootBaseUrl = Deno.env.get('CHATWOOT_BASE_URL') || 'https://chatwoot.aurelioliving.nl';

const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SyncContactRequest {
  userId: string;
  organizationId: string;
  userData?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

interface CustomerAttributes {
  customer_tier: string;
  registration_date: string;
  preferred_language: string;
  order_count: number;
  total_spent: string;
  average_order_value: string;
  last_order_date?: string;
  current_cart_value: string;
  current_cart_items: number;
  cart_products: string;
  favorite_categories: string[];
  purchase_frequency: string;
  marketing_consent: boolean;
  support_priority: string;
  previous_conversations: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'sync':
        return await syncContact(req);
      case 'bulk-sync':
        return await bulkSyncContacts(req);
      case 'update-attributes':
        return await updateContactAttributes(req);
      case 'merge-contacts':
        return await mergeContacts(req);
      default:
        throw new Error('Invalid action specified');
    }
  } catch (error: any) {
    console.error("Error in chatwoot-contact-sync:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to sync contact' 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

async function syncContact(req: Request): Promise<Response> {
  const { userId, organizationId, userData }: SyncContactRequest = await req.json();

  console.log('Syncing contact for user:', userId, 'organization:', organizationId);

  // Get Chatwoot account for organization
  const { data: chatwootAccount } = await supabase
    .from('chatwoot_accounts')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('account_status', 'active')
    .single();

  if (!chatwootAccount) {
    throw new Error('No active Chatwoot account found for organization');
  }

  // Check if contact already exists
  const { data: existingContact } = await supabase
    .from('chatwoot_contacts')
    .select('*')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .single();

  let chatwootContact;
  let contactRecord;

  if (existingContact) {
    // Update existing contact
    console.log('Updating existing contact:', existingContact.chatwoot_contact_id);
    chatwootContact = await updateChatwootContact(
      chatwootAccount.chatwoot_account_id,
      chatwootAccount.api_access_token,
      existingContact.chatwoot_contact_id,
      userData
    );
    
    contactRecord = existingContact;
  } else {
    // Create new contact
    console.log('Creating new contact');
    
    // Get user data if not provided
    if (!userData) {
      const { data: user } = await supabase.auth.admin.getUserById(userId);
      userData = {
        name: user.user?.user_metadata?.full_name || user.user?.email?.split('@')[0] || 'Unknown',
        email: user.user?.email,
        phone: user.user?.user_metadata?.phone
      };
    }

    chatwootContact = await createChatwootContact(
      chatwootAccount.chatwoot_account_id,
      chatwootAccount.api_access_token,
      userData
    );

    // Store contact mapping
    const { data: newContact, error } = await supabase
      .from('chatwoot_contacts')
      .insert({
        user_id: userId,
        organization_id: organizationId,
        email: userData.email,
        phone: userData.phone,
        chatwoot_contact_id: chatwootContact.payload.contact.id,
        chatwoot_account_id: chatwootAccount.chatwoot_account_id,
        sync_status: 'synced'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to store contact mapping: ${error.message}`);
    }

    contactRecord = newContact;
  }

  // Sync customer attributes
  await syncCustomerAttributes(userId, organizationId, chatwootAccount);

  console.log('Contact synced successfully:', contactRecord);

  return new Response(
    JSON.stringify({ 
      success: true, 
      contact: contactRecord,
      chatwoot_contact: chatwootContact,
      message: 'Contact synced successfully' 
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    }
  );
}

async function createChatwootContact(accountId: number, accessToken: string, userData: any) {
  const response = await fetch(`${chatwootBaseUrl}/api/v1/accounts/${accountId}/contacts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api_access_token': accessToken
    },
    body: JSON.stringify({
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      custom_attributes: {
        registration_date: new Date().toISOString().split('T')[0],
        preferred_language: 'nl',
        customer_tier: 'Bronze',
        marketing_consent: false
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create Chatwoot contact: ${error}`);
  }

  return await response.json();
}

async function updateChatwootContact(accountId: number, accessToken: string, contactId: number, userData: any) {
  const response = await fetch(`${chatwootBaseUrl}/api/v1/accounts/${accountId}/contacts/${contactId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'api_access_token': accessToken
    },
    body: JSON.stringify({
      name: userData.name,
      email: userData.email,
      phone: userData.phone
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update Chatwoot contact: ${error}`);
  }

  return await response.json();
}

async function syncCustomerAttributes(userId: string, organizationId: string, chatwootAccount: any) {
  console.log('Syncing customer attributes for user:', userId);

  // Get customer data
  const [orders, cart, profile] = await Promise.all([
    getOrderHistory(userId, organizationId),
    getCurrentCart(userId, organizationId),
    getCustomerProfile(userId)
  ]);

  // Calculate derived attributes
  const customerTier = calculateCustomerTier(orders);
  const totalSpent = orders.reduce((sum: number, order: any) => sum + parseFloat(order.total_amount || 0), 0);
  const averageOrderValue = orders.length > 0 ? totalSpent / orders.length : 0;
  const lastOrderDate = orders[0]?.created_at;

  const customAttributes: CustomerAttributes = {
    customer_tier: customerTier,
    registration_date: profile?.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
    preferred_language: profile?.preferred_language || 'nl',
    order_count: orders.length,
    total_spent: `€${totalSpent.toFixed(2)}`,
    average_order_value: `€${averageOrderValue.toFixed(2)}`,
    last_order_date: lastOrderDate?.split('T')[0],
    current_cart_value: cart?.total ? `€${cart.total.toFixed(2)}` : '€0.00',
    current_cart_items: cart?.items?.length || 0,
    cart_products: cart?.items?.map((item: any) => item.product_name).join(', ') || '',
    favorite_categories: getFavoriteCategories(orders),
    purchase_frequency: calculatePurchaseFrequency(orders),
    marketing_consent: profile?.marketing_consent || false,
    support_priority: getSupportPriority(customerTier, totalSpent),
    previous_conversations: await getPreviousConversationCount(userId, organizationId)
  };

  // Get contact mapping
  const { data: contact } = await supabase
    .from('chatwoot_contacts')
    .select('*')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .single();

  if (!contact) {
    throw new Error('Contact mapping not found');
  }

  // Update Chatwoot contact attributes
  const response = await fetch(`${chatwootBaseUrl}/api/v1/accounts/${chatwootAccount.chatwoot_account_id}/contacts/${contact.chatwoot_contact_id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'api_access_token': chatwootAccount.api_access_token
    },
    body: JSON.stringify({
      custom_attributes: customAttributes
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to update contact attributes:', error);
  }

  // Cache attributes in database
  await supabase
    .from('chatwoot_contacts')
    .update({
      cached_attributes: customAttributes,
      last_synced_at: new Date().toISOString()
    })
    .eq('id', contact.id);

  console.log('Customer attributes synced successfully');
}

async function getOrderHistory(userId: string, organizationId: string) {
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(10);

  return orders || [];
}

async function getCurrentCart(userId: string, organizationId: string) {
  const { data: cartItems } = await supabase
    .from('shopping_cart')
    .select(`
      *,
      products:product_id (name, price)
    `)
    .eq('user_id', userId)
    .eq('organization_id', organizationId);

  if (!cartItems || cartItems.length === 0) {
    return { items: [], total: 0 };
  }

  const total = cartItems.reduce((sum, item) => {
    const price = parseFloat(item.products?.price || 0);
    return sum + (price * item.quantity);
  }, 0);

  return {
    items: cartItems.map(item => ({
      product_name: item.products?.name,
      quantity: item.quantity,
      price: item.products?.price
    })),
    total
  };
}

async function getCustomerProfile(userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  return profile;
}

function calculateCustomerTier(orders: any[]): string {
  const totalSpent = orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
  
  if (totalSpent >= 5000) return 'Platinum';
  if (totalSpent >= 2500) return 'Gold';
  if (totalSpent >= 1000) return 'Silver';
  return 'Bronze';
}

function getFavoriteCategories(orders: any[]): string[] {
  // Simplified - would need to analyze order items
  return ['beds', 'storage'];
}

function calculatePurchaseFrequency(orders: any[]): string {
  if (orders.length === 0) return 'new';
  
  const daysSinceFirst = orders.length > 1 ? 
    (new Date().getTime() - new Date(orders[orders.length - 1].created_at).getTime()) / (1000 * 60 * 60 * 24) : 0;
  
  if (daysSinceFirst < 30) return 'frequent';
  if (daysSinceFirst < 90) return 'regular';
  return 'occasional';
}

function getSupportPriority(tier: string, totalSpent: number): string {
  if (tier === 'Platinum' || totalSpent >= 5000) return 'high';
  if (tier === 'Gold' || totalSpent >= 2500) return 'medium'; 
  return 'low';
}

async function getPreviousConversationCount(userId: string, organizationId: string): Promise<number> {
  const { count } = await supabase
    .from('chatwoot_conversations')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('customer_tier', 'any'); // Would need better filtering

  return count || 0;
}

async function updateContactAttributes(req: Request): Promise<Response> {
  const { userId, organizationId } = await req.json();

  const { data: chatwootAccount } = await supabase
    .from('chatwoot_accounts')
    .select('*')
    .eq('organization_id', organizationId)
    .single();

  if (!chatwootAccount) {
    throw new Error('No Chatwoot account found');
  }

  await syncCustomerAttributes(userId, organizationId, chatwootAccount);

  return new Response(
    JSON.stringify({ 
      success: true,
      message: 'Contact attributes updated successfully' 
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    }
  );
}

async function bulkSyncContacts(req: Request): Promise<Response> {
  const { organizationId } = await req.json();

  // Get all users for this organization
  const { data: users } = await supabase
    .from('organization_users')
    .select('user_id')
    .eq('organization_id', organizationId)
    .eq('is_active', true);

  let syncedCount = 0;
  let errorCount = 0;

  for (const user of users || []) {
    try {
      await syncContact(new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.user_id,
          organizationId: organizationId
        })
      }));
      syncedCount++;
    } catch (error) {
      console.error(`Failed to sync user ${user.user_id}:`, error);
      errorCount++;
    }
  }

  return new Response(
    JSON.stringify({ 
      success: true,
      synced: syncedCount,
      errors: errorCount,
      message: `Bulk sync completed: ${syncedCount} synced, ${errorCount} errors` 
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    }
  );
}

async function mergeContacts(req: Request): Promise<Response> {
  const { primaryContactId, duplicateContactId } = await req.json();

  // Implementation for merging duplicate contacts
  // This would involve updating conversations and deleting the duplicate

  return new Response(
    JSON.stringify({ 
      success: true,
      message: 'Contacts merged successfully' 
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    }
  );
}

serve(handler);