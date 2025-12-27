import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  image_url: string | null;
  link_url: string | null;
  link_text: string | null;
  priority: number;
  created_at: string;
}

interface NotificationRead {
  notification_id: string;
  read_at: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [reads, setReads] = useState<NotificationRead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("is_active", true)
        .or("expires_at.is.null,expires_at.gt.now()")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const fetchReads = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from("user_notification_reads")
        .select("notification_id, read_at")
        .eq("user_id", user.id);

      if (error) throw error;
      setReads(data || []);
    } catch (error) {
      console.error("Error fetching notification reads:", error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from("user_notification_reads")
        .insert({
          user_id: user.id,
          notification_id: notificationId,
        });

      if (error && !error.message.includes("duplicate")) throw error;
      
      setReads((prev) => [
        ...prev,
        { notification_id: notificationId, read_at: new Date().toISOString() },
      ]);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;

    const unreadIds = notifications
      .filter((n) => !reads.some((r) => r.notification_id === n.id))
      .map((n) => n.id);

    for (const id of unreadIds) {
      await markAsRead(id);
    }
  };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await Promise.all([fetchNotifications(), fetchReads()]);
      setIsLoading(false);
    };
    load();
  }, [user?.id]);

  const unreadNotifications = notifications.filter(
    (n) => !reads.some((r) => r.notification_id === n.id)
  );

  const unreadCount = unreadNotifications.length;

  return {
    notifications,
    unreadNotifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refetch: () => Promise.all([fetchNotifications(), fetchReads()]),
  };
};
