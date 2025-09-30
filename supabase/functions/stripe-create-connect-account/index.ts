/**
 * STRIPE CREATE CONNECT ACCOUNT
 * 
 * Creates a Stripe Connect Express account for a webshop
 * Allows each store to have its own payment processing
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.11.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const { organizationId, email, country = 'NL', businessType = 'individual' } = await req.json();

    if (!organizationId) {
      throw new Error('Organization ID is required');
    }

    console.log(`🔄 Creating Stripe Connect account for org: ${organizationId}`);

    // Create Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: country,
      email: email,
      business_type: businessType,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      settings: {
        payouts: {
          schedule: {
            interval: 'daily', // Daily automatic payouts
          },
        },
      },
    });

    console.log(`✅ Stripe account created: ${account.id}`);

    // Get tenant database connection for this organization
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get tenant database connection string
    const { data: tenantDb } = await supabaseClient
      .from('tenant_databases')
      .select('id, connection_string_encrypted')
      .eq('organization_id', organizationId)
      .single();

    if (!tenantDb) {
      throw new Error('Tenant database not found');
    }

    // Decrypt connection string via edge function
    const decryptResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/decrypt-connection-string`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({ 
          tenantDatabaseId: tenantDb.id 
        }),
      }
    );

    const { connectionString } = await decryptResponse.json();

    // Connect to tenant database and store Stripe account
    const { default: postgres } = await import('https://deno.land/x/postgresjs@v3.4.3/mod.js');
    const sql = postgres(connectionString);

    await sql`
      INSERT INTO payment_providers (
        provider,
        stripe_account_id,
        stripe_account_status,
        is_active,
        is_primary,
        capabilities,
        created_at
      ) VALUES (
        'stripe',
        ${account.id},
        ${account.charges_enabled ? 'active' : 'pending'},
        ${account.charges_enabled},
        true,
        ${JSON.stringify(account.capabilities)},
        NOW()
      )
      ON CONFLICT (stripe_account_id) 
      DO UPDATE SET 
        stripe_account_status = ${account.charges_enabled ? 'active' : 'pending'},
        is_active = ${account.charges_enabled},
        capabilities = ${JSON.stringify(account.capabilities)},
        updated_at = NOW()
    `;

    await sql.end();

    return new Response(
      JSON.stringify({
        success: true,
        accountId: account.id,
        status: account.charges_enabled ? 'active' : 'pending',
        detailsSubmitted: account.details_submitted,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Error creating Stripe Connect account:', error);

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

console.log('✅ Stripe Connect account creator initialized');
