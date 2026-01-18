import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Get auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the caller
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is an account manager or admin
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: roles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const userRoles = roles?.map(r => r.role) || [];
    const isAdmin = userRoles.includes("admin");
    const isAccountManager = userRoles.includes("gerente_contas");

    if (!isAdmin && !isAccountManager) {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, targetUserId, data } = await req.json();

    // If not admin, verify the target user is assigned to this manager
    if (!isAdmin) {
      const { data: assignment, error: assignError } = await adminClient
        .from("account_manager_sellers")
        .select("id")
        .eq("manager_id", user.id)
        .eq("seller_id", targetUserId)
        .maybeSingle();

      if (assignError || !assignment) {
        return new Response(JSON.stringify({ error: "Seller não vinculado a você" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    let result: any = { success: true };

    switch (action) {
      case "suspend_user": {
        const { error } = await adminClient
          .from("profiles")
          .update({ is_suspended: data.suspend })
          .eq("user_id", targetUserId);

        if (error) throw error;

        // Log action
        await adminClient.from("account_manager_logs").insert({
          manager_id: user.id,
          target_user_id: targetUserId,
          action: data.suspend ? "Suspendeu usuário" : "Reativou usuário",
          action_type: "suspension",
          details: { suspended: data.suspend },
        });

        result.message = data.suspend ? "Usuário suspenso" : "Usuário reativado";
        break;
      }

      case "change_plan": {
        const validPlans = ["free", "basic", "pro", "agency"];
        if (!validPlans.includes(data.plan)) {
          throw new Error("Plano inválido");
        }

        const { error } = await adminClient
          .from("profiles")
          .update({ current_plan: data.plan })
          .eq("user_id", targetUserId);

        if (error) throw error;

        // Log action
        await adminClient.from("account_manager_logs").insert({
          manager_id: user.id,
          target_user_id: targetUserId,
          action: `Alterou plano para ${data.plan}`,
          action_type: "plan_change",
          details: { new_plan: data.plan, old_plan: data.oldPlan },
        });

        result.message = `Plano alterado para ${data.plan}`;
        break;
      }

      case "update_profile": {
        const updates: any = {};
        if (data.full_name) updates.full_name = data.full_name;
        if (data.phone) updates.phone = data.phone;

        if (Object.keys(updates).length === 0) {
          throw new Error("Nenhum campo para atualizar");
        }

        updates.updated_at = new Date().toISOString();

        const { error } = await adminClient
          .from("profiles")
          .update(updates)
          .eq("user_id", targetUserId);

        if (error) throw error;

        // Log action
        await adminClient.from("account_manager_logs").insert({
          manager_id: user.id,
          target_user_id: targetUserId,
          action: "Atualizou perfil do usuário",
          action_type: "profile_update",
          details: updates,
        });

        result.message = "Perfil atualizado";
        break;
      }

      case "update_email": {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
          throw new Error("Email inválido");
        }

        // Update auth email
        const { error: authError } = await adminClient.auth.admin.updateUserById(
          targetUserId,
          { email: data.email, email_confirm: true }
        );

        if (authError) throw authError;

        // Update profile email
        const { error: profileError } = await adminClient
          .from("profiles")
          .update({ email: data.email, updated_at: new Date().toISOString() })
          .eq("user_id", targetUserId);

        if (profileError) {
          console.error("Error updating profile email:", profileError);
        }

        // Log action
        await adminClient.from("account_manager_logs").insert({
          manager_id: user.id,
          target_user_id: targetUserId,
          action: `Alterou email para ${data.email}`,
          action_type: "email_change",
          details: { new_email: data.email, old_email: data.oldEmail },
        });

        result.message = "Email atualizado";
        break;
      }

      case "send_password_reset": {
        const { data: profile } = await adminClient
          .from("profiles")
          .select("email")
          .eq("user_id", targetUserId)
          .single();

        if (!profile?.email) {
          throw new Error("Email não encontrado");
        }

        const { error } = await adminClient.auth.resetPasswordForEmail(profile.email, {
          redirectTo: `${Deno.env.get("APP_URL") || "https://nexo-tg.lovable.app"}/reset-password`,
        });

        if (error) throw error;

        // Log action
        await adminClient.from("account_manager_logs").insert({
          manager_id: user.id,
          target_user_id: targetUserId,
          action: "Enviou email de reset de senha",
          action_type: "password_reset",
          details: { email: profile.email },
        });

        result.message = "Email de reset enviado";
        break;
      }

      case "assign_indicador_role": {
        // Check if role already exists
        const { data: existingRole } = await adminClient
          .from("user_roles")
          .select("id")
          .eq("user_id", targetUserId)
          .eq("role", "indicador")
          .maybeSingle();

        if (existingRole) {
          throw new Error("Usuário já é indicador");
        }

        // Add role
        const { error: roleError } = await adminClient
          .from("user_roles")
          .insert({ user_id: targetUserId, role: "indicador" });

        if (roleError) throw roleError;

        // Set commission
        const commission = data.commission || 25;
        const { error: commError } = await adminClient
          .from("user_referral_commissions")
          .upsert({ user_id: targetUserId, commission_percent: commission }, { onConflict: "user_id" });

        if (commError) {
          console.error("Error setting commission:", commError);
        }

        // Log action
        await adminClient.from("account_manager_logs").insert({
          manager_id: user.id,
          target_user_id: targetUserId,
          action: `Atribuiu cargo Indicador (${commission}%)`,
          action_type: "role_change",
          details: { role: "indicador", commission },
        });

        result.message = "Cargo Indicador atribuído";
        break;
      }

      case "remove_indicador_role": {
        const { error } = await adminClient
          .from("user_roles")
          .delete()
          .eq("user_id", targetUserId)
          .eq("role", "indicador");

        if (error) throw error;

        // Log action
        await adminClient.from("account_manager_logs").insert({
          manager_id: user.id,
          target_user_id: targetUserId,
          action: "Removeu cargo Indicador",
          action_type: "role_change",
          details: { role: "indicador", action: "removed" },
        });

        result.message = "Cargo Indicador removido";
        break;
      }

      case "get_seller_details": {
        // Get comprehensive seller info
        const { data: profile, error: profileError } = await adminClient
          .from("profiles")
          .select("*")
          .eq("user_id", targetUserId)
          .single();

        if (profileError) throw profileError;

        // Get roles
        const { data: roles } = await adminClient
          .from("user_roles")
          .select("role")
          .eq("user_id", targetUserId);

        // Get subscription
        const { data: subscription } = await adminClient
          .from("subscriptions")
          .select("*")
          .eq("user_id", targetUserId)
          .eq("status", "active")
          .maybeSingle();

        // Get funnels count
        const { count: funnelsCount } = await adminClient
          .from("funnels")
          .select("*", { count: "exact", head: true })
          .eq("user_id", targetUserId);

        // Get telegram integrations
        const { count: telegramCount } = await adminClient
          .from("telegram_integrations")
          .select("*", { count: "exact", head: true })
          .eq("user_id", targetUserId);

        // Get recent transactions
        const { data: transactions } = await adminClient
          .from("transactions")
          .select("*")
          .eq("user_id", targetUserId)
          .order("created_at", { ascending: false })
          .limit(5);

        // Get referral info if indicador
        const { data: referralCommission } = await adminClient
          .from("user_referral_commissions")
          .select("commission_percent")
          .eq("user_id", targetUserId)
          .maybeSingle();

        result = {
          profile,
          roles: roles?.map(r => r.role) || [],
          subscription,
          stats: {
            funnels: funnelsCount || 0,
            telegram_integrations: telegramCount || 0,
          },
          transactions: transactions || [],
          referralCommission: referralCommission?.commission_percent,
        };
        break;
      }

      default:
        throw new Error("Ação inválida");
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Account manager action error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
