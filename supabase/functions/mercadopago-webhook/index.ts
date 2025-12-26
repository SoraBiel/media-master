import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const MERCADOPAGO_API_URL = 'https://api.mercadopago.com';
const TELEGRAM_API_URL = 'https://api.telegram.org/bot';

// Helper to send UTMify tracking event
async function trackUTMifyEvent(supabase: any, userId: string, paymentId: string, eventType: string) {
  try {
    console.log(`Tracking UTMify event: ${eventType} for payment ${paymentId}`);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const response = await fetch(`${supabaseUrl}/functions/v1/utmify-track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        action: 'track_event',
        payment_id: paymentId,
        user_id: userId,
        event_type: eventType,
      }),
    });
    
    const result = await response.json();
    console.log('UTMify tracking result:', JSON.stringify(result));
    return result;
  } catch (error) {
    console.error('Error tracking UTMify event:', error);
    return { ok: false, error: String(error) };
  }
}

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

      // First, try to find in funnel_payments (for funnel products)
      let payment = null;
      let paymentType = 'funnel';

      const { data: funnelPayment } = await supabase
        .from('funnel_payments')
        .select('*, funnel_products(*)')
        .eq('provider_payment_id', String(paymentId))
        .maybeSingle();

      if (funnelPayment) {
        payment = funnelPayment;
        paymentType = 'funnel';
      } else {
        // Try to find in transactions (for catalog products - tiktok, instagram, telegram, models)
        const { data: transaction } = await supabase
          .from('transactions')
          .select('*')
          .eq('buckpay_id', String(paymentId))
          .maybeSingle();

        if (transaction) {
          payment = transaction;
          paymentType = 'catalog';
        }
      }

      if (!payment) {
        console.log('Payment not found in database:', paymentId);
        return new Response('OK', { status: 200 });
      }

      console.log(`Found ${paymentType} payment:`, payment.id);

      // Get Mercado Pago access token to verify payment
      // First try the user's integration, then admin's
      let accessToken = null;
      
      const { data: userIntegration } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', payment.user_id)
        .eq('provider', 'mercadopago')
        .eq('status', 'active')
        .maybeSingle();

      if (userIntegration?.access_token) {
        accessToken = userIntegration.access_token;
      } else {
        // Try admin's integration
        const { data: adminRole } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'admin')
          .limit(1)
          .single();

        if (adminRole?.user_id) {
          const { data: adminIntegration } = await supabase
            .from('integrations')
            .select('*')
            .eq('user_id', adminRole.user_id)
            .eq('provider', 'mercadopago')
            .eq('status', 'active')
            .maybeSingle();

          if (adminIntegration?.access_token) {
            accessToken = adminIntegration.access_token;
          }
        }
      }

      if (!accessToken) {
        console.log('No valid Mercado Pago integration found');
        return new Response('OK', { status: 200 });
      }

      // Get payment details from Mercado Pago
      const mpResponse = await fetch(`${MERCADOPAGO_API_URL}/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const mpPayment = await mpResponse.json();
      console.log('Mercado Pago payment status:', mpPayment.status);

      if (paymentType === 'funnel') {
        await handleFunnelPayment(supabase, payment, mpPayment);
      } else {
        await handleCatalogPayment(supabase, payment, mpPayment);
      }
    }

    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Error in mercadopago-webhook:', error);
    // Return 200 to prevent retries
    return new Response('OK', { status: 200 });
  }
});

async function handleFunnelPayment(supabase: any, payment: any, mpPayment: any) {
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
    
    // Track UTMify approved event
    await trackUTMifyEvent(supabase, payment.user_id, payment.id, 'approved');
  }

  // Handle refund - remove member from group
  if (mpPayment.status === 'refunded' || mpPayment.status === 'cancelled' || mpPayment.status === 'charged_back') {
    console.log('Refund detected, attempting to remove member from group');
    await handleRefund(supabase, payment);
    
    // Track UTMify refund event
    const utmifyEventType = mpPayment.status === 'charged_back' ? 'chargeback' : 'refunded';
    await trackUTMifyEvent(supabase, payment.user_id, payment.id, utmifyEventType);
  }
  
  // Handle expired/rejected payments
  if (mpPayment.status === 'rejected' || mpPayment.status === 'expired') {
    await trackUTMifyEvent(supabase, payment.user_id, payment.id, 'refused');
  }

  await supabase
    .from('funnel_payments')
    .update(updateData)
    .eq('id', payment.id);

  console.log('Funnel payment updated:', payment.id, mpPayment.status);
}

