/**
 * STRIPE CREATE ONBOARDING LINK
 * 
 * Generates Stripe Connect onboarding URL for webshop owners
 * to complete KYC and activate payments
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.11.0?target=deno';

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

    const { accountId, refreshUrl, returnUrl } = await req.json();

    if (!accountId) {
      throw new Error('Stripe account ID is required');
    }

    console.log(`🔗 Creating onboarding link for account: ${accountId}`);

    // Create Account Link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl || `${Deno.env.get('FRONTEND_URL')}/admin/settings/payments?refresh=true`,
      return_url: returnUrl || `${Deno.env.get('FRONTEND_URL')}/admin/settings/payments?setup=complete`,
      type: 'account_onboarding',
    });

    console.log(`✅ Onboarding link created: ${accountLink.url}`);

    return new Response(
      JSON.stringify({
        success: true,
        url: accountLink.url,
        expiresAt: accountLink.expires_at,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Error creating onboarding link:', error);

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

console.log('✅ Stripe onboarding link creator initialized');
