import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { RefreshCcw, MousePointer, Clock, Eye, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminHeader from "@/components/AdminHeader";

interface EventData {
  id: string;
  session_id: string;
  event_type: string;
  user_name: string | null;
  user_email: string | null;
  metadata: any;
  created_at: string;
}

const GranularAnalyticsDashboard = () => {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('checkout_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
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
    fetchEvents();
  }, []);

  // Calculate metrics
  const totalSessions = new Set(events.map(e => e.session_id)).size;
  const conversionEvents = events.filter(e => e.event_type === 'pix_payment_confirmed');
  const formFocusEvents = events.filter(e => e.event_type === 'form_field_focused');
  const avgTimeToAction = events
    .filter(e => e.metadata?.time_since_load)
    .reduce((acc, e) => acc + (e.metadata.time_since_load / 1000), 0) / events.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <AdminHeader />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Analytics Granular</h2>
          <Button onClick={fetchEvents} disabled={loading}>
            <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessões Totais</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSessions}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversões PIX</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionEvents.length}</div>
            <p className="text-xs text-muted-foreground">
              {totalSessions > 0 ? ((conversionEvents.length / totalSessions) * 100).toFixed(1) : 0}% taxa
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interações de Form</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formFocusEvents.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgTimeToAction.toFixed(0)}s</div>
            <p className="text-xs text-muted-foreground">até ação</p>
          </CardContent>
        </Card>
      </div>

      {/* Event Timeline */}
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Eventos Recentes</TabsTrigger>
          <TabsTrigger value="funnel">Funil Detalhado</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Timeline de Eventos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Horário</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.slice(0, 100).map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="text-xs">
                        {new Date(event.created_at).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          event.event_type.includes('error') ? 'destructive' :
                          event.event_type.includes('confirmed') ? 'default' :
                          'secondary'
                        }>
                          {event.event_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {event.user_name || event.user_email || 'Anônimo'}
                      </TableCell>
                      <TableCell className="text-xs max-w-xs truncate">
                        {JSON.stringify(event.metadata)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Funil de Conversão Detalhado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: 'Página Carregada', event: 'page_loaded' },
                { name: 'Tipo Pagamento Selecionado', event: 'payment_type_selected' },
                { name: 'Campo Focado', event: 'form_field_focused' },
                { name: 'Formulário Enviado', event: 'form_submitted' },
                { name: 'Modal PIX Aberto', event: 'pix_modal_opened' },
                { name: 'Código PIX Copiado', event: 'pix_code_copied' },
                { name: 'Pagamento Confirmado', event: 'pix_payment_confirmed' }
              ].map((step, index) => {
                const stepEvents = events.filter(e => e.event_type === step.event);
                const percentage = totalSessions > 0 ? (stepEvents.length / totalSessions) * 100 : 0;
                
                return (
                  <div key={step.event} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{step.name}</span>
                      <span>{stepEvents.length} usuários ({percentage.toFixed(1)}%)</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </div>
  );
};

export default GranularAnalyticsDashboard;