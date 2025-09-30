# Database-per-Tenant Architecture - Neon Implementation

**Datum:** 30 September 2025  
**Beslissing:** Overstap van Shared Database naar Database-per-Tenant

## 🎯 Architectuur Beslissing

### Huidige Situatie (Shared Database)
```
┌─────────────────────────────────────┐
│     Single Supabase Database        │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  Organizations Table         │  │
│  │  - aurelioliving            │  │
│  │  - store2                   │  │
│  │  - store3                   │  │
│  └──────────────────────────────┘  │
│                                     │
│  All data with organization_id      │
│  + Row-Level Security (RLS)         │
└─────────────────────────────────────┘

❌ Nadelen:
- RLS overhead bij elke query
- Moeilijk schaalbaar bij 1000+ stores
- Data blijft samen (compliance risico)
- Performance degradatie bij grote datasets
```

### Nieuwe Architectuur (Database-per-Tenant)
```
┌─────────────────────────────────────────────────────┐
│          Central Registry Database                   │
│         (Supabase - Platform Management)            │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │  tenant_databases                            │  │
│  │  - id, organization_id, neon_project_id      │  │
│  │  - connection_string, status, region         │  │
│  │  - created_at, database_size                 │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  Organizations, Users, Subscriptions                │
│  Platform-level data only                           │
└─────────────────────────────────────────────────────┘
                        │
        ┌───────────────┴────────────────┐
        │                                │
        ▼                                ▼
┌─────────────────┐            ┌─────────────────┐
│  Neon Database  │            │  Neon Database  │
│   Store 1       │            │   Store 2       │
│                 │            │                 │
│ - products      │            │ - products      │
│ - orders        │            │ - orders        │
│ - customers     │            │ - customers     │
│ - categories    │            │ - categories    │
│ - all store     │            │ - all store     │
│   specific data │            │   specific data │
└─────────────────┘            └─────────────────┘

✅ Voordelen:
- Complete data isolatie
- Onafhankelijke scaling per store
- Geen RLS overhead
- Betere performance
- Makkelijker GDPR compliance
- Per-store backups mogelijk
```

## 🔧 Technische Implementatie

### 1. Neon API Integration

