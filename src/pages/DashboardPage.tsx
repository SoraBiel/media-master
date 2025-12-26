import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  GitBranch,
  MessageSquare,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Plus,
  MessageCircle,
  CreditCard,
  Zap,
  Radio,
  Play,
  Pause,
  Wifi,
  WifiOff,
  RefreshCw,
  Megaphone,
  Bot,
  LayoutTemplate,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { usePlanExpiration } from "@/hooks/usePlanExpiration";
import { useFunnelMetrics } from "@/hooks/useFunnelMetrics";
import { PlanExpirationModal } from "@/components/PlanExpirationModal";
import { FeatureBlockedOverlay } from "@/components/FeatureBlockedOverlay";
import { TelegramSandbox } from "@/components/TelegramSandbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { currentPlan, hasActiveSubscription, getDaysRemaining } = useSubscription();
  const {
    daysRemaining,
    expiresAt,
    isExpired,
    isSuspended,
    warning,
    planName,
    showWarningModal,
    dismissWarning,
    isFeatureBlocked,
    getBlockReason,
  } = usePlanExpiration();
  const {
    metrics,
    funnelOverviews,
    recentActivity,
    isLoading: metricsLoading,
    refetch,
  } = useFunnelMetrics();

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const eventDate = new Date(date);
    const diffMs = now.getTime() - eventDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "agora";
    if (diffMins < 60) return `há ${diffMins} min`;
    if (diffHours < 24) return `há ${diffHours}h`;
    return `há ${diffDays}d`;
  };

  const formatDaysRemaining = () => {
    const days = getDaysRemaining();
    if (days === null) {
      if (currentPlan?.slug && currentPlan.slug !== "free") {
        return "Plano ativo";
      }
      return "Sem assinatura";
    }
    if (days === 0) return "Expira hoje";
    if (days === 1) return "1 dia restante";
    return `${days} dias restantes`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "pix_generated":
        return <CreditCard className="w-4 h-4 text-warning" />;
      case "pix_paid":
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "pix_generated":
        return "bg-warning/20";
      case "pix_paid":
        return "bg-success/20";
      default:
        return "bg-muted/20";
    }
  };

  // Stats cards data (removed "Status do Bot")
  const statsCards = [
    {
      title: "Leads Hoje",
      value: metrics.leadsToday.toString(),
      icon: Users,
      color: "text-telegram",
      bgColor: "bg-telegram/10",
      description: "Novos leads nas últimas 24h",
    },
    {
      title: "Funis Ativos",
      value: metrics.activeFunnels.toString(),
      icon: GitBranch,
      color: "text-success",
      bgColor: "bg-success/10",
      description: "Funis em execução",
    },
    {
      title: "Sessões Ativas",
      value: metrics.activeSessions.toString(),
      icon: Radio,
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
      description: "Conversas em andamento",
    },
    {
      title: "Mensagens Hoje",
      value: metrics.messagesSentToday.toString(),
      icon: MessageSquare,
      color: "text-warning",
      bgColor: "bg-warning/10",
      description: "Enviadas pelo bot",
    },
    {
      title: "Taxa de Conversão",
      value: `${metrics.averageCompletionRate}%`,
      icon: TrendingUp,
      color: "text-pink-400",
      bgColor: "bg-pink-400/10",
      description: "Média de conclusão",
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
        {/* Welcome Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              Olá, {profile?.full_name?.split(" ")[0] || "usuário"}! 👋
            </h1>
            <p className="text-muted-foreground">
              Acompanhe seus funis e conversões em tempo real.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <TelegramSandbox />
            <Button variant="outline" size="icon" onClick={refetch}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Link to="/funnels/new">
              <Button variant="gradient">
                <Plus className="w-4 h-4 mr-2" />
                Novo Funil
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid - 5 cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {statsCards.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="glass-card hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <stat.icon className={`w-4 h-4 ${stat.color}`} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.title}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Funnel Overview */}
          <Card className="lg:col-span-2 glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="w-5 h-5" />
                Visão Geral dos Funis
              </CardTitle>
              <Link to="/funnels">
                <Button variant="ghost" size="sm">
                  Ver todos
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {funnelOverviews.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <GitBranch className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Nenhum funil criado</p>
                  <p className="text-sm mb-4">Crie seu primeiro funil para começar a capturar leads.</p>
                  <Link to="/funnels/new">
                    <Button variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Funil
                    </Button>
                  </Link>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Funil</TableHead>
                      <TableHead>Bot</TableHead>
                      <TableHead className="text-center">Leads</TableHead>
                      <TableHead className="text-center">Conversão</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {funnelOverviews.slice(0, 5).map((funnel) => (
                      <TableRow
                        key={funnel.id}
                        className="cursor-pointer hover:bg-secondary/50"
                        onClick={() => navigate(`/funnels/${funnel.id}`)}
                      >
                        <TableCell className="font-medium">{funnel.name}</TableCell>
                        <TableCell>
                          {funnel.botName ? (
                            <span className="flex items-center gap-1 text-sm">
                              <Bot className="w-3 h-3" />
                              {funnel.botName}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className="font-medium">{funnel.leadsStarted}</span>
                            <span className="text-muted-foreground">/</span>
                            <span className="text-success">{funnel.leadsFinished}</span>
                          </div>
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
                            <Badge className="bg-success gap-1">
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

          {/* Recent Activity */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Atividade Recente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma atividade recente</p>
                  </div>
                ) : (
                  recentActivity.slice(0, 8).map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{activity.message}</p>
                        {activity.funnelName && (
                          <p className="text-xs text-muted-foreground truncate">
                            {activity.funnelName}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Quick Actions */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/telegram" className="block">
                <div className="p-4 rounded-lg border border-telegram/30 bg-telegram/5 hover:bg-telegram/10 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Bot className="w-5 h-5 text-telegram" />
                    <div>
                      <p className="font-medium">Criar Bot</p>
                      <p className="text-sm text-muted-foreground">Configure seu bot Telegram</p>
                    </div>
                  </div>
                </div>
              </Link>

              <Link to="/funnels/new" className="block">
                <div className="p-4 rounded-lg border border-success/30 bg-success/5 hover:bg-success/10 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <GitBranch className="w-5 h-5 text-success" />
                    <div>
                      <p className="font-medium">Criar Funil</p>
                      <p className="text-sm text-muted-foreground">Builder estilo Typebot</p>
                    </div>
                  </div>
                </div>
              </Link>

              <Link to="/campaigns" className="block">
                <div className="p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Megaphone className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="font-medium">Nova Campanha</p>
                      <p className="text-sm text-muted-foreground">Automatize envios</p>
                    </div>
                  </div>
                </div>
              </Link>

              <Link to="/funnels?template=free" className="block">
                <div className="p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <LayoutTemplate className="w-5 h-5 text-pink-400" />
                    <div>
                      <p className="font-medium">Funis Prontos</p>
                      <p className="text-sm text-muted-foreground">Templates gratuitos</p>
                    </div>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Saúde do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    metrics.webhookStatus === "ok" ? "bg-success/20" : 
                    metrics.webhookStatus === "error" ? "bg-destructive/20" : "bg-muted/20"
                  }`}>
                    {metrics.webhookStatus === "ok" ? (
                      <Wifi className="w-4 h-4 text-success" />
                    ) : metrics.webhookStatus === "error" ? (
                      <WifiOff className="w-4 h-4 text-destructive" />
                    ) : (
                      <WifiOff className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">Webhook Telegram</p>
                    <p className="text-xs text-muted-foreground">
                      {metrics.webhookStatus === "ok" ? "Conectado" : 
                       metrics.webhookStatus === "error" ? "Com erros" : "Não configurado"}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={metrics.webhookStatus === "ok" ? "default" : "destructive"}
                  className={metrics.webhookStatus === "ok" ? "bg-success" : ""}
                >
                  {metrics.webhookStatus === "ok" ? "OK" : 
                   metrics.webhookStatus === "error" ? "Erro" : "—"}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-telegram/20">
                    <MessageSquare className="w-4 h-4 text-telegram" />
                  </div>
                  <div>
                    <p className="font-medium">Última Mensagem</p>
                    <p className="text-xs text-muted-foreground">
                      {metrics.lastMessageAt ? formatTimeAgo(metrics.lastMessageAt) : "Nenhuma"}
                    </p>
                  </div>
                </div>
              </div>

              {metrics.lastError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-destructive">Último Erro</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {metrics.lastError}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Plan Usage */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Seu Plano
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{currentPlan?.name || "Free"}</p>
                  <p className="text-sm text-muted-foreground">{formatDaysRemaining()}</p>
                </div>
                {currentPlan?.slug === "free" && (
                  <Link to="/billing">
                    <Button variant="gradient" size="sm">
                      Upgrade
                    </Button>
                  </Link>
                )}
              </div>

              {currentPlan?.max_funnels && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Funis</span>
                    <span>{metrics.activeFunnels} / {currentPlan.max_funnels}</span>
                  </div>
                  <Progress
                    value={(metrics.activeFunnels / currentPlan.max_funnels) * 100}
                    className="h-2"
                  />
                </div>
              )}

              {expiresAt && (
                <div className="p-3 rounded-lg bg-secondary/30">
                  <p className="text-xs text-muted-foreground">Expira em</p>
                  <p className="font-medium">
                    {expiresAt.toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              )}

              {/* Smart Suggestions */}
              {(metrics.averageCompletionRate < 30 && metrics.activeFunnels > 0) && (
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Conversão baixa</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Seus funis têm uma taxa de conversão de {metrics.averageCompletionRate}%.
                        Considere revisar suas mensagens.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {metrics.webhookStatus === "error" && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                  <div className="flex items-start gap-2">
                    <WifiOff className="w-4 h-4 text-destructive mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Bot desconectado</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Verifique a configuração do webhook do seu bot.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
