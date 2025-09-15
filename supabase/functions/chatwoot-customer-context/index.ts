import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CustomerContext {
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    tier: string;
    registration_date: string;
    total_spent: string;
    order_count: number;
    avatar_url?: string;
  };
  recent_orders: Array<{
    id: string;
    order_number: string;
    status: string;
    total_amount: string;
    created_at: string;
    items_count: number;
  }>;
  current_cart: {
    items: Array<{
      product_name: string;
      quantity: number;
      price: string;
      image_url?: string;
    }>;
    total: string;
    updated_at: string;
    items_count: number;
  };
  behavioral_insights: {
    favorite_categories: string[];
    purchase_frequency: string;
    average_order_value: string;
    seasonal_patterns: string[];
    last_activity: string;
  };
  support_history: {
    previous_conversations: number;
    satisfaction_score: number;
    escalation_history: boolean;
    last_contact_date?: string;
    preferred_contact_method: string;
  };
  current_session: {
    current_page?: string;
    session_duration: number;
    pages_visited: string[];
    products_viewed: Array<{
      name: string;
      price: string;
      viewed_at: string;
    }>;
  };
  recommendations: {
    suggested_products: Array<{
      id: string;
      name: string;
      price: string;
      image_url?: string;
      reason: string;
    }>;
    discount_opportunities: Array<{
      type: string;
      value: string;
      reason: string;
    }>;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const contactId = url.searchParams.get('contact_id');
    const accountId = url.searchParams.get('account_id');
    const action = url.searchParams.get('action') || 'context';

    if (!contactId || !accountId) {
      throw new Error('Missing required parameters: contact_id and account_id');
    }

    switch (action) {
      case 'context':
        return await getCustomerContext(contactId, accountId);
      case 'orders':
        return await getOrderHistory(contactId, accountId);
      case 'cart':
        return await getCurrentCart(contactId, accountId);
      case 'insights':
        return await getCustomerInsights(contactId, accountId);
      case 'recommendations':
        return await getRecommendations(contactId, accountId);
      default:
        throw new Error('Invalid action specified');
    }
  } catch (error: any) {
    console.error("Error in chatwoot-customer-context:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to get customer context' 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

async function getCustomerContext(contactId: string, accountId: string): Promise<Response> {
  console.log('Getting customer context for contact:', contactId);

  // Get organization and contact mapping
  const { data: chatwootAccount } = await supabase
    .from('chatwoot_accounts')
    .select('organization_id')
    .eq('chatwoot_account_id', parseInt(accountId))
    .single();

  if (!chatwootAccount) {
    throw new Error('Chatwoot account not found');
  }

  const { data: contact } = await supabase
    .from('chatwoot_contacts')
    .select('*')
    .eq('chatwoot_contact_id', parseInt(contactId))
    .eq('organization_id', chatwootAccount.organization_id)
    .single();

  if (!contact) {
    throw new Error('Contact mapping not found');
  }

  // Build comprehensive customer context
  const [
    customerData,
    orderHistory,
    cartData,
    insights,
    supportHistory,
    recommendations
  ] = await Promise.all([
    getCustomerData(contact.user_id, chatwootAccount.organization_id),
    getRecentOrders(contact.user_id, chatwootAccount.organization_id),
    getCartContents(contact.user_id, chatwootAccount.organization_id),
    getBehavioralInsights(contact.user_id, chatwootAccount.organization_id),
    getSupportHistory(contact.user_id, chatwootAccount.organization_id),
    getProductRecommendations(contact.user_id, chatwootAccount.organization_id)
  ]);

  const customerContext: CustomerContext = {
    customer: customerData,
    recent_orders: orderHistory,
    current_cart: cartData,
    behavioral_insights: insights,
    support_history: supportHistory,
    current_session: {
      session_duration: 0, // Would be tracked via widget events
      pages_visited: [],
      products_viewed: []
    },
    recommendations: recommendations
  };

  return new Response(
    JSON.stringify({ 
      success: true, 
      context: customerContext
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    }
  );
}

async function getCustomerData(userId: string, organizationId: string) {
  // Get user data from auth and profiles
  const { data: user } = await supabase.auth.admin.getUserById(userId);
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  // Get cached attributes from contact record
  const { data: contact } = await supabase
    .from('chatwoot_contacts')
    .select('cached_attributes')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .single();

  const attributes = contact?.cached_attributes || {};

  return {
    id: userId,
    name: profile?.first_name && profile?.last_name 
      ? `${profile.first_name} ${profile.last_name}`
      : user.user?.user_metadata?.full_name || user.user?.email?.split('@')[0] || 'Unknown',
    email: user.user?.email || '',
    phone: profile?.phone || user.user?.user_metadata?.phone,
    tier: attributes.customer_tier || 'Bronze',
    registration_date: attributes.registration_date || user.user?.created_at?.split('T')[0] || '',
    total_spent: attributes.total_spent || '€0.00',
    order_count: attributes.order_count || 0,
    avatar_url: profile?.avatar_url || user.user?.user_metadata?.avatar_url
  };
}

async function getRecentOrders(userId: string, organizationId: string) {
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      status,
      total_amount,
      created_at,
      order_items!inner(id)
    `)
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(5);

  return (orders || []).map(order => ({
    id: order.id,
    order_number: order.order_number,
    status: order.status,
    total_amount: `€${parseFloat(order.total_amount).toFixed(2)}`,
    created_at: order.created_at,
    items_count: order.order_items?.length || 0
  }));
}

async function getCartContents(userId: string, organizationId: string) {
  const { data: cartItems } = await supabase
    .from('shopping_cart')
    .select(`
      quantity,
      products:product_id (
        name,
        price,
        images:product_images(image_url)
      )
    `)
    .eq('user_id', userId)
    .eq('organization_id', organizationId);

  if (!cartItems || cartItems.length === 0) {
    return {
      items: [],
      total: '€0.00',
      updated_at: new Date().toISOString(),
      items_count: 0
    };
  }

  const items = cartItems.map(item => ({
    product_name: item.products?.name || 'Unknown Product',
    quantity: item.quantity,
    price: `€${parseFloat(item.products?.price || 0).toFixed(2)}`,
    image_url: item.products?.images?.[0]?.image_url
  }));

  const total = cartItems.reduce((sum, item) => {
    return sum + (parseFloat(item.products?.price || 0) * item.quantity);
  }, 0);

  return {
    items,
    total: `€${total.toFixed(2)}`,
    updated_at: new Date().toISOString(), // Would track actual cart update time
    items_count: cartItems.length
  };
}

async function getBehavioralInsights(userId: string, organizationId: string) {
  // Get order history for analysis
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      total_amount,
      created_at,
      order_items!inner(
        products:product_id (
          categories:category_id (name)
        )
      )
    `)
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (!orders || orders.length === 0) {
    return {
      favorite_categories: [],
      purchase_frequency: 'new',
      average_order_value: '€0.00',
      seasonal_patterns: [],
      last_activity: new Date().toISOString()
    };
  }

  // Calculate insights
  const totalSpent = orders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0);
  const averageOrderValue = totalSpent / orders.length;

  // Extract favorite categories
  const categoryCount: { [key: string]: number } = {};
  orders.forEach(order => {
    order.order_items?.forEach(item => {
      const category = item.products?.categories?.name;
      if (category) {
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      }
    });
  });

  const favoriteCategories = Object.entries(categoryCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([category]) => category);

  // Calculate purchase frequency
  const daysSinceFirst = orders.length > 1 ? 
    (new Date().getTime() - new Date(orders[orders.length - 1].created_at).getTime()) / (1000 * 60 * 60 * 24) : 0;
  
  let frequency = 'new';
  if (daysSinceFirst > 0) {
    const orderFrequencyDays = daysSinceFirst / orders.length;
    if (orderFrequencyDays < 30) frequency = 'frequent';
    else if (orderFrequencyDays < 90) frequency = 'regular';
    else frequency = 'occasional';
  }

  return {
    favorite_categories: favoriteCategories,
    purchase_frequency: frequency,
    average_order_value: `€${averageOrderValue.toFixed(2)}`,
    seasonal_patterns: [], // Would need more complex analysis
    last_activity: orders[0]?.created_at || new Date().toISOString()
  };
}

async function getSupportHistory(userId: string, organizationId: string) {
  const { data: conversations, count } = await supabase
    .from('chatwoot_conversations')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId)
    // Would need to join with contact mapping
    .order('created_at', { ascending: false });

  const { data: latestConversation } = await supabase
    .from('chatwoot_conversations')
    .select('created_at, satisfaction_rating')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Calculate average satisfaction
  const ratingsData = conversations?.filter(c => c.satisfaction_rating) || [];
  const averageRating = ratingsData.length > 0 ? 
    ratingsData.reduce((sum, c) => sum + c.satisfaction_rating, 0) / ratingsData.length : 0;

  return {
    previous_conversations: count || 0,
    satisfaction_score: averageRating,
    escalation_history: false, // Would need to track escalations
    last_contact_date: latestConversation?.created_at,
    preferred_contact_method: 'chat' // Would be determined from interaction history
  };
}

