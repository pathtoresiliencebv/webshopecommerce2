# AI Chatbot Database Schema

## New Tables Required

### 1. chatbot_sessions
```sql
CREATE TABLE public.chatbot_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    user_id UUID REFERENCES auth.users(id),
    session_token TEXT NOT NULL UNIQUE,
    customer_context JSONB DEFAULT '{}',
    ai_context JSONB DEFAULT '{}',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'escalated', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

### 2. chatbot_conversations
```sql
CREATE TABLE public.chatbot_conversations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.chatbot_sessions(id),
    message_type TEXT NOT NULL CHECK (message_type IN ('user', 'ai', 'agent', 'system')),
    content TEXT NOT NULL,
    ai_metadata JSONB DEFAULT '{}',
    agent_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

### 3. ai_knowledge_base
```sql
CREATE TABLE public.ai_knowledge_base (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id), -- NULL for global knowledge
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    tags TEXT[] DEFAULT '{}',
    embeddings VECTOR(1536), -- OpenAI embedding dimensions
    effectiveness_score DECIMAL DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

### 4. agent_analytics
```sql
CREATE TABLE public.agent_analytics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES auth.users(id),
    organization_id UUID REFERENCES public.organizations(id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    conversations_handled INTEGER DEFAULT 0,
    avg_resolution_time_minutes DECIMAL DEFAULT 0,
    customer_satisfaction_score DECIMAL DEFAULT 0,
    ai_escalations_received INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

### 5. escalation_rules
```sql
CREATE TABLE public.escalation_rules (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    rule_name TEXT NOT NULL,
    trigger_keywords TEXT[] DEFAULT '{}',
    trigger_conditions JSONB DEFAULT '{}',
    agent_assignment_logic JSONB DEFAULT '{}',
    priority_level INTEGER DEFAULT 1 CHECK (priority_level BETWEEN 1 AND 5),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

## Indexes for Performance
```sql
-- Session lookup by organization and user
CREATE INDEX idx_chatbot_sessions_org_user ON public.chatbot_sessions(organization_id, user_id);

-- Conversation lookup by session
CREATE INDEX idx_chatbot_conversations_session ON public.chatbot_conversations(session_id, created_at);

-- Knowledge base search and filtering
CREATE INDEX idx_ai_knowledge_base_org_category ON public.ai_knowledge_base(organization_id, category) WHERE is_active = true;

-- Agent analytics by date and organization
CREATE INDEX idx_agent_analytics_date_org ON public.agent_analytics(date, organization_id);
```

## Row Level Security (RLS) Policies

### chatbot_sessions
- Users can manage their own sessions
- Agents can view sessions for their organizations

### chatbot_conversations  
- Users can view their own conversation history
- Agents can view conversations for their organizations

### ai_knowledge_base
- Public knowledge (organization_id IS NULL) readable by all
- Organization-specific knowledge readable by organization members
- Only admins can create/update knowledge entries

### agent_analytics
- Only agents can view their own analytics
- Organization admins can view all agent analytics for their organization

### escalation_rules
- Only organization admins can manage escalation rules