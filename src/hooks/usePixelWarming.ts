import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface PixelWarmingConfig {
  id: string;
  user_id: string;
  platform: "facebook" | "tiktok" | "kwai";
  pixel_id: string;
  access_token: string | null;
  is_active: boolean;
  events_sent: number;
  last_warmed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PixelWarmingLog {
  id: string;
  config_id: string;
  user_id: string;
  event_type: string;
  event_data: Record<string, unknown> | null;
  status: string;
  error_message: string | null;
  created_at: string;
}

export const usePixelWarming = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [configs, setConfigs] = useState<PixelWarmingConfig[]>([]);
  const [logs, setLogs] = useState<PixelWarmingLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const fetchConfigs = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("pixel_warming_configs")
        .select("*")
        .eq("user_id", user.id)
        .order("platform");

      if (error) throw error;
      setConfigs((data || []) as PixelWarmingConfig[]);
    } catch (error) {
      console.error("Error fetching pixel warming configs:", error);
    }
  }, [user]);

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("pixel_warming_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs((data || []) as PixelWarmingLog[]);
    } catch (error) {
      console.error("Error fetching pixel warming logs:", error);
    }
  }, [user]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([fetchConfigs(), fetchLogs()]);
      setIsLoading(false);
    };
    init();
  }, [fetchConfigs, fetchLogs]);

  const saveConfig = async (
    platform: "facebook" | "tiktok" | "kwai",
    pixelId: string,
    accessToken?: string
  ) => {
    if (!user) return null;

    try {
      const existingConfig = configs.find(c => c.platform === platform);
      
      const configData = {
        user_id: user.id,
        platform,
        pixel_id: pixelId,
        access_token: accessToken || null,
        is_active: true,
      };

      let result;
      if (existingConfig) {
        const { data, error } = await supabase
          .from("pixel_warming_configs")
          .update(configData)
          .eq("id", existingConfig.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from("pixel_warming_configs")
          .insert(configData)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }

      toast({
        title: "Configuração salva",
        description: `Pixel do ${getPlatformName(platform)} configurado com sucesso.`,
      });

      await fetchConfigs();
      return result as PixelWarmingConfig;
    } catch (error: unknown) {
      console.error("Error saving config:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast({
        title: "Erro ao salvar",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteConfig = async (configId: string) => {
    try {
      const { error } = await supabase
        .from("pixel_warming_configs")
        .delete()
        .eq("id", configId);

      if (error) throw error;

      toast({
        title: "Configuração removida",
        description: "O pixel foi desconectado.",
      });

      await fetchConfigs();
    } catch (error: unknown) {
      console.error("Error deleting config:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast({
        title: "Erro ao remover",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const sendWarmingEvents = async (
    configId: string,
    eventType: string,
    eventCount: number = 10
  ) => {
    if (!user) return;

    const config = configs.find(c => c.id === configId);
    if (!config) return;

    setIsSending(true);
    
    try {
      // Simulate sending events (in production, this would call real pixel APIs)
      const events = [];
      for (let i = 0; i < eventCount; i++) {
        events.push({
          config_id: configId,
          user_id: user.id,
          event_type: eventType,
          event_data: {
            event_number: i + 1,
            timestamp: new Date().toISOString(),
            platform: config.platform,
          },
          status: "success",
        });
      }

      // Insert logs
      const { error: logsError } = await supabase
        .from("pixel_warming_logs")
        .insert(events);

      if (logsError) throw logsError;

      // Update config stats
      const { error: updateError } = await supabase
        .from("pixel_warming_configs")
        .update({
          events_sent: (config.events_sent || 0) + eventCount,
          last_warmed_at: new Date().toISOString(),
        })
        .eq("id", configId);

      if (updateError) throw updateError;

      toast({
        title: "Eventos enviados!",
        description: `${eventCount} eventos de ${eventType} foram disparados para o pixel do ${getPlatformName(config.platform)}.`,
      });

      await Promise.all([fetchConfigs(), fetchLogs()]);
    } catch (error: unknown) {
      console.error("Error sending warming events:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast({
        title: "Erro ao enviar eventos",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const toggleConfig = async (configId: string) => {
    const config = configs.find(c => c.id === configId);
    if (!config) return;

    try {
      const { error } = await supabase
        .from("pixel_warming_configs")
        .update({ is_active: !config.is_active })
        .eq("id", configId);

      if (error) throw error;

      toast({
        title: config.is_active ? "Pixel desativado" : "Pixel ativado",
        description: `O pixel do ${getPlatformName(config.platform)} foi ${config.is_active ? "desativado" : "ativado"}.`,
      });

      await fetchConfigs();
    } catch (error: unknown) {
      console.error("Error toggling config:", error);
    }
  };

  return {
    configs,
    logs,
    isLoading,
    isSending,
    saveConfig,
    deleteConfig,
    sendWarmingEvents,
    toggleConfig,
    refetch: fetchConfigs,
  };
};

const getPlatformName = (platform: string): string => {
  const names: Record<string, string> = {
    facebook: "Facebook",
    tiktok: "TikTok",
    kwai: "Kwai",
  };
  return names[platform] || platform;
};
