# Technical Specifications - Chatwoot Multi-Store Integration

## System Requirements

### Chatwoot Server Requirements
```yaml
Production Environment:
  CPU: 4 cores minimum (8 cores recommended)
  RAM: 8GB minimum (16GB recommended)  
  Storage: 100GB SSD minimum
  Network: 1Gbps connection
  OS: Ubuntu 20.04 LTS or newer

Development Environment:
  CPU: 2 cores minimum
  RAM: 4GB minimum
  Storage: 50GB SSD
  Network: 100Mbps connection
```

### Infrastructure Stack
```yaml
Core Services:
  - Chatwoot: v3.0+ (Ruby on Rails + Vue.js)
  - PostgreSQL: v13+ (primary database)
  - Redis: v6.0+ (caching, WebSocket, queues)
  - Nginx: v1.20+ (reverse proxy, SSL termination)
  - Docker: v20.10+ (containerization)
  - Docker Compose: v2.0+ (orchestration)

Supporting Services:
  - Let's Encrypt: SSL certificate automation
  - Cloudflare: CDN and DDoS protection
  - Prometheus: System monitoring
  - Grafana: Metrics visualization
  - Sentry: Error tracking and alerting
```

## API Specifications

### 1. Chatwoot Platform API Integration

#### Account Creation
```typescript
interface CreateAccountRequest {
  account_name: string;          // "aurelio-living-amsterdam"
  email: string;                 // "support@amsterdam.aurelioliving.nl"
  locale?: string;               // "nl" | "en" | "de"
  domain?: string;               // "amsterdam.aurelioliving.nl"
  support_email?: string;        // "help@amsterdam.aurelioliving.nl"
  timezone?: string;             // "Europe/Amsterdam"
}

interface CreateAccountResponse {
  id: number;                    // Chatwoot account ID
  name: string;                  // Account name
  status: 'active' | 'suspended';
  created_at: string;            // ISO timestamp
  updated_at: string;            // ISO timestamp
}
```

#### Token Generation
```typescript
interface GenerateTokenRequest {
  account_id: number;
  agent_email: string;
  role: 'administrator' | 'agent';
}

interface GenerateTokenResponse {
  access_token: string;          // API access token for this account
  website_token: string;         // Widget token for frontend
  expires_at: string;            // Token expiration (optional)
}
```

### 2. Chatwoot Application API Integration

#### Contact Management
```typescript
interface CreateContactRequest {
  name: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  custom_attributes: {
    customer_tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
    order_count: number;
    total_spent: string;         // "€2,450.00"
    last_order_date: string;     // "2024-01-15"
    preferred_language: string;  // "nl"
    store_id: string;            // Organization UUID
    user_id?: string;            // Auth user UUID (if logged in)
    registration_date: string;   // "2023-06-10"
    marketing_consent: boolean;
    support_priority: 'low' | 'medium' | 'high' | 'urgent';
  };
}

interface UpdateContactRequest {
  custom_attributes: {
    // Real-time order updates
    current_cart_value?: string;     // "€125.50" 
    current_cart_items?: number;    // 3
    last_page_visited?: string;     // "/products/bed-luxury-king"
    session_duration?: number;      // 1800 (seconds)
    
    // Purchase behavior
    favorite_categories?: string[]; // ["beds", "storage"]
    purchase_frequency?: string;    // "monthly" | "quarterly" | "yearly"
    average_order_value?: string;   // "€450.00"
    
    // Support history
    previous_tickets?: number;      // 2
    satisfaction_score?: number;    // 4.5 (out of 5)
    escalation_history?: boolean;   // false
  };
}
```

#### Conversation Management
```typescript
interface ConversationResponse {
  id: number;
  messages: Message[];
  status: 'open' | 'resolved' | 'pending';
  assignee: Agent | null;
  contact: Contact;
  meta: {
    sender: Contact;
    assignee: Agent;
    team: Team;
    hmac_verified: boolean;
  };
  custom_attributes: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: number;
  content: string;
  message_type: 'incoming' | 'outgoing' | 'activity';
  content_type: 'text' | 'input_email' | 'cards' | 'form';
  sender: {
    id: number;
    name: string;
    type: 'contact' | 'agent';
  };
  created_at: string;
  attachments?: Attachment[];
}
```

### 3. Widget SDK Configuration

