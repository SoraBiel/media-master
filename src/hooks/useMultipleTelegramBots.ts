import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface TelegramBot {
  id: string;
  user_id: string;
  bot_token: string;
  bot_username: string | null;
  bot_name: string | null;
  chat_id: string | null;
  chat_title: string | null;
  is_connected: boolean;
  is_validated: boolean;
  last_validated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TelegramChat {
  id: number;
  title: string;
  type: string;
  username?: string;
}

export interface BotHealthStatus {
  botId: string;
  isOnline: boolean;
  lastCheckedAt: string;
  error?: string;
}

export const useMultipleTelegramBots = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [bots, setBots] = useState<TelegramBot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [botHealthStatuses, setBotHealthStatuses] = useState<Record<string, BotHealthStatus>>({});
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const fetchBots = async () => {
    if (!user) {
      setBots([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("telegram_integrations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching telegram bots:", error);
      } else {
        setBots(data || []);
      }
    } catch (error) {
      console.error("Error in fetchBots:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const callTelegramAPI = async (action: string, params: Record<string, any> = {}) => {
    if (!session?.access_token) {
      throw new Error("No session available");
    }

    const response = await supabase.functions.invoke("telegram-bot", {
      body: { action, ...params },
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    if (!response.data.success) {
      throw new Error(response.data.error || "Unknown error");
    }

    return response.data.data;
  };

  const addBot = async (botToken: string) => {
    setIsValidating(true);
    try {
      const botInfo = await callTelegramAPI("validate", { botToken });
      
      const integrationData = {
        user_id: user!.id,
        bot_token: botToken,
        bot_username: botInfo.username,
        bot_name: botInfo.first_name,
        is_validated: true,
        is_connected: true,
        last_validated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("telegram_integrations")
        .insert(integrationData);
      
      if (error) throw error;

      await fetchBots();
      
      toast({
        title: "Bot conectado!",
        description: `@${botInfo.username} foi adicionado com sucesso.`,
      });

      return botInfo;
    } catch (error: any) {
      toast({
        title: "Erro ao validar",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsValidating(false);
    }
  };

  const removeBot = async (botId: string) => {
    try {
      const { error } = await supabase
        .from("telegram_integrations")
        .delete()
        .eq("id", botId);

      if (error) throw error;

      await fetchBots();
      
      toast({
        title: "Bot removido",
        description: "Bot desconectado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao remover",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchChatsForBot = async (botToken: string): Promise<TelegramChat[]> => {
    try {
      const chats = await callTelegramAPI("getChats", { botToken });
      return chats;
    } catch (error: any) {
      console.error("Error fetching chats:", error);
      toast({
        title: "Erro ao buscar grupos",
        description: error.message,
        variant: "destructive",
      });
      return [];
    }
  };

  const selectChatForBot = async (botId: string, chatId: string, chatTitle: string) => {
    try {
      const { error } = await supabase
        .from("telegram_integrations")
        .update({ chat_id: chatId, chat_title: chatTitle })
        .eq("id", botId);

      if (error) throw error;

      await fetchBots();
      
      toast({
        title: "Destino selecionado",
        description: `${chatTitle} foi definido como destino.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao selecionar destino",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const sendMessage = async (botToken: string, chatId: string, message: string) => {
    try {
      const result = await callTelegramAPI("sendMessage", {
        botToken,
        chatId,
        message,
      });

      toast({
        title: "Mensagem enviada!",
        description: "Sua mensagem foi enviada com sucesso.",
      });

      return result;
    } catch (error: any) {
      toast({
        title: "Erro ao enviar",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const checkBotHealth = async (bot: TelegramBot): Promise<BotHealthStatus> => {
    try {
      await callTelegramAPI("validate", { botToken: bot.bot_token });
      return {
        botId: bot.id,
        isOnline: true,
        lastCheckedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        botId: bot.id,
        isOnline: false,
        lastCheckedAt: new Date().toISOString(),
        error: error.message,
      };
    }
  };

  const checkAllBotsHealth = async () => {
    if (bots.length === 0 || !session?.access_token) return;
    
    setIsCheckingHealth(true);
    const statuses: Record<string, BotHealthStatus> = {};
    
    const results = await Promise.all(bots.map(bot => checkBotHealth(bot)));
    
    results.forEach(status => {
      statuses[status.botId] = status;
      
      // Show toast for bots that went offline
      if (!status.isOnline) {
        const bot = bots.find(b => b.id === status.botId);
        toast({
          title: "⚠️ Bot Offline",
          description: `O bot @${bot?.bot_username || "desconhecido"} está offline. Verifique o token.`,
          variant: "destructive",
        });
      }
    });
    
    setBotHealthStatuses(statuses);
    setIsCheckingHealth(false);
  };

  useEffect(() => {
    fetchBots();

    if (user) {
      const channel = supabase
        .channel("telegram_bots_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "telegram_integrations",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchBots();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  // Periodic health check every 5 minutes
  useEffect(() => {
    if (bots.length === 0 || !session?.access_token) return;

    // Initial check
    checkAllBotsHealth();

    const interval = setInterval(() => {
      checkAllBotsHealth();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [bots.length, session?.access_token]);

  return {
    bots,
    isLoading,
    isValidating,
    addBot,
    removeBot,
    fetchChatsForBot,
    selectChatForBot,
    sendMessage,
    fetchBots,
    connectedBotsCount: bots.filter(b => b.is_connected).length,
    botHealthStatuses,
    isCheckingHealth,
    checkAllBotsHealth,
  };
};
