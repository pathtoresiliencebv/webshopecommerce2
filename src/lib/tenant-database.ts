/**
 * TENANT DATABASE CONNECTION MANAGER
 * 
 * Manages dynamic database connections per organization (tenant).
 * Each store gets its own Neon database.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Cache for tenant database clients
const tenantClients = new Map<string, SupabaseClient>();

// Cache for connection strings (in-memory only, cleared on page refresh)
const connectionStringCache = new Map<string, string>();

/**
 * Get Supabase client for specific tenant (organization)
 * 
 * @param organizationId - UUID of the organization
 * @returns SupabaseClient connected to tenant's database
 */
export async function getTenantDatabase(
  organizationId: string
): Promise<SupabaseClient> {
  
  // Check cache first (avoid repeated lookups)
  if (tenantClients.has(organizationId)) {
    console.log(`📦 Using cached tenant DB client for org: ${organizationId.substring(0, 8)}`);
    
    // Track access
    trackTenantAccess(organizationId).catch(err => 
      console.warn('Failed to track access:', err)
    );
    
    return tenantClients.get(organizationId)!;
  }

  console.log(`🔍 Fetching tenant database for org: ${organizationId}`);

  try {
    // Get tenant database record from central registry
    const { data: tenantDb, error } = await supabase
      .from('tenant_databases')
      .select('id, connection_string_encrypted, status, region')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .single();

    if (error || !tenantDb) {
      console.error('❌ Tenant database not found:', error);
      throw new Error(`Tenant database not found for organization: ${organizationId}`);
    }

    if (tenantDb.status !== 'active') {
      throw new Error(`Tenant database is not active: ${tenantDb.status}`);
    }

    // Decrypt connection string
    let connectionString = connectionStringCache.get(organizationId);
    
    if (!connectionString) {
      console.log('🔓 Decrypting connection string...');
      
      const { data: decrypted } = await supabase.functions.invoke(
        'decrypt-connection-string',
        { 
          body: { 
            encryptedString: tenantDb.connection_string_encrypted 
          } 
        }
      );

      if (!decrypted?.connectionString) {
        throw new Error('Failed to decrypt connection string');
      }

      connectionString = decrypted.connectionString;
      connectionStringCache.set(organizationId, connectionString);
    }

    console.log(`✅ Connection string ready for region: ${tenantDb.region}`);

    // Extract components from connection string
    // Format: postgresql://host/database?sslmode=require
    const dbUrl = new URL(connectionString.replace('postgresql://', 'https://'));
    const host = dbUrl.hostname;
    const database = dbUrl.pathname.substring(1); // Remove leading /
    
    // Construct Supabase-compatible URL
    // Note: This assumes Neon database has Supabase-compatible API
    // You may need to adjust based on your setup
    const supabaseUrl = `https://${host}`;
    
    // Use anon key from main Supabase (or tenant-specific key if available)
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    // Create tenant-specific Supabase client
    const tenantClient = createClient(
      supabaseUrl,
      anonKey,
      {
        db: { 
          schema: 'public' 
        },
        auth: { 
          persistSession: false // Don't persist auth in tenant DB
        },
        global: {
          headers: {
            'X-Tenant-Database': tenantDb.id,
            'X-Organization-Id': organizationId,
          }
        }
      }
    );

    // Cache the client
    tenantClients.set(organizationId, tenantClient);

    console.log(`🎉 Tenant database client created for org: ${organizationId.substring(0, 8)}`);

    // Track access
    await trackTenantAccess(organizationId);

    return tenantClient;

  } catch (error) {
    console.error('💥 Failed to get tenant database:', error);
    throw error;
  }
}

/**
 * Clear tenant client cache
 * Call when user logs out or switches organizations
 */
export function clearTenantCache(organizationId?: string) {
  if (organizationId) {
    console.log(`🧹 Clearing cache for org: ${organizationId}`);
    tenantClients.delete(organizationId);
    connectionStringCache.delete(organizationId);
  } else {
    console.log('🧹 Clearing all tenant caches');
    tenantClients.clear();
    connectionStringCache.clear();
  }
}

/**
 * Track tenant database access (async, don't wait)
 */
async function trackTenantAccess(organizationId: string) {
  try {
    const { data: tenantDb } = await supabase
      .from('tenant_databases')
      .select('id')
      .eq('organization_id', organizationId)
      .single();

    if (tenantDb) {
      await supabase.rpc('track_tenant_database_access', {
        _tenant_db_id: tenantDb.id
      });
    }
  } catch (error) {
    // Silently fail - tracking is not critical
    console.debug('Access tracking failed:', error);
  }
}

/**
 * Health check for tenant database
 */
export async function checkTenantDatabaseHealth(
  organizationId: string
): Promise<{
  isHealthy: boolean;
  responseTimeMs: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    const tenantDb = await getTenantDatabase(organizationId);
    
    // Simple health check query
    const { error } = await tenantDb
      .from('products')
      .select('id')
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        isHealthy: false,
        responseTimeMs: responseTime,
        error: error.message,
      };
    }

    return {
      isHealthy: true,
      responseTimeMs: responseTime,
    };

  } catch (error) {
    return {
      isHealthy: false,
      responseTimeMs: Date.now() - startTime,
      error: (error as Error).message,
    };
  }
}

/**
 * Provision new tenant database (admin only)
 */
export async function provisionTenantDatabase(
  organizationId: string,
  organizationName: string,
  region: string = 'eu-central-1'
): Promise<{
  success: boolean;
  tenantDatabaseId?: string;
  error?: string;
}> {
  try {
    console.log(`🚀 Provisioning tenant database for: ${organizationName}`);

    const { data, error } = await supabase.functions.invoke(
      'provision-tenant-database',
      {
        body: {
          organizationId,
          organizationName,
          region,
        }
      }
    );

    if (error) throw error;

    if (!data.success) {
      throw new Error(data.error || 'Provisioning failed');
    }

    console.log(`✅ Database provisioned: ${data.tenantDatabaseId}`);

    return {
      success: true,
      tenantDatabaseId: data.tenantDatabaseId,
    };

  } catch (error) {
    console.error('❌ Provisioning error:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Check if organization has a tenant database
 */
export async function hasTenantDatabase(
  organizationId: string
): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('tenant_databases')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .single();

    return !!data;
  } catch {
    return false;
  }
}