**Neon Database Provisioning:**
```typescript
// supabase/functions/provision-tenant-database/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const NEON_API_KEY = Deno.env.get('NEON_API_KEY')!;
const NEON_PROJECT_ID = Deno.env.get('NEON_PROJECT_ID')!;

interface ProvisionRequest {
  organizationId: string;
  storeName: string;
  region?: string; // eu-central-1, us-east-1, etc.
}

const handler = async (req: Request): Promise<Response> => {
  const { organizationId, storeName, region = 'eu-central-1' } = await req.json();

  try {
    // 1. Create new Neon branch (database)
    const branchResponse = await fetch(
      `https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/branches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NEON_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          branch: {
            name: `store-${organizationId}`,
            parent_id: 'main', // Clone from main branch with schema
          },
          endpoints: [
            {
              type: 'read_write',
              autoscaling_limit_min_cu: 0.25,
              autoscaling_limit_max_cu: 1,
              suspend_timeout_seconds: 300,
            },
          ],
        }),
      }
    );

    const branchData = await branchResponse.json();
    
    if (!branchResponse.ok) {
      throw new Error(`Neon API error: ${branchData.message}`);
    }

    const branch = branchData.branch;
    const endpoint = branchData.endpoints[0];

    // 2. Get connection string
    const connectionString = `postgresql://${endpoint.host}/${branch.name}?sslmode=require`;

    // 3. Save to central registry
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: tenantDb, error: dbError } = await supabase
      .from('tenant_databases')
      .insert({
        organization_id: organizationId,
        neon_project_id: NEON_PROJECT_ID,
        neon_branch_id: branch.id,
        neon_endpoint_id: endpoint.id,
        connection_string_encrypted: encrypt(connectionString), // Encrypt!
        region: region,
        status: 'active',
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // 4. Run initial migrations on new database
    await runMigrations(connectionString);

    // 5. Seed initial data
    await seedStoreData(connectionString, organizationId, storeName);

    return new Response(
      JSON.stringify({
        success: true,
        tenantDatabaseId: tenantDb.id,
        branchId: branch.id,
        message: 'Database provisioned successfully',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Database provisioning error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
```

### 2. Central Registry Database Schema

**New Tables in Central Supabase:**
```sql
-- Central registry for all tenant databases
CREATE TABLE public.tenant_databases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Neon details
  neon_project_id TEXT NOT NULL,
  neon_branch_id TEXT NOT NULL UNIQUE,
  neon_endpoint_id TEXT NOT NULL,
  
  -- Connection info (encrypted!)
  connection_string_encrypted TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT 'eu-central-1',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'provisioning' 
    CHECK (status IN ('provisioning', 'active', 'suspended', 'failed')),
  
  -- Metrics
  database_size_mb INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id) -- One database per organization
);

-- Database migration history per tenant
CREATE TABLE public.tenant_migrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_database_id UUID NOT NULL REFERENCES tenant_databases(id),
  migration_name TEXT NOT NULL,
  migration_version TEXT NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  success BOOLEAN DEFAULT true,
  error_message TEXT
);

-- Connection pool management
CREATE TABLE public.tenant_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_database_id UUID NOT NULL REFERENCES tenant_databases(id),
  connection_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'idle', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tenant_databases_org_id ON tenant_databases(organization_id);
CREATE INDEX idx_tenant_databases_status ON tenant_databases(status);
CREATE INDEX idx_tenant_migrations_tenant_id ON tenant_migrations(tenant_database_id);
```

### 3. Dynamic Database Connection

**Client-side Connection Manager:**
```typescript
// src/lib/tenant-database.ts

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Cache for tenant database clients
const tenantClients = new Map<string, SupabaseClient>();

/**
 * Get Supabase client for specific tenant
 */
export async function getTenantDatabase(
  organizationId: string
): Promise<SupabaseClient> {
  
  // Check cache first
  if (tenantClients.has(organizationId)) {
    return tenantClients.get(organizationId)!;
  }

  // Get connection info from central registry
  const centralSupabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  const { data: tenantDb, error } = await centralSupabase
    .from('tenant_databases')
    .select('connection_string_encrypted, neon_endpoint_id')
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .single();

  if (error || !tenantDb) {
    throw new Error(`Tenant database not found for org: ${organizationId}`);
  }

  // Decrypt connection string via edge function
  const { data: decrypted } = await centralSupabase.functions.invoke(
    'decrypt-connection-string',
    { body: { encryptedString: tenantDb.connection_string_encrypted } }
  );

  const connectionString = decrypted.connectionString;

  // Create tenant-specific Supabase client
  const tenantClient = createClient(
    connectionString,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    {
      db: { schema: 'public' },
      auth: { persistSession: true },
    }
  );

  // Cache it
  tenantClients.set(organizationId, tenantClient);

  return tenantClient;
}

/**
 * Clear tenant client cache (on logout or org switch)
 */
export function clearTenantCache(organizationId?: string) {
  if (organizationId) {
    tenantClients.delete(organizationId);
  } else {
    tenantClients.clear();
  }
}
```

**Updated StoreContext:**
```typescript
// src/contexts/StoreContext.tsx

import { getTenantDatabase } from '@/lib/tenant-database';

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [store, setStore] = useState<Store | null>(null);
  const [tenantDb, setTenantDb] = useState<SupabaseClient | null>(null);
  
  useEffect(() => {
    const initializeTenantDatabase = async () => {
      if (!store?.id) return;
      
      try {
        const db = await getTenantDatabase(store.id);
        setTenantDb(db);
      } catch (error) {
        console.error('Failed to initialize tenant database:', error);
      }
    };

    initializeTenantDatabase();
  }, [store?.id]);

  return (
    <StoreContext.Provider value={{ store, tenantDb, loading, error }}>
      {children}
    </StoreContext.Provider>
  );
};
```

### 4. Migration System per Tenant

**Migration Runner:**
```typescript
// supabase/functions/run-tenant-migrations/index.ts

async function runMigrations(connectionString: string) {
  const sql = await Deno.readTextFile('./tenant-schema.sql');
  
  // Connect to tenant database
  const client = new Client(connectionString);
  await client.connect();

  try {
    // Run migration
    await client.queryArray(sql);
    
    console.log('Tenant database schema created successfully');
  } finally {
    await client.end();
  }
}
```

**Tenant Database Schema (tenant-schema.sql):**
```sql
-- E-commerce Core Tables (NO organization_id needed!)

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  sku TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  parent_id UUID REFERENCES categories(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID, -- Links to central auth
  status TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- No RLS needed! Each store has its own database
-- Much simpler queries, better performance
```

## 📊 Data Flow Architecture

### Store Creation Flow
```
1. User creates new store via admin
   ↓
2. Central DB: Create organization record
   ↓
3. Edge Function: provision-tenant-database
   ↓
4. Neon API: Create new branch (database)
   ↓
5. Run migrations on new database
   ↓
6. Seed initial data (categories, settings)
   ↓
7. Save connection info in tenant_databases
   ↓
8. Return success to user
```

### Data Access Flow
```
1. User visits: store1.myaurelio.com
   ↓
2. StoreContext detects subdomain "store1"
   ↓
3. Query central DB for organization_id
   ↓
4. Get tenant_database record
   ↓
5. Decrypt connection string
   ↓
6. Create Supabase client for tenant DB
   ↓
7. All queries go to tenant-specific database
```

## 🔐 Security Considerations

### Connection String Encryption
```typescript
// Use Supabase Vault for encryption
CREATE SECRET neon_encryption_key (
  secret = '<generated-key>'
);

-- Encrypt before storing
INSERT INTO tenant_databases (connection_string_encrypted)
VALUES (
  encrypt(
    'postgresql://user:pass@host/db',
    (SELECT secret FROM vault.secrets WHERE name = 'neon_encryption_key')
  )
);
```

### Access Control
```sql
-- Only allow service role to read connection strings
CREATE POLICY "Service role only"
ON tenant_databases FOR SELECT
USING (auth.jwt() ->> 'role' = 'service_role');
```

## 💰 Cost Estimation

### Neon Pricing (per database)
```
Free Tier per branch:
- 0.5 GB storage
- Autoscaling: 0.25 - 1 CU
- Auto-suspend after 5 min inactive

Estimated costs with 100 stores:
- Storage: ~50 GB total = €5/month
- Compute: ~10 CU-hours/month = €15/month
- Total: ~€20-30/month for 100 active stores

Much cheaper than single large database!
```

## 🚀 Migration Plan

### Phase 1: Infrastructure (Week 1)
- [ ] Set up Neon account
- [ ] Create central registry tables
- [ ] Build provisioning edge function
- [ ] Implement encryption system

### Phase 2: Dynamic Connections (Week 2)
- [ ] Build tenant database client
- [ ] Update StoreContext
- [ ] Implement connection pooling
- [ ] Create migration runner

### Phase 3: Data Migration (Week 3)
- [ ] Export existing data per organization
- [ ] Provision databases for existing stores
- [ ] Import data to tenant databases
- [ ] Verify data integrity

### Phase 4: Cutover (Week 4)
- [ ] Switch application to use tenant DBs
- [ ] Monitor performance
- [ ] Fix any issues
- [ ] Decommission old RLS system

## 📝 Benefits Summary

| Aspect | Shared DB (Current) | DB-per-Tenant (New) |
|--------|-------------------|-------------------|
| **Data Isolation** | RLS policies | Complete separation |
| **Performance** | Degrades with growth | Scales linearly |
| **Complexity** | RLS in every query | Simple queries |
| **Backup/Restore** | All or nothing | Per tenant |
| **Compliance** | Complex | Easy (delete DB) |
| **Cost** | Fixed high cost | Pay per usage |
| **Multi-region** | Difficult | Easy (Neon regions) |

**Conclusie:** Database-per-tenant is de juiste keuze voor een schaalbaar multi-tenant SaaS platform.
