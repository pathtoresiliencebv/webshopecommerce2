# Technical Architecture - Multi-Tenant SaaS Platform

## Architecture Overview

### Current State Analysis
- **Single-tenant application**: One store, one database
- **Supabase backend**: PostgreSQL with RLS, Auth, Storage
- **React frontend**: TypeScript, Tailwind CSS
- **Monolithic structure**: All features in single codebase

### Target Multi-Tenant Architecture
- **Shared database, isolated tenants**: Row-Level Security per store
- **Dynamic routing**: Store identification via subdomain/domain
- **Scalable infrastructure**: Auto-scaling and performance optimization
- **Microservices approach**: Modular backend functions

## Database Design Strategy

### Multi-Tenancy Implementation: Shared Database with Row-Level Security

#### Tenant Isolation Strategy
```sql
-- New core tables for multi-tenancy
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- for subdomain routing
  custom_domain TEXT UNIQUE, -- for custom domains
  subscription_tier TEXT DEFAULT 'starter',
  subscription_status TEXT DEFAULT 'trial',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.organization_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- owner, admin, member
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);
```

#### Modified Existing Tables
All existing tables need `organization_id` column:
```sql
-- Add organization_id to all existing tables
ALTER TABLE products ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE orders ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE categories ADD COLUMN organization_id UUID REFERENCES organizations(id);
-- ... and so on for all tables
```

#### Row-Level Security Updates
```sql
-- Example RLS policy for products
CREATE POLICY "Users can only see their organization's products"
ON products FOR ALL
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_users 
    WHERE user_id = auth.uid()
  )
);
```

## Frontend Architecture

### Routing Strategy
```typescript
// Dynamic store identification
const getStoreFromRequest = (request: Request) => {
  const url = new URL(request.url);
  const hostname = url.hostname;
  
  // Check for subdomain (store.ourplatform.com)
  if (hostname.includes('.ourplatform.com')) {
    return hostname.split('.')[0];
  }
  
  // Check for custom domain
  return lookupCustomDomain(hostname);
};
```

### Store Context System
```typescript
// Store context for tenant isolation
interface StoreContext {
  organizationId: string;
  storeSlug: string;
  customDomain?: string;
  theme: StoreTheme;
  settings: StoreSettings;
}

// Global store context provider
const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  const [storeContext, setStoreContext] = useState<StoreContext | null>(null);
  
  // Initialize store context based on domain/subdomain
  useEffect(() => {
    initializeStoreContext();
  }, []);
  
  return (
    <StoreContext.Provider value={storeContext}>
      {children}
    </StoreContext.Provider>
  );
};
```

### Multi-Store Admin Dashboard
```typescript
// Store-specific admin routes
const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/admin/stores" element={<StoreSelector />} />
      <Route path="/admin/store/:storeId" element={<StoreAdmin />} />
      <Route path="/admin/platform" element={<PlatformAdmin />} />
    </Routes>
  );
};
```

## Backend Architecture

### Supabase Edge Functions Structure
```
supabase/functions/
├── store-management/
│   ├── create-store/index.ts
│   ├── update-store-settings/index.ts
│   └── delete-store/index.ts
├── subscription-management/
│   ├── create-subscription/index.ts
│   ├── update-subscription/index.ts
│   └── webhook-stripe/index.ts
├── domain-management/
│   ├── verify-domain/index.ts
│   └── setup-ssl/index.ts
└── platform-admin/
    ├── get-platform-stats/index.ts
    └── manage-users/index.ts
```

### Store Creation Flow
```typescript
// Edge function for store creation
export const createStore = async (req: Request) => {
  const { name, slug, userId } = await req.json();
  
  // 1. Create organization
  const { data: org } = await supabase
    .from('organizations')
    .insert({ name, slug })
    .select()
    .single();
  
  // 2. Add user as owner
  await supabase
    .from('organization_users')
    .insert({
      organization_id: org.id,
      user_id: userId,
      role: 'owner'
    });
  
  // 3. Initialize default store data
  await initializeStoreDefaults(org.id);
  
  return new Response(JSON.stringify(org));
};
```

## Domain Management System

