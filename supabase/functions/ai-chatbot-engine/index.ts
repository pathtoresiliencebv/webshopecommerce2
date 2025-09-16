import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatRequest {
  sessionId: string;
  message: string;
  organizationId: string;
  userId?: string;
}

interface AIContext {
  store: any;
  customer: any;
  orderHistory: any[];
  currentCart: any;
  conversation: any[];
  knowledgeBase: any[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, message, organizationId, userId }: ChatRequest = await req.json();

    console.log('Processing chat request:', { sessionId, organizationId, userId });

    // Get or create session
    let session = await getOrCreateSession(sessionId, organizationId, userId);
    
    // Build AI context
    const context = await buildAIContext(session, organizationId, userId);
    
    // Save user message
    await saveMessage(sessionId, 'user', message);
    
    // Generate AI response
    const aiResponse = await generateAIResponse(message, context);
    
    // Save AI message
    await saveMessage(sessionId, 'ai', aiResponse.content, aiResponse.metadata);
    
    // Check for escalation
    const shouldEscalate = checkEscalation(aiResponse.metadata, message);
    
    if (shouldEscalate) {
      await escalateToAgent(sessionId, aiResponse.metadata.escalationReason);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        response: aiResponse.content,
        shouldEscalate,
        sessionId: session.id
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in ai-chatbot-engine:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to process chat request',
        fallbackResponse: "I'm sorry, I'm having trouble right now. Please try again or contact our support team."
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

async function getOrCreateSession(sessionId: string, organizationId: string, userId?: string) {
  // Try to get existing session
  let { data: session, error } = await supabase
    .from('chatbot_sessions')
    .select('*')
    .eq('session_token', sessionId)
    .single();

  if (error || !session) {
    // Create new session
    const { data: newSession, error: createError } = await supabase
      .from('chatbot_sessions')
      .insert({
        session_token: sessionId,
        organization_id: organizationId,
        user_id: userId,
        customer_context: {},
        ai_context: {},
        status: 'active'
      })
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create session: ${createError.message}`);
    }
    
    session = newSession;
  }

  return session;
}

async function buildAIContext(session: any, organizationId: string, userId?: string): Promise<AIContext> {
  // Get organization data with theme settings and store configuration
  const { data: organization } = await supabase
    .from('organizations')
    .select(`
      *,
      theme_settings (*),
      store_settings (*)
    `)
    .eq('id', organizationId)
    .single();

  // Get FAQs for the organization
  const { data: faqs } = await supabase
    .from('faqs')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .limit(50);

  // Get customer data if authenticated
  let customer = null;
  let orderHistory: any[] = [];
  let currentCart = null;
  let loyaltyLevel = 'Standard';

  if (userId) {
    // Get customer profile with extended details
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get comprehensive order history with product details
    const { data: orders } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (name, sku, price, category)
        )
      `)
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get current cart with detailed product info
    const { data: cart } = await supabase
      .from('shopping_cart')
      .select(`
        *,
        products (
          name,
          price,
          sku,
          description,
          category,
          image_url,
          stock_quantity
        )
      `)
      .eq('user_id', userId)
      .eq('organization_id', organizationId);

    // Calculate customer loyalty level based on order count and total spend
    if (orders && orders.length > 0) {
      const totalSpent = orders.reduce((sum: number, order: any) => sum + parseFloat(order.total_amount), 0);
      const orderCount = orders.length;
      
      if (totalSpent > 1000 || orderCount > 10) loyaltyLevel = 'VIP';
      else if (totalSpent > 500 || orderCount > 5) loyaltyLevel = 'Gold';
      else if (orderCount > 2) loyaltyLevel = 'Silver';
    }

    customer = {
      ...profile,
      loyaltyLevel,
      totalOrders: orders?.length || 0,
      recentOrderStatus: orders?.[0]?.status
    };
    orderHistory = orders || [];
    currentCart = cart;
  }

  // Get conversation history with enhanced context
  const { data: conversations } = await supabase
    .from('chatbot_conversations')
    .select('*')
    .eq('session_id', session.id)
    .order('created_at', { ascending: true });

  // Get relevant knowledge base entries with semantic search capability
  const { data: knowledgeBase } = await supabase
    .from('ai_knowledge_base')
    .select('*')
    .or(`organization_id.eq.${organizationId},organization_id.is.null`)
    .eq('is_active', true)
    .order('effectiveness_score', { ascending: false })
    .limit(30);

  // Get products for product knowledge
  const { data: products } = await supabase
    .from('products')
    .select('name, description, price, category, tags, sku')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .limit(100);

  // Get collections for product organization
  const { data: collections } = await supabase
    .from('collections')
    .select('name, description, slug')
    .eq('organization_id', organizationId)
    .eq('is_active', true);

  return {
    store: {
      ...organization,
      faqs: faqs || [],
      products: products || [],
      collections: collections || []
    },
    customer,
    orderHistory,
    currentCart,
    conversation: conversations || [],
    knowledgeBase: knowledgeBase || []
  };
}

async function generateAIResponse(message: string, context: AIContext) {
  // Determine which model to use based on complexity
  const isComplexQuery = await analyzeQueryComplexity(message, context);
  const model = isComplexQuery ? 'gpt-4o-mini' : 'gpt-3.5-turbo';
  
  const systemPrompt = createSystemPrompt(context);
  
  // Enhanced function definitions with better parameter handling
  const functions = [
    {
      name: "order_lookup",
      description: "Look up detailed order information by order number or email",
      parameters: {
        type: "object",
        properties: {
          orderNumber: { type: "string", description: "Order number to look up" },
          customerEmail: { type: "string", description: "Customer email to find orders" }
        }
      }
    },
    {
      name: "product_search", 
      description: "Search for products with filters and detailed information",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Product search query" },
          category: { type: "string", description: "Product category filter" },
          priceRange: { type: "string", description: "Price range filter (e.g., '100-500')" }
        },
        required: ["query"]
      }
    },
    {
      name: "check_shipping_status",
      description: "Check shipping status and tracking information",
      parameters: {
        type: "object",
        properties: {
          orderNumber: { type: "string", description: "Order number to track" }
        },
        required: ["orderNumber"]
      }
    },
    {
      name: "get_store_policies",
      description: "Get store policies for returns, exchanges, and shipping",
      parameters: {
        type: "object",
        properties: {
          policyType: { type: "string", description: "Type of policy (returns, shipping, exchanges)" }
        }
      }
    },
    {
      name: "escalate_to_agent",
      description: "Escalate to human agent when unable to help or customer is frustrated",
      parameters: {
        type: "object",
        properties: {
          reason: { type: "string", description: "Reason for escalation" },
          priority: { type: "string", enum: ["low", "medium", "high"], description: "Escalation priority" }
        },
        required: ["reason"]
      }
    }
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...context.conversation.slice(-10).map(msg => ({
          role: msg.message_type === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        { role: 'user', content: message }
      ],
      functions,
      function_call: 'auto',
      max_tokens: model === 'gpt-4o-mini' ? 800 : 500,
      temperature: 0.6
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  const aiMessage = data.choices[0].message;

  let content = aiMessage.content;
  let metadata: any = {
    model,
    confidenceScore: calculateConfidenceScore(aiMessage, context, message),
    responseTime: Date.now(),
    queryComplexity: isComplexQuery ? 'high' : 'low'
  };

  // Handle function calls
  if (aiMessage.function_call) {
    const functionResult = await handleFunctionCall(aiMessage.function_call, context);
    content = functionResult.content;
    metadata = { ...metadata, ...functionResult.metadata };
  }

  return { content, metadata };
}

async function analyzeQueryComplexity(message: string, context: AIContext): Promise<boolean> {
  // Define complexity indicators
  const complexityIndicators = [
    'refund', 'return', 'exchange', 'complaint', 'problem', 'issue',
    'cancel', 'modify', 'change order', 'damaged', 'wrong item',
    'technical', 'not working', 'broken', 'defective'
  ];
  
  const messageLower = message.toLowerCase();
  
  // High complexity if:
  // 1. Contains complaint/issue keywords
  // 2. Message is very long (>100 chars)
  // 3. Multiple questions
  // 4. Customer has order history (needs context)
  return complexityIndicators.some(indicator => messageLower.includes(indicator)) ||
         message.length > 100 ||
         (message.match(/\?/g) || []).length > 1 ||
         (context.customer && context.orderHistory.length > 0);
}

function createSystemPrompt(context: AIContext): string {
  const { store, customer, orderHistory, currentCart, knowledgeBase } = context;
  
  // Get store branding and tone settings
  const storeBrand = store?.theme_settings?.[0]?.appearance_settings || {};
  const storeSettings = store?.store_settings?.find((s: any) => s.setting_type === 'customer_service') || {};
  
  // Format business hours
  const businessHours = storeSettings?.settings?.business_hours || 
    'Monday-Friday 9AM-6PM, Weekend 10AM-4PM';
  
  // Build knowledge base context
  const faqContext = store?.faqs?.slice(0, 10).map((faq: any) => 
    `Q: ${faq.question}\nA: ${faq.answer}`
  ).join('\n\n') || '';
  
  const knowledgeContext = knowledgeBase.slice(0, 5).map(kb => 
    `Topic: ${kb.title}\nContent: ${kb.content}`
  ).join('\n\n');
  
  return `You are an intelligent customer service AI for ${store?.name || 'our store'}. 
You represent our brand with ${storeBrand?.tone || 'friendly and professional'} tone.

STORE PROFILE:
- Name: ${store?.name || 'Store'}
- Description: ${store?.description || ''}
- Contact: ${store?.email || 'Not available'} | ${store?.phone || 'Not available'}
- Website: ${store?.website_url || ''}
- Currency: ${store?.currency || 'EUR'}
- Business Hours: ${businessHours}
- Location: ${store?.city || ''}, ${store?.country || 'Netherlands'}

${customer ? `CUSTOMER PROFILE:
- Name: ${customer.first_name} ${customer.last_name}
- Email: ${customer.email || 'Not provided'}
- Loyalty Level: ${customer.loyaltyLevel || 'Standard'}
- Order History: ${orderHistory.length} orders (Recent: ${customer.recentOrderStatus || 'None'})
- Current Cart: ${currentCart?.length || 0} items worth ${currentCart?.reduce((sum: number, item: any) => sum + (item.quantity * item.products?.price || 0), 0) || 0} ${store?.currency || 'EUR'}
- Total Orders: ${customer.totalOrders || 0}` : 'CUSTOMER: Anonymous visitor'}

PRODUCT CATALOG KNOWLEDGE:
- Available Categories: ${store?.collections?.map((c: any) => c.name).join(', ') || 'General merchandise'}
- Featured Products: ${store?.products?.slice(0, 5).map((p: any) => `${p.name} (${p.category})`).join(', ') || 'Various products'}

KNOWLEDGE BASE:
${faqContext}

${knowledgeContext}

CAPABILITIES & GUIDELINES:
✓ Order Management: Look up orders, track shipments, check status
✓ Product Information: Search products, check availability, provide details
✓ Customer Support: Answer questions using store knowledge base
✓ Policy Information: Provide store policies for returns, shipping, exchanges
✓ Smart Escalation: Escalate complex issues or frustrated customers to human agents

RESPONSE STYLE:
- Always greet ${customer ? customer.first_name : 'customers'} warmly and personally
- Use store-specific policies and information
- Provide actionable, specific solutions
- Acknowledge loyalty level for VIP/Gold customers with enhanced service
- Reference previous orders when relevant
- Keep responses helpful but concise
- Match the ${storeBrand?.tone || 'friendly'} brand tone
- Use appropriate currency formatting (${store?.currency || 'EUR'})

ESCALATION TRIGGERS:
- Customer expresses frustration, anger, or dissatisfaction
- Complex return/refund requests
- Technical issues beyond basic troubleshooting
- Requests for manager or human agent
- Issues requiring account changes or billing adjustments`;
}

async function handleFunctionCall(functionCall: any, context: AIContext) {
  const { name, arguments: args } = functionCall;
  const parsedArgs = JSON.parse(args);

  switch (name) {
    case 'order_lookup':
      return await handleOrderLookup(parsedArgs.orderNumber || parsedArgs.customerEmail, context);
    case 'product_search':
      return await handleProductSearch(parsedArgs.query, context, parsedArgs.category, parsedArgs.priceRange);
    case 'check_shipping_status':
      return await handleShippingStatus(parsedArgs.orderNumber, context);
    case 'get_store_policies':
      return await handleStorePolicies(parsedArgs.policyType, context);
    case 'escalate_to_agent':
      const priority = parsedArgs.priority || 'medium';
      return {
        content: `I understand this ${priority === 'high' ? 'urgent ' : ''}matter needs special attention. I'm connecting you with one of our ${priority === 'high' ? 'senior ' : ''}support specialists right away. They'll have access to your full account and order history to provide the best assistance.`,
        metadata: { 
          escalationReason: parsedArgs.reason,
          escalationPriority: priority,
          shouldEscalate: true
        }
      };
    default:
      return {
        content: "I'm not sure how to help with that specific request. Let me connect you with a human agent who can assist you better.",
        metadata: { escalationReason: 'unknown_function', escalationPriority: 'low' }
      };
  }
}

async function handleShippingStatus(orderNumber: string, context: AIContext) {
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('order_number', orderNumber)
    .eq('organization_id', context.store.id)
    .single();

  if (!order) {
    return {
      content: `I couldn't find shipping information for order ${orderNumber}. Please verify the order number or check your email confirmation.`,
      metadata: { shippingLookupFailed: true }
    };
  }

  let statusMessage = '';
  switch (order.status) {
    case 'pending':
      statusMessage = 'Your order is being prepared and will ship within 1-2 business days.';
      break;
    case 'processing':
      statusMessage = 'Your order is being processed and packaged for shipment.';
      break;
    case 'shipped':
      const shippedDate = new Date(order.shipped_at).toLocaleDateString();
      statusMessage = `Your order shipped on ${shippedDate} to ${order.shipping_address_line1}, ${order.shipping_city}. Estimated delivery: 2-5 business days.`;
      break;
    case 'delivered':
      const deliveredDate = new Date(order.delivered_at).toLocaleDateString();
      statusMessage = `Your order was successfully delivered on ${deliveredDate}.`;
      break;
    default:
      statusMessage = `Current status: ${order.status}. Contact us if you need more details.`;
  }

  return {
    content: `Shipping Status for Order #${orderNumber}:\n\n${statusMessage}`,
    metadata: { shippingFound: true, orderStatus: order.status }
  };
}

async function handleStorePolicies(policyType: string, context: AIContext) {
  // Get store policies from settings or use defaults
  const storeSettings = context.store?.store_settings?.find((s: any) => s.setting_type === 'policies');
  const policies = storeSettings?.settings || {};
  
  let policyContent = '';
  
  switch (policyType?.toLowerCase()) {
    case 'returns':
      policyContent = policies.returns || `
📋 Return Policy:
• 30-day return window from delivery date
• Items must be unused and in original packaging
• Return shipping: Customer responsibility
• Refund processing: 5-7 business days
• Original receipt or order number required
      `.trim();
      break;
    case 'shipping':
      policyContent = policies.shipping || `
🚚 Shipping Information:
• Standard shipping: 3-5 business days
• Express shipping: 1-2 business days
• Free shipping on orders over €50
• Processing time: 1-2 business days
• Tracking provided for all shipments
      `.trim();
      break;
    case 'exchanges':
      policyContent = policies.exchanges || `
🔄 Exchange Policy:
• 30-day exchange window
• Size/color exchanges available
• Item must be unworn/unused
• Exchange shipping: Free both ways
• Processing time: 3-5 days after receipt
      `.trim();
      break;
    default:
      policyContent = `I can help you with information about our returns, shipping, or exchange policies. Which would you like to know about?`;
  }
  
  return {
    content: policyContent,
    metadata: { policyProvided: true, policyType }
  };
}

async function handleOrderLookup(orderNumber: string, context: AIContext) {
  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(*, products(name))')
    .eq('order_number', orderNumber)
    .eq('organization_id', context.store.id)
    .single();

  if (!order) {
    return {
      content: `I couldn't find an order with number ${orderNumber}. Please double-check the order number or contact our support team if you need assistance.`,
      metadata: { orderLookupFailed: true }
    };
  }

  const itemsList = order.order_items.map((item: any) => 
    `${item.products.name} (Qty: ${item.quantity})`
  ).join(', ');

  return {
    content: `I found your order #${orderNumber}:
    
Status: ${order.status}
Items: ${itemsList}
Total: ${context.store.currency} ${order.total_amount}
Order Date: ${new Date(order.created_at).toLocaleDateString()}

${order.status === 'shipped' ? `Your order has been shipped to ${order.shipping_city}.` : ''}
${order.status === 'pending' ? 'Your order is being prepared for shipping.' : ''}`,
    metadata: { orderFound: true, orderStatus: order.status }
  };
}

async function handleProductSearch(query: string, context: AIContext, category?: string, priceRange?: string) {
  let queryBuilder = supabase
    .from('products')
    .select('name, price, description, sku, category, stock_quantity, image_url')
    .eq('organization_id', context.store.id)
    .eq('is_active', true);

  // Apply category filter if provided
  if (category) {
    queryBuilder = queryBuilder.eq('category', category);
  }

  // Apply price range filter if provided
  if (priceRange) {
    const [minPrice, maxPrice] = priceRange.split('-').map(p => parseFloat(p));
    if (!isNaN(minPrice)) queryBuilder = queryBuilder.gte('price', minPrice);
    if (!isNaN(maxPrice)) queryBuilder = queryBuilder.lte('price', maxPrice);
  }

  // Search by name or description
  queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
  
  const { data: products } = await queryBuilder.limit(5);

  if (!products || products.length === 0) {
    // Try broader search in store's product knowledge
    const similarProducts = context.store.products?.filter((p: any) => 
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.description?.toLowerCase().includes(query.toLowerCase()) ||
      p.category?.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 3);

    if (similarProducts && similarProducts.length > 0) {
      const suggestionList = similarProducts.map((p: any) => 
        `• ${p.name} (${p.category}) - ${context.store.currency} ${p.price}`
      ).join('\n');

      return {
        content: `I couldn't find exact matches for "${query}", but here are some similar products:\n\n${suggestionList}\n\nWould you like more details about any of these, or should I help you search for something else?`,
        metadata: { productsFound: true, productCount: similarProducts.length, searchType: 'similar' }
      };
    }

    return {
      content: `I couldn't find any products matching "${query}"${category ? ` in the ${category} category` : ''}${priceRange ? ` in the €${priceRange} price range` : ''}. \n\nYou might want to:\n• Browse our ${context.store.collections?.map((c: any) => c.name).join(', ') || 'product categories'}\n• Try a different search term\n• Remove filters and search more broadly\n\nHow else can I help you find what you're looking for?`,
      metadata: { productsFound: false, searchTerms: query, filters: { category, priceRange } }
    };
  }

  const productList = products.map(p => {
    const stockInfo = p.stock_quantity > 0 ? '✅ In Stock' : '❌ Out of Stock';
    return `**${p.name}** (${p.sku})\n${p.description || ''}\n💰 ${context.store.currency} ${p.price} | ${stockInfo}\nCategory: ${p.category || 'N/A'}`;
  }).join('\n\n');

  return {
    content: `Here are the products I found for "${query}":\n\n${productList}\n\n${products.length === 5 ? 'Showing top 5 results. ' : ''}Would you like more information about any of these products, or help with something else?`,
    metadata: { 
      productsFound: true, 
      productCount: products.length,
      searchTerms: query,
      filters: { category, priceRange }
    }
  };
}

function calculateConfidenceScore(aiMessage: any, context: AIContext, userMessage: string): number {
  let score = 0.4; // Base score
  
  // Customer context boosts confidence
  if (context.customer) {
    score += 0.15;
    if (context.orderHistory.length > 0) score += 0.1; // Has order history
    if (context.customer.loyaltyLevel !== 'Standard') score += 0.05; // Loyalty customer
  }
  
  // Knowledge base match
  const messageWords = userMessage.toLowerCase().split(' ');
  const knowledgeMatch = context.knowledgeBase.some(kb => 
    messageWords.some(word => kb.content.toLowerCase().includes(word))
  );
  if (knowledgeMatch) score += 0.2;
  
  // FAQ match
  const faqMatch = context.store?.faqs?.some((faq: any) => 
    messageWords.some(word => 
      faq.question.toLowerCase().includes(word) || 
      faq.answer.toLowerCase().includes(word)
    )
  );
  if (faqMatch) score += 0.15;
  
  // Response quality indicators
  if (aiMessage.content?.length > 100) score += 0.1; // Detailed response
  if (aiMessage.content?.includes('€') || aiMessage.content?.includes('order')) score += 0.05; // Specific info
  
  // Function call success
  if (aiMessage.function_call) {
    score += 0.2;
    // Extra boost for order/product functions
    if (['order_lookup', 'product_search'].includes(aiMessage.function_call.name)) {
      score += 0.1;
    }
  }
  
  // Conversation context
  if (context.conversation.length > 2) score += 0.05; // Ongoing conversation
  
  return Math.min(score, 1.0);
}

function checkEscalation(metadata: any, message: string): boolean {
  // Auto escalate if AI explicitly requested it
  if (metadata.shouldEscalate) return true;
  
  // Low confidence score threshold (adjusted for enhanced scoring)
  if (metadata.confidenceScore < 0.5) return true;
  
  // Enhanced frustration and escalation indicators
  const messageLower = message.toLowerCase();
  
  // Direct escalation requests
  const escalationKeywords = ['manager', 'supervisor', 'human', 'person', 'speak to someone', 'real person'];
  if (escalationKeywords.some(keyword => messageLower.includes(keyword))) return true;
  
  // Frustration indicators
  const frustrationKeywords = [
    'angry', 'frustrated', 'terrible', 'awful', 'horrible', 'worst',
    'complain', 'complaint', 'disappointed', 'unacceptable', 'ridiculous'
  ];
  if (frustrationKeywords.some(keyword => messageLower.includes(keyword))) return true;
  
  // Issue escalation triggers
  const issueKeywords = [
    'not working', 'broken', 'defective', 'damaged', 'wrong item', 'missing',
    'never received', 'charged twice', 'billing error', 'refund', 'cancel order'
  ];
  if (issueKeywords.some(keyword => messageLower.includes(keyword))) return true;
  
  // Repeated queries (if this is a follow-up to unresolved issue)
  const repeatIndicators = ['still', 'again', 'told you', 'already said', 'keep telling'];
  if (repeatIndicators.some(keyword => messageLower.includes(keyword))) return true;
  
  // Urgency indicators
  const urgencyKeywords = ['urgent', 'asap', 'immediately', 'emergency', 'critical'];
  if (urgencyKeywords.some(keyword => messageLower.includes(keyword))) return true;
  
  return false;
}

async function saveMessage(sessionId: string, messageType: string, content: string, metadata?: any) {
  const { error } = await supabase
    .from('chatbot_conversations')
    .insert({
      session_id: sessionId,
      message_type: messageType,
      content,
      ai_metadata: metadata || {}
    });

  if (error) {
    console.error('Failed to save message:', error);
  }
}

async function escalateToAgent(sessionId: string, reason: string) {
  // Update session status
  const { error } = await supabase
    .from('chatbot_sessions')
    .update({ 
      status: 'escalated',
      ai_context: { escalationReason: reason, escalatedAt: new Date().toISOString() }
    })
    .eq('session_token', sessionId);

  if (error) {
    console.error('Failed to escalate session:', error);
  }
}

serve(handler);