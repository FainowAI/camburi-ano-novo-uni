import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Managing installment subscriptions...");
    
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Get all active subscriptions for the installment product
    const subscriptions = await stripe.subscriptions.list({
      price: "price_1S9QRcAmzfZZxsYVIjc7a0pi", // Installment price ID
      status: "active",
      limit: 100,
    });

    console.log(`Found ${subscriptions.data.length} active installment subscriptions`);

    const results = [];

    for (const subscription of subscriptions.data) {
      try {
        // Get payment history for this subscription
        const invoices = await stripe.invoices.list({
          subscription: subscription.id,
          status: "paid",
          limit: 10,
        });

        const paidInvoices = invoices.data.filter(invoice => invoice.status === "paid");
        console.log(`Subscription ${subscription.id} has ${paidInvoices.length} paid invoices`);

        // If 3 payments have been made, cancel the subscription
        if (paidInvoices.length >= 3) {
          console.log(`Canceling subscription ${subscription.id} after 3 payments`);
          
          const canceledSubscription = await stripe.subscriptions.update(subscription.id, {
            cancel_at_period_end: true,
            metadata: {
              ...subscription.metadata,
              auto_canceled_after_installments: "true",
              canceled_at: new Date().toISOString(),
            }
          });

          results.push({
            subscription_id: subscription.id,
            action: "canceled",
            payments_made: paidInvoices.length,
            customer_email: subscription.customer,
          });
        } else {
          results.push({
            subscription_id: subscription.id,
            action: "active",
            payments_made: paidInvoices.length,
            payments_remaining: 3 - paidInvoices.length,
          });
        }
      } catch (error) {
        console.error(`Error processing subscription ${subscription.id}:`, error);
        results.push({
          subscription_id: subscription.id,
          action: "error",
          error: error.message,
        });
      }
    }

    console.log("Installment management results:", results);

    return new Response(JSON.stringify({ 
      success: true,
      processed: results.length,
      results 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error managing installments:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});