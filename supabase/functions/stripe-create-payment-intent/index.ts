/**
 * STRIPE CREATE PAYMENT INTENT
 * 
 * Creates a payment intent for checkout with automatic platform fee
 * Uses Stripe Connect for direct charges to webshop's account
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

    const { 
      organizationId, 
      orderId,
      amount, 
      currency = 'eur',
      customerEmail,
      metadata = {} 
    } = await req.json();

    if (!organizationId || !amount || !orderId) {
      throw new Error('Organization ID, order ID and amount are required');
    }

    console.log(`💳 Creating payment intent for order: ${orderId}`);

    // Get tenant database and payment provider
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: tenantDb } = await supabaseClient
      .from('tenant_databases')
      .select('id, connection_string_encrypted')
      .eq('organization_id', organizationId)
      .single();

    if (!tenantDb) {
      throw new Error('Tenant database not found');
    }

    // Decrypt connection string
    const decryptResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/decrypt-connection-string`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({ tenantDatabaseId: tenantDb.id }),
      }
    );

    const { connectionString } = await decryptResponse.json();

    // Get Stripe account from tenant database
    const { default: postgres } = await import('https://deno.land/x/postgresjs@v3.4.3/mod.js');
    const sql = postgres(connectionString);

    const [paymentProvider] = await sql`
      SELECT 
        stripe_account_id,
        platform_fee_percentage,
        platform_fee_fixed
      FROM payment_providers
      WHERE provider = 'stripe' 
        AND is_active = true
        AND is_primary = true
      LIMIT 1
    `;

    if (!paymentProvider?.stripe_account_id) {
      throw new Error('No active Stripe account found for this store');
    }

    // Calculate platform fee (e.g., 2.5% + €0.25)
    const feePercentage = paymentProvider.platform_fee_percentage || 0;
    const feeFixed = paymentProvider.platform_fee_fixed || 0;
    const applicationFeeAmount = Math.round(
      (amount * (feePercentage / 100)) + (feeFixed * 100)
    );

    console.log(`💰 Amount: €${amount / 100}, Platform Fee: €${applicationFeeAmount / 100}`);

    // Create Payment Intent with Connect
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // in cents
      currency: currency,
      application_fee_amount: applicationFeeAmount > 0 ? applicationFeeAmount : undefined,
      transfer_data: {
        destination: paymentProvider.stripe_account_id,
      },
      metadata: {
        organizationId,
        orderId,
        ...metadata,
      },
      receipt_email: customerEmail,
      description: `Order ${orderId}`,
    });

    // Store transaction in tenant database
    await sql`
      INSERT INTO payment_transactions (
        order_id,
        payment_provider_id,
        provider_transaction_id,
        amount,
        currency,
        status,
        platform_fee,
        net_amount,
        provider_metadata,
        created_at
      ) 
      SELECT 
        ${orderId}::uuid,
        id,
        ${paymentIntent.id},
        ${amount / 100},
        ${currency},
        'pending',
        ${applicationFeeAmount / 100},
        ${(amount - applicationFeeAmount) / 100},
        ${JSON.stringify({ 
          client_secret: paymentIntent.client_secret 
        })},
        NOW()
      FROM payment_providers
      WHERE stripe_account_id = ${paymentProvider.stripe_account_id}
    `;

    await sql.end();

    return new Response(
      JSON.stringify({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: amount,
        applicationFee: applicationFeeAmount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Error creating payment intent:', error);

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

console.log('✅ Stripe payment intent creator initialized');
