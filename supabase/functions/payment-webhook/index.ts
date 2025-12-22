import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WebhookPayload {
  event: "transaction.created" | "transaction.processed";
  data: {
    id: string;
    status: "pending" | "paid" | "failed";
    payment_method: string;
    total_amount: number;
    net_amount: number;
    offer?: {
      name: string;
      discount_price: number;
      quantity: number;
    };
    buyer: {
      name: string;
      email: string;
      phone?: string;
      document?: string;
    };
    created_at: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const payload: WebhookPayload = await req.json();
    console.log("Webhook received:", payload);

    const { event, data } = payload;

    if (event === "transaction.processed" && data.status === "paid") {
      // Find the transaction by buckpay_id
      const { data: transaction, error: findError } = await supabaseClient
        .from("transactions")
        .select("*")
        .eq("buckpay_id", data.id)
        .single();

      if (findError || !transaction) {
        console.error("Transaction not found:", data.id);
        return new Response(JSON.stringify({ error: "Transaction not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update transaction status
      await supabaseClient
        .from("transactions")
        .update({ 
          status: "paid",
          net_amount_cents: Math.round(data.net_amount * 100),
        })
        .eq("id", transaction.id);

      // Handle based on product type
      if (transaction.product_type === "subscription") {
        // Get the plan
        const { data: plan } = await supabaseClient
          .from("plans")
          .select("*")
          .eq("id", transaction.product_id)
          .single();

        if (plan) {
          // Update user's plan
          await supabaseClient
            .from("profiles")
            .update({ current_plan: plan.slug })
            .eq("user_id", transaction.user_id);

          // Create or update subscription
          const expiresAt = new Date();
          expiresAt.setMonth(expiresAt.getMonth() + 1);

          await supabaseClient
            .from("subscriptions")
            .upsert({
              user_id: transaction.user_id,
              plan_id: plan.id,
              status: "active",
              started_at: new Date().toISOString(),
              expires_at: expiresAt.toISOString(),
            }, {
              onConflict: "user_id",
            });
        }
      } else if (transaction.product_type === "tiktok_account") {
        // Mark account as sold
        await supabaseClient
          .from("tiktok_accounts")
          .update({
            is_sold: true,
            sold_to_user_id: transaction.user_id,
            sold_at: new Date().toISOString(),
          })
          .eq("id", transaction.product_id);
      } else if (transaction.product_type === "model") {
        // Mark model as sold
        await supabaseClient
          .from("models_for_sale")
          .update({
            is_sold: true,
            sold_to_user_id: transaction.user_id,
            sold_at: new Date().toISOString(),
          })
          .eq("id", transaction.product_id);
      }

      console.log("Payment processed successfully for transaction:", transaction.id);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in payment-webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
