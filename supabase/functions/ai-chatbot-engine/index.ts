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
  // Get organization data
  const { data: organization } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .single();

  // Get customer data if authenticated
  let customer = null;
  let orderHistory: any[] = [];
  let currentCart = null;

  if (userId) {
    // Get customer profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get order history
    const { data: orders } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get current cart
    const { data: cart } = await supabase
      .from('shopping_cart')
      .select('*, products(*)')
      .eq('user_id', userId)
      .eq('organization_id', organizationId);

    customer = profile;
    orderHistory = orders || [];
    currentCart = cart;
  }

  // Get conversation history
  const { data: conversations } = await supabase
    .from('chatbot_conversations')
    .select('*')
    .eq('session_id', session.id)
    .order('created_at', { ascending: true })
    .limit(10);

  // Get relevant knowledge base entries
  const { data: knowledgeBase } = await supabase
    .from('ai_knowledge_base')
    .select('*')
    .or(`organization_id.eq.${organizationId},organization_id.is.null`)
    .eq('is_active', true)
    .limit(20);

  return {
    store: organization,
    customer,
    orderHistory,
    currentCart,
    conversation: conversations || [],
    knowledgeBase: knowledgeBase || []
  };
}

async function generateAIResponse(message: string, context: AIContext) {
  const systemPrompt = createSystemPrompt(context);
  
  const functions = [
    {
      name: "order_lookup",
      description: "Look up order information by order number",
      parameters: {
        type: "object",
        properties: {
          orderNumber: { type: "string", description: "Order number to look up" }
        },
        required: ["orderNumber"]
      }
    },
    {
      name: "product_search", 
      description: "Search for products in the store",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Product search query" }
        },
        required: ["query"]
      }
    },
    {
      name: "escalate_to_agent",
      description: "Escalate to human agent when unable to help",
      parameters: {
        type: "object",
        properties: {
          reason: { type: "string", description: "Reason for escalation" }
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
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...context.conversation.map(msg => ({
          role: msg.message_type === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        { role: 'user', content: message }
      ],
      functions,
      function_call: 'auto',
      max_tokens: 500,
      temperature: 0.7
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
    model: 'gpt-4o-mini',
    confidenceScore: calculateConfidenceScore(aiMessage, context)
  };

  // Handle function calls
  if (aiMessage.function_call) {
    const functionResult = await handleFunctionCall(aiMessage.function_call, context);
    content = functionResult.content;
    metadata = { ...metadata, ...functionResult.metadata };
  }

  return { content, metadata };
}

function createSystemPrompt(context: AIContext): string {
  const { store, customer, orderHistory, currentCart } = context;
  
  return `You are a helpful customer service AI for ${store?.name || 'our store'}. 
Always be polite, helpful, and professional in your responses.

Store Information:
- Name: ${store?.name || 'Store'}
- Email: ${store?.email || 'Not available'}
- Phone: ${store?.phone || 'Not available'}
- Currency: ${store?.currency || 'EUR'}

${customer ? `Customer Context:
- Name: ${customer.first_name} ${customer.last_name}
- Email: ${customer.email}
- Order History: ${orderHistory.length} previous orders
- Current Cart: ${currentCart?.length || 0} items` : 'Customer: Not logged in'}

Guidelines:
- Always greet customers warmly
- Provide specific, actionable information
- If asked about orders, use the order_lookup function
- If asked about products, use the product_search function  
- If you cannot help or customer is frustrated, use escalate_to_agent
- Keep responses concise but helpful
- Always maintain a friendly, professional tone`;
}

async function handleFunctionCall(functionCall: any, context: AIContext) {
  const { name, arguments: args } = functionCall;
  const parsedArgs = JSON.parse(args);

  switch (name) {
    case 'order_lookup':
      return await handleOrderLookup(parsedArgs.orderNumber, context);
    case 'product_search':
      return await handleProductSearch(parsedArgs.query, context);
    case 'escalate_to_agent':
      return {
        content: "I'm connecting you with one of our support specialists who will be able to help you better. Please hold on for just a moment.",
        metadata: { 
          escalationReason: parsedArgs.reason,
          shouldEscalate: true
        }
      };
    default:
      return {
        content: "I'm not sure how to help with that. Let me connect you with a human agent.",
        metadata: { escalationReason: 'unknown_function' }
      };
  }
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

async function handleProductSearch(query: string, context: AIContext) {
  const { data: products } = await supabase
    .from('products')
    .select('name, price, description')
    .eq('organization_id', context.store.id)
    .eq('is_active', true)
    .textSearch('name', query)
    .limit(3);

  if (!products || products.length === 0) {
    return {
      content: `I couldn't find any products matching "${query}". You might want to browse our full catalog or try a different search term.`,
      metadata: { productsFound: false }
    };
  }

  const productList = products.map(p => 
    `${p.name} - ${context.store.currency} ${p.price}`
  ).join('\n');

  return {
    content: `Here are some products matching "${query}":

${productList}

Would you like more information about any of these products?`,
    metadata: { productsFound: true, productCount: products.length }
  };
}

function calculateConfidenceScore(aiMessage: any, context: AIContext): number {
  let score = 0.5; // Base score
  
  // Higher confidence if we have customer context
  if (context.customer) score += 0.2;
  
  // Higher confidence if response is longer (more detailed)
  if (aiMessage.content?.length > 50) score += 0.1;
  
  // Higher confidence if function was called successfully
  if (aiMessage.function_call) score += 0.2;
  
  return Math.min(score, 1.0);
}

function checkEscalation(metadata: any, message: string): boolean {
  // Auto escalate if AI explicitly requested it
  if (metadata.shouldEscalate) return true;
  
  // Low confidence score
  if (metadata.confidenceScore < 0.6) return true;
  
  // Frustrated customer indicators
  const frustrationKeywords = ['angry', 'frustrated', 'terrible', 'awful', 'complain', 'manager'];
  if (frustrationKeywords.some(keyword => message.toLowerCase().includes(keyword))) {
    return true;
  }
  
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