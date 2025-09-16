import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    sku?: string;
  };
}

interface CheckoutData {
  items: CartItem[];
  organizationId: string;
  shippingInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  addInsurance?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { items, organizationId, shippingInfo, addInsurance }: CheckoutData = await req.json();

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get user if authenticated
    let user = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const { data } = await supabaseClient.auth.getUser(token);
        user = data.user;
      } catch (error) {
        console.log("No authenticated user");
      }
    }

    // Calculate totals
    const subtotal = items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
    const insuranceAmount = addInsurance ? 2.95 : 0;
    const total = subtotal + insuranceAmount;

    // Create line items for Stripe
    const lineItems = items.map(item => ({
      price_data: {
        currency: "eur",
        product_data: {
          name: item.product.name,
          metadata: {
            product_id: item.product.id,
            sku: item.product.sku || ""
          }
        },
        unit_amount: Math.round(item.product.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Add insurance if selected
    if (addInsurance) {
      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: "Verzekering - Bescherming tegen schade, verlies en diefstal",
          },
          unit_amount: 295, // €2.95 in cents
        },
        quantity: 1,
      });
    }

    // Check for existing Stripe customer
    let customerId;
    if (shippingInfo.email) {
      const customers = await stripe.customers.list({ 
        email: shippingInfo.email, 
        limit: 1 
      });
      
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        // Create new customer
        const customer = await stripe.customers.create({
          email: shippingInfo.email,
          name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
          phone: shippingInfo.phone,
          address: {
            line1: shippingInfo.address,
            city: shippingInfo.city,
            postal_code: shippingInfo.postalCode,
            country: shippingInfo.country === "Nederland" ? "NL" : shippingInfo.country,
          }
        });
        customerId = customer.id;
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : shippingInfo.email,
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get("origin")}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/checkout`,
      shipping_address_collection: {
        allowed_countries: ['NL', 'BE', 'DE', 'FR', 'AT', 'LU', 'CH'],
      },
      billing_address_collection: "required",
      metadata: {
        user_id: user?.id || "",
        organization_id: organizationId,
        subtotal: subtotal.toString(),
        insurance: addInsurance ? "true" : "false",
      }
    });

    // Optionally create order record
    if (user) {
      const supabaseService = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );

      await supabaseService.from("orders").insert({
        user_id: user.id,
        organization_id: organizationId,
        order_number: `ORD-${Date.now()}`,
        status: "pending",
        total_amount: total,
        subtotal: subtotal,
        shipping_amount: 0,
        tax_amount: 0,
        discount_amount: 0,
        shipping_first_name: shippingInfo.firstName,
        shipping_last_name: shippingInfo.lastName,
        shipping_address_line1: shippingInfo.address,
        shipping_city: shippingInfo.city,
        shipping_postal_code: shippingInfo.postalCode,
        shipping_country: shippingInfo.country,
        shipping_phone: shippingInfo.phone,
        billing_first_name: shippingInfo.firstName,
        billing_last_name: shippingInfo.lastName,
        billing_address_line1: shippingInfo.address,
        billing_city: shippingInfo.city,
        billing_postal_code: shippingInfo.postalCode,
        billing_country: shippingInfo.country,
        billing_phone: shippingInfo.phone,
      });
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Payment error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});