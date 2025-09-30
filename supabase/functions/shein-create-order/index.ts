/**
 * SHEIN CREATE ORDER
 * 
 * Automatically creates order on SHEIN when customer orders
 * a SHEIN-sourced product from your webshop
 * 
 * Flow:
 * 1. Customer orders product (that was imported from SHEIN)
 * 2. This function places order on SHEIN automatically
 * 3. Tracking info is added to customer's order
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SheinOrderRequest {
  organizationId: string;
  orderId: string;
  orderItems: {
    productId: string;
    variantId?: string;
    quantity: number;
  }[];
  shippingAddress: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    phone: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestData: SheinOrderRequest = await req.json();
    const { organizationId, orderId, orderItems, shippingAddress } = requestData;

    console.log(`🛒 Creating SHEIN order for customer order: ${orderId}`);

    // Get tenant database
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

    // Connect to tenant database
    const { default: postgres } = await import('https://deno.land/x/postgresjs@v3.4.3/mod.js');
    const sql = postgres(connectionString);

    // Get SHEIN products info
    const productIds = orderItems.map(item => item.productId);
    const sheinProducts = await sql`
      SELECT 
        id,
        source_platform,
        source_product_id,
        source_url,
        title
      FROM products
      WHERE id = ANY(${productIds})
        AND source_platform = 'shein'
    `;

    if (sheinProducts.length === 0) {
      console.log('⚠️ No SHEIN products found in this order');
      await sql.end();
      
      return new Response(
        JSON.stringify({
          success: true,
          skipped: true,
          message: 'No SHEIN products in this order',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📦 Found ${sheinProducts.length} SHEIN products`);

    // Build SHEIN order payload
    const sheinOrderItems = sheinProducts.map(product => {
      const orderItem = orderItems.find(item => item.productId === product.id);
      
      return {
        product_id: product.source_product_id,
        product_url: product.source_url,
        quantity: orderItem?.quantity || 1,
        // Variant info would go here if available
      };
    });

    // Call SHEIN API (or Chrome Extension webhook)
    // For now, we'll use a webhook approach where Chrome Extension
    // listens for order requests
    
    const sheinOrderPayload = {
      order_reference: orderId,
      items: sheinOrderItems,
      shipping_address: {
        first_name: shippingAddress.firstName,
        last_name: shippingAddress.lastName,
        address_1: shippingAddress.addressLine1,
        address_2: shippingAddress.addressLine2 || '',
        city: shippingAddress.city,
        state: shippingAddress.state || '',
        postcode: shippingAddress.postalCode,
        country: shippingAddress.country,
        phone: shippingAddress.phone,
      },
    };

    // Store SHEIN order request in central database
    // Chrome extension will poll this and execute orders
    await supabaseClient.from('shein_order_queue').insert({
      organization_id: organizationId,
      order_id: orderId,
      shein_payload: sheinOrderPayload,
      status: 'pending',
      created_at: new Date().toISOString(),
    });

    // Update order with SHEIN order info
    await sql`
      UPDATE orders
      SET 
        internal_note = COALESCE(internal_note, '') || E'\n🛒 SHEIN auto-order queued',
        updated_at = NOW()
      WHERE id = ${orderId}
    `;

    await sql.end();

    console.log(`✅ SHEIN order queued successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        sheinProductsCount: sheinProducts.length,
        queuedForProcessing: true,
        message: 'SHEIN order queued for automatic placement',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Error creating SHEIN order:', error);

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

console.log('✅ SHEIN order creator initialized');
