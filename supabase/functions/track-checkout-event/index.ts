import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[TRACK-CHECKOUT-EVENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const requestData = await req.json();
    logStep("Request data received", requestData);

    const {
      session_id,
      event_type,
      user_name,
      user_email,
      payment_method,
      checkout_session_id,
      metadata = {}
    } = requestData;

    // Validate required fields
    if (!event_type) {
      throw new Error("event_type is required");
    }

    // Insert checkout event
    const { data, error } = await supabaseClient
      .from('checkout_events')
      .insert({
        session_id: session_id || undefined, // Let DB generate if not provided
        event_type,
        user_name,
        user_email,
        payment_method,
        checkout_session_id,
        metadata
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    logStep("Checkout event created successfully", { id: data.id });

    return new Response(JSON.stringify({ 
      success: true, 
      event_id: data.id,
      session_id: data.session_id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    logStep("ERROR in track-checkout-event", { 
      message: errorMessage,
      stack: errorStack,
      error: error
    });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: error instanceof Error ? error.stack : String(error)
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});