async function handleCatalogPayment(supabase: any, transaction: any, mpPayment: any) {
  const productType = transaction.product_type;
  const productId = transaction.product_id;
  const buyerId = transaction.user_id;

  console.log(`Processing catalog payment: ${productType} - ${productId}`);

  if (mpPayment.status === 'approved') {
    // Update transaction status
    await supabase
      .from('transactions')
      .update({
        status: 'paid',
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.id);

    // Update vendor_sales if exists
    const { data: vendorSale } = await supabase
      .from('vendor_sales')
      .select('*')
      .eq('item_id', productId)
      .eq('item_type', productType)
      .eq('buyer_id', buyerId)
      .eq('status', 'pending')
      .maybeSingle();

    if (vendorSale) {
      await supabase
        .from('vendor_sales')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          transaction_id: transaction.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', vendorSale.id);

      console.log('Vendor sale updated to paid:', vendorSale.id);
    }

    // Handle product-specific delivery
    if (productType === 'tiktok_account') {
      await handleTikTokDelivery(supabase, productId, buyerId, transaction.id);
    } else if (productType === 'instagram_account') {
      await handleInstagramDelivery(supabase, productId, buyerId, transaction.id);
    } else if (productType === 'telegram_group') {
      await handleTelegramGroupDelivery(supabase, productId, buyerId, transaction.id);
    } else if (productType === 'model') {
      await handleModelDelivery(supabase, productId, buyerId, transaction.id);
    }

    console.log('Catalog payment processed successfully:', transaction.id);

  } else if (mpPayment.status === 'refunded' || mpPayment.status === 'cancelled' || mpPayment.status === 'charged_back') {
    // Update transaction status
    await supabase
      .from('transactions')
      .update({
        status: 'refunded',
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.id);

    // Update vendor_sales
    await supabase
      .from('vendor_sales')
      .update({
        status: 'refunded',
        updated_at: new Date().toISOString()
      })
      .eq('item_id', productId)
      .eq('item_type', productType)
      .eq('buyer_id', buyerId);

    console.log('Catalog payment refunded:', transaction.id);
  }
}

async function handleTikTokDelivery(supabase: any, accountId: string, buyerId: string, transactionId: string) {
  // Get account details
  const { data: account } = await supabase
    .from('tiktok_accounts')
    .select('*')
    .eq('id', accountId)
    .single();

  if (!account) return;

  // Mark as sold
  await supabase
    .from('tiktok_accounts')
    .update({
      is_sold: true,
      sold_at: new Date().toISOString(),
      sold_to_user_id: buyerId
    })
    .eq('id', accountId);

  // Check if delivery already exists to avoid duplicates
  const { data: existingDelivery } = await supabase
    .from('deliveries')
    .select('id')
    .eq('transaction_id', transactionId)
    .maybeSingle();

  if (existingDelivery) {
    console.log('TikTok delivery already exists, skipping');
    return;
  }

  // Create delivery record
  await supabase
    .from('deliveries')
    .insert({
      user_id: buyerId,
      product_type: 'tiktok_account',
      product_id: accountId,
      transaction_id: transactionId,
      delivered_at: new Date().toISOString(),
      delivery_data: {
        username: account.username,
        login: account.deliverable_login,
        password: account.deliverable_password,
        email: account.deliverable_email,
        notes: account.deliverable_notes,
        info: account.deliverable_info
      }
    });

  console.log('TikTok account delivery created:', accountId);
}

async function handleInstagramDelivery(supabase: any, accountId: string, buyerId: string, transactionId: string) {
  // Get account details
  const { data: account } = await supabase
    .from('instagram_accounts')
    .select('*')
    .eq('id', accountId)
    .single();

  if (!account) return;

  // Mark as sold
  await supabase
    .from('instagram_accounts')
    .update({
      is_sold: true,
      sold_at: new Date().toISOString(),
      sold_to_user_id: buyerId
    })
    .eq('id', accountId);

  // Check if delivery already exists to avoid duplicates
  const { data: existingDelivery } = await supabase
    .from('deliveries')
    .select('id')
    .eq('transaction_id', transactionId)
    .maybeSingle();

  if (existingDelivery) {
    console.log('Instagram delivery already exists, skipping');
    return;
  }

  // Create delivery record
  await supabase
    .from('deliveries')
    .insert({
      user_id: buyerId,
      product_type: 'instagram_account',
      product_id: accountId,
      transaction_id: transactionId,
      delivered_at: new Date().toISOString(),
      delivery_data: {
        username: account.username,
        login: account.deliverable_login,
        password: account.deliverable_password,
        email: account.deliverable_email,
        notes: account.deliverable_notes,
        info: account.deliverable_info
      }
    });

  console.log('Instagram account delivery created:', accountId);
}

async function handleTelegramGroupDelivery(supabase: any, groupId: string, buyerId: string, transactionId: string) {
  // Get group details
  const { data: group } = await supabase
    .from('telegram_groups')
    .select('*')
    .eq('id', groupId)
    .single();

  if (!group) return;

  // Mark as sold
  await supabase
    .from('telegram_groups')
    .update({
      is_sold: true,
      sold_at: new Date().toISOString(),
      sold_to_user_id: buyerId
    })
    .eq('id', groupId);

  // Check if delivery already exists to avoid duplicates
  const { data: existingDelivery } = await supabase
    .from('deliveries')
    .select('id')
    .eq('transaction_id', transactionId)
    .maybeSingle();

  if (existingDelivery) {
    console.log('Telegram group delivery already exists, skipping');
    return;
  }

  // Create delivery record
  await supabase
    .from('deliveries')
    .insert({
      user_id: buyerId,
      product_type: 'telegram_group',
      product_id: groupId,
      transaction_id: transactionId,
      delivered_at: new Date().toISOString(),
      delivery_data: {
        group_name: group.group_name,
        invite_link: group.deliverable_invite_link,
        notes: group.deliverable_notes,
        info: group.deliverable_info
      }
    });

  console.log('Telegram group delivery created:', groupId);
}

async function handleModelDelivery(supabase: any, modelId: string, buyerId: string, transactionId: string) {
  // Get model details
  const { data: model } = await supabase
    .from('models_for_sale')
    .select('*')
    .eq('id', modelId)
    .single();

  if (!model) return;

  // Mark as sold
  await supabase
    .from('models_for_sale')
    .update({
      is_sold: true,
      sold_at: new Date().toISOString(),
      sold_to_user_id: buyerId
    })
    .eq('id', modelId);

  // Check if delivery already exists to avoid duplicates
  const { data: existingDelivery } = await supabase
    .from('deliveries')
    .select('id')
    .eq('transaction_id', transactionId)
    .maybeSingle();

  if (existingDelivery) {
    console.log('Model delivery already exists, skipping');
    return;
  }

  // Create delivery record
  await supabase
    .from('deliveries')
    .insert({
      user_id: buyerId,
      product_type: 'model',
      product_id: modelId,
      transaction_id: transactionId,
      delivered_at: new Date().toISOString(),
      delivery_data: {
        name: model.name,
        link: model.deliverable_link,
        notes: model.deliverable_notes,
        info: model.deliverable_info,
        assets: model.assets,
        scripts: model.scripts
      }
    });

  // If model has funnel_json, import it for the buyer
  if (model.funnel_json) {
    try {
      const funnelData = typeof model.funnel_json === 'string' 
        ? JSON.parse(model.funnel_json) 
        : model.funnel_json;

      if (funnelData.nodes && funnelData.edges) {
        // Create new funnel for buyer
        const { data: newFunnel } = await supabase
          .from('funnels')
          .insert({
            user_id: buyerId,
            name: `${model.name} (Importado)`,
            description: model.bio,
            is_active: false
          })
          .select()
          .single();

        if (newFunnel) {
          // Create a mapping of old node IDs to new node IDs
          const nodeIdMap: Record<string, string> = {};

          // Insert nodes
          for (const node of funnelData.nodes) {
            const { data: newNode } = await supabase
              .from('funnel_nodes')
              .insert({
                funnel_id: newFunnel.id,
                node_type: node.type || node.node_type || 'message',
                position_x: node.position?.x || node.position_x || 0,
                position_y: node.position?.y || node.position_y || 0,
                content: node.data || node.content || {}
              })
              .select()
              .single();

            if (newNode) {
              nodeIdMap[node.id] = newNode.id;
            }
          }

          // Insert edges with mapped IDs
          for (const edge of funnelData.edges) {
            const newSourceId = nodeIdMap[edge.source] || nodeIdMap[edge.source_node_id];
            const newTargetId = nodeIdMap[edge.target] || nodeIdMap[edge.target_node_id];

            if (newSourceId && newTargetId) {
              await supabase
                .from('funnel_edges')
                .insert({
                  funnel_id: newFunnel.id,
                  source_node_id: newSourceId,
                  target_node_id: newTargetId,
                  source_handle: edge.sourceHandle || edge.source_handle || 'default'
                });
            }
          }

          console.log('Funnel imported from model:', newFunnel.id);
        }
      }
    } catch (e) {
      console.error('Error importing funnel from model:', e);
    }
  }

  console.log('Model delivery created:', modelId);
}

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
    const telegramUserId = payment.lead_telegram_id || userChatId;
    
    try {
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

    // If no join request exists, send invite link
    if (product.group_invite_link) {
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
            member_limit: 1,
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

    const banResponse = await fetch(`${TELEGRAM_API_URL}${botToken}/banChatMember`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: groupChatId,
        user_id: telegramUserId,
        revoke_messages: false
      })
    });

    const banResult = await banResponse.json();
    console.log('Ban user result:', JSON.stringify(banResult));

    if (banResult.ok) {
      await fetch(`${TELEGRAM_API_URL}${botToken}/unbanChatMember`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: groupChatId,
          user_id: telegramUserId,
          only_if_banned: true
        })
      });

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
