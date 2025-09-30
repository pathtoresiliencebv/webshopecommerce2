-- =====================================================
-- SHEIN ORDER QUEUE (Central Database)
-- Queue for automatic SHEIN order placement
-- =====================================================

CREATE TABLE IF NOT EXISTS public.shein_order_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  order_id UUID NOT NULL, -- Reference to tenant database order
  
  -- SHEIN order payload
  shein_payload JSONB NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Waiting for Chrome extension to process
    'processing',   -- Being placed on SHEIN
    'completed',    -- Successfully placed
    'failed',       -- Failed to place
    'canceled'      -- Canceled
  )),
  
  -- Results
  shein_order_number TEXT,
  shein_tracking_number TEXT,
  shein_tracking_url TEXT,
  
  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_shein_queue_org ON public.shein_order_queue(organization_id);
CREATE INDEX idx_shein_queue_status ON public.shein_order_queue(status);
CREATE INDEX idx_shein_queue_created ON public.shein_order_queue(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE public.shein_order_queue ENABLE ROW LEVEL SECURITY;

-- Store managers can view their own orders
CREATE POLICY "Store managers can view their SHEIN orders"
  ON public.shein_order_queue
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin', 'manager')
    )
  );

-- Platform admins can view all
CREATE POLICY "Platform admins can view all SHEIN orders"
  ON public.shein_order_queue
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Chrome extension can update (via service role)
CREATE POLICY "Service role can manage SHEIN queue"
  ON public.shein_order_queue
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Comments
COMMENT ON TABLE public.shein_order_queue IS 'Queue for automatic SHEIN order placement via Chrome extension';
COMMENT ON COLUMN public.shein_order_queue.shein_payload IS 'Complete SHEIN order data for Chrome extension';
COMMENT ON COLUMN public.shein_order_queue.retry_count IS 'Number of retry attempts';

SELECT 'SHEIN order queue created successfully' as message;
