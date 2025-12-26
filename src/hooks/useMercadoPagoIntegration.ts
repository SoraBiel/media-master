import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface MercadoPagoIntegration {
  id: string;
  user_id: string;
  provider: string;
  provider_user_id: string | null;
  provider_email: string | null;
  provider_name: string | null;
  environment: string;
  status: string;
  last_sync_at: string | null;
  created_at: string;
}

export const useMercadoPagoIntegration = () => {
  const { user } = useAuth();

  const { data: integration, isLoading, error, refetch } = useQuery({
    queryKey: ['mercadopago-integration', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'mercadopago')
        .maybeSingle();
      
      if (error) throw error;
      return data as MercadoPagoIntegration | null;
    },
    enabled: !!user?.id
  });

  const isConnected = integration?.status === 'active';

  return {
    integration,
    isConnected,
    isLoading,
    error,
    refetch
  };
};
