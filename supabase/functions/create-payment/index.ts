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
    const { name, email, cpf, payment_mode } = await req.json();

    console.log("Creating payment session for:", { name, email, cpf, payment_mode });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Define price IDs and session configuration based on payment mode
    const isInstallment = payment_mode === "installment";
    const priceId = isInstallment 
      ? "price_1S9QRcAmzfZZxsYVIjc7a0pi" // Parcelado: 3x R$300
      : "price_1S9QIuAmzfZZxsYV3Xc12rKG"; // À vista: R$900
    const mode = isInstallment ? "subscription" : "payment";

    // Generate a unique session ID for tracking
    const trackingSessionId = crypto.randomUUID();

    // Base session configuration
    const sessionConfig = {
      customer_email: email,
      client_reference_id: trackingSessionId, // For webhook tracking
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: mode,
      success_url: `${req.headers.get("origin") || "http://localhost:8080"}/?payment=success&mode=${payment_mode}&session=${trackingSessionId}`,
      cancel_url: `${req.headers.get("origin") || "http://localhost:8080"}/?payment=cancelled&session=${trackingSessionId}`,
      automatic_tax: { enabled: false },
      metadata: {
        customer_name: name,
        customer_cpf: cpf || "",
        payment_mode: payment_mode || "one_time",
        tracking_session_id: trackingSessionId,
      },
      // Configurações para pagamento no Brasil
      locale: "pt-BR",
      payment_method_types: ["card"],
      billing_address_collection: "required",
    };

    // Add subscription-specific configuration for installment payments
    if (isInstallment) {
      sessionConfig.subscription_data = {
        metadata: {
          installment_plan: "3_months",
          total_amount: "90000", // R$900 em centavos
          customer_name: name,
          customer_cpf: cpf || "",
        },
      };
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log("Checkout session created:", session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error creating payment session:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});