#### Dynamic Widget Setup
```typescript
interface ChatwootWidgetConfig {
  websiteToken: string;          // Store-specific token
  baseUrl: string;               // "https://chatwoot.aurelioliving.nl"
  locale: 'nl' | 'en' | 'de';    // Store language
  type: 'standard' | 'expanded_bubble';
  launcherTitle: string;         // "Chat met Amsterdam Store"
  position: 'left' | 'right';
  hideMessageBubble?: boolean;
  showPopoutButton?: boolean;
  popoutWindowUrl?: string;
  
  // Custom styling
  darkMode?: 'auto' | 'light' | 'dark';
  widgetStyle?: {
    primaryColor: string;        // Store brand color
    fontFamily: string;          // Store font
    borderRadius: string;        // "8px"
  };
}

interface CustomerIdentification {
  identifier: string;            // User ID or email
  name: string;
  email: string;
  avatar_url?: string;
  custom_attributes: {
    customer_tier: string;
    total_orders: number;
    store_name: string;
    registration_date: string;
    preferred_language: string;
  };
}
```

## Database Schema Specifications

### Chatwoot Integration Tables

```sql
-- Store to Chatwoot account mapping
CREATE TABLE public.chatwoot_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Chatwoot account details
  chatwoot_account_id integer NOT NULL UNIQUE,
  account_name text NOT NULL,
  account_status text DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'deleted')),
  
  -- API credentials
  api_access_token text NOT NULL,
  website_token text NOT NULL,
  
  -- Configuration
  locale text DEFAULT 'nl' CHECK (locale IN ('nl', 'en', 'de')),
  timezone text DEFAULT 'Europe/Amsterdam',
  support_email text,
  
  -- Tracking
  last_sync_at timestamptz,
  sync_status text DEFAULT 'active' CHECK (sync_status IN ('active', 'syncing', 'error')),
  sync_error text,
  
  -- Audit
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  
  -- Constraints
  UNIQUE(organization_id),
  UNIQUE(chatwoot_account_id)
);

-- Customer to Chatwoot contact mapping
CREATE TABLE public.chatwoot_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Customer identification
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text,
  phone text,
  
  -- Chatwoot mapping
  chatwoot_contact_id integer NOT NULL,
  chatwoot_account_id integer NOT NULL,
  
  -- Sync tracking
  last_synced_at timestamptz DEFAULT now(),
  sync_status text DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'error')),
  sync_error text,
  
  -- Cached attributes (for performance)
  cached_attributes jsonb DEFAULT '{}',
  
  -- Audit
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Constraints
  UNIQUE(chatwoot_contact_id, chatwoot_account_id),
  UNIQUE(organization_id, user_id),
  UNIQUE(organization_id, email) WHERE email IS NOT NULL
);

-- Conversation tracking and analytics
CREATE TABLE public.chatwoot_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Chatwoot conversation details
  chatwoot_conversation_id integer NOT NULL,
  chatwoot_contact_id integer NOT NULL,
  chatwoot_account_id integer NOT NULL,
  
  -- Conversation metadata
  status text DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'pending', 'snoozed')),
  assignee_id integer,
  assignee_name text,
  inbox_id integer,
  inbox_name text,
  
  -- Customer context
  customer_tier text,
  customer_value numeric(10,2),
  order_count integer DEFAULT 0,
  
  -- Conversation metrics
  first_response_time interval,
  resolution_time interval,
  message_count integer DEFAULT 0,
  satisfaction_rating integer CHECK (satisfaction_rating BETWEEN 1 AND 5),
  
  -- Timestamps
  conversation_started_at timestamptz,
  conversation_resolved_at timestamptz,
  last_activity_at timestamptz,
  
  -- Audit
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Constraints
  UNIQUE(chatwoot_conversation_id, chatwoot_account_id)
);

-- Widget analytics and performance tracking
CREATE TABLE public.chatwoot_widget_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Event details
  event_type text NOT NULL CHECK (event_type IN ('widget_loaded', 'widget_opened', 'message_sent', 'conversation_started')),
  session_id text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Context
  page_url text,
  user_agent text,
  ip_address inet,
  referrer text,
  
  -- Performance metrics
  load_time_ms integer,
  widget_version text,
  
  -- Event data
  event_data jsonb DEFAULT '{}',
  
  -- Timestamp
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- Indexes for analytics
  INDEX (organization_id, created_at),
  INDEX (event_type, created_at),
  INDEX (user_id, created_at) WHERE user_id IS NOT NULL
);
```

