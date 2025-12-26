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
    const reminderMinutes = body.reminder_minutes || 5; // Default 5 minutes

    console.log(`Checking for pending payments older than ${reminderMinutes} minutes...`);

    // Find pending payments that haven't been reminded yet
    const reminderThreshold = new Date(Date.now() - reminderMinutes * 60 * 1000).toISOString();
    
    const { data: pendingPayments, error: paymentsError } = await supabase
      .from('funnel_payments')
      .select(`
        *,
        funnel_products(*),
        funnels!inner(*, telegram_integrations(*))
      `)
      .eq('status', 'pending')
      .lt('created_at', reminderThreshold)
      .is('reminded_at', null);

    if (paymentsError) {
      console.error('Error fetching pending payments:', paymentsError);
      return new Response(JSON.stringify({ error: paymentsError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${pendingPayments?.length || 0} pending payments to remind`);

    let remindedCount = 0;
    let errorCount = 0;

    for (const payment of pendingPayments || []) {
      try {
        const funnel = payment.funnels;
        const botToken = funnel?.telegram_integrations?.bot_token;
        const chatId = payment.lead_chat_id;
        const product = payment.funnel_products;

        if (!botToken || !chatId) {
          console.log(`Skipping payment ${payment.id}: missing bot token or chat id`);
          continue;
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
      total: pendingPayments?.length || 0,
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
