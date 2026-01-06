import { useState } from "react";
import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DateRangePicker } from "@/components/DateRangePicker";
import { DateRange } from "react-day-picker";
import { subDays, startOfDay, endOfDay, differenceInDays } from "date-fns";
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
  ArrowDownLeft,
  ArrowUpDown,
  CreditCard,
  RotateCcw,
  Receipt,
  Banknote,
  BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanExpiration } from "@/hooks/usePlanExpiration";
import { useFunnelMetrics } from "@/hooks/useFunnelMetrics";
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
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
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
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfDay(subDays(new Date(), 6)),
    to: endOfDay(new Date()),
  });
  
  const {
    metrics,
    funnelOverviews,
    isLoading: metricsLoading,
  } = useFunnelMetrics(dateRange);

  const periodLabel = dateRange?.from && dateRange?.to 
    ? `${differenceInDays(dateRange.to, dateRange.from) + 1} dias`
    : 'Últimos 7 dias';

  // Financial metrics
  const totalRevenue = metrics.totalPaidAmountCents / 100;
  const availableBalance = totalRevenue * 0.95; // 5% de taxa simulada
  const pendingBalance = 0; // Saldo a liberar
  const retentionBalance = 0; // Em retenção
  const totalWithdrawn = 0; // Saque total realizado

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
              Acompanhe o desempenho dos seus funis
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              className="w-[220px]"
            />
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
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Left Column - Chart */}
          <div className="lg:col-span-2">
            <Card className="border-border/50 h-full">
              <CardHeader className="pb-2 px-4 sm:px-6">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <TrendingUp className="w-4 h-4 text-success" />
                  Evolução de Vendas - {periodLabel}
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
                      <p className="text-sm">Dados indisponíveis para o período selecionado</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Financial Stats */}
          <div className="space-y-3">
            {/* Available Balance */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-success">
                        R$ {availableBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-muted-foreground">Disponível</p>
                    </div>
                  </div>
                  <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground font-semibold">
                    SACAR
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Pending Balance */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-yellow-500">
                      R$ {pendingBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground">Saldo à liberar</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Retention Balance */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-orange-500">
                      R$ {retentionBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground">Em retenção</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Withdrawn */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-telegram/10 flex items-center justify-center">
                    <ArrowUpDown className="w-5 h-5 text-telegram" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-success">
                      R$ {totalWithdrawn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground">Saque total realizado</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Conversion Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <p className="text-lg font-bold">0.00%</p>
                  <p className="text-xs text-muted-foreground">Aprovação Cartão</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4 text-yellow-500" />
                </div>
                <div>
                  <p className="text-lg font-bold">0.00%</p>
                  <p className="text-xs text-muted-foreground">Chargeback</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className="text-lg font-bold">0.00%</p>
                  <p className="text-xs text-muted-foreground">Reembolsos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-telegram/10 flex items-center justify-center">
                  <Banknote className="w-4 h-4 text-telegram" />
                </div>
                <div>
                  <p className="text-lg font-bold">0.00%</p>
                  <p className="text-xs text-muted-foreground">Conversão Pix</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 col-span-2 sm:col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-purple-500" />
                </div>
                <div>
                  <p className="text-lg font-bold">0.00%</p>
                  <p className="text-xs text-muted-foreground">Conversão Boleto</p>
                </div>
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