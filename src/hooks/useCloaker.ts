import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface CloakerLink {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  safe_url: string;
  offer_url: string;
  is_active: boolean;
  block_vpn: boolean;
  block_bots: boolean;
  allowed_countries: string[];
  created_at: string;
  updated_at: string;
}

export interface CloakerClick {
  id: string;
  link_id: string;
  ip_address: string | null;
  user_agent: string | null;
  country: string | null;
  city: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  is_bot: boolean;
  is_vpn: boolean;
  was_blocked: boolean;
  redirect_target: string | null;
  referrer: string | null;
  clicked_at: string;
}

export interface CloakerStats {
  totalClicks: number;
  blockedClicks: number;
  allowedClicks: number;
  byCountry: Record<string, number>;
  byDevice: Record<string, number>;
  byBrowser: Record<string, number>;
}

export const useCloaker = () => {
  const [links, setLinks] = useState<CloakerLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchLinks = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("cloaker_links")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error("Error fetching cloaker links:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const createLink = async (linkData: Omit<CloakerLink, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("cloaker_links")
        .insert({
          ...linkData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Link criado",
        description: "Seu link cloakado foi criado com sucesso.",
      });

      await fetchLinks();
      return data;
    } catch (error: any) {
      console.error("Error creating cloaker link:", error);
      toast({
        title: "Erro",
        description: error.message?.includes("duplicate") 
          ? "Esse slug já está em uso. Escolha outro."
          : "Não foi possível criar o link.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateLink = async (id: string, updates: Partial<CloakerLink>) => {
    try {
      const { error } = await supabase
        .from("cloaker_links")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Link atualizado",
        description: "As alterações foram salvas.",
      });

      await fetchLinks();
      return true;
    } catch (error) {
      console.error("Error updating cloaker link:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o link.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteLink = async (id: string) => {
    try {
      const { error } = await supabase
        .from("cloaker_links")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Link excluído",
        description: "O link foi removido.",
      });

      await fetchLinks();
      return true;
    } catch (error) {
      console.error("Error deleting cloaker link:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o link.",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  return {
    links,
    isLoading,
    createLink,
    updateLink,
    deleteLink,
    refetch: fetchLinks,
  };
};

export const useCloakerClicks = (linkId?: string) => {
  const [clicks, setClicks] = useState<CloakerClick[]>([]);
  const [stats, setStats] = useState<CloakerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchClicks = useCallback(async () => {
    if (!user || !linkId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("cloaker_clicks")
        .select("*")
        .eq("link_id", linkId)
        .order("clicked_at", { ascending: false })
        .limit(500);

      if (error) throw error;

      setClicks(data || []);

      // Calculate stats
      const clicksData = data || [];
      const stats: CloakerStats = {
        totalClicks: clicksData.length,
        blockedClicks: clicksData.filter(c => c.was_blocked).length,
        allowedClicks: clicksData.filter(c => !c.was_blocked).length,
        byCountry: {},
        byDevice: {},
        byBrowser: {},
      };

      clicksData.forEach(click => {
        if (click.country) {
          stats.byCountry[click.country] = (stats.byCountry[click.country] || 0) + 1;
        }
        if (click.device_type) {
          stats.byDevice[click.device_type] = (stats.byDevice[click.device_type] || 0) + 1;
        }
        if (click.browser) {
          stats.byBrowser[click.browser] = (stats.byBrowser[click.browser] || 0) + 1;
        }
      });

      setStats(stats);
    } catch (error) {
      console.error("Error fetching cloaker clicks:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, linkId]);

  useEffect(() => {
    fetchClicks();
  }, [fetchClicks]);

  return {
    clicks,
    stats,
    isLoading,
    refetch: fetchClicks,
  };
};

export const useAllCloakerStats = () => {
  const [stats, setStats] = useState<CloakerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchAllStats = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      // First get user's links
      const { data: links, error: linksError } = await supabase
        .from("cloaker_links")
        .select("id")
        .eq("user_id", user.id);

      if (linksError) throw linksError;

      if (!links || links.length === 0) {
        setStats({
          totalClicks: 0,
          blockedClicks: 0,
          allowedClicks: 0,
          byCountry: {},
          byDevice: {},
          byBrowser: {},
        });
        setIsLoading(false);
        return;
      }

      const linkIds = links.map(l => l.id);

      const { data: clicks, error: clicksError } = await supabase
        .from("cloaker_clicks")
        .select("*")
        .in("link_id", linkIds)
        .order("clicked_at", { ascending: false })
        .limit(1000);

      if (clicksError) throw clicksError;

      const clicksData = clicks || [];
      const calculatedStats: CloakerStats = {
        totalClicks: clicksData.length,
        blockedClicks: clicksData.filter(c => c.was_blocked).length,
        allowedClicks: clicksData.filter(c => !c.was_blocked).length,
        byCountry: {},
        byDevice: {},
        byBrowser: {},
      };

      clicksData.forEach(click => {
        if (click.country) {
          calculatedStats.byCountry[click.country] = (calculatedStats.byCountry[click.country] || 0) + 1;
        }
        if (click.device_type) {
          calculatedStats.byDevice[click.device_type] = (calculatedStats.byDevice[click.device_type] || 0) + 1;
        }
        if (click.browser) {
          calculatedStats.byBrowser[click.browser] = (calculatedStats.byBrowser[click.browser] || 0) + 1;
        }
      });

      setStats(calculatedStats);
    } catch (error) {
      console.error("Error fetching all cloaker stats:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAllStats();
  }, [fetchAllStats]);

  return {
    stats,
    isLoading,
    refetch: fetchAllStats,
  };
};
