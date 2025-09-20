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
    const { name, email, cpf } = await req.json();

    console.log("Creating payment session for:", { name, email, cpf });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Create checkout session for guest payment
    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      line_items: [
        {
          price: "price_1S9QIuAmzfZZxsYV3Xc12rKG", // ID do preço criado
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin") || "http://localhost:8080"}/?payment=success`,
      cancel_url: `${req.headers.get("origin") || "http://localhost:8080"}/?payment=cancelled`,
      automatic_tax: { enabled: false },
      metadata: {
        customer_name: name,
        customer_cpf: cpf || "",
      },
      // Configurações para pagamento no Brasil
      locale: "pt-BR",
      payment_method_types: ["card"], // Apenas cartão por enquanto
      billing_address_collection: "required",
    });

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