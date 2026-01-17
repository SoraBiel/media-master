import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface UTMPixel {
  id: string;
  user_id: string;
  pixel_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UTMEvent {
  id: string;
  pixel_id: string;
  event_type: string;
  page_url: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  fbclid: string | null;
  gclid: string | null;
  ip_address: string | null;
  user_agent: string | null;
  country: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  session_id: string | null;
  event_value: number | null;
  event_data: any;
  created_at: string;
}

export interface UTMStats {
  totalEvents: number;
  pageViews: number;
  conversions: number;
  bySource: Record<string, number>;
  byMedium: Record<string, number>;
  byCampaign: Record<string, number>;
  byDevice: Record<string, number>;
  byCountry: Record<string, number>;
}

export interface UTMifyIntegration {
  id: string;
  user_id: string;
  api_token: string | null;
  tracking_enabled: boolean;
}

// Generate a unique pixel ID
const generatePixelId = () => {
  return `NXO-${Math.random().toString(36).substring(2, 8).toUpperCase()}${Date.now().toString(36).toUpperCase()}`;
};

export const useUTMPixel = () => {
  const [pixel, setPixel] = useState<UTMPixel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchPixel = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("utm_pixels")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      setPixel(data);
    } catch (error) {
      console.error("Error fetching UTM pixel:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const createPixel = async () => {
    if (!user) return null;

    try {
      const newPixelId = generatePixelId();
      
      const { data, error } = await supabase
        .from("utm_pixels")
        .insert({
          user_id: user.id,
          pixel_id: newPixelId,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Pixel criado",
        description: "Seu pixel de rastreamento foi criado.",
      });

      setPixel(data);
      return data;
    } catch (error) {
      console.error("Error creating UTM pixel:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o pixel.",
        variant: "destructive",
      });
      return null;
    }
  };

  const togglePixel = async () => {
    if (!pixel) return;

    try {
      const { error } = await supabase
        .from("utm_pixels")
        .update({ is_active: !pixel.is_active })
        .eq("id", pixel.id);

      if (error) throw error;

      setPixel({ ...pixel, is_active: !pixel.is_active });

      toast({
        title: pixel.is_active ? "Pixel desativado" : "Pixel ativado",
        description: pixel.is_active
          ? "O rastreamento foi pausado."
          : "O rastreamento foi ativado.",
      });
    } catch (error) {
      console.error("Error toggling pixel:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o pixel.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchPixel();
  }, [fetchPixel]);

  return {
    pixel,
    isLoading,
    createPixel,
    togglePixel,
    refetch: fetchPixel,
  };
};

export const useUTMEvents = (dateRange?: { from: Date; to: Date }) => {
  const [events, setEvents] = useState<UTMEvent[]>([]);
  const [stats, setStats] = useState<UTMStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchEvents = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      // Get user's pixel first
      const { data: pixel, error: pixelError } = await supabase
        .from("utm_pixels")
        .select("pixel_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (pixelError) throw pixelError;

      if (!pixel) {
        setEvents([]);
        setStats({
          totalEvents: 0,
          pageViews: 0,
          conversions: 0,
          bySource: {},
          byMedium: {},
          byCampaign: {},
          byDevice: {},
          byCountry: {},
        });
        setIsLoading(false);
        return;
      }

      let query = supabase
        .from("utm_events")
        .select("*")
        .eq("pixel_id", pixel.pixel_id)
        .order("created_at", { ascending: false })
        .limit(1000);

      if (dateRange?.from) {
        query = query.gte("created_at", dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        query = query.lte("created_at", dateRange.to.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      setEvents(data || []);

      // Calculate stats
      const eventsData = data || [];
      const calculatedStats: UTMStats = {
        totalEvents: eventsData.length,
        pageViews: eventsData.filter(e => e.event_type === "pageview").length,
        conversions: eventsData.filter(e => e.event_type === "conversion" || e.event_type === "purchase").length,
        bySource: {},
        byMedium: {},
        byCampaign: {},
        byDevice: {},
        byCountry: {},
      };

      eventsData.forEach(event => {
        if (event.utm_source) {
          calculatedStats.bySource[event.utm_source] = (calculatedStats.bySource[event.utm_source] || 0) + 1;
        }
        if (event.utm_medium) {
          calculatedStats.byMedium[event.utm_medium] = (calculatedStats.byMedium[event.utm_medium] || 0) + 1;
        }
        if (event.utm_campaign) {
          calculatedStats.byCampaign[event.utm_campaign] = (calculatedStats.byCampaign[event.utm_campaign] || 0) + 1;
        }
        if (event.device_type) {
          calculatedStats.byDevice[event.device_type] = (calculatedStats.byDevice[event.device_type] || 0) + 1;
        }
        if (event.country) {
          calculatedStats.byCountry[event.country] = (calculatedStats.byCountry[event.country] || 0) + 1;
        }
      });

      setStats(calculatedStats);
    } catch (error) {
      console.error("Error fetching UTM events:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, dateRange?.from?.toISOString(), dateRange?.to?.toISOString()]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    stats,
    isLoading,
    refetch: fetchEvents,
  };
};

export const useUTMifyIntegration = () => {
  const [integration, setIntegration] = useState<UTMifyIntegration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchIntegration = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("integrations")
        .select("id, user_id, api_token, tracking_enabled")
        .eq("user_id", user.id)
        .eq("provider", "utmify")
        .maybeSingle();

      if (error) throw error;
      setIntegration(data as UTMifyIntegration | null);
    } catch (error) {
      console.error("Error fetching UTMify integration:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const saveToken = async (apiToken: string) => {
    if (!user) return false;

    try {
      if (integration) {
        const { error } = await supabase
          .from("integrations")
          .update({ 
            api_token: apiToken,
            updated_at: new Date().toISOString(),
          })
          .eq("id", integration.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("integrations")
          .insert({
            user_id: user.id,
            provider: "utmify",
            api_token: apiToken,
            access_token: "utmify", // Required field
            tracking_enabled: true,
          });

        if (error) throw error;
      }

      toast({
        title: "Token salvo",
        description: "Seu token UTMify foi salvo com sucesso.",
      });

      await fetchIntegration();
      return true;
    } catch (error) {
      console.error("Error saving UTMify token:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o token.",
        variant: "destructive",
      });
      return false;
    }
  };

  const testToken = async () => {
    if (!integration?.api_token) {
      toast({
        title: "Token não configurado",
        description: "Configure seu token UTMify primeiro.",
        variant: "destructive",
      });
      return false;
    }

    setIsTesting(true);

    try {
      const { data, error } = await supabase.functions.invoke("utmify-track", {
        body: {
          action: "test_token",
          api_token: integration.api_token,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Conexão válida",
          description: "Seu token UTMify está funcionando.",
        });
        return true;
      } else {
        toast({
          title: "Token inválido",
          description: data?.error || "Verifique seu token UTMify.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("Error testing UTMify token:", error);
      toast({
        title: "Erro ao testar",
        description: "Não foi possível validar o token.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsTesting(false);
    }
  };

  const toggleTracking = async () => {
    if (!integration) return;

    try {
      const { error } = await supabase
        .from("integrations")
        .update({ tracking_enabled: !integration.tracking_enabled })
        .eq("id", integration.id);

      if (error) throw error;

      setIntegration({ ...integration, tracking_enabled: !integration.tracking_enabled });

      toast({
        title: integration.tracking_enabled ? "Rastreamento pausado" : "Rastreamento ativado",
        description: integration.tracking_enabled
          ? "Os eventos não serão enviados para a UTMify."
          : "Os eventos serão enviados para a UTMify.",
      });
    } catch (error) {
      console.error("Error toggling UTMify tracking:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o rastreamento.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchIntegration();
  }, [fetchIntegration]);

  return {
    integration,
    isLoading,
    isTesting,
    saveToken,
    testToken,
    toggleTracking,
    refetch: fetchIntegration,
  };
};
