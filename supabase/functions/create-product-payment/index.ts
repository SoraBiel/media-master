import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  product_type: "tiktok_account" | "model" | "telegram_group" | "instagram_account";
  product_id: string;
  discount_percent?: number;
  discounted_price_cents?: number;
  is_welcome_gift?: boolean;
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

    const { product_type, product_id, buyer, discount_percent, discounted_price_cents, is_welcome_gift }: PaymentRequest = await req.json();

    console.log("Product payment request:", { product_type, product_id, buyer: { ...buyer, phone: '***' }, discount_percent, is_welcome_gift });

    // Validate product type
    const validTypes = ["tiktok_account", "model", "telegram_group", "instagram_account"];
    if (!validTypes.includes(product_type)) {
      return new Response(JSON.stringify({ error: "Tipo de produto inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get product details and vendor info
    let product: any = null;
    let vendorId: string | null = null;
    let productName = "";

    if (product_type === "tiktok_account") {
      const { data, error } = await supabaseClient
        .from("tiktok_accounts")
        .select("*")
        .eq("id", product_id)
        .eq("is_sold", false)
        .single();
      
      if (error || !data) {
        return new Response(JSON.stringify({ error: "Conta TikTok não encontrada ou já vendida" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      product = data;
      vendorId = data.created_by;
      productName = `Conta TikTok @${data.username}`;

    } else if (product_type === "instagram_account") {
      const { data, error } = await supabaseClient
        .from("instagram_accounts")
        .select("*")
        .eq("id", product_id)
        .eq("is_sold", false)
        .single();
      
      if (error || !data) {
        return new Response(JSON.stringify({ error: "Conta Instagram não encontrada ou já vendida" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      product = data;
      vendorId = data.created_by;
      productName = `Conta Instagram @${data.username}`;

    } else if (product_type === "model") {
      const { data, error } = await supabaseClient
        .from("models_for_sale")
        .select("*")
        .eq("id", product_id)
        .eq("is_sold", false)
        .single();
      
      if (error || !data) {
        return new Response(JSON.stringify({ error: "Modelo não encontrado ou já vendido" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      product = data;
      vendorId = data.created_by;
      productName = `Modelo ${data.name}`;

    } else if (product_type === "telegram_group") {
      const { data, error } = await supabaseClient
        .from("telegram_groups")
        .select("*")
        .eq("id", product_id)
        .eq("is_sold", false)
        .single();
      
      if (error || !data) {
        return new Response(JSON.stringify({ error: "Grupo Telegram não encontrado ou já vendido" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      product = data;
      vendorId = data.created_by;
      productName = `Grupo Telegram ${data.group_name}`;
    }

    if (!product) {
      return new Response(JSON.stringify({ error: "Produto não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Apply discount if provided (welcome gift)
    let amountCents = product.price_cents;
    const originalPriceCents = product.price_cents;
    
    if (is_welcome_gift && discounted_price_cents && discounted_price_cents > 0) {
      amountCents = discounted_price_cents;
      console.log(`Applied welcome gift discount: ${originalPriceCents} -> ${amountCents} (${discount_percent}% off)`);
    }

    // Determine which Mercado Pago account to use
    // If vendor exists and has MP connected, use vendor's account
    // Otherwise use admin's Mercado Pago
    let accessToken: string | null = null;
    let integrationUserId: string | null = null;

    if (vendorId) {
      // Check if vendor has Mercado Pago connected
      const { data: vendorIntegration } = await supabaseClient
        .from("integrations")
        .select("*")
        .eq("user_id", vendorId)
        .eq("provider", "mercadopago")
        .eq("status", "active")
        .single();

      if (vendorIntegration?.access_token) {
        accessToken = vendorIntegration.access_token;
        integrationUserId = vendorId;
        console.log("Using vendor Mercado Pago account:", vendorId);
      }
    }

    // If no vendor MP, check for admin MP account
    if (!accessToken) {
      // Get admin user
      const { data: adminRole } = await supabaseClient
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin")
        .limit(1)
        .single();

      if (adminRole?.user_id) {
        const { data: adminIntegration } = await supabaseClient
          .from("integrations")
          .select("*")
          .eq("user_id", adminRole.user_id)
          .eq("provider", "mercadopago")
          .eq("status", "active")
          .single();

        if (adminIntegration?.access_token) {
          accessToken = adminIntegration.access_token;
          integrationUserId = adminRole.user_id;
          console.log("Using admin Mercado Pago account");
        }
      }
    }

    if (!accessToken) {
      return new Response(JSON.stringify({ 
        error: "Mercado Pago não configurado. O vendedor precisa conectar o Mercado Pago." 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate unique external_id
    const externalId = `product_${product_type}_${product_id}_${Date.now()}`;
    
    // Webhook URL for payment notifications
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const notificationUrl = `${supabaseUrl}/functions/v1/mercadopago-webhook`;

    // Create PIX payment via Mercado Pago
    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "X-Idempotency-Key": externalId,
      },
      body: JSON.stringify({
        transaction_amount: amountCents / 100,
        description: productName,
        payment_method_id: "pix",
        payer: {
          email: buyer.email,
          first_name: buyer.name.split(" ")[0],
          last_name: buyer.name.split(" ").slice(1).join(" ") || buyer.name.split(" ")[0],
        },
        external_reference: externalId,
        notification_url: notificationUrl,
      }),
    });
    
    console.log("Payment created with notification_url:", notificationUrl);

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error("Mercado Pago error:", mpResponse.status, errorText);
      return new Response(JSON.stringify({ 
        error: "Erro ao gerar pagamento PIX",
        details: errorText 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mpData = await mpResponse.json();
    console.log("Mercado Pago payment created:", mpData.id);

    // Get vendor commission percentage
    const { data: vendorConfig } = await supabaseClient
      .from("vendor_config")
      .select("setting_value")
      .eq("setting_key", "vendor_commission_percent")
      .single();

    const commissionPercent = vendorConfig?.setting_value 
      ? parseFloat(vendorConfig.setting_value) 
      : 80;
    
    const vendorCommissionCents = Math.round(amountCents * (commissionPercent / 100));
    const platformFeeCents = amountCents - vendorCommissionCents;

    // Save to transactions table for tracking
    const { error: transactionError } = await supabaseClient
      .from("transactions")
      .insert({
        user_id: user.id,
        external_id: externalId,
        buckpay_id: mpData.id?.toString(),
        amount_cents: amountCents,
        net_amount_cents: vendorCommissionCents,
        status: "pending",
        payment_method: "pix",
        pix_code: mpData.point_of_interaction?.transaction_data?.qr_code,
        pix_qrcode_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64,
        product_type: product_type,
        product_id: product_id,
        buyer_name: buyer.name,
        buyer_email: buyer.email,
        buyer_phone: buyer.phone,
      });

    if (transactionError) {
      console.error("Error saving transaction:", transactionError);
    }

    // Create vendor_sales record if vendor exists
    if (vendorId) {
      const { error: saleError } = await supabaseClient
        .from("vendor_sales")
        .insert({
          vendor_id: vendorId,
          buyer_id: user.id,
          item_type: product_type,
          item_id: product_id,
          sale_amount_cents: amountCents,
          vendor_commission_cents: vendorCommissionCents,
          platform_fee_cents: platformFeeCents,
          transaction_id: null, // Will be updated when payment is confirmed
          status: "pending",
        });

      if (saleError) {
        console.error("Error creating vendor sale:", saleError);
      }
    }

    return new Response(JSON.stringify({
      id: mpData.id,
      external_id: externalId,
      status: mpData.status,
      pix: {
        code: mpData.point_of_interaction?.transaction_data?.qr_code,
        qrcode_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64,
      },
      amount: amountCents,
      vendor_id: vendorId,
      integration_user_id: integrationUserId,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in create-product-payment:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
