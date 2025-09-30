-- =====================================================
-- PAYMENT PROVIDERS & SHOPPING FEEDS
-- Add to Tenant Database Schema (via migration runner)
-- =====================================================

-- This will be executed on each tenant database via run-tenant-migrations

-- =====================================================
-- PAYMENT PROVIDERS (Stripe Connect, Mollie, PayPal)
-- =====================================================

CREATE TABLE IF NOT EXISTS payment_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Provider type
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'mollie', 'paypal', 'adyen')),
  
  -- Stripe Connect specific
  stripe_account_id TEXT UNIQUE,
  stripe_publishable_key TEXT,
  stripe_account_status TEXT CHECK (stripe_account_status IN (
    'pending', 'active', 'restricted', 'inactive'
  )),
  
  -- Mollie specific
  mollie_profile_id TEXT UNIQUE,
  mollie_api_key_encrypted TEXT,
  
  -- PayPal specific
  paypal_merchant_id TEXT,
  paypal_client_id TEXT,
  paypal_client_secret_encrypted TEXT,
  
  -- Configuration
  is_active BOOLEAN DEFAULT false,
  is_primary BOOLEAN DEFAULT false,
  
  -- Capabilities & Requirements
  capabilities JSONB DEFAULT '{}',
  requirements JSONB DEFAULT '{}',
  
  -- Platform fees (optional commission)
  platform_fee_percentage DECIMAL(5,2) DEFAULT 0,
  platform_fee_fixed DECIMAL(10,2) DEFAULT 0,
  
  -- Metadata
  onboarding_completed_at TIMESTAMPTZ,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  payment_provider_id UUID NOT NULL REFERENCES payment_providers(id),
  
  -- Transaction details
  provider_transaction_id TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  
  -- Status
  status TEXT NOT NULL CHECK (status IN (
    'pending', 'processing', 'succeeded', 'failed', 'canceled', 'refunded'
  )),
  
  -- Fees
  platform_fee DECIMAL(10,2) DEFAULT 0,
  provider_fee DECIMAL(10,2) DEFAULT 0,
  net_amount DECIMAL(10,2),
  
  -- Metadata
  provider_metadata JSONB DEFAULT '{}',
  failure_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refunds
CREATE TABLE IF NOT EXISTS payment_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_transaction_id UUID NOT NULL REFERENCES payment_transactions(id) ON DELETE CASCADE,
  
  refund_amount DECIMAL(10,2) NOT NULL,
  refund_reason TEXT,
  
  provider_refund_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled')),
  
  created_by UUID, -- Admin user
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SHOPPING FEEDS (Google, Facebook, TikTok)
-- =====================================================

-- Feed configurations
CREATE TABLE IF NOT EXISTS shopping_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Platform
  platform TEXT NOT NULL CHECK (platform IN (
    'google_shopping', 'facebook', 'instagram', 'tiktok', 'pinterest'
  )),
  
  -- Feed settings
  feed_name TEXT NOT NULL,
  feed_url TEXT,
  is_active BOOLEAN DEFAULT false,
  
  -- Platform-specific config
  google_merchant_id TEXT,
  facebook_catalog_id TEXT,
  tiktok_catalog_id TEXT,
  
  -- Feed options
  include_out_of_stock BOOLEAN DEFAULT false,
  minimum_price DECIMAL(10,2),
  maximum_price DECIMAL(10,2),
  excluded_categories TEXT[] DEFAULT '{}',
  custom_labels JSONB DEFAULT '{}',
  
  -- Scheduling
  auto_update BOOLEAN DEFAULT true,
  update_frequency TEXT DEFAULT 'daily' CHECK (update_frequency IN (
    'hourly', 'every_6_hours', 'daily', 'weekly', 'manual'
  )),
  last_generated_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  
  -- Stats
  total_products INTEGER DEFAULT 0,
  approved_products INTEGER DEFAULT 0,
  disapproved_products INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feed generation logs
CREATE TABLE IF NOT EXISTS feed_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_feed_id UUID NOT NULL REFERENCES shopping_feeds(id) ON DELETE CASCADE,
  
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
  products_count INTEGER NOT NULL,
  file_size_bytes INTEGER,
  generation_duration_ms INTEGER,
  
  errors JSONB DEFAULT '[]',
  warnings JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product feed mapping
CREATE TABLE IF NOT EXISTS product_feed_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_feed_id UUID NOT NULL REFERENCES shopping_feeds(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Status per platform
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'disapproved', 'excluded'
  )),
  
  platform_product_id TEXT,
  disapproval_reasons TEXT[],
  warnings TEXT[],
  
  -- Custom overrides
  custom_title TEXT,
  custom_description TEXT,
  custom_image_url TEXT,
  
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(shopping_feed_id, product_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Payment providers
CREATE INDEX idx_payment_providers_stripe_account ON payment_providers(stripe_account_id);
CREATE INDEX idx_payment_providers_active ON payment_providers(is_active);

-- Payment transactions
CREATE INDEX idx_payment_transactions_order ON payment_transactions(order_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_provider ON payment_transactions(provider_transaction_id);

-- Payment refunds
CREATE INDEX idx_payment_refunds_transaction ON payment_refunds(payment_transaction_id);

-- Shopping feeds
CREATE INDEX idx_shopping_feeds_platform ON shopping_feeds(platform);
CREATE INDEX idx_shopping_feeds_active ON shopping_feeds(is_active);

-- Feed generation logs
CREATE INDEX idx_feed_logs_feed_id ON feed_generation_logs(shopping_feed_id);
CREATE INDEX idx_feed_logs_created ON feed_generation_logs(created_at DESC);

-- Product feed items
CREATE INDEX idx_product_feed_items_feed ON product_feed_items(shopping_feed_id);
CREATE INDEX idx_product_feed_items_product ON product_feed_items(product_id);
CREATE INDEX idx_product_feed_items_status ON product_feed_items(status);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE payment_providers IS 'Store-specific payment provider accounts (Stripe Connect, Mollie, PayPal)';
COMMENT ON TABLE payment_transactions IS 'Payment transactions per order';
COMMENT ON TABLE payment_refunds IS 'Refund records for failed/returned orders';
COMMENT ON TABLE shopping_feeds IS 'Shopping feed configurations per platform';
COMMENT ON TABLE feed_generation_logs IS 'History of feed generation runs';
COMMENT ON TABLE product_feed_items IS 'Product-to-feed mapping with platform status';

SELECT 'Payment providers and shopping feeds schema created successfully' as message;