### Subdomain Routing
```typescript
// Middleware for subdomain detection
export const subdomainMiddleware = (req: Request) => {
  const url = new URL(req.url);
  const subdomain = url.hostname.split('.')[0];
  
  if (subdomain !== 'www' && subdomain !== 'admin') {
    // This is a store subdomain
    req.headers.set('x-store-slug', subdomain);
  }
};
```

### Custom Domain Management
```typescript
// Domain verification system
export const verifyCustomDomain = async (domain: string, organizationId: string) => {
  // 1. Check DNS CNAME record
  const dnsCheck = await verifyDNSRecord(domain);
  
  // 2. Issue SSL certificate
  if (dnsCheck.valid) {
    await issueSSLCertificate(domain);
  }
  
  // 3. Update organization record
  await supabase
    .from('organizations')
    .update({ custom_domain: domain })
    .eq('id', organizationId);
};
```

## Performance & Scalability

### Database Optimization
```sql
-- Essential indexes for multi-tenant queries
CREATE INDEX idx_products_organization_id ON products(organization_id);
CREATE INDEX idx_orders_organization_id ON orders(organization_id);
CREATE INDEX idx_org_users_user_id ON organization_users(user_id);
CREATE INDEX idx_org_users_org_id ON organization_users(organization_id);

-- Partitioning for large tables (future)
CREATE TABLE orders_2024 PARTITION OF orders
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

### Caching Strategy
```typescript
// Store-specific caching
const cacheKey = `store:${organizationId}:products`;
const cachedProducts = await redis.get(cacheKey);

if (!cachedProducts) {
  const products = await fetchProducts(organizationId);
  await redis.setex(cacheKey, 300, JSON.stringify(products)); // 5min cache
  return products;
}
```

### CDN and Asset Management
```typescript
// Store-specific asset URLs
const getAssetUrl = (organizationId: string, assetPath: string) => {
  return `https://cdn.ourplatform.com/${organizationId}/${assetPath}`;
};

// Supabase Storage buckets per organization
const uploadStoreAsset = async (organizationId: string, file: File) => {
  const bucket = `store-assets-${organizationId}`;
  
  // Create bucket if not exists
  await supabase.storage.createBucket(bucket, { public: true });
  
  // Upload file
  const { data } = await supabase.storage
    .from(bucket)
    .upload(`${Date.now()}-${file.name}`, file);
    
  return data?.path;
};
```

## Security Architecture

### Tenant Isolation Security
```sql
-- RLS policy to prevent cross-tenant data access
CREATE POLICY "strict_tenant_isolation" ON products
FOR ALL USING (
  organization_id = (
    SELECT organization_id 
    FROM organization_users 
    WHERE user_id = auth.uid() 
    LIMIT 1
  )
);
```

### API Security
```typescript
// Middleware for tenant validation
export const validateTenant = async (req: Request) => {
  const storeSlug = req.headers.get('x-store-slug');
  const userId = getUserFromJWT(req);
  
  // Verify user has access to this store
  const hasAccess = await supabase
    .from('organization_users')
    .select('role')
    .eq('user_id', userId)
    .eq('organization_id', await getOrgIdFromSlug(storeSlug))
    .single();
    
  if (!hasAccess.data) {
    throw new Error('Unauthorized');
  }
  
  return hasAccess.data.role;
};
```

## Migration Strategy

### Phase 1: Database Migration
1. Add organization tables
2. Add organization_id to existing tables
3. Migrate current data to first organization
4. Implement RLS policies

### Phase 2: Frontend Migration
1. Implement store context system
2. Add subdomain routing
3. Create store selector interface
4. Update all API calls to include tenant context

### Phase 3: Testing & Validation
1. Comprehensive tenant isolation testing
2. Performance testing with multiple stores
3. Security audit and penetration testing
4. Beta testing with selected customers

## Monitoring & Observability

### Store-Level Analytics
```typescript
// Track metrics per store
const trackStoreMetric = async (organizationId: string, metric: string, value: number) => {
  await supabase
    .from('store_metrics')
    .insert({
      organization_id: organizationId,
      metric_name: metric,
      metric_value: value,
      timestamp: new Date().toISOString()
    });
};
```

### Platform-Level Monitoring
- Store creation/deletion rates
- Resource usage per tenant
- API response times by store
- Error rates and patterns
- Subscription health metrics