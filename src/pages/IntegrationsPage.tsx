import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Link2, Unlink, RefreshCw, ExternalLink, CreditCard, CheckCircle2, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Integration {
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

const IntegrationsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const successParam = searchParams.get('success');
  const errorParam = searchParams.get('error');

  // Handle OAuth callback result
  useEffect(() => {
    if (successParam === 'true') {
      toast({
        title: "Mercado Pago conectado!",
        description: "Sua conta foi autorizada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    } else if (errorParam) {
      const errorMessages: Record<string, string> = {
        missing_params: "Parâmetros ausentes na resposta",
        invalid_state: "Estado inválido na resposta",
        missing_user: "Usuário não identificado",
        token_exchange_failed: "Falha na troca de tokens",
        save_failed: "Falha ao salvar integração",
        unknown: "Erro desconhecido",
      };
      toast({
        title: "Erro na conexão",
        description: errorMessages[errorParam] || errorParam,
        variant: "destructive",
      });
    }
  }, [successParam, errorParam, toast, queryClient]);

  const handleDismissCallback = () => {
    setSearchParams({});
  };

  // Fetch user's integrations
  const { data: integrations, isLoading } = useQuery({
    queryKey: ['integrations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data as Integration[];
    },
    enabled: !!user?.id
  });

  // Get Mercado Pago integration
  const mercadoPagoIntegration = integrations?.find(i => i.provider === 'mercadopago');

  // Connect to Mercado Pago
  const connectMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('mercadopago-oauth', {
        body: { action: 'get_auth_url' },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const authUrl = data?.auth_url as string | undefined;
      if (!authUrl) {
        toast({
          title: 'Erro',
          description: 'URL de autorização não encontrada',
          variant: 'destructive',
        });
        return;
      }

      // Open in a new tab directly
      window.open(authUrl, '_blank', 'noopener,noreferrer');
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao conectar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Disconnect from Mercado Pago
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      if (!mercadoPagoIntegration) throw new Error("Integração não encontrada");
      
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', mercadoPagoIntegration.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast({
        title: "Desconectado",
        description: "Mercado Pago foi desconectado com sucesso"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao desconectar",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Refresh token
  const refreshMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('mercadopago-oauth', {
        body: { action: 'refresh_token' }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast({
        title: "Token atualizado",
        description: "O token foi renovado com sucesso"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar token",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Success/Error banner */}
        {(successParam === 'true' || errorParam) && (
          <Card className={`border-2 ${successParam === 'true' ? 'border-success bg-success/10' : 'border-destructive bg-destructive/10'}`}>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className={`w-6 h-6 ${successParam === 'true' ? 'text-success' : 'text-destructive'}`} />
                <div>
                  <p className="font-semibold">
                    {successParam === 'true' ? 'Mercado Pago conectado com sucesso!' : 'Erro na conexão'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {successParam === 'true' 
                      ? 'Sua conta foi autorizada e está pronta para receber pagamentos.' 
                      : `Ocorreu um erro: ${errorParam}`
                    }
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={handleDismissCallback}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para Integrações
              </Button>
            </CardContent>
          </Card>
        )}

        <div>
          <h1 className="text-3xl font-bold">Integrações</h1>
          <p className="text-muted-foreground mt-1">
            Conecte serviços externos para expandir as funcionalidades
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Mercado Pago Card */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#00b1ea]/20 to-transparent rounded-bl-full" />
              
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#00b1ea]/10 rounded-xl flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-[#00b1ea]" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Mercado Pago</CardTitle>
                      <CardDescription>Pagamentos via Pix</CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant={mercadoPagoIntegration?.status === 'active' ? 'default' : 'secondary'}
                    className={mercadoPagoIntegration?.status === 'active' ? 'bg-success' : ''}
                  >
                    {mercadoPagoIntegration?.status === 'active' ? 'Conectado' : 'Não conectado'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {mercadoPagoIntegration ? (
                  <>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">User ID:</span>
                        <span className="font-mono text-xs">{mercadoPagoIntegration.provider_user_id || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Conta:</span>
                        <span>{mercadoPagoIntegration.provider_name || mercadoPagoIntegration.provider_email || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ambiente:</span>
                        <Badge variant="outline" className="text-xs">
                          {mercadoPagoIntegration.environment === 'production' ? 'Produção' : 'Sandbox'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Última sync:</span>
                        <span>
                          {mercadoPagoIntegration.last_sync_at 
                            ? format(new Date(mercadoPagoIntegration.last_sync_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                            : '-'
                          }
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => refreshMutation.mutate()}
                        disabled={refreshMutation.isPending}
                      >
                        {refreshMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Atualizar
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => disconnectMutation.mutate()}
                        disabled={disconnectMutation.isPending}
                      >
                        {disconnectMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Unlink className="w-4 h-4 mr-2" />
                        )}
                        Desconectar
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Conecte sua conta do Mercado Pago para receber pagamentos via Pix automaticamente nos seus funis.
                    </p>
                    <Button 
                      className="w-full bg-[#00b1ea] hover:bg-[#009dd4]"
                      onClick={() => connectMutation.mutate()}
                      disabled={connectMutation.isPending}
                    >
                      {connectMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Link2 className="w-4 h-4 mr-2" />
                      )}
                      Conectar Mercado Pago
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Placeholder for future integrations */}
            <Card className="border-dashed opacity-50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
                    <ExternalLink className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-muted-foreground">Em breve</CardTitle>
                    <CardDescription>Mais integrações</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Novas integrações serão adicionadas em breve.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default IntegrationsPage;