### Indexes for Performance
```sql
-- Chatwoot accounts indexes
CREATE INDEX idx_chatwoot_accounts_org ON chatwoot_accounts(organization_id);
CREATE INDEX idx_chatwoot_accounts_status ON chatwoot_accounts(account_status) WHERE account_status = 'active';

-- Chatwoot contacts indexes  
CREATE INDEX idx_chatwoot_contacts_org ON chatwoot_contacts(organization_id);
CREATE INDEX idx_chatwoot_contacts_user ON chatwoot_contacts(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_chatwoot_contacts_email ON chatwoot_contacts(email) WHERE email IS NOT NULL;
CREATE INDEX idx_chatwoot_contacts_sync ON chatwoot_contacts(last_synced_at DESC);

-- Chatwoot conversations indexes
CREATE INDEX idx_chatwoot_conversations_org ON chatwoot_conversations(organization_id);
CREATE INDEX idx_chatwoot_conversations_status ON chatwoot_conversations(status);
CREATE INDEX idx_chatwoot_conversations_assignee ON chatwoot_conversations(assignee_id) WHERE assignee_id IS NOT NULL;
CREATE INDEX idx_chatwoot_conversations_activity ON chatwoot_conversations(last_activity_at DESC);

-- Widget events indexes (for analytics)
CREATE INDEX idx_chatwoot_widget_events_org_time ON chatwoot_widget_events(organization_id, created_at DESC);
CREATE INDEX idx_chatwoot_widget_events_type_time ON chatwoot_widget_events(event_type, created_at DESC);
```

### RLS Policies
```sql
-- Chatwoot accounts policies
ALTER TABLE chatwoot_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage Chatwoot accounts in their organizations" 
ON chatwoot_accounts FOR ALL 
USING (get_user_role_in_organization(organization_id) = ANY(ARRAY['owner', 'admin', 'manager']));

-- Chatwoot contacts policies  
ALTER TABLE chatwoot_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage contacts in their organizations"
ON chatwoot_contacts FOR ALL
USING (get_user_role_in_organization(organization_id) = ANY(ARRAY['owner', 'admin', 'manager', 'staff']));

CREATE POLICY "Users can view their own contact records"
ON chatwoot_contacts FOR SELECT
USING (user_id = auth.uid());

-- Chatwoot conversations policies
ALTER TABLE chatwoot_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage conversations in their organizations"
ON chatwoot_conversations FOR ALL  
USING (get_user_role_in_organization(organization_id) = ANY(ARRAY['owner', 'admin', 'manager', 'staff']));

-- Widget events policies
ALTER TABLE chatwoot_widget_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can insert widget events"
ON chatwoot_widget_events FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view widget events from their organizations" 
ON chatwoot_widget_events FOR SELECT
USING (get_user_role_in_organization(organization_id) = ANY(ARRAY['owner', 'admin', 'manager']));
```

## Security Specifications

### Authentication & Authorization
```yaml
Chatwoot Instance:
  - Admin users: Platform administrators only
  - Agent access: Via API token authentication
  - Customer access: Via widget SDK (no direct login)
  - API access: Bearer token authentication

Platform Integration:
  - API tokens: Scoped per Chatwoot account
  - Widget tokens: Domain-restricted
  - Webhook authentication: HMAC signature verification
  - Database access: RLS policies enforced
```

### Data Privacy & GDPR Compliance
```yaml
Customer Data:
  - Consent tracking: Explicit opt-in for chat history
  - Data portability: Export via Chatwoot API
  - Right to deletion: Automated cleanup workflows
  - Data minimization: Only necessary attributes synced

Retention Policies:
  - Chat history: 2 years (configurable per store)
  - Customer attributes: Linked to customer account lifecycle
  - Analytics data: Anonymized after 1 year
  - Logs: 90 days retention for debugging
```

### Infrastructure Security
```yaml
Network Security:
  - SSL/TLS: v1.3 minimum for all connections
  - Firewall: Restricted ports and IP ranges
  - VPN: Required for admin access
  - DDoS protection: Cloudflare integration

Application Security:
  - Input validation: All API endpoints
  - SQL injection: Parameterized queries only
  - XSS protection: Content Security Policy
  - CSRF protection: Token validation

Monitoring & Alerting:
  - Failed authentication attempts
  - Unusual API usage patterns
  - Data export requests
  - System resource anomalies
```