import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  product_type: "subscription" | "tiktok_account" | "model";
  product_id?: string;
  plan_slug?: string;
  buyer: {
    name: string;
    email: string;
    phone?: string;
    document?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { product_type, product_id, plan_slug, buyer }: PaymentRequest = await req.json();

    // Sanitize buyer name: remove numbers and invalid characters, keep only letters, spaces, hyphens, apostrophes
    const sanitizeName = (name: string): string => {
      // Remove numbers and special characters, keep only letters (including accented), spaces, hyphens, apostrophes
      let sanitized = name.replace(/[^a-zA-ZÀ-ÿ\s\-']/g, '').trim();
      // Remove multiple consecutive spaces
      sanitized = sanitized.replace(/\s+/g, ' ');
      // If name becomes empty or too short, use a default
      if (sanitized.length < 2) {
        sanitized = "Cliente";
      }
      return sanitized;
    };

    const sanitizedBuyerName = sanitizeName(buyer.name);

    console.log("Payment request:", { product_type, product_id, plan_slug, buyer, sanitizedBuyerName });

    // Determine amount based on product type
    let amountCents = 0;
    let productName = "";
    let productIdForDb: string | null = null;

    if (product_type === "subscription" && plan_slug) {
      const { data: plan, error: planError } = await supabaseClient
        .from("plans")
        .select("*")
        .eq("slug", plan_slug)
        .single();

      if (planError || !plan) {
        return new Response(JSON.stringify({ error: "Plan not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      amountCents = plan.price_cents;
      productName = `Plano ${plan.name}`;
      productIdForDb = plan.id;
    } else if (product_type === "tiktok_account" && product_id) {
      const { data: account, error: accountError } = await supabaseClient
        .from("tiktok_accounts")
        .select("*")
        .eq("id", product_id)
        .eq("is_sold", false)
        .single();

      if (accountError || !account) {
        return new Response(JSON.stringify({ error: "Account not found or already sold" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      amountCents = account.price_cents;
      productName = `Conta TikTok @${account.username}`;
      productIdForDb = account.id;
    } else if (product_type === "model" && product_id) {
      const { data: model, error: modelError } = await supabaseClient
        .from("models_for_sale")
        .select("*")
        .eq("id", product_id)
        .eq("is_sold", false)
        .single();

      if (modelError || !model) {
        return new Response(JSON.stringify({ error: "Model not found or already sold" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      amountCents = model.price_cents;
      productName = `Modelo ${model.name}`;
      productIdForDb = model.id;
    } else {
      return new Response(JSON.stringify({ error: "Invalid product" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (amountCents === 0) {
      // Free plan - just activate
      if (product_type === "subscription") {
        await supabaseClient
          .from("profiles")
          .update({ current_plan: plan_slug })
          .eq("user_id", user.id);

        return new Response(JSON.stringify({ 
          success: true, 
          message: "Plano gratuito ativado" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Generate unique external_id
    const externalId = `${product_type}_${user.id}_${Date.now()}`;

    // Call BuckPay API
    const BUCKPAY_API_TOKEN = Deno.env.get("BUCKPAY_API_TOKEN");
    const BUCKPAY_USER_AGENT = Deno.env.get("BUCKPAY_USER_AGENT");

    if (!BUCKPAY_API_TOKEN || !BUCKPAY_USER_AGENT) {
      console.error("Missing BuckPay credentials");
      return new Response(JSON.stringify({ error: "Payment service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Calling BuckPay API...");

    const buckpayResponse = await fetch("https://api.realtechdev.com.br/v1/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${BUCKPAY_API_TOKEN}`,
        "User-Agent": BUCKPAY_USER_AGENT,
      },
      body: JSON.stringify({
        external_id: externalId,
        payment_method: "pix",
        amount: amountCents,
        buyer: {
          name: sanitizedBuyerName,
          email: buyer.email,
          phone: buyer.phone || undefined,
          document: buyer.document || undefined,
        },
      }),
    });

    if (!buckpayResponse.ok) {
      const errorText = await buckpayResponse.text();
      console.error("BuckPay error:", buckpayResponse.status, errorText);
      return new Response(JSON.stringify({ 
        error: "Payment service error",
        details: errorText 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const buckpayData = await buckpayResponse.json();
    console.log("BuckPay response:", buckpayData);

    // Save transaction to database
    const { error: transactionError } = await supabaseClient
      .from("transactions")
      .insert({
        user_id: user.id,
        external_id: externalId,
        buckpay_id: buckpayData.data?.id,
        amount_cents: amountCents,
        net_amount_cents: buckpayData.data?.net_amount ? Math.round(buckpayData.data.net_amount * 100) : null,
        status: "pending",
        payment_method: "pix",
        pix_code: buckpayData.data?.pix?.code,
        pix_qrcode_base64: buckpayData.data?.pix?.qrcode_base64,
        product_type: product_type,
        product_id: productIdForDb,
        buyer_name: buyer.name,
        buyer_email: buyer.email,
        buyer_phone: buyer.phone,
        buyer_document: buyer.document,
      });

    if (transactionError) {
      console.error("Error saving transaction:", transactionError);
    }

    return new Response(JSON.stringify({
      id: buckpayData.data?.id,
      external_id: externalId,
      status: buckpayData.data?.status,
      pix: buckpayData.data?.pix,
      amount: amountCents,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in create-payment:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
