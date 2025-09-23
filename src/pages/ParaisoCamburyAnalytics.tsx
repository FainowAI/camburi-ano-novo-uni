import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { RefreshCcw, Download, Users, CreditCard, TrendingUp, TrendingDown, Activity, Target, MousePointer, Clock, Eye, DollarSign, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminHeader from "@/components/AdminHeader";

interface PaymentLog {
  id: string;
  name: string;
  email: string;
  telefone?: string;
  payment_method: string;
  created_at: string;
  aceitou: boolean;
  pagou_pix?: any;
}

interface CheckoutEvent {
  id: string;
  session_id: string;
  event_type: string;
  user_name?: string;
  user_email?: string;
  payment_method?: string;
  checkout_session_id?: string;
  use_number?: string;
  metadata: any;
  created_at: string;
}

interface FunnelMetrics {
  total_sessions: number;
  form_fields_completed: number;
  form_submitted: number;
  pix_modal_opened: number;
  pix_payment_confirmed: number;
  pix_modal_closed: number;
  payment_type_selected: number;
  abandonment_rate: number;
}

interface EventTypeMetrics {
  event_type: string;
  count: number;
  percentage: number;
  avg_time_to_event?: number;
}

interface SessionAnalytics {
  total_unique_sessions: number;
  avg_session_duration: number;
  bounce_rate: number;
  conversion_funnel: {
    visitors: number;
    form_completions: number;
    payment_selections: number;
    pix_opens: number;
    pix_confirmations: number;
  };
}

interface ConversionMetrics {
  total_visits: number;
  form_submissions: number;
  conversions: number;
  conversion_rate: number;
  revenue: number;
  average_order_value: number;
}

const ParaisoCamburyAnalytics = () => {
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([]);
  const [checkoutEvents, setCheckoutEvents] = useState<CheckoutEvent[]>([]);
  const [eventTypeMetrics, setEventTypeMetrics] = useState<EventTypeMetrics[]>([]);
  const [sessionAnalytics, setSessionAnalytics] = useState<SessionAnalytics>({
    total_unique_sessions: 0,
    avg_session_duration: 0,
    bounce_rate: 0,
    conversion_funnel: {
      visitors: 0,
      form_completions: 0,
      payment_selections: 0,
      pix_opens: 0,
      pix_confirmations: 0,
    },
  });
  const [metrics, setMetrics] = useState<ConversionMetrics>({
    total_visits: 0,
    form_submissions: 0,
    conversions: 0,
    conversion_rate: 0,
    revenue: 0,
    average_order_value: 0,
  });
  const [funnelMetrics, setFunnelMetrics] = useState<FunnelMetrics>({
    total_sessions: 0,
    form_fields_completed: 0,
    form_submitted: 0,
    pix_modal_opened: 0,
    pix_payment_confirmed: 0,
    pix_modal_closed: 0,
    payment_type_selected: 0,
    abandonment_rate: 0,
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [logsResponse, eventsResponse] = await Promise.all([
        supabase.from('payment_logs').select('*').order('created_at', { ascending: false }),
        supabase.from('checkout_events').select('*').order('created_at', { ascending: false })
      ]);

      if (logsResponse.error) throw logsResponse.error;
      if (eventsResponse.error) throw eventsResponse.error;
      
      setPaymentLogs(logsResponse.data || []);
      setCheckoutEvents(eventsResponse.data || []);
      
      // Calculate advanced metrics
      const logs = logsResponse.data || [];
      const events = eventsResponse.data || [];
      
      const totalVisits = new Set(events.map(e => e.session_id)).size;
      const formSubmissions = events.filter(e => e.event_type === 'form_submitted').length;
      const conversions = logs.filter(l => l.aceitou && l.pagou_pix).length;
      const revenue = conversions * 810; // R$ 810 per conversion
      
      setMetrics({
        total_visits: totalVisits,
        form_submissions: formSubmissions,
        conversions,
        conversion_rate: totalVisits > 0 ? (conversions / totalVisits) * 100 : 0,
        revenue,
        average_order_value: conversions > 0 ? revenue / conversions : 0,
      });

      // Calculate detailed funnel metrics
      const uniqueSessions = new Set(events.map(e => e.session_id)).size;
      const formSubmitted = events.filter(e => e.event_type === 'form_submitted').length;
      const pixModalOpened = events.filter(e => e.event_type === 'pix_modal_opened').length;
      const pixPaymentConfirmed = events.filter(e => e.event_type === 'pix_payment_confirmed').length;
      const pixModalClosed = events.filter(e => e.event_type === 'pix_modal_closed').length;
      const paymentTypeSelected = events.filter(e => e.event_type === 'payment_type_selected').length;

      const abandonmentRate = pixModalOpened > 0 ? 
        ((pixModalOpened - pixPaymentConfirmed) / pixModalOpened) * 100 : 0;

      setFunnelMetrics({
        total_sessions: uniqueSessions,
        form_fields_completed: 0, // Removido evento form_field_completed
        form_submitted: formSubmitted,
        pix_modal_opened: pixModalOpened,
        pix_payment_confirmed: pixPaymentConfirmed,
        pix_modal_closed: pixModalClosed,
        payment_type_selected: paymentTypeSelected,
        abandonment_rate: abandonmentRate,
      });

      // Calculate event type metrics (filter out form_field_completed)
      const filteredEvents = events.filter(e => e.event_type !== 'form_field_completed');
      const eventTypeCounts = filteredEvents.reduce((acc, event) => {
        acc[event.event_type] = (acc[event.event_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const totalEvents = filteredEvents.length;
      const eventMetrics = Object.entries(eventTypeCounts)
        .map(([event_type, count]) => ({
          event_type,
          count,
          percentage: totalEvents > 0 ? (count / totalEvents) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count);

      setEventTypeMetrics(eventMetrics);

      // Calculate session analytics
      const sessionData = events.reduce((acc, event) => {
        if (!acc[event.session_id]) {
          acc[event.session_id] = {
            start_time: new Date(event.created_at),
            end_time: new Date(event.created_at),
            events: []
          };
        }
        acc[event.session_id].events.push(event);
        acc[event.session_id].end_time = new Date(event.created_at);
        return acc;
      }, {} as Record<string, any>);

      const avgSessionDuration = Object.values(sessionData).reduce((total: number, session: any) => {
        return total + (session.end_time.getTime() - session.start_time.getTime());
      }, 0) / Math.max(uniqueSessions, 1);

      setSessionAnalytics({
        total_unique_sessions: uniqueSessions,
        avg_session_duration: avgSessionDuration / (1000 * 60), // Convert to minutes
        bounce_rate: 0, // Will calculate based on single-event sessions
        conversion_funnel: {
          visitors: uniqueSessions,
          form_completions: new Set(events.filter(e => e.event_type === 'form_submitted').map(e => e.session_id)).size,
          payment_selections: new Set(events.filter(e => e.event_type === 'payment_type_selected').map(e => e.session_id)).size,
          pix_opens: new Set(events.filter(e => e.event_type === 'pix_modal_opened').map(e => e.session_id)).size,
          pix_confirmations: new Set(events.filter(e => e.event_type === 'pix_payment_confirmed').map(e => e.session_id)).size,
        },
      });
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <AdminHeader />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Analytics - Paraíso Cambury</h2>
          <Button onClick={fetchData} disabled={loading}>
            <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Visitas Totais</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total_visits}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Formulários Enviados</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.form_submissions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversões</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.conversions}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.conversion_rate.toFixed(2)}% taxa de conversão
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {metrics.revenue.toLocaleString('pt-BR')}
              </div>
              <p className="text-xs text-muted-foreground">
                Ticket médio: R$ {metrics.average_order_value.toFixed(0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Funnel Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Funil de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Sessões Únicas', value: funnelMetrics.total_sessions, percentage: 100 },
                { name: 'Formulário Enviado', value: funnelMetrics.form_submitted, percentage: (funnelMetrics.form_submitted / Math.max(funnelMetrics.total_sessions, 1)) * 100 },
                { name: 'Modal PIX Aberto', value: funnelMetrics.pix_modal_opened, percentage: (funnelMetrics.pix_modal_opened / Math.max(funnelMetrics.total_sessions, 1)) * 100 },
                { name: 'PIX Confirmado', value: funnelMetrics.pix_payment_confirmed, percentage: (funnelMetrics.pix_payment_confirmed / Math.max(funnelMetrics.total_sessions, 1)) * 100 },
              ].map((step, index) => (
                <div key={step.name} className="flex items-center space-x-4">
                  <div className="w-32 text-sm font-medium">{step.name}</div>
                  <div className="flex-1">
                    <Progress value={step.percentage} className="h-2" />
                  </div>
                  <div className="w-20 text-sm text-right">
                    {step.value} ({isNaN(step.percentage) ? 0 : step.percentage.toFixed(1)}%)
                  </div>
                  {index < 3 && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* New Event Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Event Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Distribuição de Eventos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {eventTypeMetrics.slice(0, 8).map((metric) => (
                  <div key={metric.event_type} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      <span className="text-sm font-medium capitalize">
                        {metric.event_type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{metric.count}</Badge>
                      <span className="text-xs text-muted-foreground w-12">
                        {metric.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Session Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Análise de Sessões
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Sessões Únicas</p>
                    <p className="text-2xl font-bold">{sessionAnalytics.total_unique_sessions}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Duração Média</p>
                    <p className="text-2xl font-bold">{sessionAnalytics.avg_session_duration.toFixed(1)}min</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Funil de Conversão por Sessão</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Visitantes', value: sessionAnalytics.conversion_funnel.visitors },
                      { label: 'Formulários Completos', value: sessionAnalytics.conversion_funnel.form_completions },
                      { label: 'Pagamentos Selecionados', value: sessionAnalytics.conversion_funnel.payment_selections },
                      { label: 'PIX Aberto', value: sessionAnalytics.conversion_funnel.pix_opens },
                      { label: 'PIX Confirmado', value: sessionAnalytics.conversion_funnel.pix_confirmations },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between text-sm">
                        <span>{item.label}</span>
                        <Badge variant="outline">{item.value}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Abandonment Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Análise de Abandono
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Taxa de Abandono PIX</p>
                <p className="text-2xl font-bold text-destructive">
                  {funnelMetrics.abandonment_rate.toFixed(1)}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Modal PIX Fechado</p>
                <p className="text-2xl font-bold">{funnelMetrics.pix_modal_closed}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Tipos de Pagamento</p>
                <p className="text-2xl font-bold">{funnelMetrics.payment_type_selected}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="payments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="payments">Pagamentos</TabsTrigger>
            <TabsTrigger value="events">Eventos de Checkout</TabsTrigger>
            <TabsTrigger value="detailed">Análise Detalhada</TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Logs de Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">{log.name}</TableCell>
                          <TableCell>{log.email}</TableCell>
                          <TableCell>{log.telefone || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={log.payment_method === 'pix' ? 'default' : 'secondary'}>
                              {log.payment_method}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Badge variant={log.aceitou ? 'default' : 'destructive'}>
                                {log.aceitou ? 'Aceito' : 'Pendente'}
                              </Badge>
                              {log.pagou_pix && (
                                <Badge variant="default">PIX Pago</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(log.created_at).toLocaleString('pt-BR')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Eventos de Checkout</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Evento</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Sessão</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {checkoutEvents.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell>
                            <Badge variant={
                              event.event_type.includes('error') ? 'destructive' :
                              event.event_type.includes('success') ? 'default' :
                              'secondary'
                            }>
                              {event.event_type}
                            </Badge>
                          </TableCell>
                          <TableCell>{event.user_name || '-'}</TableCell>
                          <TableCell>{event.user_email || '-'}</TableCell>
                          <TableCell>{event.payment_method || '-'}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {event.session_id.substring(0, 8)}...
                          </TableCell>
                          <TableCell>
                            {new Date(event.created_at).toLocaleString('pt-BR')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="detailed" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Real-time Event Stream */}
              <Card>
                <CardHeader>
                  <CardTitle>Stream de Eventos Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-auto">
                    {checkoutEvents.slice(0, 20).map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-2 border rounded-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {event.event_type}
                          </Badge>
                          <span className="text-sm">
                            {event.user_name || event.user_email || 'Anônimo'}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(event.created_at).toLocaleTimeString('pt-BR')}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Event Metadata Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Análise de Metadados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* PIX Events Analysis */}
                    <div>
                      <h4 className="font-medium mb-2">Eventos PIX</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span>Modal Aberto:</span>
                          <span>{checkoutEvents.filter(e => e.event_type === 'pix_modal_opened').length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pagamento Confirmado:</span>
                          <span>{checkoutEvents.filter(e => e.event_type === 'pix_payment_confirmed').length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Modal Fechado:</span>
                          <span>{checkoutEvents.filter(e => e.event_type === 'pix_modal_closed').length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Código Copiado:</span>
                          <span>{checkoutEvents.filter(e => e.event_type === 'pix_code_copied').length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Form Interaction Analysis */}
                    <div>
                      <h4 className="font-medium mb-2">Interações do Formulário</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span>Formulários Enviados:</span>
                          <span>{checkoutEvents.filter(e => e.event_type === 'form_submitted').length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Validações de Erro:</span>
                          <span>{checkoutEvents.filter(e => e.event_type === 'form_validation_error').length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Session Behavior */}
                    <div>
                      <h4 className="font-medium mb-2">Comportamento de Sessão</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span>Páginas Carregadas:</span>
                          <span>{checkoutEvents.filter(e => e.event_type === 'page_loaded').length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tabs Ocultas:</span>
                          <span>{checkoutEvents.filter(e => e.event_type === 'tab_hidden').length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tabs Visíveis:</span>
                          <span>{checkoutEvents.filter(e => e.event_type === 'tab_visible').length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Scroll Depth:</span>
                          <span>{checkoutEvents.filter(e => e.event_type === 'scroll_depth').length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Event Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Timeline Detalhada de Eventos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Tipo de Evento</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Sessão</TableHead>
                        <TableHead>Metadados</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {checkoutEvents.slice(0, 50).map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="text-xs">
                            {new Date(event.created_at).toLocaleString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {event.event_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {event.user_name || event.user_email || '-'}
                          </TableCell>
                          <TableCell className="text-xs font-mono">
                            {event.session_id.substring(0, 8)}...
                          </TableCell>
                          <TableCell className="text-xs max-w-xs truncate">
                            {event.metadata ? JSON.stringify(event.metadata).substring(0, 100) + '...' : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ParaisoCamburyAnalytics;