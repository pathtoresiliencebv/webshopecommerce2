# Edge Functions - Chatwoot Multi-Store Integration

## Overview

Deze Edge Functions vormen de backend integratie tussen het Aurelio platform en Chatwoot, en zorgen voor geautomatiseerd account management, real-time data synchronisatie en webhook verwerking.

## Function 1: chatwoot-account-manager

### Purpose
Automatisch aanmaken en beheren van Chatwoot accounts wanneer een nieuwe store wordt gecreëerd.

### Triggers
- Store/Organization creation
- Store settings updates
- Account status changes

### Key Features
```typescript
interface AccountManagerFunction {
  // Account lifecycle management
  createAccount(organizationData: Organization): Promise<ChatwootAccount>;
  updateAccount(accountId: string, updates: Partial<ChatwootAccount>): Promise<void>;
  suspendAccount(accountId: string): Promise<void>;
  deleteAccount(accountId: string): Promise<void>;
  
  // Token management
  regenerateTokens(accountId: string): Promise<{apiToken: string, websiteToken: string}>;
  validateTokens(accountId: string): Promise<boolean>;
  
  // Configuration management
  updateBranding(accountId: string, branding: StoreBranding): Promise<void>;
  setupDefaultInboxes(accountId: string): Promise<Inbox[]>;
}
```

### Implementation Highlights
```typescript
// Automatic account creation on store creation
export async function createChatwootAccount(organizationData: Organization) {
  // 1. Generate unique account name
  const accountName = `aurelio-${organizationData.slug}`;
  
  // 2. Create Chatwoot account via Platform API
  const chatwootAccount = await chatwootPlatformAPI.createAccount({
    account_name: accountName,
    email: organizationData.email || `support@${organizationData.domain}`,
    locale: organizationData.locale || 'nl',
    timezone: organizationData.timezone || 'Europe/Amsterdam'
  });
  
  // 3. Generate API tokens
  const tokens = await chatwootPlatformAPI.generateTokens({
    account_id: chatwootAccount.id,
    agent_email: organizationData.email,
    role: 'administrator'
  });
  
  // 4. Store mapping in database
  const { data, error } = await supabase
    .from('chatwoot_accounts')
    .insert({
      organization_id: organizationData.id,
      chatwoot_account_id: chatwootAccount.id,
      api_access_token: tokens.access_token,
      website_token: tokens.website_token,
      account_status: 'active'
    });
    
  // 5. Setup default inboxes
  await setupDefaultInboxes(chatwootAccount.id, tokens.access_token);
  
  return data;
}
```

## Function 2: chatwoot-contact-sync

### Purpose
Real-time synchronisatie van klantdata tussen het platform en Chatwoot voor complete customer context.

### Triggers
- User registration/profile updates
- Order placement/status changes
- Cart modifications
- Customer tier changes

### Key Features
```typescript
interface ContactSyncFunction {
  // Contact lifecycle
  createContact(userId: string, organizationId: string): Promise<ChatwootContact>;
  updateContact(contactId: string, attributes: CustomerAttributes): Promise<void>;
  mergeContacts(primaryId: string, duplicateId: string): Promise<void>;
  
  // Attribute synchronization
  syncOrderHistory(userId: string): Promise<void>;
  syncCartContents(userId: string): Promise<void>;
  syncCustomerTier(userId: string): Promise<void>;
  
  // Bulk operations
  bulkSyncContacts(organizationId: string): Promise<SyncResult>;
  schedulePeriodicSync(organizationId: string): Promise<void>;
}
```

