import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Download, Users, CreditCard } from "lucide-react";
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

const ParaisoCamburyAnalytics = () => {
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPaymentLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payment_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payment logs:', error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os dados dos usuários.",
          variant: "destructive"
        });
        return;
      }

      setPaymentLogs(data || []);
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

  useEffect(() => {
    fetchPaymentLogs();
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
            onClick={fetchPaymentLogs}
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

        {/* Table */}
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
      </div>
    </div>
  );
};

export default ParaisoCamburyAnalytics;