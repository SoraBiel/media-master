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

      // Handle refund - remove member from group
      if (mpPayment.status === 'refunded' || mpPayment.status === 'cancelled' || mpPayment.status === 'charged_back') {
        console.log('Refund detected, attempting to remove member from group');
        await handleRefund(supabase, payment);
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

    // Handle group delivery type
    if (product.delivery_type === 'group' && product.group_chat_id) {
      await handleGroupDelivery(botToken, chatId, product, payment);
      return;
    }

    // Build delivery message for other types
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

async function handleGroupDelivery(botToken: string, userChatId: string, product: any, payment: any) {
  try {
    const groupChatId = product.group_chat_id;
    console.log(`Processing group delivery for user ${userChatId} to group ${groupChatId}`);

    // First, try to approve any pending join requests
    // Get the user's Telegram ID from the chat
    const telegramUserId = payment.lead_telegram_id || userChatId;
    
    try {
      // Try to approve the join request
      const approveResponse = await fetch(`${TELEGRAM_API_URL}${botToken}/approveChatJoinRequest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: groupChatId,
          user_id: telegramUserId
        })
      });
      
      const approveResult = await approveResponse.json();
      console.log('Approve join request result:', JSON.stringify(approveResult));
      
      if (approveResult.ok) {
        // Send success message to user
        await fetch(`${TELEGRAM_API_URL}${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: userChatId,
            text: `✅ *Pagamento Confirmado!*\n\n🎉 Seu acesso ao grupo *${product.name}* foi liberado!\n\nVocê já pode acessar o grupo.`,
            parse_mode: 'Markdown'
          })
        });
        console.log('Join request approved and user notified');
        return;
      }
    } catch (e) {
      console.log('No pending join request to approve, will try alternative method');
    }

    // If no join request exists, try to create an invite link or send the existing one
    if (product.group_invite_link) {
      // Send the invite link to the user
      await fetch(`${TELEGRAM_API_URL}${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: userChatId,
          text: `✅ *Pagamento Confirmado!*\n\n🎉 Obrigado pela compra de *${product.name}*!\n\n🔗 Acesse o grupo usando o link abaixo:\n${product.group_invite_link}\n\n⚠️ O link é exclusivo para você.`,
          parse_mode: 'Markdown'
        })
      });
      console.log('Invite link sent to user');
    } else {
      // Try to create a one-time invite link
      try {
        const createLinkResponse = await fetch(`${TELEGRAM_API_URL}${botToken}/createChatInviteLink`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: groupChatId,
            member_limit: 1, // One-time use
            name: `${product.name} - ${payment.lead_name || 'Cliente'}`
          })
        });
        
        const linkResult = await createLinkResponse.json();
        console.log('Create invite link result:', JSON.stringify(linkResult));
        
        if (linkResult.ok && linkResult.result.invite_link) {
          await fetch(`${TELEGRAM_API_URL}${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: userChatId,
              text: `✅ *Pagamento Confirmado!*\n\n🎉 Obrigado pela compra de *${product.name}*!\n\n🔗 Seu link exclusivo para o grupo:\n${linkResult.result.invite_link}\n\n⚠️ Este link só pode ser usado uma vez.`,
              parse_mode: 'Markdown'
            })
          });
          console.log('One-time invite link created and sent');
        } else {
          throw new Error('Could not create invite link');
        }
      } catch (e) {
        console.error('Error creating invite link:', e);
        // Fallback: just notify the user
        await fetch(`${TELEGRAM_API_URL}${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: userChatId,
            text: `✅ *Pagamento Confirmado!*\n\n🎉 Obrigado pela compra de *${product.name}*!\n\n📩 Em breve você receberá o acesso ao grupo.`,
            parse_mode: 'Markdown'
          })
        });
      }
    }
  } catch (error) {
    console.error('Error handling group delivery:', error);
  }
}

async function handleRefund(supabase: any, payment: any) {
  try {
    const product = payment.funnel_products;
    if (!product || product.delivery_type !== 'group' || !product.group_chat_id) {
      console.log('Not a group product or no group_chat_id, skipping refund removal');
      return;
    }

    // Get funnel to find the telegram integration
    const { data: funnel } = await supabase
      .from('funnels')
      .select('*, telegram_integrations(*)')
      .eq('id', payment.funnel_id)
      .maybeSingle();

    if (!funnel?.telegram_integrations?.bot_token) {
      console.log('Cannot process refund: missing bot token');
      return;
    }

    const botToken = funnel.telegram_integrations.bot_token;
    const groupChatId = product.group_chat_id;
    const telegramUserId = payment.lead_telegram_id || payment.lead_chat_id;

    console.log(`Attempting to remove user ${telegramUserId} from group ${groupChatId}`);

    // Ban the user from the group (this also removes them)
    const banResponse = await fetch(`${TELEGRAM_API_URL}${botToken}/banChatMember`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: groupChatId,
        user_id: telegramUserId,
        revoke_messages: false // Don't delete their messages
      })
    });

    const banResult = await banResponse.json();
    console.log('Ban user result:', JSON.stringify(banResult));

    if (banResult.ok) {
      // Optionally unban so they can request to join again in the future
      await fetch(`${TELEGRAM_API_URL}${botToken}/unbanChatMember`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: groupChatId,
          user_id: telegramUserId,
          only_if_banned: true
        })
      });

      // Notify user
      await fetch(`${TELEGRAM_API_URL}${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: payment.lead_chat_id,
          text: `⚠️ *Reembolso Processado*\n\nSeu reembolso foi confirmado e seu acesso ao grupo *${product.name}* foi removido.\n\nObrigado por usar nossos serviços.`,
          parse_mode: 'Markdown'
        })
      });

      console.log('User removed from group and notified');

      // Update payment status
      await supabase
        .from('funnel_payments')
        .update({ 
          delivery_status: 'refunded',
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.id);
    } else {
      console.error('Failed to remove user from group:', banResult);
    }

  } catch (error) {
    console.error('Error handling refund:', error);
  }
}
