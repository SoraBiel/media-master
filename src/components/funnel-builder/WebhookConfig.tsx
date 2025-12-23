import { useState, useEffect } from 'react';
import { 
  Webhook, 
  Copy, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TelegramIntegration {
  id: string;
  bot_name: string | null;
  bot_username: string | null;
  is_validated: boolean;
}

interface WebhookConfigProps {
  funnelId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWebhookConfigured?: () => void;
}

export const WebhookConfig = ({ 
  funnelId, 
  open, 
  onOpenChange,
  onWebhookConfigured 
}: WebhookConfigProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<TelegramIntegration[]>([]);
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<string>('');
  const [funnelData, setFunnelData] = useState<{ 
    telegram_integration_id: string | null;
    webhook_url: string | null;
    webhook_registered: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<'unknown' | 'active' | 'inactive'>('unknown');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  
  useEffect(() => {
    if (open && user) {
      fetchData();
    }
  }, [open, user, funnelId]);

  const fetchData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Fetch user's telegram integrations
      const { data: integrationsData } = await supabase
        .from('telegram_integrations')
        .select('id, bot_name, bot_username, is_validated')
        .eq('user_id', user.id)
        .eq('is_validated', true);

      setIntegrations(integrationsData || []);

      // Fetch funnel data
      const { data: funnel } = await supabase
        .from('funnels')
        .select('telegram_integration_id, webhook_url, webhook_registered')
        .eq('id', funnelId)
        .single();

      if (funnel) {
        setFunnelData(funnel);
        setSelectedIntegrationId(funnel.telegram_integration_id || '');
        if (funnel.webhook_registered) {
          setWebhookStatus('active');
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getWebhookUrl = (integrationId: string) => {
    return `${supabaseUrl}/functions/v1/funnel-webhook/${integrationId}`;
  };

  const handleRegisterWebhook = async () => {
    if (!selectedIntegrationId) {
      toast({
        title: 'Erro',
        description: 'Selecione um bot do Telegram primeiro.',
        variant: 'destructive',
      });
      return;
    }

    setIsRegistering(true);
    try {
      // Get bot token
      const { data: integration } = await supabase
        .from('telegram_integrations')
        .select('bot_token')
        .eq('id', selectedIntegrationId)
        .single();

      if (!integration) throw new Error('Integração não encontrada');

      const webhookUrl = getWebhookUrl(selectedIntegrationId);

      // Register webhook with Telegram
      const response = await fetch(
        `https://api.telegram.org/bot${integration.bot_token}/setWebhook`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: webhookUrl }),
        }
      );

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.description || 'Erro ao registrar webhook');
      }

      // Update funnel with webhook info
      await supabase
        .from('funnels')
        .update({
          telegram_integration_id: selectedIntegrationId,
          webhook_url: webhookUrl,
          webhook_registered: true,
        })
        .eq('id', funnelId);

      setFunnelData(prev => prev ? {
        ...prev,
        telegram_integration_id: selectedIntegrationId,
        webhook_url: webhookUrl,
        webhook_registered: true,
      } : null);
      setWebhookStatus('active');

      toast({
        title: 'Webhook Registrado!',
        description: 'O bot do Telegram agora está conectado a este funil.',
      });

      onWebhookConfigured?.();
    } catch (error: any) {
      console.error('Error registering webhook:', error);
      toast({
        title: 'Erro ao registrar webhook',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleUnregisterWebhook = async () => {
    if (!funnelData?.telegram_integration_id) return;

    setIsRegistering(true);
    try {
      // Get bot token
      const { data: integration } = await supabase
        .from('telegram_integrations')
        .select('bot_token')
        .eq('id', funnelData.telegram_integration_id)
        .single();

      if (!integration) throw new Error('Integração não encontrada');

      // Remove webhook from Telegram
      const response = await fetch(
        `https://api.telegram.org/bot${integration.bot_token}/deleteWebhook`,
        { method: 'POST' }
      );

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.description || 'Erro ao remover webhook');
      }

      // Update funnel
      await supabase
        .from('funnels')
        .update({
          webhook_url: null,
          webhook_registered: false,
        })
        .eq('id', funnelId);

      setFunnelData(prev => prev ? {
        ...prev,
        webhook_url: null,
        webhook_registered: false,
      } : null);
      setWebhookStatus('inactive');

      toast({
        title: 'Webhook Removido',
        description: 'O bot do Telegram foi desconectado deste funil.',
      });
    } catch (error: any) {
      console.error('Error unregistering webhook:', error);
      toast({
        title: 'Erro ao remover webhook',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleCopyWebhookUrl = () => {
    if (funnelData?.webhook_url) {
      navigator.clipboard.writeText(funnelData.webhook_url);
      toast({ title: 'URL copiada!' });
    }
  };

  const handleCheckWebhookStatus = async () => {
    if (!funnelData?.telegram_integration_id) return;

    try {
      const { data: integration } = await supabase
        .from('telegram_integrations')
        .select('bot_token')
        .eq('id', funnelData.telegram_integration_id)
        .single();

      if (!integration) return;

      const response = await fetch(
        `https://api.telegram.org/bot${integration.bot_token}/getWebhookInfo`,
        { method: 'GET' }
      );

      const result = await response.json();

      if (result.ok && result.result.url) {
        setWebhookStatus('active');
        toast({
          title: 'Webhook Ativo',
          description: `URL: ${result.result.url}`,
        });
      } else {
        setWebhookStatus('inactive');
        toast({
          title: 'Webhook Inativo',
          description: 'Nenhum webhook configurado no Telegram.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error checking webhook:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Configurar Webhook do Telegram
          </DialogTitle>
          <DialogDescription>
            Conecte um bot do Telegram a este funil para receber mensagens e executar a automação.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {integrations.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Você não tem bots do Telegram configurados. Vá para a página de Telegram para adicionar um bot.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Bot do Telegram</Label>
                  <Select
                    value={selectedIntegrationId}
                    onValueChange={setSelectedIntegrationId}
                    disabled={funnelData?.webhook_registered}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um bot" />
                    </SelectTrigger>
                    <SelectContent>
                      {integrations.map((int) => (
                        <SelectItem key={int.id} value={int.id}>
                          @{int.bot_username || int.bot_name || 'Bot'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {funnelData?.webhook_registered && funnelData.webhook_url && (
                  <div className="space-y-2">
                    <Label>URL do Webhook</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={funnelData.webhook_url} 
                        readOnly 
                        className="text-xs font-mono"
                      />
                      <Button variant="outline" size="icon" onClick={handleCopyWebhookUrl}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Status:</span>
                    {webhookStatus === 'active' ? (
                      <Badge className="bg-success">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Ativo
                      </Badge>
                    ) : webhookStatus === 'inactive' ? (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Inativo
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Desconhecido</Badge>
                    )}
                  </div>
                  {funnelData?.webhook_registered && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleCheckWebhookStatus}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Verificar
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter className="flex gap-2">
          {funnelData?.webhook_registered ? (
            <Button
              variant="destructive"
              onClick={handleUnregisterWebhook}
              disabled={isRegistering}
            >
              {isRegistering ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Desconectar
            </Button>
          ) : (
            <Button
              onClick={handleRegisterWebhook}
              disabled={isRegistering || !selectedIntegrationId}
            >
              {isRegistering ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Webhook className="h-4 w-4 mr-2" />
              )}
              Conectar Webhook
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
