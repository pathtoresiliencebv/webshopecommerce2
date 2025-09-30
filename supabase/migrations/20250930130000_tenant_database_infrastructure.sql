-- =====================================================
-- MULTI-TENANT DATABASE INFRASTRUCTURE
-- Phase 1: Database-per-Tenant Architecture (Neon)
-- =====================================================

-- Central Registry: All Tenant Databases
CREATE TABLE IF NOT EXISTS public.tenant_databases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Neon Database Details
  neon_project_id TEXT NOT NULL,
  neon_branch_id TEXT NOT NULL UNIQUE,
  neon_endpoint_id TEXT NOT NULL,
  neon_branch_name TEXT NOT NULL,
  
  -- Connection Info (ENCRYPTED!)
  connection_string_encrypted TEXT NOT NULL,
  database_host TEXT NOT NULL,
  database_name TEXT NOT NULL,
  database_port INTEGER DEFAULT 5432,
  
  -- Region & Config
  region TEXT NOT NULL DEFAULT 'eu-central-1',
  autoscaling_min_cu DECIMAL(3,2) DEFAULT 0.25,
  autoscaling_max_cu DECIMAL(3,2) DEFAULT 1.0,
  suspend_timeout_seconds INTEGER DEFAULT 300,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'provisioning' CHECK (status IN (
    'provisioning', 'active', 'suspended', 'maintenance', 'failed', 'deleted'
  )),
  
  -- Metrics
  database_size_mb INTEGER DEFAULT 0,
  active_connections INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  last_health_check_at TIMESTAMPTZ,
  
  -- Error Tracking
  provisioning_error TEXT,
  last_error TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(organization_id) -- One database per organization
);

-- Migration History per Tenant Database
CREATE TABLE IF NOT EXISTS public.tenant_migrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_database_id UUID NOT NULL REFERENCES public.tenant_databases(id) ON DELETE CASCADE,
  
  -- Migration Details
  migration_name TEXT NOT NULL,
  migration_version TEXT NOT NULL,
  migration_hash TEXT, -- For verification
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'running', 'success', 'failed', 'rolled_back'
  )),
  
  -- Execution Details
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- Error Handling
  error_message TEXT,
  error_stack TEXT,
  rollback_executed BOOLEAN DEFAULT false,
  
  -- Metadata
  applied_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(tenant_database_id, migration_version)
);

-- Connection Pool Management per Tenant
CREATE TABLE IF NOT EXISTS public.tenant_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_database_id UUID NOT NULL REFERENCES public.tenant_databases(id) ON DELETE CASCADE,
  
  -- Connection Details
  connection_id TEXT NOT NULL UNIQUE,
  process_id INTEGER,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('active', 'idle', 'closed', 'error')),
  
  -- Metrics
  queries_executed INTEGER DEFAULT 0,
  last_query_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- Tenant Database Health Monitoring
CREATE TABLE IF NOT EXISTS public.tenant_database_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_database_id UUID NOT NULL REFERENCES public.tenant_databases(id) ON DELETE CASCADE,
  
  -- Health Metrics
  is_healthy BOOLEAN DEFAULT true,
  response_time_ms INTEGER,
  cpu_usage_percent DECIMAL(5,2),
  memory_usage_mb INTEGER,
  storage_used_mb INTEGER,
  
  -- Alerts
  has_errors BOOLEAN DEFAULT false,
  error_count INTEGER DEFAULT 0,
  warning_count INTEGER DEFAULT 0,
  
  -- Timestamp
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_tenant_databases_org_id 
  ON public.tenant_databases(organization_id);

CREATE INDEX IF NOT EXISTS idx_tenant_databases_status 
  ON public.tenant_databases(status);

CREATE INDEX IF NOT EXISTS idx_tenant_databases_neon_branch 
  ON public.tenant_databases(neon_branch_id);

CREATE INDEX IF NOT EXISTS idx_tenant_migrations_tenant_db 
  ON public.tenant_migrations(tenant_database_id);

CREATE INDEX IF NOT EXISTS idx_tenant_migrations_status 
  ON public.tenant_migrations(status);

CREATE INDEX IF NOT EXISTS idx_tenant_connections_tenant_db 
  ON public.tenant_connections(tenant_database_id);

CREATE INDEX IF NOT EXISTS idx_tenant_connections_status 
  ON public.tenant_connections(status);

CREATE INDEX IF NOT EXISTS idx_tenant_health_tenant_db 
  ON public.tenant_database_health(tenant_database_id);

CREATE INDEX IF NOT EXISTS idx_tenant_health_checked_at 
  ON public.tenant_database_health(checked_at DESC);

-- =====================================================
-- ROW-LEVEL SECURITY POLICIES
-- =====================================================

ALTER TABLE public.tenant_databases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_database_health ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write tenant database info
CREATE POLICY "Service role only - tenant_databases"
  ON public.tenant_databases
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role only - tenant_migrations"
  ON public.tenant_migrations
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role only - tenant_connections"
  ON public.tenant_connections
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Platform admins can view health metrics
CREATE POLICY "Platform admins can view health"
  ON public.tenant_database_health
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_users
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get tenant database connection info
CREATE OR REPLACE FUNCTION public.get_tenant_database(org_id UUID)
RETURNS TABLE (
  database_id UUID,
  connection_string TEXT,
  status TEXT,
  region TEXT
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id as database_id,
    connection_string_encrypted as connection_string,
    status,
    region
  FROM public.tenant_databases
  WHERE organization_id = org_id
  AND status = 'active'
  LIMIT 1;
$$;

-- Function to update database health metrics
CREATE OR REPLACE FUNCTION public.update_tenant_database_health(
  _tenant_db_id UUID,
  _response_time_ms INTEGER,
  _storage_used_mb INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.tenant_database_health (
    tenant_database_id,
    response_time_ms,
    storage_used_mb,
    is_healthy,
    checked_at
  ) VALUES (
    _tenant_db_id,
    _response_time_ms,
    _storage_used_mb,
    _response_time_ms < 1000, -- Healthy if < 1 second
    NOW()
  );
  
  -- Update tenant_databases last_health_check
  UPDATE public.tenant_databases
  SET 
    last_health_check_at = NOW(),
    database_size_mb = _storage_used_mb
  WHERE id = _tenant_db_id;
END;
$$;

-- Function to track database access
CREATE OR REPLACE FUNCTION public.track_tenant_database_access(_tenant_db_id UUID)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.tenant_databases
  SET last_accessed_at = NOW()
  WHERE id = _tenant_db_id;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_tenant_database_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenant_databases_updated_at
  BEFORE UPDATE ON public.tenant_databases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tenant_database_updated_at();

-- =====================================================
-- INITIAL DATA / COMMENTS
-- =====================================================

COMMENT ON TABLE public.tenant_databases IS 'Central registry of all tenant databases provisioned via Neon API';
COMMENT ON TABLE public.tenant_migrations IS 'Migration history for each tenant database';
COMMENT ON TABLE public.tenant_connections IS 'Active connection pool tracking per tenant';
COMMENT ON TABLE public.tenant_database_health IS 'Health monitoring metrics for tenant databases';

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Multi-tenant database infrastructure created successfully';
  RAISE NOTICE 'Tables: tenant_databases, tenant_migrations, tenant_connections, tenant_database_health';
  RAISE NOTICE 'Next: Create Edge Functions for Neon API integration';
END $$;
