import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Link2, Unlink, RefreshCw, ExternalLink, CreditCard, CheckCircle2, ArrowLeft, BarChart3, Save, Eye, EyeOff, TestTube2 } from "lucide-react";
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
  tracking_enabled?: boolean;
  api_token?: string;
}

const IntegrationsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // UTMify state
  const [utmifyToken, setUtmifyToken] = useState("");
  const [utmifyTracking, setUtmifyTracking] = useState(false);
  const [showUtmifyToken, setShowUtmifyToken] = useState(false);

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
  
  // Get UTMify integration
  const utmifyIntegration = integrations?.find(i => i.provider === 'utmify');

  // Load UTMify state when integration data loads
  useEffect(() => {
    if (utmifyIntegration) {
      setUtmifyToken(utmifyIntegration.api_token || "");
      setUtmifyTracking(utmifyIntegration.tracking_enabled || false);
    }
  }, [utmifyIntegration]);

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

  // UTMify save mutation
  const saveUtmifyMutation = useMutation({
    mutationFn: async ({ token, trackingEnabled }: { token: string; trackingEnabled: boolean }) => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      
      if (utmifyIntegration) {
        // Update existing integration
        const { error } = await supabase
          .from('integrations')
          .update({
            api_token: token,
            tracking_enabled: trackingEnabled,
            updated_at: new Date().toISOString(),
          })
          .eq('id', utmifyIntegration.id);
        
        if (error) throw error;
      } else {
        // Create new integration
        const { error } = await supabase
          .from('integrations')
          .insert({
            user_id: user.id,
            provider: 'utmify',
            api_token: token,
            tracking_enabled: trackingEnabled,
            access_token: 'utmify_token', // Required field, using placeholder
            status: token ? 'active' : 'inactive',
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast({
        title: "UTMify salvo!",
        description: utmifyTracking 
          ? "Trackeamento ativado. Eventos serão enviados automaticamente." 
          : "Configurações salvas.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar UTMify",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // UTMify disconnect mutation
  const disconnectUtmifyMutation = useMutation({
    mutationFn: async () => {
      if (!utmifyIntegration) throw new Error("Integração não encontrada");
      
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', utmifyIntegration.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      setUtmifyToken("");
      setUtmifyTracking(false);
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast({
        title: "Desconectado",
        description: "UTMify foi desconectado com sucesso"
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

  // UTMify test token mutation
  const testUtmifyMutation = useMutation({
    mutationFn: async (token: string) => {
      const { data, error } = await supabase.functions.invoke('utmify-track', {
        body: { action: 'test_token', api_token: token }
      });
      
      if (error) throw error;
      return data as { ok: boolean; valid: boolean; message?: string; error?: string };
    },
    onSuccess: (data) => {
      if (data.valid) {
        toast({
          title: "Token válido!",
          description: data.message || "Conexão com UTMify testada com sucesso.",
        });
      } else {
        toast({
          title: "Token inválido",
          description: data.error || "O token não foi aceito pela UTMify.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao testar token",
        description: error.message,
        variant: "destructive",
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

            {/* UTMify Card */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-bl-full" />
              
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">UTMify</CardTitle>
                      <CardDescription>Trackeamento de vendas</CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant={utmifyIntegration?.tracking_enabled ? 'default' : 'secondary'}
                    className={utmifyIntegration?.tracking_enabled ? 'bg-success' : ''}
                  >
                    {utmifyIntegration?.tracking_enabled ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Toggle Trackeamento */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="utmify-tracking" className="text-sm font-medium">
                      Trackeamento
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Ativar envio de eventos para UTMify
                    </p>
                  </div>
                  <Switch
                    id="utmify-tracking"
                    checked={utmifyTracking}
                    onCheckedChange={setUtmifyTracking}
                  />
                </div>

                {/* API Token Input */}
                <div className="space-y-2">
                  <Label htmlFor="utmify-token" className="text-sm">
                    API Token
                  </Label>
                  <div className="relative">
                    <Input
                      id="utmify-token"
                      type={showUtmifyToken ? "text" : "password"}
                      value={utmifyToken}
                      onChange={(e) => setUtmifyToken(e.target.value)}
                      placeholder="Cole seu token da UTMify"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowUtmifyToken(!showUtmifyToken)}
                    >
                      {showUtmifyToken ? (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Obtenha seu token em{" "}
                    <a 
                      href="https://app.utmify.com.br" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-purple-500 hover:underline"
                    >
                      app.utmify.com.br
                    </a>
                  </p>
                </div>

                {/* Status Info */}
                {utmifyIntegration && (
                  <div className="space-y-2 text-sm pt-2 border-t">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="outline" className="text-xs">
                        {utmifyIntegration.status === 'active' ? 'Conectado' : 'Não conectado'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Última atualização:</span>
                      <span className="text-xs">
                        {utmifyIntegration.last_sync_at 
                          ? format(new Date(utmifyIntegration.last_sync_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                          : format(new Date(utmifyIntegration.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                        }
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2 pt-2">
                  <Button 
                    variant="outline"
                    className="w-full border-purple-500/50 text-purple-500 hover:bg-purple-500/10"
                    onClick={() => testUtmifyMutation.mutate(utmifyToken)}
                    disabled={testUtmifyMutation.isPending || !utmifyToken.trim()}
                  >
                    {testUtmifyMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <TestTube2 className="w-4 h-4 mr-2" />
                    )}
                    Testar Conexão
                  </Button>
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-purple-500 hover:bg-purple-600"
                      onClick={() => saveUtmifyMutation.mutate({ token: utmifyToken, trackingEnabled: utmifyTracking })}
                      disabled={saveUtmifyMutation.isPending || !utmifyToken.trim()}
                    >
                      {saveUtmifyMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Salvar
                    </Button>
                    {utmifyIntegration && (
                      <Button 
                        variant="destructive" 
                        size="icon"
                        onClick={() => disconnectUtmifyMutation.mutate()}
                        disabled={disconnectUtmifyMutation.isPending}
                      >
                        {disconnectUtmifyMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Unlink className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3 text-xs text-muted-foreground">
                  <p className="font-medium text-purple-500 mb-1">100% Server-Side</p>
                  <p>Trackeamento automático de vendas Pix sem bloqueio de navegador. Eventos enviados: Pendente, Aprovado, Recusado, Reembolso.</p>
                </div>
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
