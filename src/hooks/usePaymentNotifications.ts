import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const usePaymentNotifications = () => {
  const { user } = useAuth();
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.log('Este navegador não suporta notificações');
      return false;
    }

    const permission = await Notification.requestPermission();
    setPermissionStatus(permission);
    return permission === 'granted';
  };

  const showNotification = (title: string, body: string, icon?: string) => {
    if (permissionStatus !== 'granted') return;

    new Notification(title, {
      body,
      icon: icon || '/logo-nexo.png',
      badge: '/logo-nexo.png',
      tag: 'payment-notification',
      requireInteraction: true,
    });
  };

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('payment-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'funnel_payments',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;

          // Notificar quando status muda para 'paid'
          if (oldRecord.status !== 'paid' && newRecord.status === 'paid') {
            const amount = (newRecord.amount_cents / 100).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            });
            
            showNotification(
              '💰 Pagamento Confirmado!',
              `${newRecord.lead_name || 'Lead'} pagou ${amount}`,
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, permissionStatus]);

  return {
    permissionStatus,
    requestPermission,
    isSupported: 'Notification' in window,
  };
};
