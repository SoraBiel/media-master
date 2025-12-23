import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// BuckPay webhook payload interface
interface BuckPayWebhookPayload {
  event?: string;
  type?: string;
  data?: {
    id: string;
    status: string;
    external_id?: string;
    payment_method?: string;
    amount?: number;
    total_amount?: number;
    net_amount?: number;
    offer?: {
      name: string;
      discount_price: number;
      quantity: number;
    };
    buyer?: {
      name: string;
      email: string;
      phone?: string;
      document?: string;
    };
    created_at?: string;
  };
  // Alternative flat structure
  id?: string;
  status?: string;
  external_id?: string;
  amount?: number;
  net_amount?: number;
}

serve(async (req) => {
  // Log all incoming requests
  console.log("=== PAYMENT WEBHOOK RECEIVED ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("Headers:", JSON.stringify(Object.fromEntries(req.headers.entries())));

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get raw body for logging
    const rawBody = await req.text();
    console.log("Raw payload:", rawBody);

    let payload: BuckPayWebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      console.error("Failed to parse JSON payload:", e);
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Parsed payload:", JSON.stringify(payload, null, 2));

    // Extract data from different possible payload formats
    const eventType = payload.event || payload.type || "unknown";
    const transactionData = payload.data || payload;
    const buckpayId = transactionData.id || payload.id;
    const status = transactionData.status || payload.status;
    const externalId = transactionData.external_id || payload.external_id;
    const netAmount = transactionData.net_amount || payload.net_amount;

    console.log("Extracted data:", {
      eventType,
      buckpayId,
      status,
      externalId,
      netAmount
    });

    // Check if this is a paid transaction
    const isPaid = status === "paid" || status === "approved" || status === "completed";
    
    if (!isPaid) {
      console.log(`Transaction status is "${status}", not processing payment`);
      return new Response(JSON.stringify({ success: true, message: "Status not paid" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing paid transaction: buckpay_id=${buckpayId}, external_id=${externalId}`);

    // Try to find transaction by buckpay_id first, then by external_id
    let transaction = null;
    let findError = null;

    if (buckpayId) {
      const result = await supabaseClient
        .from("transactions")
        .select("*")
        .eq("buckpay_id", buckpayId)
        .maybeSingle();
      
      transaction = result.data;
      findError = result.error;
      console.log("Search by buckpay_id result:", { found: !!transaction, error: findError });
    }

    if (!transaction && externalId) {
      const result = await supabaseClient
        .from("transactions")
        .select("*")
        .eq("external_id", externalId)
        .maybeSingle();
      
      transaction = result.data;
      findError = result.error;
      console.log("Search by external_id result:", { found: !!transaction, error: findError });
    }

    if (findError) {
      console.error("Error finding transaction:", findError);
      return new Response(JSON.stringify({ error: "Database error", details: findError }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!transaction) {
      console.error("Transaction not found. buckpay_id:", buckpayId, "external_id:", externalId);
      
      // List recent pending transactions for debugging
      const { data: recentTx } = await supabaseClient
        .from("transactions")
        .select("id, external_id, buckpay_id, status, created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5);
      
      console.log("Recent pending transactions:", recentTx);
      
      return new Response(JSON.stringify({ error: "Transaction not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found transaction: id=${transaction.id}, current_status=${transaction.status}, product_type=${transaction.product_type}`);

    // Skip if already paid
    if (transaction.status === "paid") {
      console.log("Transaction already marked as paid, skipping");
      return new Response(JSON.stringify({ success: true, message: "Already processed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update transaction status
    const netAmountCents = netAmount ? Math.round(netAmount * 100) : null;
    const { error: updateError } = await supabaseClient
      .from("transactions")
      .update({ 
        status: "paid",
        net_amount_cents: netAmountCents,
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
      console.log(`Processing subscription payment for user: ${transaction.user_id}, product_id: ${transaction.product_id}`);
      
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
        console.log(`Activating plan: ${plan.slug} (${plan.name}) for user: ${transaction.user_id}`);
        
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

        // Calculate expiration - 30 days for paid plans
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

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
            console.log(`Subscription updated: ${existingSub.id}, expires: ${expiresAt.toISOString()}`);
          }
        } else {
          // Create new subscription
          const { data: newSub, error: subError } = await supabaseClient
            .from("subscriptions")
            .insert({
              user_id: transaction.user_id,
              plan_id: plan.id,
              status: "active",
              started_at: new Date().toISOString(),
              expires_at: expiresAt.toISOString(),
            })
            .select()
            .single();

          if (subError) {
            console.error("Error creating subscription:", subError);
          } else {
            console.log(`New subscription created: ${newSub?.id}, expires: ${expiresAt.toISOString()}`);
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

      // Create delivery record
      const { error: deliveryError } = await supabaseClient
        .from("deliveries")
        .insert({
          user_id: transaction.user_id,
          product_type: "tiktok_account",
          product_id: transaction.product_id,
          transaction_id: transaction.id,
          delivered_at: new Date().toISOString(),
        });

      if (deliveryError) {
        console.error("Error creating delivery:", deliveryError);
      } else {
        console.log("Delivery record created for TikTok account");
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

      // Create delivery record
      const { error: deliveryError } = await supabaseClient
        .from("deliveries")
        .insert({
          user_id: transaction.user_id,
          product_type: "model",
          product_id: transaction.product_id,
          transaction_id: transaction.id,
          delivered_at: new Date().toISOString(),
        });

      if (deliveryError) {
        console.error("Error creating delivery:", deliveryError);
      } else {
        console.log("Delivery record created for model");
      }
    }

    console.log("=== PAYMENT WEBHOOK PROCESSED SUCCESSFULLY ===");
    console.log("Transaction ID:", transaction.id);
    console.log("Product Type:", transaction.product_type);
    console.log("User ID:", transaction.user_id);

    return new Response(JSON.stringify({ success: true, transaction_id: transaction.id }), {
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
