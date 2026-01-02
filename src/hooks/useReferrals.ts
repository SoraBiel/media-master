import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface ReferralSettings {
  id: string;
  is_enabled: boolean;
  default_commission_percent: number;
  commission_type: "first_only" | "recurring";
  cookie_duration_days: number;
  min_payout_cents: number;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code: string;
  status: "pending" | "active" | "cancelled";
  created_at: string;
  referred_profile?: {
    email: string;
    full_name: string | null;
    current_plan: string | null;
  };
}

export interface Commission {
  id: string;
  referral_id: string;
  referrer_id: string;
  referred_id: string;
  transaction_id: string | null;
  amount_cents: number;
  commission_percent: number;
  commission_cents: number;
  status: "pending" | "paid" | "cancelled";
  paid_at: string | null;
  paid_by: string | null;
  notes: string | null;
  created_at: string;
  referrer_profile?: {
    email: string;
    full_name: string | null;
  };
  referred_profile?: {
    email: string;
    full_name: string | null;
  };
}

export interface ReferralAllowedRole {
  id: string;
  role_name: string;
  created_at: string;
}

export interface ReferralRoleCommission {
  id: string;
  role_name: string;
  commission_percent: number;
}

export interface ReferralStats {
  totalReferred: number;
  activeReferred: number;
  totalEarned: number;
  pendingCommission: number;
  paidCommission: number;
}

