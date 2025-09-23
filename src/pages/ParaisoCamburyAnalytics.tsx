import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { RefreshCcw, Download, Users, CreditCard, TrendingUp, TrendingDown, Activity, Target } from "lucide-react";
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
  payment_type_selected: number;
  form_submitted: number;
  checkout_started: number;
  redirected_to_stripe: number;
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
    payment_type_selected: 0,
    form_submitted: 0,
    checkout_started: 0,
    redirected_to_stripe: 0,
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
      
      // Calculate metrics
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

      // Calculate funnel metrics
      const uniqueSessions = new Set(events.map(e => e.session_id)).size;
      const paymentSelected = events.filter(e => e.event_type === 'payment_type_selected').length;
      const formSubmitted = events.filter(e => e.event_type === 'form_submitted').length;
      const checkoutStarted = events.filter(e => e.event_type === 'checkout_started').length;
      const redirectedToStripe = events.filter(e => e.event_type === 'redirected_to_stripe').length;

      setFunnelMetrics({
        total_sessions: uniqueSessions,
        payment_type_selected: paymentSelected,
        form_submitted: formSubmitted,
        checkout_started: checkoutStarted,
        redirected_to_stripe: redirectedToStripe,
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
                { name: 'Método Selecionado', value: funnelMetrics.payment_type_selected, percentage: (funnelMetrics.payment_type_selected / funnelMetrics.total_sessions) * 100 },
                { name: 'Formulário Enviado', value: funnelMetrics.form_submitted, percentage: (funnelMetrics.form_submitted / funnelMetrics.total_sessions) * 100 },
                { name: 'Checkout Iniciado', value: funnelMetrics.checkout_started, percentage: (funnelMetrics.checkout_started / funnelMetrics.total_sessions) * 100 },
                { name: 'Redirecionado Stripe', value: funnelMetrics.redirected_to_stripe, percentage: (funnelMetrics.redirected_to_stripe / funnelMetrics.total_sessions) * 100 },
              ].map((step, index) => (
                <div key={step.name} className="flex items-center space-x-4">
                  <div className="w-32 text-sm font-medium">{step.name}</div>
                  <div className="flex-1">
                    <Progress value={step.percentage} className="h-2" />
                  </div>
                  <div className="w-20 text-sm text-right">
                    {step.value} ({isNaN(step.percentage) ? 0 : step.percentage.toFixed(1)}%)
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="payments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="payments">Pagamentos</TabsTrigger>
            <TabsTrigger value="events">Eventos de Checkout</TabsTrigger>
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
        </Tabs>
      </div>
    </div>
  );
};

export default ParaisoCamburyAnalytics;