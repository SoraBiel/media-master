import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { subDays, startOfDay, endOfDay } from "date-fns";
import { DateRange } from "react-day-picker";
import {
  Users,
  GitBranch,
  TrendingUp,
  ArrowUpRight,
  Plus,
  DollarSign,
  Play,
  Pause,
  Bot,
  CheckCircle,
  Wallet,
  Clock,
  ArrowUpDown,
  BarChart3,
  Banknote,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanExpiration } from "@/hooks/usePlanExpiration";
import { useFunnelMetrics } from "@/hooks/useFunnelMetrics";
import { useMercadoPagoIntegration } from "@/hooks/useMercadoPagoIntegration";
import { PlanExpirationModal } from "@/components/PlanExpirationModal";
import { FeatureBlockedOverlay } from "@/components/FeatureBlockedOverlay";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { DashboardBannerCarousel } from "@/components/DashboardBannerCarousel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { isConnected: isMercadoPagoConnected } = useMercadoPagoIntegration();
  const {
    daysRemaining,
    isExpired,
    isSuspended,
    warning,
    planName,
    showWarningModal,
    dismissWarning,
    isFeatureBlocked,
    getBlockReason,
  } = usePlanExpiration();
  
  // Fixed to last 7 days
  const dateRange: DateRange = {
    from: startOfDay(subDays(new Date(), 6)),
    to: endOfDay(new Date()),
  };
  
  const {
    metrics,
    funnelOverviews,
    isLoading: metricsLoading,
  } = useFunnelMetrics(dateRange);

  // Financial metrics based on MercadoPago sales
  const totalRevenue = metrics.totalPaidAmountCents / 100;
  const totalWithdrawn = 0; // Saque total realizado

  // Calculate PIX conversion data for pie chart
  const totalPixGenerated = metrics.pixChartData.reduce((sum, d) => sum + d.count, 0) || 0;
  const paidPixCount = metrics.pixChartData.reduce((sum, d) => sum + d.count, 0); // All in chart are paid
  const pendingPixCount = Math.max(0, totalPixGenerated - paidPixCount);
  
  const pixConversionRate = totalPixGenerated > 0 
    ? ((paidPixCount / totalPixGenerated) * 100).toFixed(1)
    : "0.0";

  const pieChartData = [
    { name: "Pagos", value: paidPixCount, color: "hsl(var(--success))" },
    { name: "Pendentes", value: pendingPixCount || 1, color: "hsl(var(--muted))" },
  ];

  // Only show pie if there's actual data
  const hasPieData = totalPixGenerated > 0;

  return (
    <DashboardLayout>
      {/* Plan Expiration Modal */}
      <PlanExpirationModal
        open={showWarningModal}
        warning={warning}
        planName={planName}
        daysRemaining={daysRemaining}
        onDismiss={dismissWarning}
      />

      {/* Feature Blocked Overlay */}
      {isFeatureBlocked() && (
        <FeatureBlockedOverlay
          reason={getBlockReason() || ""}
          isExpired={isExpired}
          isSuspended={isSuspended}
        />
      )}

      <div className="space-y-6">
        {/* Banner Carousel */}
        <DashboardBannerCarousel />

        {/* Clean Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              Olá, {profile?.full_name?.split(" ")[0] || "usuário"}! 👋
            </h1>
            <p className="text-muted-foreground text-sm">
              Dados dos últimos 7 dias
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <NotificationsPanel />
            <Link to="/funnels/new">
              <Button variant="gradient" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Novo Funil
              </Button>
            </Link>
          </div>
        </div>

        {/* Financial Overview Section */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Left Column - Chart */}
          <Card className="border-border/50">
            <CardHeader className="pb-2 px-4 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="w-4 h-4 text-success" />
                Evolução de Vendas - Últimos 7 dias
                {!isMercadoPagoConnected && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    MercadoPago não conectado
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              <div className="h-[200px]">
                {metrics.pixChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics.pixChartData}>
                      <defs>
                        <linearGradient id="colorPixAmount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="label" 
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} 
                        tickLine={false} 
                        axisLine={false} 
                      />
                      <YAxis 
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} 
                        tickLine={false} 
                        axisLine={false} 
                        tickFormatter={(v) => `R$${v}`} 
                        width={50}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Faturamento']}
                        contentStyle={{ 
                          background: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))', 
                          borderRadius: '6px',
                          fontSize: '12px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="hsl(var(--success))" 
                        strokeWidth={1.5} 
                        fill="url(#colorPixAmount)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <BarChart3 className="w-10 h-10 mb-2 opacity-30" />
                    <p className="text-sm">Dados indisponíveis para o período</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Saque Total */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <ArrowUpDown className="w-4 h-4 text-success" />
                Saque Total Realizado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center h-[180px]">
                <p className="text-5xl font-bold text-success mb-2">
                  R$ {totalWithdrawn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-muted-foreground text-center">
                  Total sacado da sua conta MercadoPago
                </p>
                {!isMercadoPagoConnected && (
                  <Link to="/integrations" className="mt-3">
                    <Button variant="outline" size="sm">
                      Conectar MercadoPago
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PIX Conversion with Pie Chart + Package Stats */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Banknote className="w-4 h-4 text-telegram" />
                Conversão PIX
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="h-[150px] w-[150px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={hasPieData ? pieChartData : [{ name: "Sem dados", value: 1, color: "hsl(var(--muted))" }]}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {(hasPieData ? pieChartData : [{ name: "Sem dados", value: 1, color: "hsl(var(--muted))" }]).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-success">{pixConversionRate}%</p>
                    <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-success" />
                        <span className="text-lg font-semibold">{paidPixCount}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Pagos</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-muted" />
                        <span className="text-lg font-semibold">{pendingPixCount}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Pendentes</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Package Stats */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <BarChart3 className="w-4 h-4 text-telegram" />
                Pacotes Mais Criados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {funnelOverviews.length > 0 ? (
                  <>
                    {funnelOverviews.slice(0, 4).map((funnel, index) => (
                      <div key={funnel.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                            index === 0 ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                          )}>
                            {index + 1}
                          </div>
                          <span className="text-sm font-medium truncate max-w-[150px]">{funnel.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{funnel.leadsStarted} leads</span>
                          <Badge variant={funnel.isActive ? "default" : "secondary"} className="text-xs">
                            {funnel.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {funnelOverviews.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum funil criado ainda
                      </p>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[130px] text-muted-foreground">
                    <GitBranch className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-sm">Nenhum funil encontrado</p>
                    <Link to="/funnels/new" className="mt-2">
                      <Button variant="outline" size="sm">Criar Funil</Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid - 3 cards */}
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Leads no Período</p>
                    <p className="text-2xl font-bold mt-0.5">{metrics.leadsToday}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-telegram/10">
                    <Users className="w-5 h-5 text-telegram" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.05 }}
          >
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Funis Ativos</p>
                    <p className="text-2xl font-bold mt-0.5">{metrics.activeFunnels}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-success/10">
                    <GitBranch className="w-5 h-5 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Faturamento Total</p>
                    <p className="text-2xl font-bold mt-0.5">
                      R$ {(metrics.totalPaidAmountCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-success/10">
                    <DollarSign className="w-5 h-5 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Funnel Overview Table */}
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <GitBranch className="w-4 h-4" />
              Seus Funis
            </CardTitle>
            <Link to="/funnels">
              <Button variant="ghost" size="sm" className="text-xs h-8">
                Ver todos
                <ArrowUpRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {funnelOverviews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="font-medium text-sm">Nenhum funil criado</p>
                <p className="text-xs mb-3">Crie seu primeiro funil para começar</p>
                <Link to="/funnels/new">
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Criar Funil
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:-mx-6">
                <div className="min-w-[500px] px-4 sm:px-6">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-border/50">
                        <TableHead className="text-2xs font-medium">Nome</TableHead>
                        <TableHead className="text-2xs font-medium hidden sm:table-cell">Bot</TableHead>
                        <TableHead className="text-2xs font-medium text-center">Leads</TableHead>
                        <TableHead className="text-2xs font-medium text-center">Conv.</TableHead>
                        <TableHead className="text-2xs font-medium text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {funnelOverviews.slice(0, 5).map((funnel) => (
                        <TableRow
                          key={funnel.id}
                          className="cursor-pointer border-border/50"
                          onClick={() => navigate(`/funnels/${funnel.id}`)}
                        >
                          <TableCell className="font-medium text-xs py-3">{funnel.name}</TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {funnel.botName ? (
                              <span className="flex items-center gap-1 text-2xs text-muted-foreground font-mono">
                                <Bot className="w-3 h-3" />
                                {funnel.botName}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-2xs">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center text-xs py-3">
                            <span className="font-medium">{funnel.leadsStarted}</span>
                            <span className="text-muted-foreground mx-0.5">/</span>
                            <span className="text-success">{funnel.leadsFinished}</span>
                          </TableCell>
                          <TableCell className="text-center py-3">
                            <Badge
                              variant={funnel.conversionRate >= 50 ? "default" : "secondary"}
                              className={cn("text-2xs", funnel.conversionRate >= 50 && "bg-success")}
                            >
                              {funnel.conversionRate}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center py-3">
                            {funnel.isActive ? (
                              <Badge className="bg-success gap-1 text-2xs" variant="default">
                                <Play className="w-2.5 h-2.5" />
                                Ativo
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1 text-2xs">
                                <Pause className="w-2.5 h-2.5" />
                                Pausado
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;