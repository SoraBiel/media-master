import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AdminSettings {
  tiktok_enabled: boolean;
  models_enabled: boolean;
  campaigns_enabled: boolean;
  destinations_enabled: boolean;
  funnels_enabled: boolean;
  media_library_enabled: boolean;
}

export interface SettingsHistoryEntry {
  id: string;
  setting_key: string;
  old_value: boolean | null;
  new_value: boolean;
  changed_by: string | null;
  changed_at: string;
  changed_by_email?: string;
}

const defaultSettings: AdminSettings = {
  tiktok_enabled: true,
  models_enabled: true,
  campaigns_enabled: true,
  destinations_enabled: true,
  funnels_enabled: true,
  media_library_enabled: true,
};

const settingLabels: Record<keyof AdminSettings, string> = {
  tiktok_enabled: "TikTok Accounts",
  models_enabled: "Model Hub",
  campaigns_enabled: "Campanhas",
  destinations_enabled: "Destinos",
  funnels_enabled: "Funis",
  media_library_enabled: "Biblioteca de Mídias",
};

export const getSettingLabel = (key: string): string => {
  return settingLabels[key as keyof AdminSettings] || key;
};

export const useAdminSettings = () => {
  const [settings, setSettings] = useState<AdminSettings>(defaultSettings);
  const [history, setHistory] = useState<SettingsHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("setting_key, setting_value");

      if (error) throw error;

      const newSettings: AdminSettings = { ...defaultSettings };

      data?.forEach((item) => {
        const key = item.setting_key as keyof AdminSettings;
        if (key in newSettings) {
          newSettings[key] = item.setting_value;
        }
      });

      setSettings(newSettings);
    } catch (error) {
      console.error("Error fetching admin settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from("admin_settings_history")
        .select("*")
        .order("changed_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch user emails for the history entries
      if (data && data.length > 0) {
        const userIds = [...new Set(data.filter(h => h.changed_by).map(h => h.changed_by))];
        
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, email")
            .in("user_id", userIds);

          const emailMap = new Map(profiles?.map(p => [p.user_id, p.email]));
          
          const enrichedData = data.map(entry => ({
            ...entry,
            changed_by_email: entry.changed_by ? emailMap.get(entry.changed_by) || "Desconhecido" : "Sistema"
          }));

          setHistory(enrichedData);
        } else {
          setHistory(data);
        }
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error("Error fetching settings history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const updateSetting = async (key: keyof AdminSettings, value: boolean) => {
    const oldValue = settings[key];
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Update the setting
      const { error } = await supabase
        .from("admin_settings")
        .update({ 
          setting_value: value,
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        })
        .eq("setting_key", key);

      if (error) throw error;

      // Log the change to history
      await supabase
        .from("admin_settings_history")
        .insert({
          setting_key: key,
          old_value: oldValue,
          new_value: value,
          changed_by: user?.id,
        });

      setSettings((prev) => ({ ...prev, [key]: value }));
      
      toast({
        title: "Configuração atualizada",
        description: `${settingLabels[key]} ${value ? "ativado" : "desativado"} com sucesso.`,
      });

      // Refresh history
      fetchHistory();
    } catch (error) {
      console.error("Error updating setting:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a configuração.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchHistory();

    const channel = supabase
      .channel("admin-settings-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admin_settings" },
        () => fetchSettings()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "admin_settings_history" },
        () => fetchHistory()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    settings,
    history,
    isLoading,
    isLoadingHistory,
    updateSetting,
    refetch: fetchSettings,
    refetchHistory: fetchHistory,
  };
};
