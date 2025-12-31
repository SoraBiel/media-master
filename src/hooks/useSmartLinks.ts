import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";

export interface SmartLinkPage {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  description: string | null;
  avatar_url: string | null;
  background_color: string;
  text_color: string;
  button_style: string;
  is_active: boolean;
  meta_pixel_id: string | null;
  google_analytics_id: string | null;
  tiktok_pixel_id: string | null;
  total_views: number;
  created_at: string;
  updated_at: string;
}

export interface SmartLinkButton {
  id: string;
  page_id: string;
  user_id: string;
  title: string;
  url: string | null;
  icon: string | null;
  position: number;
  is_active: boolean;
  funnel_id: string | null;
  funnel_tag: string | null;
  event_name: string | null;
  click_count: number;
  created_at: string;
  updated_at: string;
}

export interface SmartLinkClick {
  id: string;
  button_id: string;
  page_id: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  referrer: string | null;
  user_agent: string | null;
  ip_address: string | null;
  country: string | null;
  clicked_at: string;
}

// Plan limits
const PLAN_LIMITS = {
  free: { pages: 1, buttons: 5 },
  basic: { pages: 3, buttons: 10 },
  pro: { pages: 10, buttons: 25 },
  agency: { pages: 999, buttons: 999 },
};

export const useSmartLinks = () => {
  const { user, isAdmin } = useAuth();
  const { currentPlan } = useSubscription();
  const { toast } = useToast();
  const [pages, setPages] = useState<SmartLinkPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const planSlug = (currentPlan?.slug || "free") as keyof typeof PLAN_LIMITS;
  const limits = isAdmin 
    ? { pages: 999, buttons: 999 } 
    : PLAN_LIMITS[planSlug] || PLAN_LIMITS.free;

  const fetchPages = async () => {
    if (!user) {
      setPages([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("smart_link_pages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPages((data as SmartLinkPage[]) || []);
    } catch (error) {
      console.error("Error fetching smart link pages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const canCreatePage = (): boolean => {
    return pages.length < limits.pages;
  };

  const canAddButton = (pageId: string, currentButtonCount: number): boolean => {
    return currentButtonCount < limits.buttons;
  };

  const createPage = async (data: Partial<SmartLinkPage>): Promise<SmartLinkPage | null> => {
    if (!user) return null;

    if (!canCreatePage()) {
      toast({
        title: "Limite atingido",
        description: `Seu plano permite apenas ${limits.pages} página(s). Faça upgrade para criar mais.`,
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data: newPage, error } = await supabase
        .from("smart_link_pages")
        .insert({
          user_id: user.id,
          slug: data.slug,
          title: data.title || "Minha Página",
          description: data.description,
          avatar_url: data.avatar_url,
          background_color: data.background_color || "#1a1a2e",
          text_color: data.text_color || "#ffffff",
          button_style: data.button_style || "rounded",
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "URL já existe",
            description: "Escolha outro nome para sua URL personalizada.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return null;
      }

      toast({
        title: "Página criada!",
        description: "Sua Smart Link foi criada com sucesso.",
      });

      await fetchPages();
      return newPage as SmartLinkPage;
    } catch (error) {
      console.error("Error creating smart link page:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a página.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updatePage = async (pageId: string, data: Partial<SmartLinkPage>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("smart_link_pages")
        .update(data)
        .eq("id", pageId);

      if (error) throw error;

      toast({
        title: "Página atualizada",
        description: "Suas alterações foram salvas.",
      });

      await fetchPages();
      return true;
    } catch (error) {
      console.error("Error updating smart link page:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a página.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deletePage = async (pageId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("smart_link_pages")
        .delete()
        .eq("id", pageId);

      if (error) throw error;

      toast({
        title: "Página excluída",
        description: "Sua Smart Link foi removida.",
      });

      await fetchPages();
      return true;
    } catch (error) {
      console.error("Error deleting smart link page:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a página.",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchPages();

    if (user) {
      const channel = supabase
        .channel("smart-link-pages-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "smart_link_pages",
            filter: `user_id=eq.${user.id}`,
          },
          () => fetchPages()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  return {
    pages,
    isLoading,
    limits,
    canCreatePage,
    canAddButton,
    createPage,
    updatePage,
    deletePage,
    refetch: fetchPages,
  };
};

// Hook for managing buttons on a specific page
export const useSmartLinkButtons = (pageId: string | null) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [buttons, setButtons] = useState<SmartLinkButton[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchButtons = async () => {
    if (!pageId || !user) {
      setButtons([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("smart_link_buttons")
        .select("*")
        .eq("page_id", pageId)
        .order("position", { ascending: true });

      if (error) throw error;
      setButtons((data as SmartLinkButton[]) || []);
    } catch (error) {
      console.error("Error fetching buttons:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createButton = async (data: Partial<SmartLinkButton>): Promise<SmartLinkButton | null> => {
    if (!user || !pageId) return null;

    try {
      const maxPosition = buttons.length > 0 
        ? Math.max(...buttons.map(b => b.position)) + 1 
        : 0;

      const { data: newButton, error } = await supabase
        .from("smart_link_buttons")
        .insert({
          page_id: pageId,
          user_id: user.id,
          title: data.title || "Novo Botão",
          url: data.url,
          icon: data.icon,
          position: maxPosition,
          funnel_id: data.funnel_id,
          funnel_tag: data.funnel_tag,
          event_name: data.event_name,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchButtons();
      return newButton as SmartLinkButton;
    } catch (error) {
      console.error("Error creating button:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o botão.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateButton = async (buttonId: string, data: Partial<SmartLinkButton>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("smart_link_buttons")
        .update(data)
        .eq("id", buttonId);

      if (error) throw error;

      await fetchButtons();
      return true;
    } catch (error) {
      console.error("Error updating button:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o botão.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteButton = async (buttonId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("smart_link_buttons")
        .delete()
        .eq("id", buttonId);

      if (error) throw error;

      await fetchButtons();
      return true;
    } catch (error) {
      console.error("Error deleting button:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o botão.",
        variant: "destructive",
      });
      return false;
    }
  };

  const reorderButtons = async (newOrder: string[]): Promise<boolean> => {
    try {
      const updates = newOrder.map((id, index) => ({
        id,
        position: index,
      }));

      for (const update of updates) {
        await supabase
          .from("smart_link_buttons")
          .update({ position: update.position })
          .eq("id", update.id);
      }

      await fetchButtons();
      return true;
    } catch (error) {
      console.error("Error reordering buttons:", error);
      return false;
    }
  };

  useEffect(() => {
    fetchButtons();

    if (pageId && user) {
      const channel = supabase
        .channel(`smart-link-buttons-${pageId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "smart_link_buttons",
            filter: `page_id=eq.${pageId}`,
          },
          () => fetchButtons()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [pageId, user]);

  return {
    buttons,
    isLoading,
    createButton,
    updateButton,
    deleteButton,
    reorderButtons,
    refetch: fetchButtons,
  };
};

// Hook for analytics
export const useSmartLinkAnalytics = (pageId: string | null) => {
  const [clicks, setClicks] = useState<SmartLinkClick[]>([]);
  const [viewCount, setViewCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = async () => {
    if (!pageId) {
      setClicks([]);
      setViewCount(0);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch clicks
      const { data: clicksData, error: clicksError } = await supabase
        .from("smart_link_clicks")
        .select("*")
        .eq("page_id", pageId)
        .order("clicked_at", { ascending: false })
        .limit(100);

      if (clicksError) throw clicksError;
      setClicks((clicksData as SmartLinkClick[]) || []);

      // Fetch view count
      const { count, error: viewsError } = await supabase
        .from("smart_link_views")
        .select("*", { count: "exact", head: true })
        .eq("page_id", pageId);

      if (viewsError) throw viewsError;
      setViewCount(count || 0);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();

    if (pageId) {
      const channel = supabase
        .channel(`smart-link-analytics-${pageId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "smart_link_clicks",
            filter: `page_id=eq.${pageId}`,
          },
          () => fetchAnalytics()
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "smart_link_views",
            filter: `page_id=eq.${pageId}`,
          },
          () => fetchAnalytics()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [pageId]);

  return {
    clicks,
    viewCount,
    isLoading,
    refetch: fetchAnalytics,
  };
};