export const useReferrals = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<ReferralSettings | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [allowedRoles, setAllowedRoles] = useState<ReferralAllowedRole[]>([]);
  const [roleCommissions, setRoleCommissions] = useState<ReferralRoleCommission[]>([]);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferred: 0,
    activeReferred: 0,
    totalEarned: 0,
    pendingCommission: 0,
    paidCommission: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [canAccessReferrals, setCanAccessReferrals] = useState(false);

  const fetchSettings = useCallback(async () => {
    const { data, error } = await supabase
      .from("referral_settings")
      .select("*")
      .single();
    
    if (!error && data) {
      setSettings(data as ReferralSettings);
    }
  }, []);

  const fetchAllowedRoles = useCallback(async () => {
    const { data } = await supabase
      .from("referral_allowed_roles")
      .select("*")
      .order("role_name");
    
    setAllowedRoles((data || []) as ReferralAllowedRole[]);
  }, []);

  const fetchRoleCommissions = useCallback(async () => {
    const { data } = await supabase
      .from("referral_role_commissions")
      .select("*")
      .order("role_name");
    
    setRoleCommissions((data || []) as ReferralRoleCommission[]);
  }, []);

  const checkAccess = useCallback(async () => {
    if (!user) {
      setCanAccessReferrals(false);
      return;
    }

    if (isAdmin) {
      setCanAccessReferrals(true);
      return;
    }

    // Check user roles against allowed roles
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const { data: allowed } = await supabase
      .from("referral_allowed_roles")
      .select("role_name");

    const userRoleNames = (userRoles || []).map(r => r.role);
    const allowedRoleNames = (allowed || []).map(r => r.role_name);

    const hasAccess = userRoleNames.some(role => allowedRoleNames.includes(role));
    setCanAccessReferrals(hasAccess);
  }, [user, isAdmin]);

  const fetchReferrals = useCallback(async () => {
    if (!user) return;

    let query = supabase
      .from("referrals")
      .select("*")
      .order("created_at", { ascending: false });

    if (!isAdmin) {
      query = query.eq("referrer_id", user.id);
    }

    const { data } = await query;

    if (data && data.length > 0) {
      // Fetch referred profiles
      const referredIds = data.map(r => r.referred_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, full_name, current_plan")
        .in("user_id", referredIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

      const enrichedReferrals = data.map(r => ({
        ...r,
        referred_profile: profileMap.get(r.referred_id),
      }));

      setReferrals(enrichedReferrals as Referral[]);

      // Calculate stats
      const activeCount = enrichedReferrals.filter(r => r.status === "active").length;
      setStats(prev => ({
        ...prev,
        totalReferred: enrichedReferrals.length,
        activeReferred: activeCount,
      }));
    } else {
      setReferrals([]);
    }
  }, [user, isAdmin]);

  const fetchCommissions = useCallback(async () => {
    if (!user) return;

    let query = supabase
      .from("commissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (!isAdmin) {
      query = query.eq("referrer_id", user.id);
    }

    const { data } = await query;

    if (data && data.length > 0) {
      // Fetch profiles
      const referrerIds = [...new Set(data.map(c => c.referrer_id))];
      const referredIds = [...new Set(data.map(c => c.referred_id))];
      const allIds = [...new Set([...referrerIds, ...referredIds])];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, full_name")
        .in("user_id", allIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

      const enrichedCommissions = data.map(c => ({
        ...c,
        referrer_profile: profileMap.get(c.referrer_id),
        referred_profile: profileMap.get(c.referred_id),
      }));

      setCommissions(enrichedCommissions as Commission[]);

      // Calculate stats
      const pending = enrichedCommissions
        .filter(c => c.status === "pending")
        .reduce((sum, c) => sum + c.commission_cents, 0);
      const paid = enrichedCommissions
        .filter(c => c.status === "paid")
        .reduce((sum, c) => sum + c.commission_cents, 0);

      setStats(prev => ({
        ...prev,
        totalEarned: pending + paid,
        pendingCommission: pending,
        paidCommission: paid,
      }));
    } else {
      setCommissions([]);
    }
  }, [user, isAdmin]);

  const updateSettings = async (updates: Partial<ReferralSettings>) => {
    if (!settings) return;

    const { error } = await supabase
      .from("referral_settings")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", settings.id);

    if (error) {
      toast({ title: "Erro ao atualizar configurações", variant: "destructive" });
    } else {
      toast({ title: "Configurações atualizadas" });
      await fetchSettings();
    }
  };

  const addAllowedRole = async (roleName: string) => {
    const { error } = await supabase
      .from("referral_allowed_roles")
      .insert({ role_name: roleName });

    if (error) {
      if (error.code === "23505") {
        toast({ title: "Este cargo já está autorizado", variant: "destructive" });
      } else {
        toast({ title: "Erro ao adicionar cargo", variant: "destructive" });
      }
    } else {
      toast({ title: "Cargo autorizado" });
      await fetchAllowedRoles();
    }
  };

  const removeAllowedRole = async (id: string) => {
    const { error } = await supabase
      .from("referral_allowed_roles")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Erro ao remover cargo", variant: "destructive" });
    } else {
      toast({ title: "Cargo removido" });
      await fetchAllowedRoles();
    }
  };

  const setRoleCommission = async (roleName: string, percent: number) => {
    const { error } = await supabase
      .from("referral_role_commissions")
      .upsert({ role_name: roleName, commission_percent: percent }, { onConflict: "role_name" });

    if (error) {
      toast({ title: "Erro ao definir comissão", variant: "destructive" });
    } else {
      toast({ title: "Comissão definida" });
      await fetchRoleCommissions();
    }
  };

  const markCommissionAsPaid = async (commissionId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("commissions")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        paid_by: user.id,
      })
      .eq("id", commissionId);

    if (error) {
      toast({ title: "Erro ao marcar como paga", variant: "destructive" });
    } else {
      toast({ title: "Comissão marcada como paga" });
      await fetchCommissions();

      // Log audit
      await supabase.from("referral_audit_logs").insert({
        action: "commission_paid",
        entity_type: "commission",
        entity_id: commissionId,
        user_id: user.id,
        new_data: { status: "paid" },
      });
    }
  };

  const getReferralCode = () => {
    if (!user) return "";
    return user.id.substring(0, 8).toUpperCase();
  };

  const getReferralLink = () => {
    if (!user) return "";
    const baseUrl = window.location.origin;
    return `${baseUrl}/signup?ref=${getReferralCode()}`;
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchSettings(),
        fetchAllowedRoles(),
        fetchRoleCommissions(),
        checkAccess(),
      ]);
      
      if (user) {
        await Promise.all([fetchReferrals(), fetchCommissions()]);
      }
      setIsLoading(false);
    };

    init();

    // Realtime subscriptions
    const channel = supabase
      .channel("referrals-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "referrals" }, fetchReferrals)
      .on("postgres_changes", { event: "*", schema: "public", table: "commissions" }, fetchCommissions)
      .on("postgres_changes", { event: "*", schema: "public", table: "referral_settings" }, fetchSettings)
      .on("postgres_changes", { event: "*", schema: "public", table: "referral_allowed_roles" }, fetchAllowedRoles)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin]);

  return {
    settings,
    referrals,
    commissions,
    allowedRoles,
    roleCommissions,
    stats,
    isLoading,
    canAccessReferrals,
    updateSettings,
    addAllowedRole,
    removeAllowedRole,
    setRoleCommission,
    markCommissionAsPaid,
    getReferralCode,
    getReferralLink,
    fetchReferrals,
    fetchCommissions,
  };
};
