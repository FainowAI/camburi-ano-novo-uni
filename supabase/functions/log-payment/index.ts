import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[LOG-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Parse request body
    const { name, email, telefone, payment_method, pagou_pix } = await req.json();
    logStep("Request data received", { name, email, telefone, payment_method, pagou_pix });

    // Validate required fields
    if (!name || !email || !payment_method) {
      throw new Error("Missing required fields: name, email, and payment_method are required");
    }

    // Create Supabase client with service role key to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Insert payment log with all provided fields
    const paymentData = {
      name,
      email,
      telefone: telefone || null,
      payment_method,
      aceitou: true,
      ...(pagou_pix !== undefined && { pagou_pix })
    };

    const { data, error } = await supabaseClient
      .from('payment_logs')
      .insert(paymentData)
      .select()
      .single();

    if (error) {
      logStep("Database error", { error });
      throw new Error(`Database error: ${error.message}`);
    }

    logStep("Payment log created successfully", { id: data.id });

    return new Response(
      JSON.stringify({ success: true, id: data.id }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in log-payment", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});