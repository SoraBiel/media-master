import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TELEGRAM_API_BASE = "https://api.telegram.org/bot";

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: { id: number; first_name: string; username?: string };
    chat: { id: number; type: string; title?: string };
    date: number;
    text?: string;
  };
  callback_query?: {
    id: string;
    from: { id: number; first_name: string };
    message: { chat: { id: number }; message_id: number };
    data: string;
  };
  chat_join_request?: {
    chat: { id: number; title?: string; type: string };
    from: { id: number; first_name: string; username?: string };
    date: number;
    invite_link?: { invite_link: string; name?: string };
  };
}

interface FunnelNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, any>;
}

interface FunnelEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
}

// Telegram API helper
async function callTelegramAPI(botToken: string, method: string, params?: Record<string, any>) {
  const url = `${TELEGRAM_API_BASE}${botToken}/${method}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: params ? JSON.stringify(params) : undefined,
  });
  const data = await response.json();
  console.log(`Telegram API ${method}:`, JSON.stringify(data).slice(0, 200));
  return data;
}

// Replace variables in text
function replaceVariables(text: string, variables: Record<string, any>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    return variables[varName] !== undefined ? String(variables[varName]) : match;
  });
}

// Find next node based on edge
function findNextNode(
  currentNodeId: string, 
  edges: FunnelEdge[], 
  nodes: FunnelNode[],
  sourceHandle?: string
): FunnelNode | undefined {
  const edge = edges.find(e => {
    if (e.source !== currentNodeId) return false;
    if (sourceHandle && e.sourceHandle) return e.sourceHandle === sourceHandle;
    return true;
  });
  
  if (!edge) return undefined;
  return nodes.find(n => n.id === edge.target);
}

// Evaluate condition
function evaluateCondition(node: FunnelNode, variables: Record<string, any>): boolean {
  const { variable, operator, value } = node.data;
  const actualValue = variables[variable];
  
  switch (operator) {
    case 'equals': return String(actualValue) === String(value);
    case 'not_equals': return String(actualValue) !== String(value);
    case 'contains': return String(actualValue).includes(String(value));
    case 'greater': return Number(actualValue) > Number(value);
    case 'less': return Number(actualValue) < Number(value);
    case 'exists': return actualValue !== undefined && actualValue !== null && actualValue !== '';
    case 'empty': return actualValue === undefined || actualValue === null || actualValue === '';
    default: return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  const integrationId = pathParts[pathParts.length - 1];

  console.log(`Funnel webhook called for integration: ${integrationId}`);

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Parse Telegram update
    const update: TelegramUpdate = await req.json();
    console.log("Telegram update:", JSON.stringify(update).slice(0, 500));

    // Handle chat join requests (for group product delivery)
    if (update.chat_join_request) {
      return await handleChatJoinRequest(supabase, integrationId, update.chat_join_request);
    }

    // Get chat info
    const chatId = update.message?.chat.id || update.callback_query?.message?.chat.id;
    const userId = update.message?.from.id || update.callback_query?.from.id;
    const userName = update.message?.from.first_name || update.callback_query?.from.first_name || 'Usuário';
    const messageText = update.message?.text;
    const callbackData = update.callback_query?.data;

    if (!chatId) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get telegram integration with bot token
    const { data: integration, error: intError } = await supabase
      .from("telegram_integrations")
      .select("*, user_id")
      .eq("id", integrationId)
      .single();

    if (intError || !integration) {
      console.error("Integration not found:", integrationId);
      return new Response(JSON.stringify({ error: "Integration not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const botToken = integration.bot_token;

    // Handle PIX callback actions (copied, paid, cancel)
    if (callbackData && callbackData.startsWith('pix_')) {
      const [action, paymentId] = callbackData.split(':');
      console.log(`PIX callback: ${action} for payment ${paymentId}`);

      // Answer callback query first
      if (update.callback_query) {
        await callTelegramAPI(botToken, "answerCallbackQuery", {
          callback_query_id: update.callback_query.id,
        });
      }

      if (action === 'pix_copied') {
        await callTelegramAPI(botToken, "sendMessage", {
          chat_id: chatId,
          text: "✅ Ótimo! Agora finalize o pagamento no seu app de banco.\n\n⏰ O pagamento será confirmado automaticamente assim que for processado.",
          parse_mode: "HTML",
        });
        return new Response(JSON.stringify({ ok: true, action: 'pix_copied' }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === 'pix_paid') {
        // Reconcile payment status with Mercado Pago (webhooks may be blocked)
        const { data: payment, error: paymentError } = await supabase
          .from('funnel_payments')
          .select('*, funnel_products(*)')
          .eq('id', paymentId)
          .maybeSingle();

        if (paymentError) {
          console.error('Error fetching payment:', paymentError);
        }

        if (!payment) {
          await callTelegramAPI(botToken, 'sendMessage', {
            chat_id: chatId,
            text: '❌ Pagamento não encontrado. Entre em contato com o suporte.',
            parse_mode: 'HTML',
          });

          return new Response(JSON.stringify({ ok: true, action: 'pix_paid', status: 'not_found' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get user's Mercado Pago integration (token)
        const { data: mpIntegration, error: mpIntegrationError } = await supabase
          .from('integrations')
          .select('*')
          .eq('user_id', payment.user_id)
          .eq('provider', 'mercadopago')
          .eq('status', 'active')
          .maybeSingle();

        if (mpIntegrationError) {
          console.error('Error fetching Mercado Pago integration:', mpIntegrationError);
        }

        if (!mpIntegration) {
          await callTelegramAPI(botToken, 'sendMessage', {
            chat_id: chatId,
            text: '⚠️ Não foi possível verificar o pagamento agora. Tente novamente em alguns instantes.',
            parse_mode: 'HTML',
          });

          return new Response(JSON.stringify({ ok: true, action: 'pix_paid', status: payment.status }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Fetch payment status from Mercado Pago
        let mpStatus: string | undefined;
        try {
          const providerPaymentId = String(payment.provider_payment_id || '');
          const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${providerPaymentId}`, {
            headers: {
              Authorization: `Bearer ${mpIntegration.access_token}`,
              'Content-Type': 'application/json',
            },
          });

          const mpPayment = await mpRes.json();
          if (!mpRes.ok) {
            console.error('Mercado Pago status fetch failed:', mpPayment);
          } else {
            mpStatus = mpPayment?.status;
          }
        } catch (e) {
          console.error('Error fetching Mercado Pago payment:', e);
        }

        const newStatus = mpStatus || payment.status;
        const nowIso = new Date().toISOString();

        // Persist latest status
        const statusUpdate: Record<string, unknown> = { status: newStatus, updated_at: nowIso };
        if (newStatus === 'approved' && !payment.paid_at) statusUpdate.paid_at = nowIso;
        await supabase.from('funnel_payments').update(statusUpdate).eq('id', payment.id);

        if (newStatus === 'approved') {
          // Deliver product (once)
          if (payment.delivery_status !== 'delivered') {
            await deliverFunnelProduct(botToken, chatId, payment);
            await supabase
              .from('funnel_payments')
              .update({ delivery_status: 'delivered', delivered_at: nowIso, updated_at: nowIso })
              .eq('id', payment.id);
          }

          await callTelegramAPI(botToken, 'sendMessage', {
            chat_id: chatId,
            text: '✅ <b>Pagamento confirmado!</b>\n\nSe você comprou acesso ao grupo, peça para entrar que eu aprovo automaticamente.',
            parse_mode: 'HTML',
          });
        } else if (newStatus === 'pending' || !newStatus) {
          await callTelegramAPI(botToken, 'sendMessage', {
            chat_id: chatId,
            text: '⏳ <b>Pagamento ainda não identificado.</b>\n\nAguarde alguns instantes e tente novamente. O PIX pode levar até 1 minuto para ser processado.',
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [[{ text: '🔄 Verificar Novamente', callback_data: `pix_paid:${paymentId}` }]],
            },
          });
        } else {
          await callTelegramAPI(botToken, 'sendMessage', {
            chat_id: chatId,
            text: `⚠️ Status do pagamento: ${newStatus}.\n\nSe você já pagou, aguarde alguns instantes e tente novamente.`,
            parse_mode: 'HTML',
          });
        }

        return new Response(JSON.stringify({ ok: true, action: 'pix_paid', status: newStatus }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'pix_cancel') {
        // Mark payment as cancelled
        await supabase
          .from('funnel_payments')
          .update({ status: 'cancelled' })
          .eq('id', paymentId);

        await callTelegramAPI(botToken, "sendMessage", {
          chat_id: chatId,
          text: "❌ Pagamento cancelado.\n\nSe mudar de ideia, digite /start para começar novamente.",
          parse_mode: "HTML",
        });

        return new Response(JSON.stringify({ ok: true, action: 'pix_cancel' }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Find active funnel for this integration
    const { data: funnel, error: funnelError } = await supabase
      .from("funnels")
      .select("*")
      .eq("telegram_integration_id", integrationId)
      .eq("is_active", true)
      .single();

    if (funnelError || !funnel) {
      console.log("No active funnel for this integration");
      return new Response(JSON.stringify({ ok: true, message: "No active funnel" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get funnel nodes and edges
    const { data: nodesData } = await supabase
      .from("funnel_nodes")
      .select("*")
      .eq("funnel_id", funnel.id);

    const { data: edgesData } = await supabase
      .from("funnel_edges")
      .select("*")
      .eq("funnel_id", funnel.id);

    // Convert to our format
    const nodes: FunnelNode[] = (nodesData || []).map((n: any) => ({
      id: n.id,
      type: n.node_type,
      position: { x: n.position_x, y: n.position_y },
      data: n.content || {},
    }));

    const edges: FunnelEdge[] = (edgesData || []).map((e: any) => ({
      id: e.id,
      source: e.source_node_id,
      target: e.target_node_id,
      sourceHandle: e.source_handle,
    }));

    // Check for trigger keywords
    const triggerKeywords = funnel.trigger_keywords || ['/start'];
    let isNewSession = !!(messageText && triggerKeywords.some((k: string) => 
      messageText.toLowerCase().startsWith(k.toLowerCase())
    ));

    // Get or create session
    let { data: session } = await supabase
      .from("telegram_sessions")
      .select("*")
      .eq("funnel_id", funnel.id)
      .eq("chat_id", String(chatId))
      .eq("is_finished", false)
      .single();

    // If the funnel was updated after the last interaction, restart the session
    if (session) {
      const funnelUpdatedAt = funnel.updated_at ? new Date(funnel.updated_at).getTime() : 0;
      const sessionLastAtRaw = session.last_message_at || session.created_at;
      const sessionLastAt = sessionLastAtRaw ? new Date(sessionLastAtRaw).getTime() : 0;

      if (funnelUpdatedAt && sessionLastAt && funnelUpdatedAt > sessionLastAt) {
        console.log(
          `Restarting session because funnel was updated (funnel.updated_at=${funnel.updated_at}, session.last=${sessionLastAtRaw})`
        );
        isNewSession = true;
      }
    }

    // If starting fresh or no session exists
    if (isNewSession || !session) {
      // Mark old sessions as finished
      await supabase
        .from("telegram_sessions")
        .update({ is_finished: true })
        .eq("funnel_id", funnel.id)
        .eq("chat_id", String(chatId));

      // Find start node
      const startNode = nodes.find(n => n.type === 'start');
      if (!startNode) {
        console.error("No start node in funnel");
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create new session
      const { data: newSession, error: sessError } = await supabase
        .from("telegram_sessions")
        .insert({
          funnel_id: funnel.id,
          chat_id: String(chatId),
          telegram_user_id: String(userId),
          current_node_id: startNode.id,
          variables: { nome: userName, user_id: userId, chat_id: chatId },
          history: [],
        })
        .select()
        .single();

      if (sessError) {
        console.error("Error creating session:", sessError);
        return new Response(JSON.stringify({ error: sessError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      session = newSession;

      // Log session start
      await supabase.from("telegram_logs").insert({
        session_id: session.id,
        funnel_id: funnel.id,
        event_type: "session_started",
        payload: { trigger: messageText },
      });
    }

    // Get current node
    let currentNode: FunnelNode | undefined = nodes.find(n => n.id === session.current_node_id);
    if (!currentNode) {
      console.error("Current node not found:", session.current_node_id);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let variables = session.variables || {};
    let responseHandle: string | undefined;

    // Process user input if waiting for response
    if (currentNode.type.startsWith('question') && (messageText || callbackData) && !isNewSession) {
      const userResponse = callbackData || messageText;
      const varName = currentNode.data.variableName;
      
      if (varName && userResponse) {
        variables[varName] = userResponse;
      }

      // For choice questions, the response determines the path
      if (currentNode.type === 'question_choice' && callbackData) {
        responseHandle = callbackData;
        
        // Answer callback query
        if (update.callback_query) {
          await callTelegramAPI(botToken, "answerCallbackQuery", {
            callback_query_id: update.callback_query.id,
          });
        }
      }

      // Log response
      await supabase.from("telegram_logs").insert({
        session_id: session.id,
        funnel_id: funnel.id,
        event_type: "user_response",
        node_id: currentNode.id,
        payload: { response: userResponse, variable: varName },
      });

      // Move to next node
      currentNode = findNextNode(currentNode.id, edges, nodes, responseHandle) || currentNode;
    }

    // Process nodes until we need user input or finish
    let iterationCount = 0;
    const maxIterations = 50; // Prevent infinite loops

    while (currentNode && iterationCount < maxIterations) {
      iterationCount++;
      console.log(`Processing node: ${currentNode.type} (${currentNode.id})`);

      // Send typing action
      await callTelegramAPI(botToken, "sendChatAction", {
        chat_id: chatId,
        action: "typing",
      });

      switch (currentNode.type) {
        case 'start':
          // Just move to next
          currentNode = findNextNode(currentNode.id, edges, nodes);
          break;

        case 'message':
        case 'action_message': {
          const text = replaceVariables(currentNode.data.text || '', variables);
          
          if (currentNode.data.mediaType === 'image' && currentNode.data.mediaUrl) {
            await callTelegramAPI(botToken, "sendPhoto", {
              chat_id: chatId,
              photo: currentNode.data.mediaUrl,
              caption: text,
              parse_mode: "HTML",
            });
          } else if (currentNode.data.mediaType === 'video' && currentNode.data.mediaUrl) {
            await callTelegramAPI(botToken, "sendVideo", {
              chat_id: chatId,
              video: currentNode.data.mediaUrl,
              caption: text,
              parse_mode: "HTML",
            });
          } else if (text) {
            await callTelegramAPI(botToken, "sendMessage", {
              chat_id: chatId,
              text: text,
              parse_mode: "HTML",
            });
          }

          currentNode = findNextNode(currentNode.id, edges, nodes);
          break;
        }

        case 'question': {
          const text = replaceVariables(currentNode.data.questionText || '', variables);
          await callTelegramAPI(botToken, "sendMessage", {
            chat_id: chatId,
            text: text,
            parse_mode: "HTML",
          });

          // Update session and wait for response
          await supabase
            .from("telegram_sessions")
            .update({ 
              current_node_id: currentNode.id, 
              variables,
              last_message_at: new Date().toISOString(),
            })
            .eq("id", session.id);

          return new Response(JSON.stringify({ ok: true, waiting: "text" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        case 'question_choice': {
          const text = replaceVariables(currentNode.data.questionText || '', variables);
          const choices = currentNode.data.choices || [];
          
          // Create inline keyboard
          const keyboard = {
            inline_keyboard: choices.map((choice: any) => [{
              text: choice.label,
              callback_data: choice.id,
            }]),
          };

          await callTelegramAPI(botToken, "sendMessage", {
            chat_id: chatId,
            text: text,
            parse_mode: "HTML",
            reply_markup: keyboard,
          });

          // Update session and wait for response
          await supabase
            .from("telegram_sessions")
            .update({ 
              current_node_id: currentNode.id, 
              variables,
              last_message_at: new Date().toISOString(),
            })
            .eq("id", session.id);

          return new Response(JSON.stringify({ ok: true, waiting: "choice" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        case 'question_number': {
          const text = replaceVariables(currentNode.data.questionText || '', variables);
          await callTelegramAPI(botToken, "sendMessage", {
            chat_id: chatId,
            text: text,
            parse_mode: "HTML",
          });

          await supabase
            .from("telegram_sessions")
            .update({ 
              current_node_id: currentNode.id, 
              variables,
              last_message_at: new Date().toISOString(),
            })
            .eq("id", session.id);

          return new Response(JSON.stringify({ ok: true, waiting: "number" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        case 'condition': {
          const result = evaluateCondition(currentNode, variables);
          const handle = result ? 'true' : 'false';
          
          await supabase.from("telegram_logs").insert({
            session_id: session.id,
            funnel_id: funnel.id,
            event_type: "condition_evaluated",
            node_id: currentNode.id,
            payload: { result, variable: currentNode.data.variable, value: variables[currentNode.data.variable] },
          });

          currentNode = findNextNode(currentNode.id, edges, nodes, handle);
          break;
        }

        case 'delay': {
          const seconds = currentNode.data.seconds || 5;
          // For now, we'll just wait inline (in production, use a queue/scheduler)
          await new Promise(resolve => setTimeout(resolve, Math.min(seconds, 10) * 1000));
          currentNode = findNextNode(currentNode.id, edges, nodes);
          break;
        }

        case 'variable': {
          if (currentNode.data.action === 'set') {
            const varName = currentNode.data.variableName;
            const varValue = replaceVariables(currentNode.data.varValue || '', variables);
            if (varName) {
              variables[varName] = varValue;
            }
          } else if (currentNode.data.action === 'clear') {
            const varName = currentNode.data.variableName;
            if (varName) {
              delete variables[varName];
            }
          }
          currentNode = findNextNode(currentNode.id, edges, nodes);
          break;
        }

        case 'action_notify': {
          const text = replaceVariables(currentNode.data.text || '', variables);
          
          // Log notification
          await supabase.from("telegram_logs").insert({
            session_id: session.id,
            funnel_id: funnel.id,
            event_type: "admin_notification",
            node_id: currentNode.id,
            payload: { message: text, variables },
          });

          // TODO: Send actual notification (email, webhook, etc)
          console.log("ADMIN NOTIFICATION:", text);
          
          currentNode = findNextNode(currentNode.id, edges, nodes);
          break;
        }

        case 'action_webhook': {
          const webhookUrl = currentNode.data.webhookUrl;
          const method = currentNode.data.webhookMethod || 'POST';
          
          if (webhookUrl) {
            try {
              const body = currentNode.data.webhookBody 
                ? JSON.parse(replaceVariables(currentNode.data.webhookBody, variables))
                : variables;

              const response = await fetch(webhookUrl, {
                method,
                headers: { "Content-Type": "application/json" },
                body: method === 'POST' ? JSON.stringify(body) : undefined,
              });

              await supabase.from("telegram_logs").insert({
                session_id: session.id,
                funnel_id: funnel.id,
                event_type: "webhook_called",
                node_id: currentNode.id,
                payload: { url: webhookUrl, status: response.status },
              });
            } catch (error: any) {
              console.error("Webhook error:", error);
            }
          }
          
          currentNode = findNextNode(currentNode.id, edges, nodes);
          break;
        }

        case 'payment': {
          // Get product ID (fixed or from variable)
          let productId = currentNode.data.productId;
          if (currentNode.data.productSelectionType === 'variable' && currentNode.data.productVariable) {
            productId = variables[currentNode.data.productVariable];
          }

          if (!productId) {
            console.error("No product ID for payment block");
            currentNode = findNextNode(currentNode.id, edges, nodes);
            break;
          }

          // Get product details
          const { data: product } = await supabase
            .from("funnel_products")
            .select("*")
            .eq("id", productId)
            .single();

          if (!product) {
            console.error("Product not found:", productId);
            currentNode = findNextNode(currentNode.id, edges, nodes);
            break;
          }

          // Get user's Mercado Pago integration
          const { data: integration } = await supabase
            .from("integrations")
            .select("*")
            .eq("user_id", funnel.user_id)
            .eq("provider", "mercadopago")
            .eq("status", "active")
            .maybeSingle();

          if (!integration) {
            console.error("Mercado Pago not connected for user:", funnel.user_id);
            await callTelegramAPI(botToken, "sendMessage", {
              chat_id: chatId,
              text: "⚠️ Pagamento indisponível no momento. Por favor, entre em contato.",
            });
            currentNode = findNextNode(currentNode.id, edges, nodes);
            break;
          }

          // Create PIX payment via Mercado Pago
          const paymentData = {
            transaction_amount: product.price_cents / 100,
            description: product.name,
            payment_method_id: "pix",
            payer: {
              email: "customer@email.com",
              first_name: variables.nome || "Cliente",
            },
          };

          const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${integration.access_token}`,
              "Content-Type": "application/json",
              "X-Idempotency-Key": crypto.randomUUID(),
            },
            body: JSON.stringify(paymentData),
          });

          const mpPayment = await mpResponse.json();

          if (!mpResponse.ok) {
            console.error("Mercado Pago payment error:", mpPayment);
            await callTelegramAPI(botToken, "sendMessage", {
              chat_id: chatId,
              text: "⚠️ Erro ao gerar pagamento. Tente novamente.",
            });
            currentNode = findNextNode(currentNode.id, edges, nodes);
            break;
          }

          const pixData = mpPayment.point_of_interaction?.transaction_data;
          const pixCode = pixData?.qr_code || "";
          const pixQrcode = pixData?.qr_code_base64 || "";
          const amount = (product.price_cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

          // Save payment to database
          const { data: savedPayment } = await supabase
            .from("funnel_payments")
            .insert({
              funnel_id: funnel.id,
              product_id: product.id,
              user_id: funnel.user_id,
              lead_chat_id: String(chatId),
              lead_name: variables.nome || null,
              provider: "mercadopago",
              provider_payment_id: String(mpPayment.id),
              amount_cents: product.price_cents,
              currency: product.currency,
              status: mpPayment.status,
              pix_qrcode: pixQrcode,
              pix_code: pixCode,
              pix_expiration: mpPayment.date_of_expiration,
            })
            .select()
            .single();

          // Store payment info in variables for next blocks
          variables.payment_id = savedPayment?.id || mpPayment.id;
          variables.pix_code = pixCode;
          variables.amount = amount;
          variables.product_name = product.name;

          // Send QR code image if available
          if (pixQrcode) {
            try {
              // Send QR code as photo using base64
              await callTelegramAPI(botToken, "sendPhoto", {
                chat_id: chatId,
                photo: `data:image/png;base64,${pixQrcode}`,
                caption: `🛒 *${product.name}*\n\n💰 Valor: *${amount}*\n\n📱 Escaneie o QR Code acima ou copie o código PIX abaixo`,
                parse_mode: "Markdown",
              });
            } catch (e) {
              console.log("Could not send QR image via data URL, trying alternative method");
              // Alternative: Create an InputFile from base64
              try {
                const formData = new FormData();
                formData.append('chat_id', String(chatId));
                
                // Convert base64 to Blob
                const binaryString = atob(pixQrcode);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }
                const blob = new Blob([bytes], { type: 'image/png' });
                formData.append('photo', blob, 'qrcode.png');
                formData.append('caption', `🛒 *${product.name}*\n\n💰 Valor: *${amount}*\n\n📱 Escaneie o QR Code acima ou copie o código PIX abaixo`);
                formData.append('parse_mode', 'Markdown');
                
                const photoResponse = await fetch(`${TELEGRAM_API_BASE}${botToken}/sendPhoto`, {
                  method: 'POST',
                  body: formData,
                });
                const photoResult = await photoResponse.json();
                console.log("QR photo sent via FormData:", JSON.stringify(photoResult).slice(0, 200));
              } catch (e2) {
                console.error("Failed to send QR code image:", e2);
              }
            }
          }

          // Send PIX code with inline buttons
          const pixMessage = `💳 <b>Código PIX (Copia e Cola):</b>\n\n<code>${pixCode}</code>\n\n⏰ Após efetuar o pagamento, clique no botão abaixo para confirmar.`;
          
          // Get the payment ID for the callback
          const paymentId = savedPayment?.id || mpPayment.id;
          
          await callTelegramAPI(botToken, "sendMessage", {
            chat_id: chatId,
            text: pixMessage,
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "✅ Copiei o PIX", callback_data: `pix_copied:${paymentId}` },
                ],
                [
                  { text: "🔄 Já Paguei - Verificar", callback_data: `pix_paid:${paymentId}` },
                ],
              ],
            },
          });

          // Log payment created
          await supabase.from("telegram_logs").insert({
            session_id: session.id,
            funnel_id: funnel.id,
            event_type: "payment_created",
            node_id: currentNode.id,
            payload: { 
              payment_id: savedPayment?.id,
              provider_payment_id: mpPayment.id,
              amount: product.price_cents,
              pix_code: pixCode.slice(0, 50) + "...",
            },
          });

          // Update session and wait for payment confirmation
          await supabase
            .from("telegram_sessions")
            .update({ 
              current_node_id: currentNode.id, 
              variables,
              last_message_at: new Date().toISOString(),
            })
            .eq("id", session.id);

          // Note: Payment confirmation comes via webhook, session continues after payment
          return new Response(JSON.stringify({ ok: true, waiting: "payment" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        case 'end': {
          // Mark session as finished
          await supabase
            .from("telegram_sessions")
            .update({ 
              is_finished: true, 
              variables,
              current_node_id: currentNode.id,
            })
            .eq("id", session.id);

          await supabase.from("telegram_logs").insert({
            session_id: session.id,
            funnel_id: funnel.id,
            event_type: "session_finished",
            node_id: currentNode.id,
            payload: { variables },
          });

          return new Response(JSON.stringify({ ok: true, finished: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        default:
          console.log("Unknown node type:", currentNode.type);
          currentNode = findNextNode(currentNode.id, edges, nodes);
      }

      // Small delay between messages
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Update session
    if (session && currentNode) {
      await supabase
        .from("telegram_sessions")
        .update({ 
          current_node_id: currentNode.id, 
          variables,
          last_message_at: new Date().toISOString(),
        })
        .eq("id", session.id);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Funnel webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function deliverFunnelProduct(botToken: string, chatId: string | number, payment: any) {
  try {
    const product = payment?.funnel_products;
    if (!product) return;

    // Group product: send invite link / instructions (approval happens on join request)
    if (product.delivery_type === 'group') {
      const groupText = product.group_invite_link
        ? `✅ <b>Pagamento confirmado!</b>\n\n🎉 Seu acesso ao grupo <b>${product.name}</b> foi liberado.\n\n🔗 Entre por aqui: ${product.group_invite_link}\n\nDepois de pedir para entrar, eu aprovo automaticamente.`
        : `✅ <b>Pagamento confirmado!</b>\n\n🎉 Seu acesso ao grupo <b>${product.name}</b> foi liberado.\n\nAgora peça para entrar no grupo (solicitação de entrada) que eu aprovo automaticamente.`;

      await callTelegramAPI(botToken, 'sendMessage', {
        chat_id: chatId,
        text: groupText,
        parse_mode: 'HTML',
      });
      return;
    }

    // Link/message product
    let message = `✅ <b>Pagamento Confirmado!</b>\n\nObrigado pela compra de <b>${product.name}</b>!\n\n`;

    if ((product.delivery_type === 'link' || product.delivery_type === 'both') && product.delivery_content) {
      message += `🔗 Seu acesso: ${product.delivery_content}\n\n`;
    }

    if ((product.delivery_type === 'message' || product.delivery_type === 'both') && product.delivery_message) {
      message += product.delivery_message;
    }

    await callTelegramAPI(botToken, 'sendMessage', {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    });
  } catch (e) {
    console.error('deliverFunnelProduct error:', e);
  }
}

// Handle chat join requests for group product delivery
async function handleChatJoinRequest(
  supabase: any,
  integrationId: string,
  joinRequest: NonNullable<TelegramUpdate['chat_join_request']>
) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  try {
    const groupChatId = String(joinRequest.chat.id);
    const telegramUserId = joinRequest.from.id;
    const userName = joinRequest.from.first_name;
    
    console.log(`Chat join request from user ${telegramUserId} (${userName}) to group ${groupChatId}`);

    // Get the telegram integration to get bot token
    const { data: integration } = await supabase
      .from("telegram_integrations")
      .select("*")
      .eq("id", integrationId)
      .single();

    if (!integration) {
      console.log("Integration not found for join request");
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const botToken = integration.bot_token;

    // Find approved payment for this user and group
    const { data: payment } = await supabase
      .from("funnel_payments")
      .select("*, funnel_products(*)")
      .eq("status", "approved")
      .eq("lead_chat_id", String(telegramUserId))
      .maybeSingle();

    // Also check by telegram user ID if lead_chat_id didn't match
    let approvedPayment = payment;

    if (!approvedPayment) {
      // Try finding by any payment where product has this group
      const { data: productPayment } = await supabase
        .from("funnel_payments")
        .select("*, funnel_products!inner(*)")
        .eq("status", "approved")
        .eq("funnel_products.group_chat_id", groupChatId)
        .eq("lead_chat_id", String(telegramUserId))
        .maybeSingle();

      approvedPayment = productPayment;
    }

    if (approvedPayment && approvedPayment.funnel_products?.delivery_type === 'group') {
      // User has paid! Approve the join request
      console.log(`Approving join request for paid user ${telegramUserId}`);
      
      const approveResponse = await fetch(`https://api.telegram.org/bot${botToken}/approveChatJoinRequest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: groupChatId,
          user_id: telegramUserId
        })
      });

      const approveResult = await approveResponse.json();
      console.log("Approve result:", JSON.stringify(approveResult));

      if (approveResult.ok) {
        // Notify the user in their private chat
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: telegramUserId,
            text: `🎉 *Bem-vindo!*\n\nSua entrada no grupo *${joinRequest.chat.title || 'exclusivo'}* foi aprovada!\n\n✅ Obrigado por sua compra!`,
            parse_mode: 'Markdown'
          })
        });

        // Log the approval
        await supabase.from("telegram_logs").insert({
          event_type: "group_join_approved",
          payload: { 
            user_id: telegramUserId,
            user_name: userName,
            group_id: groupChatId,
            group_title: joinRequest.chat.title,
            payment_id: approvedPayment.id
          },
        });
      }
    } else {
      console.log(`No approved payment found for user ${telegramUserId} requesting to join group ${groupChatId}`);
      // Don't auto-decline - let admin handle it or wait for payment
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error handling chat join request:", error);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}
