import { CheckCircle, Clock, Bell } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { usePaymentNotifications } from '@/hooks/usePaymentNotifications';

export const NotificationSettings = () => {
  const {
    permissionStatus,
    isEnabled,
    notifyPaid,
    notifyPending,
    toggleNotifications,
    setNotifyPaid,
    setNotifyPending,
    isSupported,
  } = usePaymentNotifications();

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
          </CardTitle>
          <CardDescription>
            Seu navegador não suporta notificações push.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const isActive = isEnabled && permissionStatus === 'granted';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notificações
        </CardTitle>
        <CardDescription>
          As preferências são salvas automaticamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Venda Aprovada */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">Venda Aprovada</p>
              <p className="text-sm text-muted-foreground">
                Receba notificações quando uma venda for aprovada.
              </p>
            </div>
          </div>
          <Switch
            checked={notifyPaid && isActive}
            onCheckedChange={(checked) => {
              if (!isActive && checked) {
                toggleNotifications();
              }
              setNotifyPaid(checked);
            }}
          />
        </div>

        <Separator />

        {/* Venda Pendente */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <p className="font-medium">Venda Pendente</p>
              <p className="text-sm text-muted-foreground">
                Receba notificações quando uma venda estiver pendente.
              </p>
            </div>
          </div>
          <Switch
            checked={notifyPending && isActive}
            onCheckedChange={(checked) => {
              if (!isActive && checked) {
                toggleNotifications();
              }
              setNotifyPending(checked);
            }}
          />
        </div>

        {permissionStatus === 'denied' && (
          <>
            <Separator />
            <p className="text-sm text-destructive">
              As notificações foram bloqueadas pelo navegador. Para ativá-las, acesse as configurações do seu navegador.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};
