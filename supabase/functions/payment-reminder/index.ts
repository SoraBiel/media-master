import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const defaultReminderMinutes = body.reminder_minutes || 5;

    console.log(`Checking for pending payments...`);

    // Find pending payments that haven't been reminded yet
    // Join with funnels to get the reminder_minutes setting for each funnel
    const { data: pendingPayments, error: paymentsError } = await supabase
      .from('funnel_payments')
      .select(`
        *,
        funnel_products(*),
        funnels!inner(*, telegram_integrations(*), payment_reminder_minutes)
      `)
      .eq('status', 'pending')
      .is('reminded_at', null);

    if (paymentsError) {
      console.error('Error fetching pending payments:', paymentsError);
      return new Response(JSON.stringify({ error: paymentsError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Filter payments based on their funnel's reminder_minutes setting
    const now = Date.now();
    const paymentsToRemind = (pendingPayments || []).filter(payment => {
      const funnel = payment.funnels;
      const reminderMinutes = funnel?.payment_reminder_minutes ?? defaultReminderMinutes;
      
      // Skip if reminder is disabled (0)
      if (reminderMinutes === 0) return false;
      
      const createdAt = new Date(payment.created_at).getTime();
      const reminderThreshold = reminderMinutes * 60 * 1000;
      
      return (now - createdAt) >= reminderThreshold;
    });

    console.log(`Found ${paymentsToRemind.length} pending payments to remind (out of ${pendingPayments?.length || 0} total pending)`);

    let remindedCount = 0;
    let errorCount = 0;

    for (const payment of paymentsToRemind) {
      try {
        const funnel = payment.funnels;
        const botToken = funnel?.telegram_integrations?.bot_token;
        const chatId = payment.lead_chat_id;
        const product = payment.funnel_products;

        if (!botToken || !chatId) {
          console.log(`Skipping payment ${payment.id}: missing bot token or chat id`);
          continue;
        }

        // Reconcile status with Mercado Pago before sending reminders
        if (payment.provider === 'mercadopago' && payment.provider_payment_id) {
          const { data: integration } = await supabase
            .from('integrations')
            .select('*')
            .eq('user_id', funnel.user_id)
            .eq('provider', 'mercadopago')
            .eq('status', 'active')
            .maybeSingle();

          if (integration) {
            try {
              const mpRes = await fetch(`${'https://api.mercadopago.com'}/v1/payments/${payment.provider_payment_id}`, {
                headers: {
                  Authorization: `Bearer ${integration.access_token}`,
                  'Content-Type': 'application/json',
                },
              });

              const mpPayment = await mpRes.json();

              if (mpRes.ok && mpPayment?.status && mpPayment.status !== payment.status) {
                await supabase
                  .from('funnel_payments')
                  .update({ status: mpPayment.status, paid_at: mpPayment.status === 'approved' ? new Date().toISOString() : payment.paid_at })
                  .eq('id', payment.id);
              }

              // If approved, deliver and skip reminder
              if (mpRes.ok && mpPayment?.status === 'approved') {
                if (payment.delivery_status !== 'delivered') {
                  let deliveryText = `✅ <b>Pagamento Confirmado!</b>\n\nObrigado pela compra de <b>${product?.name || 'seu produto'}</b>!\n\n`;

                  if (product?.delivery_type === 'group') {
                    deliveryText = product?.group_invite_link
                      ? `✅ <b>Pagamento confirmado!</b>\n\n🎉 Seu acesso ao grupo <b>${product.name}</b> foi liberado.\n\n🔗 Entre por aqui: ${product.group_invite_link}\n\nDepois de pedir para entrar, eu aprovo automaticamente.`
                      : `✅ <b>Pagamento confirmado!</b>\n\n🎉 Seu acesso ao grupo <b>${product?.name || 'exclusivo'}</b> foi liberado.\n\nAgora peça para entrar no grupo que eu aprovo automaticamente.`;
                  } else {
                    if ((product?.delivery_type === 'link' || product?.delivery_type === 'both') && product?.delivery_content) {
                      deliveryText += `🔗 Seu acesso: ${product.delivery_content}\n\n`;
                    }
                    if ((product?.delivery_type === 'message' || product?.delivery_type === 'both') && product?.delivery_message) {
                      deliveryText += product.delivery_message;
                    }
                  }

                  const sendRes = await fetch(`${TELEGRAM_API_BASE}${botToken}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      chat_id: chatId,
                      text: deliveryText,
                      parse_mode: 'HTML',
                    }),
                  });

                  const sendResult = await sendRes.json();

                  if (sendResult.ok) {
                    await supabase
                      .from('funnel_payments')
                      .update({ delivery_status: 'delivered', delivered_at: new Date().toISOString(), updated_at: new Date().toISOString() })
                      .eq('id', payment.id);

                    console.log(`Auto-delivered approved payment ${payment.id} (skipping reminder)`);
                    continue;
                  }
                } else {
                  // already delivered
                  continue;
                }
              }
            } catch (e) {
              console.error(`Mercado Pago reconcile failed for payment ${payment.id}:`, e);
            }
          }
        }

        // Format amount
        const amount = new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: payment.currency || 'BRL',
        }).format(payment.amount_cents / 100);

        // Send reminder message with inline buttons
        const reminderMessage = `⏰ <b>Lembrete de Pagamento</b>\n\n` +
          `Você ainda não concluiu o pagamento de <b>${product?.name || 'seu produto'}</b>.\n\n` +
          `💰 Valor: <b>${amount}</b>\n\n` +
          `📱 Use o código PIX abaixo para pagar:\n\n` +
          `<code>${payment.pix_code}</code>\n\n` +
          `⚠️ O PIX expira em breve. Efetue o pagamento para garantir sua compra!`;

        const response = await fetch(`${TELEGRAM_API_BASE}${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: reminderMessage,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '✅ Já Paguei', callback_data: `pix_paid:${payment.id}` },
                  { text: '❌ Desistir', callback_data: `pix_cancel:${payment.id}` },
                ],
              ],
            },
          }),
        });

        const result = await response.json();
        
        if (result.ok) {
          // Mark as reminded
          await supabase
            .from('funnel_payments')
            .update({ reminded_at: new Date().toISOString() })
            .eq('id', payment.id);

          // Log reminder
          await supabase.from('telegram_logs').insert({
            funnel_id: funnel.id,
            event_type: 'payment_reminder_sent',
            payload: { 
              payment_id: payment.id,
              chat_id: chatId,
              amount: payment.amount_cents,
            },
          });

          remindedCount++;
          console.log(`Reminder sent for payment ${payment.id}`);
        } else {
          console.error(`Failed to send reminder for payment ${payment.id}:`, result);
          errorCount++;
        }
      } catch (e) {
        console.error(`Error processing payment ${payment.id}:`, e);
        errorCount++;
      }
    }

    return new Response(JSON.stringify({ 
      ok: true, 
      reminded: remindedCount,
      errors: errorCount,
      total: paymentsToRemind.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in payment-reminder:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
