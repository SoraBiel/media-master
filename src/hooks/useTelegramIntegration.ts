import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface TelegramIntegration {
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

export const useTelegramIntegration = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [integration, setIntegration] = useState<TelegramIntegration | null>(null);
  const [availableChats, setAvailableChats] = useState<TelegramChat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);

  const fetchIntegration = async () => {
    if (!user) {
      setIntegration(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("telegram_integrations")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching telegram integration:", error);
      } else {
        setIntegration(data);
      }
    } catch (error) {
      console.error("Error in fetchIntegration:", error);
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

  const validateToken = async (botToken: string) => {
    setIsValidating(true);
    try {
      const botInfo = await callTelegramAPI("validate", { botToken });
      
      // Save or update integration
      const integrationData = {
        user_id: user!.id,
        bot_token: botToken,
        bot_username: botInfo.username,
        bot_name: botInfo.first_name,
        is_validated: true,
        is_connected: true,
        last_validated_at: new Date().toISOString(),
      };

      if (integration) {
        const { error } = await supabase
          .from("telegram_integrations")
          .update(integrationData)
          .eq("id", integration.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("telegram_integrations")
          .insert(integrationData);
        
        if (error) throw error;
      }

      await fetchIntegration();
      
      toast({
        title: "Bot conectado!",
        description: `@${botInfo.username} foi validado com sucesso.`,
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

  const fetchAvailableChats = async () => {
    if (!integration?.bot_token) return [];

    try {
      const chats = await callTelegramAPI("getChats", { botToken: integration.bot_token });
      setAvailableChats(chats);
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

  const selectChat = async (chatId: string, chatTitle: string) => {
    if (!integration) return;

    try {
      const { error } = await supabase
        .from("telegram_integrations")
        .update({ chat_id: chatId, chat_title: chatTitle })
        .eq("id", integration.id);

      if (error) throw error;

      await fetchIntegration();
      
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

  const sendMessage = async (message: string, chatId?: string) => {
    if (!integration?.bot_token) {
      toast({
        title: "Bot não conectado",
        description: "Conecte um bot primeiro.",
        variant: "destructive",
      });
      return;
    }

    const targetChatId = chatId || integration.chat_id;
    if (!targetChatId) {
      toast({
        title: "Destino não definido",
        description: "Selecione um grupo/canal primeiro.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await callTelegramAPI("sendMessage", {
        botToken: integration.bot_token,
        chatId: targetChatId,
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

  const sendMedia = async (mediaUrl: string, mediaType: "photo" | "video", caption?: string, chatId?: string) => {
    if (!integration?.bot_token) {
      toast({
        title: "Bot não conectado",
        description: "Conecte um bot primeiro.",
        variant: "destructive",
      });
      return;
    }

    const targetChatId = chatId || integration.chat_id;
    if (!targetChatId) {
      toast({
        title: "Destino não definido",
        description: "Selecione um grupo/canal primeiro.",
        variant: "destructive",
      });
      return;
    }

    try {
      const action = mediaType === "photo" ? "sendPhoto" : "sendVideo";
      const result = await callTelegramAPI(action, {
        botToken: integration.bot_token,
        chatId: targetChatId,
        mediaUrl,
        message: caption,
      });

      toast({
        title: "Mídia enviada!",
        description: `${mediaType === "photo" ? "Foto" : "Vídeo"} enviado com sucesso.`,
      });

      return result;
    } catch (error: any) {
      toast({
        title: "Erro ao enviar mídia",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const disconnect = async () => {
    if (!integration) return;

    try {
      const { error } = await supabase
        .from("telegram_integrations")
        .delete()
        .eq("id", integration.id);

      if (error) throw error;

      setIntegration(null);
      setAvailableChats([]);
      
      toast({
        title: "Desconectado",
        description: "Bot do Telegram desconectado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao desconectar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchIntegration();

    // Set up realtime subscription
    if (user) {
      const channel = supabase
        .channel("telegram_integration_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "telegram_integrations",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchIntegration();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  return {
    integration,
    availableChats,
    isLoading,
    isValidating,
    validateToken,
    fetchAvailableChats,
    selectChat,
    sendMessage,
    sendMedia,
    disconnect,
    fetchIntegration,
  };
};
