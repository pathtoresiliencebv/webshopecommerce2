-- Performance Optimization: Add indexes for faster queries
-- These indexes will significantly improve query performance for the most common operations

-- Index for products filtered by organization and active status (used in Products page and CollectionSlider)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_active_org ON products(is_active, organization_id) WHERE is_active = true;

-- Index for product collections by collection_id (used in CollectionSlider N+1 query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_collections_collection ON product_collections(collection_id);

-- Index for product images with primary flag for faster image lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_images_primary ON product_images(product_id, is_primary) WHERE is_primary = true;

-- Index for product images by product_id for fallback images
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_images_product ON product_images(product_id, sort_order);

-- Index for product attributes by product_id and attribute_type (used for filtering)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_attributes_product_type ON product_attributes(product_id, attribute_type);

-- Index for reviews by product_id for rating calculations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_product ON reviews(product_id) WHERE is_approved = true;

-- Index for organization users for faster role checks
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organization_users_user_org ON organization_users(user_id, organization_id) WHERE is_active = true;

-- Partial index for active categories by organization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_active_org ON categories(organization_id, is_active) WHERE is_active = true;