### Real-time Attribute Updates
```typescript
// Comprehensive customer context synchronization
export async function syncCustomerAttributes(userId: string, organizationId: string) {
  // 1. Fetch customer data from multiple sources
  const [user, orders, cart, profile] = await Promise.all([
    getUserData(userId),
    getOrderHistory(userId, organizationId),
    getCurrentCart(userId, organizationId),
    getCustomerProfile(userId, organizationId)
  ]);
  
  // 2. Calculate derived attributes
  const customerTier = calculateCustomerTier(orders);
  const totalSpent = orders.reduce((sum, order) => sum + order.total_amount, 0);
  const averageOrderValue = totalSpent / orders.length || 0;
  const lastOrderDate = orders[0]?.created_at;
  
  // 3. Build custom attributes object
  const customAttributes = {
    // Basic customer info
    customer_tier: customerTier,
    registration_date: user.created_at,
    preferred_language: profile.language || 'nl',
    
    // Purchase behavior
    order_count: orders.length,
    total_spent: `€${totalSpent.toFixed(2)}`,
    average_order_value: `€${averageOrderValue.toFixed(2)}`,
    last_order_date: lastOrderDate,
    
    // Current session context
    current_cart_value: cart.total ? `€${cart.total.toFixed(2)}` : '€0.00',
    current_cart_items: cart.items?.length || 0,
    cart_products: cart.items?.map(item => item.product_name).join(', ') || '',
    
    // Behavioral insights
    favorite_categories: getFavoriteCategories(orders),
    purchase_frequency: calculatePurchaseFrequency(orders),
    marketing_consent: profile.marketing_consent || false,
    
    // Support context
    support_priority: getSupportPriority(customerTier, totalSpent),
    previous_conversations: await getPreviousConversationCount(userId, organizationId)
  };
  
  // 4. Update Chatwoot contact
  await updateChatwootContact(userId, organizationId, customAttributes);
}
```

## Function 3: chatwoot-webhook-handler

### Purpose
Verwerking van webhooks van Chatwoot voor bidirectionele data synchronisatie en analytics.

### Webhook Events
- conversation_created
- conversation_status_changed
- message_created
- conversation_resolved
- agent_assigned

### Key Features
```typescript
interface WebhookHandlerFunction {
  // Event processing
  processConversationEvent(event: ConversationEvent): Promise<void>;
  processMessageEvent(event: MessageEvent): Promise<void>;
  processAgentEvent(event: AgentEvent): Promise<void>;
  
  // Analytics tracking
  trackConversationMetrics(conversationId: string): Promise<void>;
  updateCustomerSatisfaction(conversationId: string, rating: number): Promise<void>;
  
  // Business logic triggers
  triggerFollowUpWorkflows(conversationId: string): Promise<void>;
  notifyStoreManagers(event: CriticalEvent): Promise<void>;
}
```

### Webhook Processing Pipeline
```typescript
// Comprehensive webhook event processing
export async function processWebhookEvent(webhookData: any) {
  const { event, data } = webhookData;
  
  switch (event) {
    case 'conversation_created':
      await handleConversationCreated(data);
      break;
      
    case 'message_created':
      await handleMessageCreated(data);
      break;
      
    case 'conversation_resolved':
      await handleConversationResolved(data);
      break;
      
    case 'conversation_status_changed':
      await handleStatusChanged(data);
      break;
  }
}

async function handleConversationCreated(data: ConversationData) {
  // 1. Store conversation in local database
  await supabase.from('chatwoot_conversations').insert({
    organization_id: await getOrganizationFromAccount(data.account_id),
    chatwoot_conversation_id: data.id,
    chatwoot_contact_id: data.meta.sender.id,
    chatwoot_account_id: data.account_id,
    status: data.status,
    conversation_started_at: data.created_at
  });
  
  // 2. Trigger customer context enrichment
  await enrichCustomerContext(data.meta.sender.id, data.account_id);
  
  // 3. Apply auto-assignment rules
  await applyAutoAssignmentRules(data.id, data.account_id);
  
  // 4. Send notifications if needed
  if (isHighPriorityCustomer(data.meta.sender)) {
    await notifyManagers(data);
  }
}
```

## Function 4: chatwoot-widget-tracker

### Purpose
Tracking van widget performance en customer journey analytics.

### Key Features
```typescript
interface WidgetTrackerFunction {
  // Widget performance
  trackWidgetLoad(organizationId: string, loadTime: number): Promise<void>;
  trackWidgetInteraction(event: WidgetEvent): Promise<void>;
  
  // Customer journey
  trackPageVisit(userId: string, pageUrl: string): Promise<void>;
  trackProductInterest(userId: string, productId: string): Promise<void>;
  
  // Conversion analytics
  trackChatToSale(conversationId: string, orderId: string): Promise<void>;
  calculateConversionRates(organizationId: string): Promise<ConversionMetrics>;
}
```

