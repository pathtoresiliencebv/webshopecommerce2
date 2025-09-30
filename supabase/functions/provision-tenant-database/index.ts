// =====================================================
// PROVISION TENANT DATABASE - Neon API Integration
// Creates a new Neon database branch for each store
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProvisionRequest {
  organizationId: string;
  organizationName: string;
  region?: string;
}

const NEON_API_KEY = Deno.env.get('NEON_API_KEY');
const NEON_PROJECT_ID = Deno.env.get('NEON_PROJECT_ID');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organizationId, organizationName, region = 'eu-central-1' }: ProvisionRequest = 
      await req.json();

    console.log(`🚀 Provisioning database for organization: ${organizationId}`);

    // Validate Neon API key
    if (!NEON_API_KEY || !NEON_PROJECT_ID) {
      throw new Error('Neon API credentials not configured');
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Check if database already exists
    const { data: existing } = await supabase
      .from('tenant_databases')
      .select('id, status')
      .eq('organization_id', organizationId)
      .single();

    if (existing) {
      console.log(`⚠️  Database already exists for org ${organizationId}:`, existing.status);
      return new Response(
        JSON.stringify({ 
          success: true, 
          existing: true,
          tenantDatabaseId: existing.id,
          status: existing.status,
          message: 'Database already provisioned'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. CREATE NEON BRANCH (New Database)
    console.log('📦 Creating Neon branch...');
    
    const branchName = `store-${organizationId.substring(0, 8)}`;
    
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
            name: branchName,
            parent_id: 'main', // Clone from main branch schema
          },
          endpoints: [{
            type: 'read_write',
            autoscaling_limit_min_cu: 0.25,
            autoscaling_limit_max_cu: 1.0,
            suspend_timeout_seconds: 300,
          }],
        }),
      }
    );

    if (!branchResponse.ok) {
      const error = await branchResponse.json();
      throw new Error(`Neon branch creation failed: ${error.message || branchResponse.statusText}`);
    }

    const branchData = await branchResponse.json();
    const branch = branchData.branch;
    const endpoint = branchData.endpoints?.[0];

    console.log(`✅ Neon branch created: ${branch.id}`);

    // 2. CONSTRUCT CONNECTION STRING
    const connectionString = `postgresql://${endpoint.host}/${branch.database_name}?sslmode=require`;
    
    console.log(`🔗 Connection string ready for: ${endpoint.host}`);

    // 3. ENCRYPT CONNECTION STRING
    // In production, use Supabase Vault or external encryption service
    // For now, we'll store it (YOU MUST ADD ENCRYPTION IN PRODUCTION!)
    const encryptedConnectionString = await encryptConnectionString(connectionString);

    // 4. SAVE TO TENANT_DATABASES TABLE
    console.log('💾 Saving tenant database record...');
    
    const { data: tenantDb, error: dbError } = await supabase
      .from('tenant_databases')
      .insert({
        organization_id: organizationId,
        neon_project_id: NEON_PROJECT_ID,
        neon_branch_id: branch.id,
        neon_endpoint_id: endpoint.id,
        neon_branch_name: branchName,
        connection_string_encrypted: encryptedConnectionString,
        database_host: endpoint.host,
        database_name: branch.database_name,
        database_port: 5432,
        region: region,
        autoscaling_min_cu: 0.25,
        autoscaling_max_cu: 1.0,
        suspend_timeout_seconds: 300,
        status: 'provisioning',
      })
      .select()
      .single();

    if (dbError) {
      console.error('❌ Failed to save tenant database:', dbError);
      throw dbError;
    }

    console.log(`✅ Tenant database record created: ${tenantDb.id}`);

    // 5. RUN INITIAL MIGRATIONS
    console.log('🔄 Running initial migrations...');
    
    try {
      const migrationResult = await supabase.functions.invoke('run-tenant-migrations', {
        body: {
          tenantDatabaseId: tenantDb.id,
          connectionString: connectionString, // Pass decrypted string
        }
      });

      if (migrationResult.error) {
        throw new Error(`Migration failed: ${migrationResult.error.message}`);
      }

      console.log('✅ Migrations completed successfully');
    } catch (migrationError) {
      console.error('❌ Migration error:', migrationError);
      
      // Update status to failed
      await supabase
        .from('tenant_databases')
        .update({ 
          status: 'failed',
          provisioning_error: (migrationError as Error).message 
        })
        .eq('id', tenantDb.id);
      
      throw migrationError;
    }

    // 6. UPDATE STATUS TO ACTIVE
    const { error: updateError } = await supabase
      .from('tenant_databases')
      .update({ 
        status: 'active',
        last_health_check_at: new Date().toISOString()
      })
      .eq('id', tenantDb.id);

    if (updateError) {
      console.error('❌ Failed to update status:', updateError);
    }

    console.log(`🎉 Database provisioning complete for ${organizationName}!`);

    // 7. RETURN SUCCESS RESPONSE
    return new Response(
      JSON.stringify({
        success: true,
        tenantDatabaseId: tenantDb.id,
        branchId: branch.id,
        branchName: branchName,
        region: region,
        status: 'active',
        message: 'Tenant database provisioned successfully',
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('💥 Provision tenant database error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to provision tenant database',
        details: error.stack,
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

/**
 * Encrypt connection string
 * 🔒 IMPORTANT: In production, use proper encryption:
 * - Supabase Vault
 * - AWS KMS
 * - HashiCorp Vault
 * 
 * This is a PLACEHOLDER - DO NOT use in production!
 */
async function encryptConnectionString(connectionString: string): Promise<string> {
  // TODO: Implement proper encryption
  // For now, base64 encode (NOT SECURE!)
  
  const encoder = new TextEncoder();
  const data = encoder.encode(connectionString);
  const base64 = btoa(String.fromCharCode(...data));
  
  console.warn('⚠️  WARNING: Using base64 encoding, not proper encryption!');
  console.warn('⚠️  MUST implement proper encryption before production!');
  
  return base64;
}

console.log('🚀 Provision Tenant Database function loaded');
