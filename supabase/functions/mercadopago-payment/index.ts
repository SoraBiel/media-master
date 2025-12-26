import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MERCADOPAGO_API_URL = 'https://api.mercadopago.com';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { action, product_id, lead_chat_id, lead_name, user_id } = body;

    switch (action) {
      case 'create_pix': {
        if (!product_id || !user_id) {
          return new Response(
            JSON.stringify({ error: 'product_id and user_id required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get user's Mercado Pago integration
        const { data: integration, error: integrationError } = await supabase
          .from('integrations')
          .select('*')
          .eq('user_id', user_id)
          .eq('provider', 'mercadopago')
          .eq('status', 'active')
          .maybeSingle();

        if (integrationError || !integration) {
          return new Response(
            JSON.stringify({ error: 'Mercado Pago não conectado' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get product details
        const { data: product, error: productError } = await supabase
          .from('funnel_products')
          .select('*')
          .eq('id', product_id)
          .single();

        if (productError || !product) {
          return new Response(
            JSON.stringify({ error: 'Produto não encontrado' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Create PIX payment on Mercado Pago
        const paymentData = {
          transaction_amount: product.price_cents / 100,
          description: product.name,
          payment_method_id: 'pix',
          payer: {
            email: 'customer@email.com', // In production, get from lead
            first_name: lead_name || 'Cliente',
          },
          notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`
        };

        const paymentResponse = await fetch(`${MERCADOPAGO_API_URL}/v1/payments`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${integration.access_token}`,
            'Content-Type': 'application/json',
            'X-Idempotency-Key': crypto.randomUUID()
          },
          body: JSON.stringify(paymentData)
        });

        const payment = await paymentResponse.json();

        if (!paymentResponse.ok) {
          console.error('Payment creation failed:', payment);
          return new Response(
            JSON.stringify({ error: 'Falha ao criar pagamento', details: payment }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Extract PIX data
        const pixData = payment.point_of_interaction?.transaction_data;
        
        // Save payment to database
        const { data: savedPayment, error: saveError } = await supabase
          .from('funnel_payments')
          .insert({
            funnel_id: product.funnel_id,
            product_id: product.id,
            user_id: user_id,
            lead_chat_id: lead_chat_id || null,
            lead_name: lead_name || null,
            provider: 'mercadopago',
            provider_payment_id: String(payment.id),
            amount_cents: product.price_cents,
            currency: product.currency,
            status: payment.status,
            pix_qrcode: pixData?.qr_code_base64 || null,
            pix_code: pixData?.qr_code || null,
            pix_expiration: payment.date_of_expiration || null
          })
          .select()
          .single();

        if (saveError) {
          console.error('Failed to save payment:', saveError);
        }

        return new Response(
          JSON.stringify({
            success: true,
            payment_id: savedPayment?.id || payment.id,
            provider_payment_id: payment.id,
            status: payment.status,
            pix_qrcode: pixData?.qr_code_base64,
            pix_code: pixData?.qr_code,
            amount: product.price_cents / 100,
            expiration: payment.date_of_expiration
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'check_status': {
        const { payment_id } = body;
        
        if (!payment_id) {
          return new Response(
            JSON.stringify({ error: 'payment_id required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: payment } = await supabase
          .from('funnel_payments')
          .select('*')
          .eq('id', payment_id)
          .single();

        if (!payment) {
          return new Response(
            JSON.stringify({ error: 'Payment not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            status: payment.status,
            paid_at: payment.paid_at,
            delivered_at: payment.delivered_at,
            delivery_status: payment.delivery_status
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error in mercadopago-payment:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
