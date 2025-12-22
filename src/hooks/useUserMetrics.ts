import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserMetrics {
  total_actions: number;
  telegram_integrations_active: number;
  media_sent: number;
  last_activity_at: string | null;
}

export const useUserMetrics = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<UserMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = async () => {
    if (!user) {
      setMetrics(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_metrics")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching metrics:", error);
        // Create metrics if they don't exist
        const { data: newData, error: insertError } = await supabase
          .from("user_metrics")
          .insert({ user_id: user.id })
          .select()
          .single();
        
        if (!insertError && newData) {
          setMetrics(newData);
        }
      } else if (data) {
        setMetrics(data);
      } else {
        // Create metrics if they don't exist
        const { data: newData } = await supabase
          .from("user_metrics")
          .insert({ user_id: user.id })
          .select()
          .single();
        
        if (newData) {
          setMetrics(newData);
        }
      }
    } catch (error) {
      console.error("Error in useUserMetrics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const logEvent = async (eventType: string, eventData: Record<string, any> = {}) => {
    if (!user) return;

    try {
      await supabase.from("user_events").insert({
        user_id: user.id,
        event_type: eventType,
        event_data: eventData,
      });

      // Refresh metrics after logging event
      fetchMetrics();
    } catch (error) {
      console.error("Error logging event:", error);
    }
  };

  useEffect(() => {
    fetchMetrics();

    // Set up realtime subscription
    if (user) {
      const channel = supabase
        .channel("user_metrics_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "user_metrics",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (payload.new) {
              setMetrics(payload.new as UserMetrics);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  return { metrics, isLoading, fetchMetrics, logEvent };
};
