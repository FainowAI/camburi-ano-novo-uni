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

interface PaymentLog {
  id: string;
  name: string;
  email: string;
  cpf: string | null;
  payment_method: string;
  created_at: string;
  aceitou: boolean;
}

interface CheckoutEvent {
  id: string;
  session_id: string;
  event_type: string;
  user_name: string | null;
  user_email: string | null;
  user_cpf: string | null;
  payment_method: string | null;
  checkout_session_id: string | null;
  metadata: any;
  created_at: string;
}

interface FunnelMetrics {
  total_sessions: number;
  payment_type_selected: number;
  form_submitted: number;
  checkout_started: number;
  redirected_to_stripe: number;
  payment_completed: number;
  conversion_rate: number;
  abandonment_rate: number;
}

const ParaisoCamburyAnalytics = () => {
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([]);
  const [checkoutEvents, setCheckoutEvents] = useState<CheckoutEvent[]>([]);
  const [funnelMetrics, setFunnelMetrics] = useState<FunnelMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch payment logs
      const { data: paymentData, error: paymentError } = await supabase
        .from('payment_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (paymentError) {
        console.error('Error fetching payment logs:', paymentError);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os dados dos usuários.",
          variant: "destructive"
        });
        return;
      }

      // Fetch checkout events
      const { data: eventData, error: eventError } = await supabase
        .from('checkout_events')
        .select('*')
        .order('created_at', { ascending: false });

      if (eventError) {
        console.error('Error fetching checkout events:', eventError);
      }

      setPaymentLogs(paymentData || []);
      setCheckoutEvents(eventData || []);
      
      // Calculate funnel metrics
      if (eventData) {
        calculateFunnelMetrics(eventData);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateFunnelMetrics = (events: CheckoutEvent[]) => {
    const uniqueSessions = new Set(events.map(e => e.session_id));
    const total_sessions = uniqueSessions.size;
    
    const eventsByType = events.reduce((acc, event) => {
      if (!acc[event.event_type]) {
        acc[event.event_type] = new Set();
      }
      acc[event.event_type].add(event.session_id);
      return acc;
    }, {} as Record<string, Set<string>>);

    const payment_type_selected = eventsByType['payment_type_selected']?.size || 0;
    const form_submitted = eventsByType['form_submitted']?.size || 0;
    const checkout_started = eventsByType['checkout_started']?.size || 0;
    const redirected_to_stripe = eventsByType['redirected_to_stripe']?.size || 0;
    const payment_completed = eventsByType['payment_completed']?.size || 0;

    const conversion_rate = total_sessions > 0 ? (payment_completed / total_sessions) * 100 : 0;
    const abandonment_rate = total_sessions > 0 ? ((total_sessions - payment_completed) / total_sessions) * 100 : 0;

    setFunnelMetrics({
      total_sessions,
      payment_type_selected,
      form_submitted,
      checkout_started,
      redirected_to_stripe,
      payment_completed,
      conversion_rate,
      abandonment_rate
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCPF = (cpf: string | null) => {
    if (!cpf) return '-';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const getPaymentMethodBadge = (method: string) => {
    const color = method === 'à vista' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
    return (
      <Badge className={color}>
        <CreditCard className="w-3 h-3 mr-1" />
        {method}
      </Badge>
    );
  };

  const exportToCSV = () => {
    const headers = ['Nome', 'Email', 'CPF', 'Método de Pagamento', 'Data de Cadastro'];
    const csvContent = [
      headers.join(','),
      ...paymentLogs.map(log => [
        `"${log.name}"`,
        `"${log.email}"`,
        `"${formatCPF(log.cpf)}"`,
        `"${log.payment_method}"`,
        `"${formatDate(log.created_at)}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `paraiso_cambury_usuarios_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export realizado",
      description: "Os dados foram exportados para CSV com sucesso.",
    });
  };

  const totalUsers = paymentLogs.length;
  const aVistaCount = paymentLogs.filter(log => log.payment_method === 'à vista').length;
  const parceladoCount = paymentLogs.filter(log => log.payment_method === 'parcelado').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Analytics - Paraíso Cambury
          </h1>
          <p className="text-gray-400">
            Informações das pessoas que preencheram o formulário
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/10 border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">
                Total de Usuários
              </CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalUsers}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">
                Pagamento À Vista
              </CardTitle>
              <CreditCard className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{aVistaCount}</div>
              <p className="text-xs text-gray-400">
                {totalUsers > 0 ? Math.round((aVistaCount / totalUsers) * 100) : 0}% do total
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">
                Pagamento Parcelado
              </CardTitle>
              <CreditCard className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{parceladoCount}</div>
              <p className="text-xs text-gray-400">
                {totalUsers > 0 ? Math.round((parceladoCount / totalUsers) * 100) : 0}% do total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <Button
            onClick={fetchData}
            disabled={loading}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>

          <Button
            onClick={exportToCSV}
            disabled={totalUsers === 0}
            className="bg-primary hover:bg-primary/90"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="funnel" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/10 border-white/20">
            <TabsTrigger value="funnel" className="text-white data-[state=active]:bg-primary data-[state=active]:text-white">
              Funil de Conversão
            </TabsTrigger>
            <TabsTrigger value="users" className="text-white data-[state=active]:bg-primary data-[state=active]:text-white">
              Lista de Usuários
            </TabsTrigger>
          </TabsList>

          {/* Funnel Analysis Tab */}
          <TabsContent value="funnel" className="space-y-6">
            {/* Conversion Metrics */}
            {funnelMetrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white/10 border-white/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-200">
                      Taxa de Conversão
                    </CardTitle>
                    {funnelMetrics.conversion_rate > 5 ? (
                      <TrendingUp className="h-4 w-4 text-green-400" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-400" />
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {funnelMetrics.conversion_rate.toFixed(1)}%
                    </div>
                    <p className="text-xs text-gray-400">
                      {funnelMetrics.payment_completed} de {funnelMetrics.total_sessions} sessões converteram
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 border-white/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-200">
                      Taxa de Abandono
                    </CardTitle>
                    <Activity className="h-4 w-4 text-orange-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {funnelMetrics.abandonment_rate.toFixed(1)}%
                    </div>
                    <p className="text-xs text-gray-400">
                      {funnelMetrics.total_sessions - funnelMetrics.payment_completed} sessões abandonaram o processo
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Funnel Steps */}
            {funnelMetrics && (
              <Card className="bg-white/10 border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Etapas do Funil de Conversão
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[
                    { label: "Sessões Iniciadas", count: funnelMetrics.total_sessions, percentage: 100 },
                    { label: "Método de Pagamento Selecionado", count: funnelMetrics.payment_type_selected, percentage: (funnelMetrics.payment_type_selected / funnelMetrics.total_sessions) * 100 },
                    { label: "Formulário Preenchido", count: funnelMetrics.form_submitted, percentage: (funnelMetrics.form_submitted / funnelMetrics.total_sessions) * 100 },
                    { label: "Checkout Iniciado", count: funnelMetrics.checkout_started, percentage: (funnelMetrics.checkout_started / funnelMetrics.total_sessions) * 100 },
                    { label: "Redirecionado para Stripe", count: funnelMetrics.redirected_to_stripe, percentage: (funnelMetrics.redirected_to_stripe / funnelMetrics.total_sessions) * 100 },
                    { label: "Pagamento Concluído", count: funnelMetrics.payment_completed, percentage: (funnelMetrics.payment_completed / funnelMetrics.total_sessions) * 100 },
                  ].map((step, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-200 text-sm font-medium">{step.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold">{step.count}</span>
                          <span className="text-gray-400 text-sm">({step.percentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                      <Progress 
                        value={step.percentage} 
                        className="h-2 bg-gray-700" 
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Recent Events */}
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Eventos Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    <span className="ml-2 text-white">Carregando...</span>
                  </div>
                ) : checkoutEvents.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    Nenhum evento encontrado
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/20">
                          <TableHead className="text-gray-200">Evento</TableHead>
                          <TableHead className="text-gray-200">Usuário</TableHead>
                          <TableHead className="text-gray-200">Método</TableHead>
                          <TableHead className="text-gray-200">Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {checkoutEvents.slice(0, 10).map((event) => (
                          <TableRow key={event.id} className="border-white/10">
                            <TableCell className="text-white font-medium">
                              {event.event_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </TableCell>
                            <TableCell className="text-gray-300">
                              {event.user_name || event.user_email || '-'}
                            </TableCell>
                            <TableCell className="text-gray-300">
                              {event.payment_method ? getPaymentMethodBadge(event.payment_method) : '-'}
                            </TableCell>
                            <TableCell className="text-gray-300">
                              {formatDate(event.created_at)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users List Tab */}
          <TabsContent value="users">
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white">
                  Lista de Usuários Cadastrados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    <span className="ml-2 text-white">Carregando...</span>
                  </div>
                ) : totalUsers === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    Nenhum usuário encontrado
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/20">
                          <TableHead className="text-gray-200">Nome</TableHead>
                          <TableHead className="text-gray-200">Email</TableHead>
                          <TableHead className="text-gray-200">CPF</TableHead>
                          <TableHead className="text-gray-200">Método de Pagamento</TableHead>
                          <TableHead className="text-gray-200">Data de Cadastro</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paymentLogs.map((log) => (
                          <TableRow key={log.id} className="border-white/10">
                            <TableCell className="text-white font-medium">
                              {log.name}
                            </TableCell>
                            <TableCell className="text-gray-300">
                              {log.email}
                            </TableCell>
                            <TableCell className="text-gray-300">
                              {formatCPF(log.cpf)}
                            </TableCell>
                            <TableCell>
                              {getPaymentMethodBadge(log.payment_method)}
                            </TableCell>
                            <TableCell className="text-gray-300">
                              {formatDate(log.created_at)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ParaisoCamburyAnalytics;