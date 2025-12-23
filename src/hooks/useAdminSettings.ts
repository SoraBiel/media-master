import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AdminSettings {
  tiktok_enabled: boolean;
  models_enabled: boolean;
}

export const useAdminSettings = () => {
  const [settings, setSettings] = useState<AdminSettings>({
    tiktok_enabled: true,
    models_enabled: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("setting_key, setting_value");

      if (error) throw error;

      const newSettings: AdminSettings = {
        tiktok_enabled: true,
        models_enabled: true,
      };

      data?.forEach((item) => {
        if (item.setting_key === "tiktok_enabled") {
          newSettings.tiktok_enabled = item.setting_value;
        }
        if (item.setting_key === "models_enabled") {
          newSettings.models_enabled = item.setting_value;
        }
      });

      setSettings(newSettings);
    } catch (error) {
      console.error("Error fetching admin settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: keyof AdminSettings, value: boolean) => {
    try {
      const { error } = await supabase
        .from("admin_settings")
        .update({ 
          setting_value: value,
          updated_at: new Date().toISOString()
        })
        .eq("setting_key", key);

      if (error) throw error;

      setSettings((prev) => ({ ...prev, [key]: value }));
      
      toast({
        title: "Configuração atualizada",
        description: `${key === "tiktok_enabled" ? "TikTok" : "Modelos"} ${value ? "ativado" : "desativado"} com sucesso.`,
      });
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

    const channel = supabase
      .channel("admin-settings-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admin_settings" },
        () => fetchSettings()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    settings,
    isLoading,
    updateSetting,
    refetch: fetchSettings,
  };
};
