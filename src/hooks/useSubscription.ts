import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: "active" | "pending" | "cancelled" | "expired";
  started_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: string;
  name: string;
  slug: "free" | "basic" | "pro" | "agency";
  price_cents: number;
  description: string | null;
  features: any;
  max_destinations: number | null;
  max_media_per_month: number | null;
  max_funnels: number | null;
  has_scheduling: boolean;
  has_ai_models: boolean;
  is_active: boolean;
}

export const useSubscription = () => {
  const { user, isAdmin } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setCurrentPlan(null);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch all active plans first
      const { data: plansData, error: plansError } = await supabase
        .from("plans")
        .select("*")
        .eq("is_active", true)
        .order("price_cents", { ascending: true });

      if (plansError) {
        console.error("Error fetching plans:", plansError);
      } else {
        setPlans(plansData || []);
      }

      // Fetch active subscription from subscriptions table
      const { data: subData, error: subError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subError) {
        console.error("Error fetching subscription:", subError);
      }

      // If there's an active subscription, check if it's expired
      if (subData && subData.expires_at) {
        const expiresAt = new Date(subData.expires_at);
        if (expiresAt < new Date()) {
          // Subscription expired, update status
          await supabase
            .from("subscriptions")
            .update({ status: "expired" })
            .eq("id", subData.id);
          
          setSubscription(null);
        } else {
          setSubscription(subData);
          // Find current plan from subscription
          const plan = plansData?.find(p => p.id === subData.plan_id);
          setCurrentPlan(plan || null);
          setIsLoading(false);
          return;
        }
      }

      // If no active subscription in subscriptions table, check profile.current_plan
      // This handles cases where admin assigns plan directly via profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("current_plan")
        .eq("user_id", user.id)
        .single();

      if (profileData?.current_plan && profileData.current_plan !== "free") {
        // Find the plan by slug
        const plan = plansData?.find(p => p.slug === profileData.current_plan);
        if (plan) {
          setCurrentPlan(plan);
          // Create a virtual subscription object for UI consistency
          setSubscription({
            id: "profile-based",
            user_id: user.id,
            plan_id: plan.id,
            status: "active",
            started_at: null,
            expires_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      } else {
        // Default to free plan
        const freePlan = plansData?.find(p => p.slug === "free");
        setCurrentPlan(freePlan || null);
        setSubscription(null);
      }
    } catch (error) {
      console.error("Error in useSubscription:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasActiveSubscription = (): boolean => {
    // Admins always have full access to all plan features
    if (isAdmin) return true;
    
    if (!subscription) return false;
    if (subscription.status !== "active") return false;
    // For profile-based subscriptions (no expiry), always active
    if (!subscription.expires_at) return true;
    const expiresAt = new Date(subscription.expires_at);
    if (expiresAt < new Date()) return false;
    return true;
  };

  const getDaysRemaining = (): number | null => {
    if (!subscription?.expires_at) return null;
    const expiresAt = new Date(subscription.expires_at);
    const now = new Date();
    const diffTime = expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  useEffect(() => {
    fetchSubscription();

    // Set up realtime subscription for subscription changes
    if (user) {
      const subscriptionChannel = supabase
        .channel("subscription_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "subscriptions",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchSubscription();
          }
        )
        .subscribe();

      // Also listen to profile changes for admin-assigned plans
      const profileChannel = supabase
        .channel("profile_plan_changes")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchSubscription();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscriptionChannel);
        supabase.removeChannel(profileChannel);
      };
    }
  }, [user]);

  return {
    subscription,
    currentPlan,
    plans,
    isLoading,
    hasActiveSubscription,
    getDaysRemaining,
    fetchSubscription,
  };
};
