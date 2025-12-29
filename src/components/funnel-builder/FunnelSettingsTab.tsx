import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, Bell, Clock, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TypebotConverter } from './TypebotConverter';
import { FunnelNode, FunnelEdge } from './types';

interface FunnelSettingsTabProps {
  funnelId: string;
  onImportFunnel?: (nodes: FunnelNode[], edges: FunnelEdge[]) => void;
}

export const FunnelSettingsTab = ({ funnelId, onImportFunnel }: FunnelSettingsTabProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState<string>('5');
  const [autoRemarketingEnabled, setAutoRemarketingEnabled] = useState(false);
  const [autoRemarketingMessage, setAutoRemarketingMessage] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('funnels')
          .select('payment_reminder_minutes, auto_remarketing_enabled, auto_remarketing_message')
          .eq('id', funnelId)
          .single();

        if (error) throw error;
        
        if (data?.payment_reminder_minutes) {
          setReminderMinutes(String(data.payment_reminder_minutes));
        }
        setAutoRemarketingEnabled(data?.auto_remarketing_enabled || false);
        setAutoRemarketingMessage(data?.auto_remarketing_message || '');
      } catch (error) {
        console.error('Error fetching funnel settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [funnelId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('funnels')
        .update({ 
          payment_reminder_minutes: parseInt(reminderMinutes),
          auto_remarketing_enabled: autoRemarketingEnabled,
          auto_remarketing_message: autoRemarketingMessage || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', funnelId);

      if (error) throw error;

      toast({
        title: 'Configurações salvas',
        description: 'As configurações do funil foram atualizadas.',
      });
    } catch (error: unknown) {
      toast({
        title: 'Erro ao salvar',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold">Configurações do Funil</h2>
        <p className="text-sm text-muted-foreground">
          Configure o comportamento do funil e importe funis externos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Lembrete de Pagamento PIX</CardTitle>
          </div>
          <CardDescription>
            Configure quando enviar um lembrete para clientes que não finalizaram o pagamento.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reminder-time" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Tempo para enviar lembrete
            </Label>
            <Select value={reminderMinutes} onValueChange={setReminderMinutes}>
              <SelectTrigger id="reminder-time" className="w-[200px]">
                <SelectValue placeholder="Selecione o tempo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Desativado</SelectItem>
                <SelectItem value="3">3 minutos</SelectItem>
                <SelectItem value="5">5 minutos</SelectItem>
                <SelectItem value="10">10 minutos</SelectItem>
                <SelectItem value="15">15 minutos</SelectItem>
                <SelectItem value="30">30 minutos</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {reminderMinutes === '0' 
                ? 'Lembretes de pagamento estão desativados.'
                : `Um lembrete será enviado ${reminderMinutes} minutos após a geração do PIX se o pagamento não for confirmado.`
              }
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-base">Remarketing Automático</CardTitle>
          </div>
          <CardDescription>
            Envie mensagens automáticas para leads que não completaram o pagamento.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Ativar Remarketing Automático</Label>
              <p className="text-xs text-muted-foreground">
                Envia mensagens automaticamente após o tempo de lembrete configurado acima.
              </p>
            </div>
            <Switch
              checked={autoRemarketingEnabled}
              onCheckedChange={setAutoRemarketingEnabled}
            />
          </div>
          
          {autoRemarketingEnabled && (
            <div className="space-y-2">
              <Label htmlFor="auto-remarketing-message">Mensagem de Remarketing</Label>
              <Textarea
                id="auto-remarketing-message"
                placeholder="💰 Oi! Vi que você ainda não finalizou seu pagamento. Posso te ajudar com algo?"
                value={autoRemarketingMessage}
                onChange={(e) => setAutoRemarketingMessage(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Se vazio, será usada a mensagem padrão. Você pode usar HTML para formatação.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>

      {/* Typebot Converter */}
      <TypebotConverter funnelId={funnelId} onImport={onImportFunnel} />
    </div>
  );
};
