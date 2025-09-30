-- =====================================================
-- PLATFORM ADMIN SYSTEM
-- Super Admin & Platform Management
-- =====================================================

-- Platform Admin Roles (in Central Database)
CREATE TABLE IF NOT EXISTS public.platform_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Role levels
  role TEXT NOT NULL CHECK (role IN (
    'super_admin',     -- Full platform access
    'admin',           -- Platform management
    'support',         -- Customer support
    'analyst',         -- Read-only analytics
    'developer'        -- Technical access
  )),
  
  -- Permissions
  permissions JSONB NOT NULL DEFAULT '{
    "manage_organizations": false,
    "manage_users": false,
    "view_analytics": false,
    "manage_billing": false,
    "manage_infrastructure": false,
    "access_support_tools": false,
    "modify_platform_settings": false,
    "view_all_data": false
  }',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, role)
);

-- Platform Activity Logs (Audit Trail)
CREATE TABLE IF NOT EXISTS public.platform_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Actor
  user_id UUID REFERENCES auth.users(id),
  platform_admin_id UUID REFERENCES public.platform_admins(id),
  
  -- Action
  action_type TEXT NOT NULL,
  action_category TEXT CHECK (action_category IN (
    'organization_management',
    'user_management',
    'billing',
    'infrastructure',
    'security',
    'support',
    'system'
  )),
  
  -- Details
  description TEXT NOT NULL,
  target_organization_id UUID REFERENCES public.organizations(id),
  target_user_id UUID REFERENCES auth.users(id),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  
  -- Severity for security events
  severity TEXT DEFAULT 'info' CHECK (severity IN (
    'info', 'warning', 'error', 'critical'
  )),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform Settings (Global Configuration)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  setting_type TEXT CHECK (setting_type IN (
    'feature_flag',
    'configuration',
    'limits',
    'security',
    'billing'
  )),
  
  description TEXT,
  is_public BOOLEAN DEFAULT false, -- Can be read by non-admins
  
  last_modified_by UUID REFERENCES public.platform_admins(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform Analytics (Aggregated Metrics)
CREATE TABLE IF NOT EXISTS public.platform_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Time period
  date DATE NOT NULL,
  metric_type TEXT NOT NULL,
  
  -- Metrics
  total_organizations INTEGER DEFAULT 0,
  active_organizations INTEGER DEFAULT 0,
  new_organizations INTEGER DEFAULT 0,
  
  total_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  
  total_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  platform_revenue DECIMAL(12,2) DEFAULT 0,
  
  total_products INTEGER DEFAULT 0,
  total_customers INTEGER DEFAULT 0,
  
  -- System metrics
  total_databases INTEGER DEFAULT 0,
  total_storage_gb DECIMAL(10,2) DEFAULT 0,
  total_bandwidth_gb DECIMAL(10,2) DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(date, metric_type)
);

-- Organization Alerts & Notifications
CREATE TABLE IF NOT EXISTS public.organization_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Alert details
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'billing_issue',
    'subscription_expiring',
    'database_error',
    'high_resource_usage',
    'security_issue',
    'compliance_issue',
    'performance_degradation'
  )),
  
  severity TEXT NOT NULL CHECK (severity IN (
    'info', 'warning', 'error', 'critical'
  )),
  
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN (
    'open', 'acknowledged', 'investigating', 'resolved', 'ignored'
  )),
  
  -- Resolution
  resolved_by UUID REFERENCES public.platform_admins(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform Support Tickets
CREATE TABLE IF NOT EXISTS public.platform_support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Requester
  organization_id UUID REFERENCES public.organizations(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Ticket details
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN (
    'low', 'medium', 'high', 'urgent'
  )),
  
  category TEXT CHECK (category IN (
    'billing',
    'technical',
    'feature_request',
    'bug_report',
    'account',
    'general'
  )),
  
  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN (
    'open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'
  )),
  
  -- Assignment
  assigned_to UUID REFERENCES public.platform_admins(id),
  
  -- Resolution
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  
  -- Metadata
  attachments JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support Ticket Messages
CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.platform_support_tickets(id) ON DELETE CASCADE,
  
  -- Author
  user_id UUID REFERENCES auth.users(id),
  platform_admin_id UUID REFERENCES public.platform_admins(id),
  is_internal BOOLEAN DEFAULT false, -- Internal notes vs customer-visible
  
  -- Message
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_platform_admins_user ON public.platform_admins(user_id);
CREATE INDEX idx_platform_admins_role ON public.platform_admins(role);
CREATE INDEX idx_platform_admins_active ON public.platform_admins(is_active);

CREATE INDEX idx_platform_activity_logs_user ON public.platform_activity_logs(user_id);
CREATE INDEX idx_platform_activity_logs_admin ON public.platform_activity_logs(platform_admin_id);
CREATE INDEX idx_platform_activity_logs_category ON public.platform_activity_logs(action_category);
CREATE INDEX idx_platform_activity_logs_created ON public.platform_activity_logs(created_at DESC);
CREATE INDEX idx_platform_activity_logs_severity ON public.platform_activity_logs(severity);

