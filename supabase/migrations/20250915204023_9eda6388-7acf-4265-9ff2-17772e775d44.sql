-- Chatwoot Multi-Store Integration Database Schema

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
  UNIQUE(organization_id, user_id) WHERE user_id IS NOT NULL,
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
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_chatwoot_accounts_org ON chatwoot_accounts(organization_id);
CREATE INDEX idx_chatwoot_accounts_status ON chatwoot_accounts(account_status) WHERE account_status = 'active';

CREATE INDEX idx_chatwoot_contacts_org ON chatwoot_contacts(organization_id);
CREATE INDEX idx_chatwoot_contacts_user ON chatwoot_contacts(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_chatwoot_contacts_email ON chatwoot_contacts(email) WHERE email IS NOT NULL;
CREATE INDEX idx_chatwoot_contacts_sync ON chatwoot_contacts(last_synced_at DESC);

CREATE INDEX idx_chatwoot_conversations_org ON chatwoot_conversations(organization_id);
CREATE INDEX idx_chatwoot_conversations_status ON chatwoot_conversations(status);
CREATE INDEX idx_chatwoot_conversations_assignee ON chatwoot_conversations(assignee_id) WHERE assignee_id IS NOT NULL;
CREATE INDEX idx_chatwoot_conversations_activity ON chatwoot_conversations(last_activity_at DESC);

CREATE INDEX idx_chatwoot_widget_events_org_time ON chatwoot_widget_events(organization_id, created_at DESC);
CREATE INDEX idx_chatwoot_widget_events_type_time ON chatwoot_widget_events(event_type, created_at DESC);

-- RLS Policies
ALTER TABLE chatwoot_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatwoot_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatwoot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatwoot_widget_events ENABLE ROW LEVEL SECURITY;

-- Chatwoot accounts policies
CREATE POLICY "Users can manage Chatwoot accounts in their organizations" 
ON chatwoot_accounts FOR ALL 
USING (get_user_role_in_organization(organization_id) = ANY(ARRAY['owner', 'admin', 'manager']));

-- Chatwoot contacts policies  
CREATE POLICY "Users can manage contacts in their organizations"
ON chatwoot_contacts FOR ALL
USING (get_user_role_in_organization(organization_id) = ANY(ARRAY['owner', 'admin', 'manager', 'staff']));

CREATE POLICY "Users can view their own contact records"
ON chatwoot_contacts FOR SELECT
USING (user_id = auth.uid());

-- Chatwoot conversations policies
CREATE POLICY "Users can manage conversations in their organizations"
ON chatwoot_conversations FOR ALL  
USING (get_user_role_in_organization(organization_id) = ANY(ARRAY['owner', 'admin', 'manager', 'staff']));

-- Widget events policies
CREATE POLICY "System can insert widget events"
ON chatwoot_widget_events FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view widget events from their organizations" 
ON chatwoot_widget_events FOR SELECT
USING (get_user_role_in_organization(organization_id) = ANY(ARRAY['owner', 'admin', 'manager']));

-- Triggers for updated_at timestamps
CREATE TRIGGER update_chatwoot_accounts_updated_at
  BEFORE UPDATE ON chatwoot_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chatwoot_contacts_updated_at
  BEFORE UPDATE ON chatwoot_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chatwoot_conversations_updated_at
  BEFORE UPDATE ON chatwoot_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();