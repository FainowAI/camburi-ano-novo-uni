import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-CONVERSION-ANALYTICS] ${step}${detailsStr}`);
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

    const { days = 30 } = await req.json().catch(() => ({}));
    logStep("Analytics period", { days });

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get funnel metrics from checkout_events
    logStep("Fetching checkout events");
    const { data: checkoutEvents, error: checkoutError } = await supabaseClient
      .from('checkout_events')
      .select('*')
      .gte('created_at', startDate.toISOString());

    if (checkoutError) {
      throw checkoutError;
    }

    // Get payment logs (legacy data)
    logStep("Fetching payment logs");
    const { data: paymentLogs, error: paymentError } = await supabaseClient
      .from('payment_logs')
      .select('*')
      .gte('created_at', startDate.toISOString());

    if (paymentError) {
      throw paymentError;
    }

    // Calculate funnel metrics
    const funnelMetrics = calculateFunnelMetrics(checkoutEvents, paymentLogs);
    const dailyMetrics = calculateDailyMetrics(checkoutEvents, paymentLogs, days);
    const paymentMethodMetrics = calculatePaymentMethodMetrics(checkoutEvents, paymentLogs);

    const analytics = {
      period: `${days} days`,
      funnel: funnelMetrics,
      daily: dailyMetrics,
      payment_methods: paymentMethodMetrics,
      total_events: checkoutEvents.length + paymentLogs.length,
      generated_at: new Date().toISOString()
    };

    logStep("Analytics calculated successfully", analytics);

    return new Response(JSON.stringify(analytics), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in get-conversion-analytics", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

function calculateFunnelMetrics(checkoutEvents: any[], paymentLogs: any[]) {
  // Group events by session_id
  const sessionMap = new Map();
  
  // Add checkout events
  checkoutEvents.forEach(event => {
    if (!sessionMap.has(event.session_id)) {
      sessionMap.set(event.session_id, {
        session_id: event.session_id,
        events: []
      });
    }
    sessionMap.get(event.session_id).events.push(event);
  });

  // Add payment logs (treat each as a session)
  paymentLogs.forEach(log => {
    const sessionId = `legacy_${log.id}`;
    sessionMap.set(sessionId, {
      session_id: sessionId,
      events: [{
        event_type: 'payment_method_selected',
        payment_method: log.payment_method,
        user_email: log.email,
        user_name: log.name,
        created_at: log.created_at
      }]
    });
  });

  // Count funnel steps
  let formSubmitted = 0;
  let paymentModalOpened = 0;
  let paymentMethodSelected = 0;
  let checkoutStarted = 0;
  let paymentCompleted = 0;
  let paymentCancelled = 0;

  sessionMap.forEach(session => {
    const events = session.events.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const eventTypes = events.map(e => e.event_type);

    if (eventTypes.includes('form_submitted')) formSubmitted++;
    if (eventTypes.includes('payment_modal_opened')) paymentModalOpened++;
    if (eventTypes.includes('payment_method_selected')) paymentMethodSelected++;
    if (eventTypes.includes('checkout_started')) checkoutStarted++;
    if (eventTypes.includes('payment_completed')) paymentCompleted++;
    if (eventTypes.includes('payment_cancelled')) paymentCancelled++;
  });

  // Calculate conversion rates
  const totalSessions = sessionMap.size;
  
  return {
    total_sessions: totalSessions,
    steps: {
      form_submitted: {
        count: formSubmitted,
        percentage: totalSessions ? (formSubmitted / totalSessions * 100).toFixed(2) : 0
      },
      payment_modal_opened: {
        count: paymentModalOpened,
        percentage: formSubmitted ? (paymentModalOpened / formSubmitted * 100).toFixed(2) : 0
      },
      payment_method_selected: {
        count: paymentMethodSelected,
        percentage: paymentModalOpened ? (paymentMethodSelected / paymentModalOpened * 100).toFixed(2) : 0
      },
      checkout_started: {
        count: checkoutStarted,
        percentage: paymentMethodSelected ? (checkoutStarted / paymentMethodSelected * 100).toFixed(2) : 0
      },
      payment_completed: {
        count: paymentCompleted,
        percentage: checkoutStarted ? (paymentCompleted / checkoutStarted * 100).toFixed(2) : 0
      }
    },
    abandonment_rate: checkoutStarted ? ((checkoutStarted - paymentCompleted) / checkoutStarted * 100).toFixed(2) : 0,
    overall_conversion: totalSessions ? (paymentCompleted / totalSessions * 100).toFixed(2) : 0
  };
}

function calculateDailyMetrics(checkoutEvents: any[], paymentLogs: any[], days: number) {
  const dailyData = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayEvents = checkoutEvents.filter(e => 
      e.created_at.startsWith(dateStr)
    );
    
    const dayPaymentLogs = paymentLogs.filter(e => 
      e.created_at.startsWith(dateStr)
    );
    
    dailyData.push({
      date: dateStr,
      events: dayEvents.length,
      payment_selections: dayPaymentLogs.length,
      total_activity: dayEvents.length + dayPaymentLogs.length
    });
  }
  
  return dailyData;
}

function calculatePaymentMethodMetrics(checkoutEvents: any[], paymentLogs: any[]) {
  const methodCounts = {};
  
  // Count from checkout events
  checkoutEvents
    .filter(e => e.event_type === 'payment_method_selected' && e.payment_method)
    .forEach(e => {
      methodCounts[e.payment_method] = (methodCounts[e.payment_method] || 0) + 1;
    });
  
  // Count from payment logs
  paymentLogs.forEach(log => {
    methodCounts[log.payment_method] = (methodCounts[log.payment_method] || 0) + 1;
  });
  
  const total = Object.values(methodCounts).reduce((sum: number, count: number) => sum + count, 0);
  
  return Object.entries(methodCounts).map(([method, count]) => ({
    payment_method: method,
    count,
    percentage: total ? ((count as number) / total * 100).toFixed(2) : 0
  })).sort((a, b) => (b.count as number) - (a.count as number));
}