CREATE INDEX idx_platform_analytics_date ON public.platform_analytics(date DESC);
CREATE INDEX idx_platform_analytics_type ON public.platform_analytics(metric_type);

CREATE INDEX idx_organization_alerts_org ON public.organization_alerts(organization_id);
CREATE INDEX idx_organization_alerts_status ON public.organization_alerts(status);
CREATE INDEX idx_organization_alerts_severity ON public.organization_alerts(severity);

CREATE INDEX idx_platform_tickets_org ON public.platform_support_tickets(organization_id);
CREATE INDEX idx_platform_tickets_user ON public.platform_support_tickets(user_id);
CREATE INDEX idx_platform_tickets_status ON public.platform_support_tickets(status);
CREATE INDEX idx_platform_tickets_assigned ON public.platform_support_tickets(assigned_to);

CREATE INDEX idx_ticket_messages_ticket ON public.support_ticket_messages(ticket_id);
CREATE INDEX idx_ticket_messages_created ON public.support_ticket_messages(created_at DESC);

-- =====================================================
-- ROW-LEVEL SECURITY
-- =====================================================

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- Super admins can see everything
CREATE POLICY "Super admins have full access to platform_admins"
  ON public.platform_admins FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
    )
  );

-- Platform admins can view activity logs
CREATE POLICY "Platform admins can view activity logs"
  ON public.platform_activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Only super admins can modify platform settings
CREATE POLICY "Super admins can manage platform settings"
  ON public.platform_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
    )
  );

-- Public settings readable by all authenticated users
CREATE POLICY "Public settings readable by authenticated users"
  ON public.platform_settings FOR SELECT
  USING (is_public = true AND auth.uid() IS NOT NULL);

-- Platform admins can view analytics
CREATE POLICY "Platform admins can view analytics"
  ON public.platform_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Organization owners can view their own alerts
CREATE POLICY "Organization owners can view their alerts"
  ON public.organization_alerts FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Users can view their own tickets
CREATE POLICY "Users can view their own support tickets"
  ON public.platform_support_tickets FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Check if user is platform admin
CREATE OR REPLACE FUNCTION public.is_platform_admin(user_uuid UUID, min_role TEXT DEFAULT 'support')
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins
    WHERE user_id = user_uuid
    AND is_active = true
    AND CASE min_role
      WHEN 'super_admin' THEN role = 'super_admin'
      WHEN 'admin' THEN role IN ('super_admin', 'admin')
      WHEN 'support' THEN role IN ('super_admin', 'admin', 'support')
      WHEN 'analyst' THEN role IN ('super_admin', 'admin', 'analyst')
      WHEN 'developer' THEN role IN ('super_admin', 'admin', 'developer')
      ELSE false
    END
  );
$$;

-- Log platform activity
CREATE OR REPLACE FUNCTION public.log_platform_activity(
  _action_type TEXT,
  _action_category TEXT,
  _description TEXT,
  _metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _log_id UUID;
  _admin_id UUID;
BEGIN
  -- Get platform admin ID if user is admin
  SELECT id INTO _admin_id
  FROM public.platform_admins
  WHERE user_id = auth.uid()
  AND is_active = true
  LIMIT 1;
  
  INSERT INTO public.platform_activity_logs (
    user_id,
    platform_admin_id,
    action_type,
    action_category,
    description,
    metadata
  ) VALUES (
    auth.uid(),
    _admin_id,
    _action_type,
    _action_category,
    _description,
    _metadata
  ) RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;

-- =====================================================
-- DEFAULT DATA
-- =====================================================

-- Insert default platform settings
INSERT INTO public.platform_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
  ('max_stores_per_user', '{"value": 5}', 'limits', 'Maximum stores a user can create', true),
  ('trial_period_days', '{"value": 14}', 'configuration', 'Trial period in days', true),
  ('enable_new_signups', '{"value": true}', 'feature_flag', 'Allow new user signups', true),
  ('maintenance_mode', '{"value": false}', 'system', 'Platform maintenance mode', true),
  ('min_password_length', '{"value": 8}', 'security', 'Minimum password length', true)
ON CONFLICT (setting_key) DO NOTHING;

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_platform_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER platform_admins_updated_at
  BEFORE UPDATE ON public.platform_admins
  FOR EACH ROW
  EXECUTE FUNCTION public.update_platform_tables_updated_at();

CREATE TRIGGER platform_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_platform_tables_updated_at();

CREATE TRIGGER organization_alerts_updated_at
  BEFORE UPDATE ON public.organization_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_platform_tables_updated_at();

CREATE TRIGGER platform_tickets_updated_at
  BEFORE UPDATE ON public.platform_support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_platform_tables_updated_at();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.platform_admins IS 'Platform administrators with elevated permissions';
COMMENT ON TABLE public.platform_activity_logs IS 'Audit trail of all platform admin actions';
COMMENT ON TABLE public.platform_settings IS 'Global platform configuration';
COMMENT ON TABLE public.platform_analytics IS 'Aggregated platform metrics';
COMMENT ON TABLE public.organization_alerts IS 'Alerts and notifications for organizations';
COMMENT ON TABLE public.platform_support_tickets IS 'Customer support ticket system';

SELECT 'Platform admin system created successfully' as message;
