import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const NOTIFICATION_KEY = 'payment_notifications_enabled';
const NOTIFICATION_PAID_KEY = 'payment_notifications_paid';
const NOTIFICATION_PENDING_KEY = 'payment_notifications_pending';

interface NotificationPreferences {
  enabled: boolean;
  notifyPaid: boolean;
  notifyPending: boolean;
}

export const usePaymentNotifications = () => {
  const { user } = useAuth();
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [preferences, setPreferences] = useState<NotificationPreferences>(() => ({
    enabled: localStorage.getItem(NOTIFICATION_KEY) !== 'false', // Default to enabled
    notifyPaid: localStorage.getItem(NOTIFICATION_PAID_KEY) !== 'false', // Default to enabled
    notifyPending: localStorage.getItem(NOTIFICATION_PENDING_KEY) !== 'false', // Default to enabled
  }));
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Create audio element for notification sound
  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1iYmJhX2ZmaGJiYGRiY2Nka2tra2lmaWpuamdjZmZmamtra2dmZWVmaGlrbGppZ2doaWlqamppaGdoaGlpaWlpaWhoaGhoaGhoaGhoaGhoZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2hoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaA==');
    audioRef.current.volume = 0.5;
  }, []);

  const playNotificationSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.error);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.log('Este navegador não suporta notificações');
      return false;
    }

    const permission = await Notification.requestPermission();
    setPermissionStatus(permission);
    
    if (permission === 'granted') {
      setPreferences(prev => {
        const newPrefs = { ...prev, enabled: true };
        localStorage.setItem(NOTIFICATION_KEY, 'true');
        return newPrefs;
      });
    }
    
    return permission === 'granted';
  };

  const toggleNotifications = useCallback(() => {
    if (permissionStatus !== 'granted') {
      requestPermission();
      return;
    }
    
    setPreferences(prev => {
      const newEnabled = !prev.enabled;
      localStorage.setItem(NOTIFICATION_KEY, String(newEnabled));
      return { ...prev, enabled: newEnabled };
    });
  }, [permissionStatus]);

  const setNotifyPaid = useCallback((value: boolean) => {
    setPreferences(prev => {
      localStorage.setItem(NOTIFICATION_PAID_KEY, String(value));
      return { ...prev, notifyPaid: value };
    });
  }, []);

  const setNotifyPending = useCallback((value: boolean) => {
    setPreferences(prev => {
      localStorage.setItem(NOTIFICATION_PENDING_KEY, String(value));
      return { ...prev, notifyPending: value };
    });
  }, []);

  const showNotification = useCallback((title: string, body: string, icon?: string) => {
    if (permissionStatus !== 'granted' || !preferences.enabled) return;

    playNotificationSound();
    
    new Notification(title, {
      body,
      icon: icon || '/logo-nexo.png',
      badge: '/logo-nexo.png',
      tag: 'payment-notification-' + Date.now(),
      requireInteraction: false,
    });
  }, [permissionStatus, preferences.enabled, playNotificationSound]);

  // Auto-request permission on mount if not already granted
  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
      
      // Auto-request if default and user wants notifications
      if (Notification.permission === 'default' && preferences.enabled) {
        requestPermission();
      }
    }
  }, []);

  // Global listener for all payments
  useEffect(() => {
    if (!user || permissionStatus !== 'granted' || !preferences.enabled) return;

    console.log('Setting up global payment notifications listener');

    const channel = supabase
      .channel('global-payment-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'funnel_payments',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;
          const event = payload.eventType;

          const amount = (newRecord.amount_cents / 100).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          });

          // Notify when status changes to 'paid'
          if (preferences.notifyPaid && oldRecord?.status !== 'paid' && newRecord.status === 'paid') {
            showNotification(
              '💰 Venda Aprovada!',
              `${newRecord.lead_name || 'Lead'} pagou ${amount}`,
            );
          }

          // Notify on new pending payment (INSERT)
          if (preferences.notifyPending && event === 'INSERT' && newRecord.status === 'pending') {
            showNotification(
              '⏳ Venda Pendente',
              `${newRecord.lead_name || 'Lead'} gerou um PIX de ${amount}`,
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, permissionStatus, preferences.enabled, preferences.notifyPaid, preferences.notifyPending, showNotification]);

  return {
    permissionStatus,
    isEnabled: preferences.enabled,
    notifyPaid: preferences.notifyPaid,
    notifyPending: preferences.notifyPending,
    requestPermission,
    toggleNotifications,
    setNotifyPaid,
    setNotifyPending,
    isSupported: 'Notification' in window,
  };
};
