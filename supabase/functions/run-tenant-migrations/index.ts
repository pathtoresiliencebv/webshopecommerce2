/**
 * RUN TENANT MIGRATIONS
 * 
 * Applies database schema to newly provisioned tenant databases (Neon)
 * Runs all migrations in order to set up complete e-commerce schema
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import postgres from 'https://deno.land/x/postgresjs@v3.4.3/mod.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Migration files in order of execution
const MIGRATIONS = [
  {
    name: '20250930120000_tenant_ecommerce_schema',
    description: 'Core e-commerce schema (products, orders, customers)',
  },
  {
    name: '20250930140000_payment_providers_shopping_feeds',
    description: 'Payment providers & shopping feeds',
  },
];

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { tenantDatabaseId, connectionString } = await req.json();

    console.log(`🚀 Starting migrations for tenant database: ${tenantDatabaseId}`);

    if (!connectionString) {
      throw new Error('Connection string is required');
    }

    // Connect to tenant database (Neon)
    const sql = postgres(connectionString, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    });

    const migrationResults = [];

    // Run each migration
    for (const migration of MIGRATIONS) {
      console.log(`▶️  Running migration: ${migration.name}`);

      try {
        // Load migration SQL file
        const migrationSQL = await loadMigrationSQL(migration.name);

        // Execute migration
        await sql.unsafe(migrationSQL);

        // Record migration in tenant database
        await sql`
          INSERT INTO tenant_migrations (name, checksum, executed_at)
          VALUES (${migration.name}, ${generateChecksum(migrationSQL)}, NOW())
          ON CONFLICT (name) DO NOTHING
        `;

        migrationResults.push({
          migration: migration.name,
          status: 'success',
          description: migration.description,
        });

        console.log(`✅ Migration completed: ${migration.name}`);
      } catch (error) {
        console.error(`❌ Migration failed: ${migration.name}`, error);
        
        migrationResults.push({
          migration: migration.name,
          status: 'failed',
          error: error.message,
        });

        // Stop on first failure
        break;
      }
    }

    // Close connection
    await sql.end();

    // Update tenant database status in central DB
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const allSuccess = migrationResults.every(r => r.status === 'success');

    await supabaseClient
      .from('tenant_databases')
      .update({
        status: allSuccess ? 'active' : 'failed',
        last_synced_migration_id: allSuccess ? MIGRATIONS[MIGRATIONS.length - 1].name : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenantDatabaseId);

    return new Response(
      JSON.stringify({
        success: allSuccess,
        tenantDatabaseId,
        migrations: migrationResults,
        message: allSuccess
          ? 'All migrations completed successfully'
          : 'Some migrations failed',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: allSuccess ? 200 : 500,
      }
    );
  } catch (error) {
    console.error('❌ Error running tenant migrations:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

/**
 * Load migration SQL from file
 */
async function loadMigrationSQL(migrationName: string): Promise<string> {
  // In production, these would be bundled or fetched from storage
  // For now, we'll return the SQL inline
  
  const migrations: Record<string, string> = {
    '20250930120000_tenant_ecommerce_schema': await fetch(
      new URL('../../../supabase/migrations/20250930120000_tenant_ecommerce_schema.sql', import.meta.url)
    ).then(r => r.text()),
    
    '20250930140000_payment_providers_shopping_feeds': await fetch(
      new URL('../../../supabase/migrations/20250930140000_payment_providers_shopping_feeds.sql', import.meta.url)
    ).then(r => r.text()),
  };

  const sql = migrations[migrationName];
  
  if (!sql) {
    throw new Error(`Migration not found: ${migrationName}`);
  }

  return sql;
}

/**
 * Generate checksum for migration (simple hash)
 */
function generateChecksum(content: string): string {
  // Simple checksum - in production use crypto
  return btoa(content).slice(0, 32);
}

console.log('✅ Tenant migration runner initialized');