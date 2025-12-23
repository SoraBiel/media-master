import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Send,
  Target,
  Image,
  Megaphone,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Plus,
  MessageCircle,
  CreditCard,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserMetrics } from "@/hooks/useUserMetrics";
import { useSubscription } from "@/hooks/useSubscription";
import { useTelegramIntegration } from "@/hooks/useTelegramIntegration";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const DashboardPage = () => {
  const { profile } = useAuth();
  const { metrics, isLoading: metricsLoading } = useUserMetrics();
  const { currentPlan, hasActiveSubscription, getDaysRemaining } = useSubscription();
  const { integration } = useTelegramIntegration();
  const [recentEvents, setRecentEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchRecentEvents = async () => {
      if (!profile?.user_id) return;
      
      const { data } = await supabase
        .from("user_events")
        .select("*")
        .eq("user_id", profile.user_id)
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (data) setRecentEvents(data);
    };

    fetchRecentEvents();

    // Realtime subscription for events
    if (profile?.user_id) {
      const channel = supabase
        .channel("user_events_realtime")
        .on("postgres_changes", {
          event: "*",
          schema: "public",
          table: "user_events",
          filter: `user_id=eq.${profile.user_id}`,
        }, () => fetchRecentEvents())
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile?.user_id]);

  // Format days remaining with proper label
  const formatDaysRemaining = () => {
    const days = getDaysRemaining();
    if (days === null) {
      // Profile-based subscription without expiry
      if (currentPlan?.slug && currentPlan.slug !== "free") {
        return "Plano ativo";
      }
      return "Sem assinatura";
    }
    if (days === 0) return "Expira hoje";
    if (days === 1) return "1 dia restante";
    return `${days} dias restantes`;
  };

  const stats = [
    {
      title: "Ações realizadas",
      value: metrics?.total_actions?.toString() || "0",
      change: "+0",
      icon: Send,
      color: "text-telegram",
      bgColor: "bg-telegram/10",
    },
    {
      title: "Telegram ativo",
      value: integration?.is_connected ? "1" : "0",
      change: integration?.is_connected ? "Conectado" : "Desconectado",
      icon: MessageCircle,
      color: integration?.is_connected ? "text-success" : "text-muted-foreground",
      bgColor: integration?.is_connected ? "bg-success/10" : "bg-muted/10",
    },
    {
      title: "Mídias enviadas",
      value: metrics?.media_sent?.toString() || "0",
      change: "+0",
      icon: Image,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Plano atual",
      value: currentPlan?.name || profile?.current_plan || "Free",
      change: formatDaysRemaining(),
      icon: CreditCard,
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
    },
  ];

  const formatEventType = (type: string) => {
    const types: Record<string, string> = {
      telegram_message_sent: "Mensagem enviada",
      telegram_photo_sent: "Foto enviada",
      telegram_video_sent: "Vídeo enviado",
      telegram_media_group_sent: "Mídia em grupo enviada",
      login: "Login realizado",
      signup: "Conta criada",
    };
    return types[type] || type;
  };

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Bem-vindo, {profile?.full_name?.split(" ")[0] || "usuário"}! 👋
            </h1>
            <p className="text-muted-foreground">
              Aqui está um resumo da sua atividade no MediaDrop TG.
            </p>
          </div>
          <Link to="/campaigns">
            <Button variant="gradient">
              <Plus className="w-4 h-4 mr-2" />
              Nova Campanha
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground text-sm">
                      {stat.change}
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Activity */}
          <Card className="lg:col-span-2 glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Atividade Recente</CardTitle>
              <Link to="/settings">
                <Button variant="ghost" size="sm">
                  Ver todas
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma atividade recente</p>
                    <p className="text-sm">Comece conectando seu Telegram!</p>
                  </div>
                ) : (
                  recentEvents.map((event, index) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors"
                    >
                      <div className="p-2 rounded-lg bg-telegram/20">
                        <Send className="w-4 h-4 text-telegram" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{formatEventType(event.event_type)}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatTimeAgo(event.created_at)}
                        </p>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
          <Link to="/telegram" className="block">
            <div className="p-4 rounded-lg border border-telegram/30 bg-telegram/5 hover:bg-telegram/10 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-telegram" />
                <div>
                  <p className="font-medium">Crie Bot</p>
                  <p className="text-sm text-muted-foreground">Configure seu bot Telegram</p>
                </div>
              </div>
            </div>
          </Link>

          <Link to="/campaigns" className="block">
                <div className="p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Megaphone className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="font-medium">Criar Campanha</p>
                      <p className="text-sm text-muted-foreground">Automatize envios</p>
                    </div>
                  </div>
                </div>
              </Link>

              <Link to="/model-hub" className="block">
                <div className="p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Image className="w-5 h-5 text-pink-400" />
                    <div>
                      <p className="font-medium">Explorar Modelos</p>
                      <p className="text-sm text-muted-foreground">IA e mais</p>
                    </div>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Usage Card */}
        {currentPlan && (
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">Uso do Plano {currentPlan.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {metrics?.media_sent || 0} de {currentPlan.max_media_per_month || "∞"} mídias usadas este mês
                  </p>
                </div>
                {!hasActiveSubscription() && (
                  <Link to="/billing">
                    <Button variant="outline" size="sm">
                      Upgrade
                    </Button>
                  </Link>
                )}
              </div>
              <Progress 
                value={currentPlan.max_media_per_month 
                  ? ((metrics?.media_sent || 0) / currentPlan.max_media_per_month) * 100 
                  : 0
                } 
                className="h-3" 
              />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>
                  {currentPlan.max_media_per_month 
                    ? `${(((metrics?.media_sent || 0) / currentPlan.max_media_per_month) * 100).toFixed(1)}% usado`
                    : "Ilimitado"
                  }
                </span>
                {hasActiveSubscription() && getDaysRemaining() !== null && (
                  <span>Renova em {getDaysRemaining()} dias</span>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
