import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface FunnelMetrics {
  leadsToday: number;
  activeFunnels: number;
  activeSessions: number;
  messagesSentToday: number;
  averageCompletionRate: number;
  webhookStatus: "ok" | "error" | "unknown";
  lastError: string | null;
  lastMessageAt: string | null;
}

export interface FunnelOverview {
  id: string;
  name: string;
  botName: string | null;
  isActive: boolean;
  leadsStarted: number;
  leadsFinished: number;
  conversionRate: number;
}

export interface RecentActivity {
  id: string;
  type: "lead_started" | "message_sent" | "lead_responded" | "funnel_finished" | "webhook_error";
  message: string;
  funnelName?: string;
  timestamp: string;
}

export const useFunnelMetrics = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<FunnelMetrics>({
    leadsToday: 0,
    activeFunnels: 0,
    activeSessions: 0,
    messagesSentToday: 0,
    averageCompletionRate: 0,
    webhookStatus: "unknown",
    lastError: null,
    lastMessageAt: null,
  });
  const [funnelOverviews, setFunnelOverviews] = useState<FunnelOverview[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = async () => {
    if (!user) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch funnels
      const { data: funnels } = await supabase
        .from("funnels")
        .select("*, telegram_integrations(bot_name, is_connected)")
        .eq("user_id", user.id);

      const activeFunnels = funnels?.filter((f) => f.is_active).length || 0;

      // Fetch sessions
      const { data: sessions } = await supabase
        .from("telegram_sessions")
        .select("*, funnels!inner(user_id)")
        .eq("funnels.user_id", user.id);

      const activeSessions = sessions?.filter((s) => !s.is_finished).length || 0;
      const todaySessions = sessions?.filter(
        (s) => new Date(s.created_at) >= today
      ).length || 0;

      // Fetch logs for today
      const { data: logs } = await supabase
        .from("telegram_logs")
        .select("*, funnels!inner(user_id, name)")
        .eq("funnels.user_id", user.id)
        .gte("created_at", today.toISOString())
        .order("created_at", { ascending: false });

      const messagesSentToday = logs?.filter((l) => 
        l.event_type === "message_sent" || 
        l.event_type === "media_sent"
      ).length || 0;

      // Calculate completion rate
      const totalSessions = sessions?.length || 0;
      const finishedSessions = sessions?.filter((s) => s.is_finished).length || 0;
      const averageCompletionRate = totalSessions > 0 
        ? (finishedSessions / totalSessions) * 100 
        : 0;

      // Check webhook status
      const lastError = logs?.find((l) => l.event_type === "webhook_error");
      const lastMessage = logs?.find((l) => 
        l.event_type === "message_sent" || 
        l.event_type === "message_received"
      );

      // Determine webhook status
      let webhookStatus: "ok" | "error" | "unknown" = "unknown";
      if (funnels?.some((f) => f.webhook_registered && f.is_active)) {
        webhookStatus = lastError ? "error" : "ok";
      }

      // Safely extract error message
      const errorPayload = lastError?.payload as Record<string, unknown> | null;
      const errorMessage = errorPayload?.error as string | null;

      setMetrics({
        leadsToday: todaySessions,
        activeFunnels,
        activeSessions,
        messagesSentToday,
        averageCompletionRate: Math.round(averageCompletionRate),
        webhookStatus,
        lastError: errorMessage,
        lastMessageAt: lastMessage?.created_at || null,
      });

      // Build funnel overviews
      const overviews: FunnelOverview[] = (funnels || []).map((funnel) => {
        const funnelSessions = sessions?.filter((s) => s.funnel_id === funnel.id) || [];
        const finished = funnelSessions.filter((s) => s.is_finished).length;
        const total = funnelSessions.length;
        
        return {
          id: funnel.id,
          name: funnel.name,
          botName: funnel.telegram_integrations?.bot_name || null,
          isActive: funnel.is_active,
          leadsStarted: total,
          leadsFinished: finished,
          conversionRate: total > 0 ? Math.round((finished / total) * 100) : 0,
        };
      });
      setFunnelOverviews(overviews);

      // Build recent activity from logs
      const activities: RecentActivity[] = (logs || []).slice(0, 10).map((log) => {
        let type: RecentActivity["type"] = "message_sent";
        let message = "";

        switch (log.event_type) {
          case "session_started":
            type = "lead_started";
            message = "Novo lead entrou no funil";
            break;
          case "message_sent":
          case "media_sent":
            type = "message_sent";
            message = "Mensagem enviada pelo bot";
            break;
          case "message_received":
            type = "lead_responded";
            message = "Lead respondeu";
            break;
          case "session_finished":
            type = "funnel_finished";
            message = "Funil finalizado";
            break;
          case "webhook_error":
            type = "webhook_error";
            message = "Erro no webhook";
            break;
          default:
            message = log.event_type;
        }

        return {
          id: log.id,
          type,
          message,
          funnelName: (log.funnels as any)?.name,
          timestamp: log.created_at,
        };
      });
      setRecentActivity(activities);

    } catch (error) {
      console.error("Error fetching funnel metrics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();

    // Set up realtime subscriptions
    if (user) {
      const channel = supabase
        .channel("funnel_metrics_realtime")
        .on("postgres_changes", {
          event: "*",
          schema: "public",
          table: "telegram_sessions",
        }, fetchMetrics)
        .on("postgres_changes", {
          event: "*",
          schema: "public",
          table: "telegram_logs",
        }, fetchMetrics)
        .on("postgres_changes", {
          event: "*",
          schema: "public",
          table: "funnels",
        }, fetchMetrics)
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  return {
    metrics,
    funnelOverviews,
    recentActivity,
    isLoading,
    refetch: fetchMetrics,
  };
};
