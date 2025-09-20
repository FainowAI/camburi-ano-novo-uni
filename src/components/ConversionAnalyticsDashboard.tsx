import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
  CreditCard, 
  AlertCircle,
  RefreshCw,
  Calendar,
  BarChart3,
  PieChart
} from "lucide-react";

interface FunnelStep {
  count: number;
  percentage: string;
}

interface FunnelMetrics {
  total_sessions: number;
  steps: {
    form_submitted: FunnelStep;
    payment_modal_opened: FunnelStep;
    payment_method_selected: FunnelStep;
    checkout_started: FunnelStep;
    payment_completed: FunnelStep;
  };
  abandonment_rate: string;
  overall_conversion: string;
}

interface PaymentMethodMetric {
  payment_method: string;
  count: number;
  percentage: string;
}

interface DailyMetric {
  date: string;
  events: number;
  payment_selections: number;
  total_activity: number;
}

interface AnalyticsData {
  period: string;
  funnel: FunnelMetrics;
  daily: DailyMetric[];
  payment_methods: PaymentMethodMetric[];
  total_events: number;
  generated_at: string;
}

export const ConversionAnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  const fetchAnalytics = async (days = 30) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: analyticsError } = await supabase.functions.invoke('get-conversion-analytics', {
        body: { days }
      });

      if (analyticsError) {
        throw analyticsError;
      }

      setAnalytics(data);
      console.log('Analytics data loaded:', data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(selectedPeriod);
  }, [selectedPeriod]);

  const renderFunnelStep = (stepName: string, step: FunnelStep, isLast = false) => {
    const percentage = parseFloat(step.percentage);
    const isGoodConversion = percentage >= 70;
    const isMediumConversion = percentage >= 40;
    
    return (
      <div key={stepName} className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-200 capitalize">
            {stepName.replace(/_/g, ' ')}
          </span>
          <Badge variant={isGoodConversion ? "default" : isMediumConversion ? "secondary" : "destructive"}>
            {step.percentage}%
          </Badge>
        </div>
        <div className="flex justify-between items-center text-xs text-gray-400">
          <span>{step.count} usuários</span>
          {!isLast && <span>↓</span>}
        </div>
        <Progress 
          value={percentage} 
          className={`h-2 ${isGoodConversion ? 'bg-green-900' : isMediumConversion ? 'bg-yellow-900' : 'bg-red-900'}`}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            <span className="ml-4 text-white">Carregando métricas...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="bg-red-900/20 border-red-700">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Erro ao carregar dados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-300">{error}</p>
              <Button 
                onClick={() => fetchAnalytics(selectedPeriod)} 
                className="mt-4"
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const totalSessions = analytics.funnel.total_sessions;
  const completedPayments = analytics.funnel.steps.payment_completed.count;
  const abandonmentRate = parseFloat(analytics.funnel.abandonment_rate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Métricas de Conversão
            </h1>
            <p className="text-gray-400">
              Dashboard de análise do funil de pagamentos - {analytics.period}
            </p>
          </div>
          <div className="flex gap-3">
            <select 
              value={selectedPeriod} 
              onChange={(e) => setSelectedPeriod(Number(e.target.value))}
              className="bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2"
            >
              <option value={7}>Últimos 7 dias</option>
              <option value={30}>Últimos 30 dias</option>
              <option value={90}>Últimos 90 dias</option>
            </select>
            <Button 
              onClick={() => fetchAnalytics(selectedPeriod)}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total de Sessões
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalSessions}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Taxa de Conversão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {analytics.funnel.overall_conversion}%
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Pagamentos Concluídos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">{completedPayments}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                {abandonmentRate > 50 ? <TrendingDown className="w-4 h-4 text-red-400" /> : <TrendingUp className="w-4 h-4 text-green-400" />}
                Taxa de Abandono
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${abandonmentRate > 50 ? 'text-red-400' : 'text-green-400'}`}>
                {analytics.funnel.abandonment_rate}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Funnel Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Funil de Conversão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(analytics.funnel.steps).map(([stepName, step], index, array) => 
                renderFunnelStep(stepName, step, index === array.length - 1)
              )}
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Métodos de Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics.payment_methods.map((method) => (
                <div key={method.payment_method} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-200 capitalize">
                      {method.payment_method}
                    </span>
                    <Badge variant="outline">
                      {method.count} ({method.percentage}%)
                    </Badge>
                  </div>
                  <Progress value={parseFloat(method.percentage)} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Daily Activity */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Atividade Diária
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
              {analytics.daily.slice(-7).map((day) => (
                <div key={day.date} className="bg-gray-700 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-400 mb-1">
                    {new Date(day.date).toLocaleDateString('pt-BR', { 
                      day: '2-digit', 
                      month: '2-digit' 
                    })}
                  </div>
                  <div className="text-lg font-bold text-white">{day.total_activity}</div>
                  <div className="text-xs text-gray-400">atividades</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="text-center text-gray-500 text-sm">
          Última atualização: {new Date(analytics.generated_at).toLocaleString('pt-BR')}
        </div>
      </div>
    </div>
  );
};