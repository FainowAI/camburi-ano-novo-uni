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
    const { email } = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    console.log("Checking subscription status for:", email);
    
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Find customer by email
    const customers = await stripe.customers.list({ email, limit: 1 });
    
    if (customers.data.length === 0) {
      return new Response(JSON.stringify({ 
        hasSubscription: false,
        message: "No customer found with this email"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    
    // Get subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      price: "price_1S9QRcAmzfZZxsYVIjc7a0pi", // Installment price ID
      limit: 10,
    });

    const activeSubscriptions = subscriptions.data.filter(sub => 
      sub.status === "active" || sub.status === "trialing"
    );

    if (activeSubscriptions.length === 0) {
      return new Response(JSON.stringify({ 
        hasSubscription: false,
        message: "No active installment subscription found"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const subscription = activeSubscriptions[0];
    
    // Get payment history
    const invoices = await stripe.invoices.list({
      subscription: subscription.id,
      status: "paid",
      limit: 10,
    });

    const paidInvoices = invoices.data.filter(invoice => invoice.status === "paid");
    const paymentsRemaining = Math.max(0, 3 - paidInvoices.length);

    return new Response(JSON.stringify({
      hasSubscription: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        payments_made: paidInvoices.length,
        payments_remaining: paymentsRemaining,
        total_amount_paid: paidInvoices.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0),
        next_payment_date: paymentsRemaining > 0 ? new Date(subscription.current_period_end * 1000).toISOString() : null,
        metadata: subscription.metadata,
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error checking subscription status:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});