## Function 5: chatwoot-customer-context-api

### Purpose
Dedicated API endpoint voor real-time customer context display in agent dashboard.

### Key Features
```typescript
interface CustomerContextAPI {
  // Context retrieval
  getCustomerContext(contactId: string, accountId: string): Promise<CustomerContext>;
  getOrderHistory(contactId: string, limit?: number): Promise<Order[]>;
  getCurrentCart(contactId: string): Promise<CartContents>;
  
  // Insights
  getCustomerInsights(contactId: string): Promise<CustomerInsights>;
  getRecommendations(contactId: string): Promise<ProductRecommendation[]>;
  
  // Actions
  createDiscountCode(contactId: string, discount: DiscountConfig): Promise<string>;
  escalateToManager(conversationId: string, reason: string): Promise<void>;
}
```

### Customer Context Response
```typescript
interface CustomerContext {
  // Basic info
  customer: {
    id: string;
    name: string;
    email: string;
    tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
    registration_date: string;
    total_spent: string;
    order_count: number;
  };
  
  // Recent activity
  recent_orders: Order[];
  current_cart: {
    items: CartItem[];
    total: string;
    updated_at: string;
  };
  
  // Behavioral insights
  favorite_categories: string[];
  purchase_frequency: string;
  average_order_value: string;
  seasonal_patterns: SeasonalPattern[];
  
  // Support history
  previous_conversations: number;
  satisfaction_score: number;
  escalation_history: boolean;
  
  // Current session
  current_page: string;
  session_duration: number;
  pages_visited: string[];
  products_viewed: ProductView[];
}
```

## Security & Error Handling

### Authentication
```typescript
// API token validation for all functions
async function validateApiToken(token: string, accountId: string): Promise<boolean> {
  const { data } = await supabase
    .from('chatwoot_accounts')
    .select('api_access_token')
    .eq('chatwoot_account_id', accountId)
    .single();
    
  return data?.api_access_token === token;
}
```

### Error Handling & Retry Logic
```typescript
// Robust error handling with exponential backoff
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  backoffMs: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      const delay = backoffMs * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
}
```

### Rate Limiting & Caching
```typescript
// Redis-based rate limiting and caching
const RATE_LIMITS = {
  account_creation: { requests: 10, window: 3600 }, // 10 per hour
  contact_sync: { requests: 1000, window: 60 },     // 1000 per minute
  webhook_processing: { requests: 5000, window: 60 } // 5000 per minute
};

async function checkRateLimit(key: string, limit: RateLimit): Promise<boolean> {
  // Implementation using Redis or similar
  const currentCount = await redis.get(`rate_limit:${key}`);
  return (currentCount || 0) < limit.requests;
}
```

## Monitoring & Observability

### Metrics Collection
```typescript
// Comprehensive metrics for monitoring
interface EdgeFunctionMetrics {
  // Performance metrics
  execution_time: number;
  memory_usage: number;
  api_response_time: number;
  
  // Business metrics
  accounts_created: number;
  contacts_synced: number;
  conversations_processed: number;
  
  // Error metrics
  error_rate: number;
  retry_count: number;
  timeout_count: number;
}
```

### Logging Strategy
```typescript
// Structured logging for debugging and analytics
function logEvent(level: 'info' | 'warn' | 'error', event: string, data: any) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    data,
    function_name: 'chatwoot-account-manager',
    request_id: getRequestId()
  }));
}
```

## Testing Strategy

### Unit Tests
- Individual function logic
- Error handling scenarios
- Rate limiting behavior
- Data validation

### Integration Tests
- Chatwoot API connectivity
- Database operations
- Webhook processing
- End-to-end workflows

### Performance Tests
- Load testing with simulated traffic
- Memory usage under stress
- API response time benchmarks
- Concurrent request handling