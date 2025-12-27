import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/DateRangePicker";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { DateRange } from "react-day-picker";
import { 
  Loader2, 
  DollarSign, 
  TrendingUp, 
  ShoppingCart, 
  CheckCircle, 
  Clock, 
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay, differenceInDays, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface Payment {
  id: string;
  funnel_id: string;
  product_id: string | null;
  lead_name: string | null;
  amount_cents: number;
  status: string;
  created_at: string;
  paid_at: string | null;
  delivered_at: string | null;
  funnel_products?: {
    name: string;
  } | null;
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1'];

const PaymentsPage = () => {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfDay(subDays(new Date(), 6)),
    to: endOfDay(new Date()),
  });

  // Fetch payments
  const { data: payments, isLoading, refetch } = useQuery({
    queryKey: ['payments-dashboard', user?.id, dateRange?.from?.toISOString(), dateRange?.to?.toISOString()],
    queryFn: async () => {
      if (!user?.id || !dateRange?.from) return [];
      
      const startDate = startOfDay(dateRange.from).toISOString();
      const endDate = dateRange.to ? endOfDay(dateRange.to).toISOString() : endOfDay(new Date()).toISOString();
      
      const { data, error } = await supabase
        .from('funnel_payments')
        .select('*, funnel_products(name)')
        .eq('user_id', user.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Payment[];
    },
    enabled: !!user?.id && !!dateRange?.from
  });

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!payments) return null;

    const approved = payments.filter(p => p.status === 'approved');
    const pending = payments.filter(p => p.status === 'pending');
    const rejected = payments.filter(p => ['rejected', 'cancelled'].includes(p.status));

    const totalRevenue = approved.reduce((sum, p) => sum + p.amount_cents, 0);
    const pendingRevenue = pending.reduce((sum, p) => sum + p.amount_cents, 0);
    const conversionRate = payments.length > 0 
      ? (approved.length / payments.length) * 100 
      : 0;

    return {
      totalRevenue,
      pendingRevenue,
      totalTransactions: payments.length,
      approvedCount: approved.length,
      pendingCount: pending.length,
      rejectedCount: rejected.length,
      conversionRate,
    };
  }, [payments]);

  // Chart data - daily revenue
  const dailyRevenueData = useMemo(() => {
    if (!payments || !dateRange?.from) return [];

    const from = dateRange.from;
    const to = dateRange.to || new Date();
    const days = eachDayOfInterval({ start: from, end: to });

    return days.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const displayDate = format(date, 'dd/MM');
      
      const dayPayments = payments.filter(p => {
        if (p.status !== 'approved' || !p.paid_at) return false;
        return format(new Date(p.paid_at), 'yyyy-MM-dd') === dateStr;
      });

      return {
        date: displayDate,
        revenue: dayPayments.reduce((sum, p) => sum + p.amount_cents / 100, 0),
        count: dayPayments.length,
      };
    });
  }, [payments, dateRange]);

  // Status distribution for pie chart
  const statusData = useMemo(() => {
    if (!metrics) return [];
    return [
      { name: 'Aprovados', value: metrics.approvedCount, color: '#10b981' },
      { name: 'Pendentes', value: metrics.pendingCount, color: '#f59e0b' },
      { name: 'Rejeitados', value: metrics.rejectedCount, color: '#ef4444' },
    ].filter(d => d.value > 0);
  }, [metrics]);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents / 100);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success">Aprovado</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-warning/20 text-warning">Pendente</Badge>;
      case 'rejected':
      case 'cancelled':
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const periodLabel = dateRange?.from && dateRange?.to 
    ? `${differenceInDays(dateRange.to, dateRange.from) + 1} dias`
    : '';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Pagamentos</h1>
            <p className="text-muted-foreground mt-1">
              Acompanhe suas vendas e transações
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              className="w-[280px]"
            />
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                  <DollarSign className="w-4 h-4 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">
                    {formatCurrency(metrics?.totalRevenue || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {metrics?.approvedCount || 0} vendas aprovadas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Pendente</CardTitle>
                  <Clock className="w-4 h-4 text-warning" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-warning">
                    {formatCurrency(metrics?.pendingRevenue || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {metrics?.pendingCount || 0} aguardando pagamento
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total de Transações</CardTitle>
                  <ShoppingCart className="w-4 h-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metrics?.totalTransactions || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {periodLabel && `nos últimos ${periodLabel}`}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
                  <TrendingUp className="w-4 h-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(metrics?.conversionRate || 0).toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    PIX gerados → pagos
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Revenue Chart */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Receita por Dia</CardTitle>
                  <CardDescription>Evolução das vendas no período</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyRevenueData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis 
                          tickFormatter={(v) => `R$${v}`} 
                          className="text-xs"
                        />
                        <Tooltip 
                          formatter={(value: number) => [formatCurrency(value * 100), 'Receita']}
                          contentStyle={{ 
                            background: 'hsl(var(--background))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar 
                          dataKey="revenue" 
                          fill="hsl(var(--primary))" 
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Status Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Status dos Pagamentos</CardTitle>
                  <CardDescription>Distribuição por status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {statusData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              background: 'hsl(var(--background))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        Sem dados no período
                      </div>
                    )}
                  </div>
                  <div className="flex justify-center gap-4 mt-4">
                    {statusData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm">{item.name}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transactions Table */}
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Transações</CardTitle>
                <CardDescription>Últimas transações realizadas</CardDescription>
              </CardHeader>
              <CardContent>
                {payments && payments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">Data</th>
                          <th className="text-left py-3 px-4 font-medium">Produto</th>
                          <th className="text-left py-3 px-4 font-medium">Lead</th>
                          <th className="text-left py-3 px-4 font-medium">Valor</th>
                          <th className="text-left py-3 px-4 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.slice(0, 20).map((payment) => (
                          <tr key={payment.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4 text-sm">
                              {format(new Date(payment.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              {payment.funnel_products?.name || '-'}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              {payment.lead_name || 'Anônimo'}
                            </td>
                            <td className="py-3 px-4 text-sm font-medium">
                              {formatCurrency(payment.amount_cents)}
                            </td>
                            <td className="py-3 px-4">
                              {getStatusBadge(payment.status)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma transação encontrada no período
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PaymentsPage;