async function getProductRecommendations(userId: string, organizationId: string) {
  // Get user's order history for recommendations
  const { data: orderHistory } = await supabase
    .from('orders')
    .select(`
      order_items!inner(
        products:product_id (
          id,
          name,
          price,
          category_id,
          product_images(image_url)
        )
      )
    `)
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .limit(5);

  // Get popular products in similar categories
  const { data: popularProducts } = await supabase
    .from('products')
    .select(`
      id,
      name,
      price,
      is_featured,
      product_images(image_url)
    `)
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .eq('is_featured', true)
    .limit(3);

  const suggestedProducts = (popularProducts || []).map(product => ({
    id: product.id,
    name: product.name,
    price: `€${parseFloat(product.price).toFixed(2)}`,
    image_url: product.product_images?.[0]?.image_url,
    reason: 'Popular product'
  }));

  const discountOpportunities = [];
  
  // Add discount opportunities based on cart value, customer tier, etc.
  const { data: cart } = await supabase
    .from('shopping_cart')
    .select('quantity, products:product_id(price)')
    .eq('user_id', userId)
    .eq('organization_id', organizationId);

  if (cart && cart.length > 0) {
    const cartValue = cart.reduce((sum, item) => sum + (parseFloat(item.products?.price || 0) * item.quantity), 0);
    
    if (cartValue > 500) {
      discountOpportunities.push({
        type: 'percentage',
        value: '10%',
        reason: 'Cart value over €500'
      });
    }
  }

  return {
    suggested_products: suggestedProducts,
    discount_opportunities: discountOpportunities
  };
}

async function getOrderHistory(contactId: string, accountId: string): Promise<Response> {
  // Implementation for getting detailed order history
  const context = await getCustomerContext(contactId, accountId);
  const contextData = JSON.parse(await context.text());
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      orders: contextData.context.recent_orders
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    }
  );
}

async function getCurrentCart(contactId: string, accountId: string): Promise<Response> {
  // Implementation for getting current cart
  const context = await getCustomerContext(contactId, accountId);
  const contextData = JSON.parse(await context.text());
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      cart: contextData.context.current_cart
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    }
  );
}

async function getCustomerInsights(contactId: string, accountId: string): Promise<Response> {
  // Implementation for getting behavioral insights
  const context = await getCustomerContext(contactId, accountId);
  const contextData = JSON.parse(await context.text());
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      insights: contextData.context.behavioral_insights
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    }
  );
}

async function getRecommendations(contactId: string, accountId: string): Promise<Response> {
  // Implementation for getting product recommendations
  const context = await getCustomerContext(contactId, accountId);
  const contextData = JSON.parse(await context.text());
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      recommendations: contextData.context.recommendations
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    }
  );
}

serve(handler);