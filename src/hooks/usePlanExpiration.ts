import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, Profile } from "@/contexts/AuthContext";
import { useSubscription } from "./useSubscription";

export type ExpirationWarning = "3days" | "2days" | "24hours" | "expired" | null;

export interface PlanExpirationData {
  daysRemaining: number | null;
  expiresAt: Date | null;
  startedAt: Date | null;
  isExpired: boolean;
  isSuspended: boolean;
  warning: ExpirationWarning;
  planName: string | null;
}

export const usePlanExpiration = () => {
  const { user, profile } = useAuth();
  const { subscription, currentPlan, getDaysRemaining } = useSubscription();
  const [expirationData, setExpirationData] = useState<PlanExpirationData>({
    daysRemaining: null,
    expiresAt: null,
    startedAt: null,
    isExpired: false,
    isSuspended: false,
    warning: null,
    planName: null,
  });
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [dismissedWarning, setDismissedWarning] = useState<ExpirationWarning>(null);

  const calculateWarning = (days: number | null): ExpirationWarning => {
    if (days === null) return null;
    if (days <= 0) return "expired";
    if (days <= 1) return "24hours";
    if (days <= 2) return "2days";
    if (days <= 3) return "3days";
    return null;
  };

  const checkAndExpireSubscription = async () => {
    if (!user || !subscription) return;

    const days = getDaysRemaining();
    if (days !== null && days <= 0 && subscription.status === "active") {
      // Expire the subscription
      await supabase
        .from("subscriptions")
        .update({ status: "expired" })
        .eq("id", subscription.id);

      // Update profile to free plan
      await supabase
        .from("profiles")
        .update({ current_plan: "free" })
        .eq("user_id", user.id);
    }
  };

  useEffect(() => {
    if (!user) return;

    const days = getDaysRemaining();
    const warning = calculateWarning(days);
    
    setExpirationData({
      daysRemaining: days,
      expiresAt: subscription?.expires_at ? new Date(subscription.expires_at) : null,
      startedAt: subscription?.started_at ? new Date(subscription.started_at) : null,
      isExpired: days !== null && days <= 0,
      isSuspended: profile?.is_suspended || false,
      warning,
      planName: currentPlan?.name || null,
    });

    // Show warning modal if not dismissed
    if (warning && warning !== dismissedWarning) {
      setShowWarningModal(true);
    }

    // Check and expire subscription
    checkAndExpireSubscription();
  }, [user, subscription, currentPlan, profile]);

  const dismissWarning = () => {
    setShowWarningModal(false);
    setDismissedWarning(expirationData.warning);
  };

  const isFeatureBlocked = (): boolean => {
    return expirationData.isExpired || expirationData.isSuspended;
  };

  const getBlockReason = (): string | null => {
    if (expirationData.isSuspended) return "Sua conta está suspensa. Entre em contato com o suporte.";
    if (expirationData.isExpired) return "Seu plano expirou. Renove para continuar usando.";
    return null;
  };

  return {
    ...expirationData,
    showWarningModal,
    dismissWarning,
    isFeatureBlocked,
    getBlockReason,
  };
};
