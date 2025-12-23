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
    console.log("Webhook received:", JSON.stringify(payload));

    const { event, data } = payload;

    // Handle both transaction.created with paid status and transaction.processed
    if ((event === "transaction.processed" || event === "transaction.created") && data.status === "paid") {
      console.log(`Processing paid transaction: ${data.id}`);
      
      // Find the transaction by buckpay_id
      const { data: transaction, error: findError } = await supabaseClient
        .from("transactions")
        .select("*")
        .eq("buckpay_id", data.id)
        .maybeSingle();

      if (findError) {
        console.error("Error finding transaction:", findError);
        return new Response(JSON.stringify({ error: "Database error" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!transaction) {
        console.error("Transaction not found for buckpay_id:", data.id);
        return new Response(JSON.stringify({ error: "Transaction not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`Found transaction: ${transaction.id}, current status: ${transaction.status}`);

      // Skip if already paid
      if (transaction.status === "paid") {
        console.log("Transaction already marked as paid, skipping");
        return new Response(JSON.stringify({ success: true, message: "Already processed" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update transaction status
      const { error: updateError } = await supabaseClient
        .from("transactions")
        .update({ 
          status: "paid",
          net_amount_cents: Math.round(data.net_amount * 100),
          updated_at: new Date().toISOString(),
        })
        .eq("id", transaction.id);

      if (updateError) {
        console.error("Error updating transaction:", updateError);
      } else {
        console.log(`Transaction ${transaction.id} marked as paid`);
      }

      // Handle based on product type
      if (transaction.product_type === "subscription") {
        console.log(`Processing subscription payment for user: ${transaction.user_id}`);
        
        // Get the plan
        const { data: plan, error: planError } = await supabaseClient
          .from("plans")
          .select("*")
          .eq("id", transaction.product_id)
          .single();

        if (planError) {
          console.error("Error fetching plan:", planError);
        }

        if (plan) {
          console.log(`Activating plan: ${plan.slug} for user: ${transaction.user_id}`);
          
          // Update user's plan in profiles
          const { error: profileError } = await supabaseClient
            .from("profiles")
            .update({ current_plan: plan.slug })
            .eq("user_id", transaction.user_id);

          if (profileError) {
            console.error("Error updating profile plan:", profileError);
          } else {
            console.log(`Profile updated with plan: ${plan.slug}`);
          }

          // Calculate expiration based on plan type
          const expiresAt = new Date();
          // Free trial is 7 days, paid plans are 30 days
          if (plan.slug === "free") {
            expiresAt.setDate(expiresAt.getDate() + 7);
          } else {
            expiresAt.setMonth(expiresAt.getMonth() + 1);
          }

          // Check if user has existing subscription
          const { data: existingSub } = await supabaseClient
            .from("subscriptions")
            .select("id")
            .eq("user_id", transaction.user_id)
            .maybeSingle();

          if (existingSub) {
            // Update existing subscription
            const { error: subError } = await supabaseClient
              .from("subscriptions")
              .update({
                plan_id: plan.id,
                status: "active",
                started_at: new Date().toISOString(),
                expires_at: expiresAt.toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingSub.id);

            if (subError) {
              console.error("Error updating subscription:", subError);
            } else {
              console.log(`Subscription updated: ${existingSub.id}`);
            }
          } else {
            // Create new subscription
            const { error: subError } = await supabaseClient
              .from("subscriptions")
              .insert({
                user_id: transaction.user_id,
                plan_id: plan.id,
                status: "active",
                started_at: new Date().toISOString(),
                expires_at: expiresAt.toISOString(),
              });

            if (subError) {
              console.error("Error creating subscription:", subError);
            } else {
              console.log(`New subscription created for user: ${transaction.user_id}`);
            }
          }
        }
      } else if (transaction.product_type === "tiktok_account") {
        console.log(`Processing TikTok account purchase: ${transaction.product_id}`);
        
        // Mark account as sold
        const { error } = await supabaseClient
          .from("tiktok_accounts")
          .update({
            is_sold: true,
            sold_to_user_id: transaction.user_id,
            sold_at: new Date().toISOString(),
          })
          .eq("id", transaction.product_id);

        if (error) {
          console.error("Error updating tiktok account:", error);
        } else {
          console.log(`TikTok account ${transaction.product_id} marked as sold`);
        }
      } else if (transaction.product_type === "model") {
        console.log(`Processing model purchase: ${transaction.product_id}`);
        
        // Mark model as sold
        const { error } = await supabaseClient
          .from("models_for_sale")
          .update({
            is_sold: true,
            sold_to_user_id: transaction.user_id,
            sold_at: new Date().toISOString(),
          })
          .eq("id", transaction.product_id);

        if (error) {
          console.error("Error updating model:", error);
        } else {
          console.log(`Model ${transaction.product_id} marked as sold`);
        }
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
