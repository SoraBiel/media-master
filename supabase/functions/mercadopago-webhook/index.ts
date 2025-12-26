import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const MERCADOPAGO_API_URL = 'https://api.mercadopago.com';
const TELEGRAM_API_URL = 'https://api.telegram.org/bot';

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse webhook data
    const body = await req.json();
    console.log('Mercado Pago webhook received:', JSON.stringify(body, null, 2));

    const { type, data, action } = body;

    // Handle payment events
    if (type === 'payment' || action?.includes('payment')) {
      const paymentId = data?.id;
      
      if (!paymentId) {
        console.log('No payment ID in webhook');
        return new Response('OK', { status: 200 });
      }

      // Find the payment in our database
      const { data: payment, error: paymentError } = await supabase
        .from('funnel_payments')
        .select('*, funnel_products(*)')
        .eq('provider_payment_id', String(paymentId))
        .maybeSingle();

      if (paymentError || !payment) {
        console.log('Payment not found in database:', paymentId);
        return new Response('OK', { status: 200 });
      }

      // Get user's Mercado Pago integration to verify payment
      const { data: integration } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', payment.user_id)
        .eq('provider', 'mercadopago')
        .maybeSingle();

      if (!integration) {
        console.log('Integration not found for user:', payment.user_id);
        return new Response('OK', { status: 200 });
      }

      // Get payment details from Mercado Pago
      const mpResponse = await fetch(`${MERCADOPAGO_API_URL}/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${integration.access_token}`
        }
      });

      const mpPayment = await mpResponse.json();
      console.log('Mercado Pago payment status:', mpPayment.status);

      // Update payment status
      const updateData: Record<string, unknown> = {
        status: mpPayment.status,
        updated_at: new Date().toISOString()
      };

      if (mpPayment.status === 'approved') {
        updateData.paid_at = new Date().toISOString();

        // Trigger delivery if not already delivered
        if (payment.delivery_status !== 'delivered') {
          await handleDelivery(supabase, payment);
          updateData.delivery_status = 'delivered';
          updateData.delivered_at = new Date().toISOString();
        }
      }

      await supabase
        .from('funnel_payments')
        .update(updateData)
        .eq('id', payment.id);

      console.log('Payment updated:', payment.id, mpPayment.status);
    }

    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Error in mercadopago-webhook:', error);
    // Return 200 to prevent retries
    return new Response('OK', { status: 200 });
  }
});

async function handleDelivery(supabase: any, payment: any) {
  try {
    const product = payment.funnel_products;
    if (!product) {
      console.log('No product found for delivery');
      return;
    }

    // Get funnel to find the telegram integration
    const { data: funnel } = await supabase
      .from('funnels')
      .select('*, telegram_integrations(*)')
      .eq('id', payment.funnel_id)
      .maybeSingle();

    if (!funnel?.telegram_integrations?.bot_token || !payment.lead_chat_id) {
      console.log('Cannot deliver: missing bot or chat_id');
      return;
    }

    const botToken = funnel.telegram_integrations.bot_token;
    const chatId = payment.lead_chat_id;

    // Build delivery message
    let message = '✅ *Pagamento Confirmado!*\n\n';
    message += `Obrigado pela compra de *${product.name}*!\n\n`;

    if (product.delivery_type === 'link' || product.delivery_type === 'both') {
      if (product.delivery_content) {
        message += `🔗 Seu acesso: ${product.delivery_content}\n\n`;
      }
    }

    if (product.delivery_type === 'message' || product.delivery_type === 'both') {
      if (product.delivery_message) {
        message += product.delivery_message;
      }
    }

    // Send via Telegram
    await fetch(`${TELEGRAM_API_URL}${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    console.log('Delivery sent to chat:', chatId);

  } catch (error) {
    console.error('Error handling delivery:', error);
  }
}
