-- AI Chatbot Multi-Store Database Schema

-- 1. Chatbot Sessions Table
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

-- 2. Chatbot Conversations Table
CREATE TABLE public.chatbot_conversations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.chatbot_sessions(id),
    message_type TEXT NOT NULL CHECK (message_type IN ('user', 'ai', 'agent', 'system')),
    content TEXT NOT NULL,
    ai_metadata JSONB DEFAULT '{}',
    agent_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. AI Knowledge Base Table
CREATE TABLE public.ai_knowledge_base (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id), -- NULL for global knowledge
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    tags TEXT[] DEFAULT '{}',
    effectiveness_score DECIMAL DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Agent Analytics Table
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

-- 5. Escalation Rules Table
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

-- Performance Indexes
CREATE INDEX idx_chatbot_sessions_org_user ON public.chatbot_sessions(organization_id, user_id);
CREATE INDEX idx_chatbot_conversations_session ON public.chatbot_conversations(session_id, created_at);
CREATE INDEX idx_ai_knowledge_base_org_category ON public.ai_knowledge_base(organization_id, category) WHERE is_active = true;
CREATE INDEX idx_agent_analytics_date_org ON public.agent_analytics(date, organization_id);

-- Enable Row Level Security
ALTER TABLE public.chatbot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalation_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chatbot_sessions
CREATE POLICY "Users can manage their own sessions" 
ON public.chatbot_sessions 
FOR ALL 
USING (
    auth.uid() = user_id OR 
    get_user_role_in_organization(organization_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'staff'::text])
);

-- RLS Policies for chatbot_conversations
CREATE POLICY "Users can view their own conversations" 
ON public.chatbot_conversations 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.chatbot_sessions 
        WHERE chatbot_sessions.id = chatbot_conversations.session_id 
        AND (chatbot_sessions.user_id = auth.uid() OR 
             get_user_role_in_organization(chatbot_sessions.organization_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'staff'::text]))
    )
);

CREATE POLICY "Agents can create conversation messages" 
ON public.chatbot_conversations 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.chatbot_sessions 
        WHERE chatbot_sessions.id = chatbot_conversations.session_id 
        AND (chatbot_sessions.user_id = auth.uid() OR 
             get_user_role_in_organization(chatbot_sessions.organization_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'staff'::text]))
    )
);

-- RLS Policies for ai_knowledge_base
CREATE POLICY "Anyone can view active knowledge base" 
ON public.ai_knowledge_base 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage knowledge base" 
ON public.ai_knowledge_base 
FOR ALL 
USING (
    organization_id IS NULL OR 
    get_user_role_in_organization(organization_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text])
);

-- RLS Policies for agent_analytics
CREATE POLICY "Agents can view their own analytics" 
ON public.agent_analytics 
FOR SELECT 
USING (
    agent_id = auth.uid() OR 
    get_user_role_in_organization(organization_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text])
);

CREATE POLICY "Agents can update their own analytics" 
ON public.agent_analytics 
FOR ALL 
USING (
    agent_id = auth.uid() OR 
    get_user_role_in_organization(organization_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text])
);

-- RLS Policies for escalation_rules
CREATE POLICY "Organization members can view escalation rules" 
ON public.escalation_rules 
FOR SELECT 
USING (get_user_role_in_organization(organization_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'staff'::text]));

CREATE POLICY "Admins can manage escalation rules" 
ON public.escalation_rules 
FOR ALL 
USING (get_user_role_in_organization(organization_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text]));

-- Update triggers for timestamps
CREATE TRIGGER update_chatbot_sessions_updated_at
BEFORE UPDATE ON public.chatbot_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_knowledge_base_updated_at
BEFORE UPDATE ON public.ai_knowledge_base
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_escalation_rules_updated_at
BEFORE UPDATE ON public.escalation_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live chat functionality
ALTER PUBLICATION supabase_realtime ADD TABLE public.chatbot_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chatbot_sessions;