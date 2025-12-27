import { useState } from "react";
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

  // Only 3 essential stats
  const statsCards = [
    {
      title: "Leads no Período",
      value: metrics.leadsToday.toString(),
      icon: Users,
      color: "text-telegram",
      bgColor: "bg-telegram/10",
    },
    {
      title: "Funis Ativos",
      value: metrics.activeFunnels.toString(),
      icon: GitBranch,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Faturamento",
      value: `R$ ${(metrics.totalPaidAmountCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      icon: DollarSign,
      color: "text-success",
      bgColor: "bg-success/10",
    },
  ];

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

        {/* Stats Grid - 3 cards only */}
        <div className="grid gap-4 md:grid-cols-3">
          {statsCards.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="glass-card border-border/50">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Sales Chart */}
        <Card className="glass-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <TrendingUp className="w-4 h-4 text-success" />
              Evolução de Vendas - {periodLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              {metrics.pixChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics.pixChartData}>
                    <defs>
                      <linearGradient id="colorPixAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="label" 
                      tick={{ fontSize: 11 }} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      tick={{ fontSize: 11 }} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(v) => `R$${v}`} 
                      width={60}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Faturamento']}
                      contentStyle={{ 
                        background: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))', 
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="hsl(var(--success))" 
                      strokeWidth={2} 
                      fill="url(#colorPixAmount)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p className="text-sm">Nenhum pagamento no período</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Funnel Overview Table */}
        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <GitBranch className="w-4 h-4" />
              Seus Funis
            </CardTitle>
            <Link to="/funnels">
              <Button variant="ghost" size="sm" className="text-xs">
                Ver todos
                <ArrowUpRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {funnelOverviews.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <GitBranch className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">Nenhum funil criado</p>
                <p className="text-sm mb-4">Crie seu primeiro funil para começar</p>
                <Link to="/funnels/new">
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Criar Funil
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs">Nome</TableHead>
                    <TableHead className="text-xs">Bot</TableHead>
                    <TableHead className="text-xs text-center">Leads</TableHead>
                    <TableHead className="text-xs text-center">Conversão</TableHead>
                    <TableHead className="text-xs text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {funnelOverviews.slice(0, 5).map((funnel) => (
                    <TableRow
                      key={funnel.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/funnels/${funnel.id}`)}
                    >
                      <TableCell className="font-medium text-sm">{funnel.name}</TableCell>
                      <TableCell>
                        {funnel.botName ? (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Bot className="w-3 h-3" />
                            {funnel.botName}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        <span className="font-medium">{funnel.leadsStarted}</span>
                        <span className="text-muted-foreground mx-1">/</span>
                        <span className="text-success">{funnel.leadsFinished}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={funnel.conversionRate >= 50 ? "default" : "secondary"}
                          className={funnel.conversionRate >= 50 ? "bg-success" : ""}
                        >
                          {funnel.conversionRate}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {funnel.isActive ? (
                          <Badge className="bg-success gap-1" variant="default">
                            <Play className="w-3 h-3" />
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <Pause className="w-3 h-3" />
                            Pausado
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
