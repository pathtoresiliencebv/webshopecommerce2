import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const signature = req.headers.get("stripe-signature");
    const body = await req.text();

    if (!signature) {
      console.error("No Stripe signature found");
      return new Response("No signature", { status: 400 });
    }

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        Deno.env.get("STRIPE_WEBHOOK_SECRET") || ""
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response("Invalid signature", { status: 400 });
    }

    console.log("Received webhook event:", event.type);

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Checkout session completed:", session.id);

        const userId = session.metadata?.user_id;
        const organizationId = session.metadata?.organization_id;
        const subtotal = parseFloat(session.metadata?.subtotal || "0");
        const insurance = session.metadata?.insurance === "true";

        if (!userId || !organizationId) {
          console.error("Missing user_id or organization_id in session metadata");
          break;
        }

        // Find the pending order
        const { data: orders, error: orderError } = await supabaseService
          .from("orders")
          .select("*")
          .eq("user_id", userId)
          .eq("organization_id", organizationId)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(1);

        if (orderError) {
          console.error("Error finding order:", orderError);
          break;
        }

        if (!orders || orders.length === 0) {
          console.error("No pending order found for user");
          break;
        }

        const order = orders[0];

        // Update order status to completed
        const { error: updateError } = await supabaseService
          .from("orders")
          .update({
            status: "completed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id);

        if (updateError) {
          console.error("Error updating order status:", updateError);
          break;
        }

        // Get the user's cart items to create order items
        const { data: cartItems, error: cartError } = await supabaseService
          .from("shopping_cart")
          .select(`
            id,
            product_id,
            quantity,
            products!inner (
              id,
              name,
              price,
              sku
            )
          `)
          .eq("user_id", userId)
          .eq("organization_id", organizationId);

        if (cartError) {
          console.error("Error fetching cart items:", cartError);
          break;
        }

        // Create order items
        if (cartItems && cartItems.length > 0) {
          const orderItems = cartItems.map(item => ({
            order_id: order.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: Number(item.products.price),
            total_price: Number(item.products.price) * item.quantity,
            product_name: item.products.name,
            product_sku: item.products.sku || null,
          }));

          const { error: orderItemsError } = await supabaseService
            .from("order_items")
            .insert(orderItems);

          if (orderItemsError) {
            console.error("Error creating order items:", orderItemsError);
            break;
          }

          // Clear the cart
          const { error: clearCartError } = await supabaseService
            .from("shopping_cart")
            .delete()
            .eq("user_id", userId)
            .eq("organization_id", organizationId);

          if (clearCartError) {
            console.error("Error clearing cart:", clearCartError);
          }

          // Update product stock quantities
          for (const item of cartItems) {
            const { error: stockError } = await supabaseService
              .from("products")
              .update({
                stock_quantity: supabaseService.rpc('decrement_stock', {
                  product_id: item.product_id,
                  quantity: item.quantity
                })
              })
              .eq("id", item.product_id);

            if (stockError) {
              console.error("Error updating stock:", stockError);
            }
          }
        }

        console.log("Order processed successfully:", order.id);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("Payment succeeded:", paymentIntent.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});