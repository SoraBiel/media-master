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
