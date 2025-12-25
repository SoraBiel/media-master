import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface WppAccount {
  id: string;
  user_id: string;
  waba_id: string;
  phone_number_id: string;
  access_token: string;
  webhook_verify_token: string;
  phone_display: string | null;
  business_name: string | null;
  status: string;
  is_connected: boolean;
  last_validated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WppTemplate {
  id: string;
  user_id: string;
  wpp_account_id: string;
  template_name: string;
  template_id: string | null;
  language: string;
  category: string;
  status: string;
  components: any;
  variables: any;
  created_at: string;
  updated_at: string;
}

export interface WppContact {
  id: string;
  wa_id: string;
  phone: string;
  name: string | null;
  profile_name: string | null;
  opt_in_status: string;
}

export function useWhatsAppIntegration() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [accounts, setAccounts] = useState<WppAccount[]>([]);
  const [templates, setTemplates] = useState<WppTemplate[]>([]);
  const [contacts, setContacts] = useState<WppContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<WppAccount | null>(null);

  const fetchAccounts = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("wpp_accounts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setAccounts(data || []);
      
      if (data && data.length > 0 && !selectedAccount) {
        setSelectedAccount(data[0]);
      }
    } catch (error: any) {
      console.error("Error fetching WPP accounts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedAccount]);

  const fetchTemplates = useCallback(async (accountId?: string) => {
    if (!user) return;
    
    try {
      let query = supabase
        .from("wpp_templates")
        .select("*")
        .eq("user_id", user.id);
      
      if (accountId) {
        query = query.eq("wpp_account_id", accountId);
      }
      
      const { data, error } = await query.order("created_at", { ascending: false });
      
      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      console.error("Error fetching WPP templates:", error);
    }
  }, [user]);

  const fetchContacts = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("wpp_contacts")
        .select("*")
        .eq("user_id", user.id)
        .order("last_seen_at", { ascending: false });
      
      if (error) throw error;
      setContacts(data || []);
    } catch (error: any) {
      console.error("Error fetching WPP contacts:", error);
    }
  }, [user]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    if (selectedAccount) {
      fetchTemplates(selectedAccount.id);
    }
  }, [selectedAccount, fetchTemplates]);

  const connectAccount = async (
    wabaId: string,
    phoneNumberId: string,
    accessToken: string,
    businessName?: string
  ) => {
    if (!user) return null;
    
    setIsValidating(true);
    
    try {
      // Validate token by calling the API
      const { data: validateResult, error: validateError } = await supabase.functions.invoke("wpp-api", {
        body: {
          action: "validate",
          phoneNumberId,
          accessToken,
        },
      });
      
      if (validateError) throw validateError;
      
      if (!validateResult?.success) {
        throw new Error(validateResult?.error || "Token inválido");
      }
      
      // Save account
      const { data, error } = await supabase
        .from("wpp_accounts")
        .insert({
          user_id: user.id,
          waba_id: wabaId,
          phone_number_id: phoneNumberId,
          access_token: accessToken,
          business_name: businessName || validateResult.data?.verified_name,
          phone_display: validateResult.data?.display_phone_number,
          status: "active",
          is_connected: true,
          last_validated_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast({ title: "WhatsApp conectado com sucesso!" });
      await fetchAccounts();
      return data;
    } catch (error: any) {
      toast({
        title: "Erro ao conectar",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsValidating(false);
    }
  };

  const disconnectAccount = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from("wpp_accounts")
        .delete()
        .eq("id", accountId);
      
      if (error) throw error;
      
      toast({ title: "Conta desconectada" });
      
      if (selectedAccount?.id === accountId) {
        setSelectedAccount(null);
      }
      
      await fetchAccounts();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const sendMessage = async (
    accountId: string,
    to: string,
    message: string,
    messageType: "text" | "template" | "image" | "video" | "document" = "text",
    templateData?: any
  ) => {
    try {
      const account = accounts.find((a) => a.id === accountId);
      if (!account) throw new Error("Conta não encontrada");
      
      const { data, error } = await supabase.functions.invoke("wpp-api", {
        body: {
          action: "send",
          phoneNumberId: account.phone_number_id,
          accessToken: account.access_token,
          to,
          message,
          messageType,
          templateData,
        },
      });
      
      if (error) throw error;
      
      if (!data?.success) {
        throw new Error(data?.error || "Erro ao enviar mensagem");
      }
      
      // Log message
      await supabase.from("wpp_messages").insert({
        user_id: user!.id,
        wpp_account_id: accountId,
        wa_id: to,
        direction: "outbound",
        message_id: data.messageId,
        message_type: messageType,
        status: "sent",
        payload: { message, templateData },
      });
      
      return data;
    } catch (error: any) {
      toast({
        title: "Erro ao enviar",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const createTemplate = async (
    accountId: string,
    templateName: string,
    category: string,
    components: any[],
    language: string = "pt_BR"
  ) => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from("wpp_templates")
        .insert({
          user_id: user.id,
          wpp_account_id: accountId,
          template_name: templateName,
          category,
          components,
          language,
          status: "draft",
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast({ title: "Template criado!" });
      await fetchTemplates(accountId);
      return data;
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from("wpp_templates")
        .delete()
        .eq("id", templateId);
      
      if (error) throw error;
      
      toast({ title: "Template removido" });
      if (selectedAccount) {
        await fetchTemplates(selectedAccount.id);
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getWebhookUrl = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return "";
    
    return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wpp-webhook/${account.id}`;
  };

  return {
    accounts,
    templates,
    contacts,
    selectedAccount,
    isLoading,
    isValidating,
    setSelectedAccount,
    connectAccount,
    disconnectAccount,
    sendMessage,
    createTemplate,
    deleteTemplate,
    fetchAccounts,
    fetchTemplates,
    fetchContacts,
    getWebhookUrl,
  };
}
