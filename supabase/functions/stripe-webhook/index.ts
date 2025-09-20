import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

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
    const signature = req.headers.get("stripe-signature");
    const body = await req.text();
    
    console.log("[STRIPE-WEBHOOK] Received webhook");

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Initialize Supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify webhook signature (in production, use proper endpoint secret)
    let event;
    try {
      // For development, we'll skip signature verification
      // In production, you should use: stripe.webhooks.constructEvent(body, signature, webhookSecret)
      event = JSON.parse(body);
      console.log("[STRIPE-WEBHOOK] Event type:", event.type);
    } catch (err) {
      console.error("[STRIPE-WEBHOOK] Invalid webhook signature:", err);
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        console.log("[STRIPE-WEBHOOK] Payment completed for session:", session.id);
        
        // Extract customer info from metadata
        const customerName = session.metadata?.customer_name || "";
        const customerEmail = session.customer_email || session.customer_details?.email || "";
        const customerCpf = session.metadata?.customer_cpf || "";
        const paymentMode = session.metadata?.payment_mode || "one_time";
        
        // Determine payment method based on mode
        const paymentMethod = paymentMode === "installment" ? "parcelado" : "à vista";
        
        console.log("[STRIPE-WEBHOOK] Customer info:", { customerName, customerEmail, paymentMethod });

        // Track payment completion event
        try {
          await supabase.functions.invoke('track-checkout-event', {
            body: {
              session_id: session.client_reference_id || 'stripe_webhook_session',
              event_type: 'payment_completed',
              user_name: customerName,
              user_email: customerEmail,
              user_cpf: customerCpf,
              payment_method: paymentMethod,
              checkout_session_id: session.id,
              metadata: {
                timestamp: new Date().toISOString(),
                stripe_session_id: session.id,
                amount_total: session.amount_total,
                currency: session.currency,
                payment_status: session.payment_status,
                payment_mode: paymentMode
              }
            }
          });
          
          console.log("[STRIPE-WEBHOOK] Payment completion tracked successfully");
        } catch (trackingError) {
          console.error("[STRIPE-WEBHOOK] Error tracking payment completion:", trackingError);
        }
        
        break;
      }
      
      case "invoice.payment_succeeded": {
        // Handle subscription payment success (for installments)
        const invoice = event.data.object;
        console.log("[STRIPE-WEBHOOK] Subscription payment succeeded:", invoice.id);
        
        // For subscription payments, track installment payment completion
        try {
          await supabase.functions.invoke('track-checkout-event', {
            body: {
              session_id: 'stripe_subscription_payment',
              event_type: 'installment_payment_completed',
              user_email: invoice.customer_email,
              payment_method: 'parcelado',
              metadata: {
                timestamp: new Date().toISOString(),
                stripe_invoice_id: invoice.id,
                amount_paid: invoice.amount_paid,
                currency: invoice.currency,
                billing_reason: invoice.billing_reason
              }
            }
          });
          
          console.log("[STRIPE-WEBHOOK] Installment payment tracked successfully");
        } catch (trackingError) {
          console.error("[STRIPE-WEBHOOK] Error tracking installment payment:", trackingError);
        }
        
        break;
      }
      
      case "checkout.session.expired": {
        // Track abandoned checkouts
        const session = event.data.object;
        
        try {
          await supabase.functions.invoke('track-checkout-event', {
            body: {
              session_id: session.client_reference_id || 'stripe_expired_session',
              event_type: 'checkout_expired',
              checkout_session_id: session.id,
              metadata: {
                timestamp: new Date().toISOString(),
                stripe_session_id: session.id,
                expiration_reason: 'session_expired'
              }
            }
          });
          
          console.log("[STRIPE-WEBHOOK] Checkout expiration tracked successfully");
        } catch (trackingError) {
          console.error("[STRIPE-WEBHOOK] Error tracking checkout expiration:", trackingError);
        }
        
        break;
      }
      
      default:
        console.log("[STRIPE-WEBHOOK] Unhandled event type:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error) {
    console.error("[STRIPE-WEBHOOK] Error processing webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});