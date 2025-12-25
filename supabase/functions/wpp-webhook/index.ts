import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GRAPH_API_URL = "https://graph.facebook.com/v18.0";

interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  image?: { id: string; mime_type: string; sha256: string; caption?: string };
  video?: { id: string; mime_type: string; sha256: string; caption?: string };
  audio?: { id: string; mime_type: string; sha256: string };
  document?: { id: string; mime_type: string; sha256: string; filename: string; caption?: string };
  button?: { text: string; payload: string };
  interactive?: { type: string; button_reply?: { id: string; title: string }; list_reply?: { id: string; title: string } };
}

interface WhatsAppStatus {
  id: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
  recipient_id: string;
  conversation?: { id: string; origin?: { type: string } };
  pricing?: { billable: boolean; pricing_model: string; category: string };
  errors?: Array<{ code: number; title: string }>;
}

interface WebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: { display_phone_number: string; phone_number_id: string };
        contacts?: Array<{ profile: { name: string }; wa_id: string }>;
        messages?: WhatsAppMessage[];
        statuses?: WhatsAppStatus[];
      };
      field: string;
    }>;
  }>;
}

// Helper to create Supabase client
function getSupabaseClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

// Find WPP account by phone_number_id
async function findWppAccount(supabase: any, phoneNumberId: string) {
  const { data, error } = await supabase
    .from("wpp_accounts")
    .select("*")
    .eq("phone_number_id", phoneNumberId)
    .eq("is_connected", true)
    .single();
  
  if (error) {
    console.error("Error finding WPP account:", error);
    return null;
  }
  
  return data;
}

// Process incoming message
async function processIncomingMessage(
  supabase: any,
  account: any,
  message: WhatsAppMessage,
  contact: { name: string; wa_id: string }
) {
  console.log(`Processing incoming message from ${contact.wa_id}:`, message.type);
  
  // Save/update contact
  await supabase.from("wpp_contacts").upsert(
    {
      user_id: account.user_id,
      wa_id: contact.wa_id,
      phone: contact.wa_id,
      name: contact.name,
      profile_name: contact.name,
      last_seen_at: new Date().toISOString(),
      opt_in_status: "opted_in",
    },
    { onConflict: "user_id,wa_id" }
  );
  
  // Save message
  const messagePayload: any = {
    type: message.type,
  };
  
  if (message.text) {
    messagePayload.text = message.text.body;
  } else if (message.image) {
    messagePayload.image = message.image;
  } else if (message.video) {
    messagePayload.video = message.video;
  } else if (message.audio) {
    messagePayload.audio = message.audio;
  } else if (message.document) {
    messagePayload.document = message.document;
  } else if (message.button) {
    messagePayload.button = message.button;
  } else if (message.interactive) {
    messagePayload.interactive = message.interactive;
  }
  
  await supabase.from("wpp_messages").insert({
    user_id: account.user_id,
    wpp_account_id: account.id,
    wa_id: contact.wa_id,
    direction: "inbound",
    message_id: message.id,
    message_type: message.type,
    status: "received",
    payload: messagePayload,
  });
  
  // Check for active funnel session
  const { data: session } = await supabase
    .from("wpp_sessions")
    .select("*, funnels(*)")
    .eq("wpp_account_id", account.id)
    .eq("wa_id", contact.wa_id)
    .eq("is_finished", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (session && session.funnels?.is_active) {
    // Continue funnel execution
    await executeFunnelStep(supabase, account, session, message, contact);
  } else {
    // Check for funnel triggers
    const messageText = message.text?.body?.toLowerCase() || "";
    
    const { data: funnels } = await supabase
      .from("funnels")
      .select("*")
      .eq("user_id", account.user_id)
      .eq("channel", "wpp")
      .eq("is_active", true);
    
    if (funnels) {
      for (const funnel of funnels) {
        const keywords = funnel.trigger_keywords || ["/start"];
        const shouldTrigger = keywords.some((kw: string) =>
          messageText.includes(kw.toLowerCase())
        );
        
        if (shouldTrigger) {
          // Start new funnel session
          await startFunnelSession(supabase, account, funnel, contact, message);
          break;
        }
      }
    }
  }
  
  // Log event
  await supabase.from("wpp_logs").insert({
    user_id: account.user_id,
    wpp_account_id: account.id,
    event_type: "message_received",
    payload: { message, contact },
  });
}

// Start a new funnel session
async function startFunnelSession(
  supabase: any,
  account: any,
  funnel: any,
  contact: { name: string; wa_id: string },
  message: WhatsAppMessage
) {
  console.log(`Starting funnel session for ${contact.wa_id} in funnel ${funnel.id}`);
  
  // Get start node
  const { data: nodes } = await supabase
    .from("funnel_nodes")
    .select("*")
    .eq("funnel_id", funnel.id)
    .eq("node_type", "start")
    .limit(1);
  
  const startNode = nodes?.[0];
  if (!startNode) {
    console.error("No start node found for funnel");
    return;
  }
  
  // Create session
  const { data: session, error } = await supabase
    .from("wpp_sessions")
    .insert({
      user_id: account.user_id,
      wpp_account_id: account.id,
      funnel_id: funnel.id,
      wa_id: contact.wa_id,
      chat_id: contact.wa_id,
      current_node_id: startNode.id,
      variables: {
        user_name: contact.name,
        user_phone: contact.wa_id,
        start_message: message.text?.body || "",
      },
      history: [],
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error creating session:", error);
    return;
  }
  
  // Execute from start node
  await executeFunnelFromNode(supabase, account, session, startNode.id, contact);
}

// Execute funnel step
async function executeFunnelStep(
  supabase: any,
  account: any,
  session: any,
  message: WhatsAppMessage,
  contact: { name: string; wa_id: string }
) {
  const userInput = message.text?.body ||
    message.button?.text ||
    message.interactive?.button_reply?.title ||
    message.interactive?.list_reply?.title ||
    "";
  
  // Update session variables with user input
  const variables = {
    ...session.variables,
    last_input: userInput,
    last_message_type: message.type,
  };
  
  // Get current node
  const { data: currentNode } = await supabase
    .from("funnel_nodes")
    .select("*")
    .eq("id", session.current_node_id)
    .single();
  
  if (!currentNode) {
    console.error("Current node not found");
    return;
  }
  
  // Handle question responses
  const content = currentNode.content as any;
  if (currentNode.node_type.startsWith("question")) {
    if (content.variableName) {
      variables[content.variableName] = userInput;
    }
  }
  
  // Find next node
  const { data: edges } = await supabase
    .from("funnel_edges")
    .select("*")
    .eq("funnel_id", session.funnel_id)
    .eq("source_node_id", currentNode.id);
  
  let nextNodeId = edges?.[0]?.target_node_id;
  
  // Handle condition nodes
  if (currentNode.node_type === "condition" && edges && edges.length > 1) {
    const conditionMet = evaluateCondition(content, variables);
    const targetHandle = conditionMet ? "yes" : "no";
    const matchingEdge = edges.find((e: any) => e.source_handle === targetHandle);
    nextNodeId = matchingEdge?.target_node_id || edges[0]?.target_node_id;
  }
  
  // Update session
  await supabase
    .from("wpp_sessions")
    .update({
      variables,
      history: [
        ...session.history,
        {
          node_id: currentNode.id,
          input: userInput,
          timestamp: new Date().toISOString(),
        },
      ],
      current_node_id: nextNodeId,
      last_message_at: new Date().toISOString(),
    })
    .eq("id", session.id);
  
  if (nextNodeId) {
    await executeFunnelFromNode(supabase, account, { ...session, variables }, nextNodeId, contact);
  }
}

// Execute funnel from a specific node
async function executeFunnelFromNode(
  supabase: any,
  account: any,
  session: any,
  nodeId: string,
  contact: { name: string; wa_id: string }
) {
  const { data: node } = await supabase
    .from("funnel_nodes")
    .select("*")
    .eq("id", nodeId)
    .single();
  
  if (!node) {
    console.error("Node not found:", nodeId);
    return;
  }
  
  const content = node.content as any;
  const variables = session.variables || {};
  
  console.log(`Executing node ${nodeId} of type ${node.node_type}`);
  
  switch (node.node_type) {
    case "start":
      // Move to next node
      await moveToNextNode(supabase, account, session, node, contact);
      break;
    
    case "message":
    case "action_message":
      // Send message
      const messageText = replaceVariables(content.text || "", variables);
      await sendWhatsAppMessage(account, contact.wa_id, messageText);
      
      // Move to next
      await moveToNextNode(supabase, account, session, node, contact);
      break;
    
    case "question":
    case "question_choice":
    case "question_number":
      // Send question and wait for response
      const questionText = replaceVariables(content.question || content.text || "", variables);
      await sendWhatsAppMessage(account, contact.wa_id, questionText);
      
      // Update current node and wait
      await supabase
        .from("wpp_sessions")
        .update({ current_node_id: nodeId })
        .eq("id", session.id);
      break;
    
    case "condition":
      // Evaluate and move
      await moveToNextNode(supabase, account, session, node, contact, variables);
      break;
    
    case "delay":
      // Wait and continue
      const delayMs = (content.duration || 1) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      await moveToNextNode(supabase, account, session, node, contact);
      break;
    
    case "variable":
      // Set variable
      if (content.variableName && content.variableValue !== undefined) {
        const newVariables = {
          ...variables,
          [content.variableName]: replaceVariables(content.variableValue, variables),
        };
        await supabase
          .from("wpp_sessions")
          .update({ variables: newVariables })
          .eq("id", session.id);
        session.variables = newVariables;
      }
      await moveToNextNode(supabase, account, session, node, contact);
      break;
    
    case "action_notify":
      // Log notification
      await supabase.from("wpp_logs").insert({
        user_id: account.user_id,
        wpp_account_id: account.id,
        funnel_id: session.funnel_id,
        session_id: session.id,
        node_id: nodeId,
        event_type: "admin_notification",
        payload: { message: content.message, variables },
      });
      await moveToNextNode(supabase, account, session, node, contact);
      break;
    
    case "end":
      // Mark session as finished
      await supabase
        .from("wpp_sessions")
        .update({ is_finished: true, current_node_id: nodeId })
        .eq("id", session.id);
      
      if (content.message) {
        const endMessage = replaceVariables(content.message, variables);
        await sendWhatsAppMessage(account, contact.wa_id, endMessage);
      }
      break;
    
    default:
      console.log(`Unknown node type: ${node.node_type}`);
      await moveToNextNode(supabase, account, session, node, contact);
  }
}

// Move to next node
async function moveToNextNode(
  supabase: any,
  account: any,
  session: any,
  currentNode: any,
  contact: { name: string; wa_id: string },
  variables?: any
) {
  const { data: edges } = await supabase
    .from("funnel_edges")
    .select("*")
    .eq("funnel_id", session.funnel_id)
    .eq("source_node_id", currentNode.id);
  
  if (!edges || edges.length === 0) {
    // No more nodes, end session
    await supabase
      .from("wpp_sessions")
      .update({ is_finished: true })
      .eq("id", session.id);
    return;
  }
  
  let nextNodeId = edges[0].target_node_id;
  
  // Handle condition nodes
  if (currentNode.node_type === "condition" && edges.length > 1) {
    const content = currentNode.content as any;
    const conditionMet = evaluateCondition(content, variables || session.variables);
    const targetHandle = conditionMet ? "yes" : "no";
    const matchingEdge = edges.find((e: any) => e.source_handle === targetHandle);
    nextNodeId = matchingEdge?.target_node_id || edges[0].target_node_id;
  }
  
  await supabase
    .from("wpp_sessions")
    .update({ current_node_id: nextNodeId })
    .eq("id", session.id);
  
  // Execute next node
  await executeFunnelFromNode(supabase, account, session, nextNodeId, contact);
}

// Helper functions
function replaceVariables(text: string, variables: Record<string, any>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    return variables[varName] !== undefined ? String(variables[varName]) : match;
  });
}

function evaluateCondition(content: any, variables: Record<string, any>): boolean {
  const { variable, operator, value } = content;
  const varValue = variables[variable];
  
  switch (operator) {
    case "equals":
      return String(varValue).toLowerCase() === String(value).toLowerCase();
    case "not_equals":
      return String(varValue).toLowerCase() !== String(value).toLowerCase();
    case "contains":
      return String(varValue).toLowerCase().includes(String(value).toLowerCase());
    case "not_contains":
      return !String(varValue).toLowerCase().includes(String(value).toLowerCase());
    case "greater_than":
      return Number(varValue) > Number(value);
    case "less_than":
      return Number(varValue) < Number(value);
    case "is_set":
      return varValue !== undefined && varValue !== null && varValue !== "";
    case "is_not_set":
      return varValue === undefined || varValue === null || varValue === "";
    default:
      return false;
  }
}

async function sendWhatsAppMessage(account: any, to: string, message: string) {
  const url = `${GRAPH_API_URL}/${account.phone_number_id}/messages`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${account.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { preview_url: true, body: message },
    }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    console.error("Error sending WhatsApp message:", data);
    throw new Error(data.error?.message || "Failed to send message");
  }
  
  return data;
}

// Process status update
async function processStatusUpdate(supabase: any, account: any, status: WhatsAppStatus) {
  console.log(`Processing status update: ${status.status} for message ${status.id}`);
  
  await supabase
    .from("wpp_messages")
    .update({
      status: status.status,
      updated_at: new Date().toISOString(),
    })
    .eq("message_id", status.id)
    .eq("wpp_account_id", account.id);
  
  // Handle conversation window
  if (status.conversation) {
    await supabase.from("wpp_conversations").upsert(
      {
        user_id: account.user_id,
        wa_id: status.recipient_id,
        wpp_account_id: account.id,
        conversation_id: status.conversation.id,
        pricing_category: status.pricing?.category,
        last_message_at: new Date().toISOString(),
      },
      { onConflict: "conversation_id" }
    );
  }
  
  // Log
  await supabase.from("wpp_logs").insert({
    user_id: account.user_id,
    wpp_account_id: account.id,
    event_type: `message_${status.status}`,
    payload: status,
  });
}

serve(async (req) => {
  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const accountId = pathParts[pathParts.length - 1];
  
  // Handle webhook verification (GET request)
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    
    console.log(`Webhook verification: mode=${mode}, token=${token}`);
    
    if (mode === "subscribe" && token && challenge) {
      const supabase = getSupabaseClient();
      
      // Verify token against account
      const { data: account } = await supabase
        .from("wpp_accounts")
        .select("webhook_verify_token")
        .eq("id", accountId)
        .single();
      
      if (account && account.webhook_verify_token === token) {
        console.log("Webhook verified successfully");
        return new Response(challenge, { status: 200 });
      }
    }
    
    return new Response("Verification failed", { status: 403 });
  }
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Handle webhook events (POST request)
  if (req.method === "POST") {
    try {
      const payload: WebhookPayload = await req.json();
      console.log("Received webhook:", JSON.stringify(payload, null, 2));
      
      if (payload.object !== "whatsapp_business_account") {
        return new Response("OK", { status: 200 });
      }
      
      const supabase = getSupabaseClient();
      
      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          if (change.field !== "messages") continue;
          
          const value = change.value;
          const phoneNumberId = value.metadata.phone_number_id;
          
          // Find account
          const account = await findWppAccount(supabase, phoneNumberId);
          if (!account) {
            console.error(`No account found for phone_number_id: ${phoneNumberId}`);
            continue;
          }
          
          // Process messages
          if (value.messages && value.contacts) {
            for (let i = 0; i < value.messages.length; i++) {
              const message = value.messages[i];
              const contact = value.contacts[i] || value.contacts[0];
              
              // Idempotency check
              const { data: existingMessage } = await supabase
                .from("wpp_messages")
                .select("id")
                .eq("message_id", message.id)
                .maybeSingle();
              
              if (existingMessage) {
                console.log(`Message ${message.id} already processed, skipping`);
                continue;
              }
              
              await processIncomingMessage(
                supabase,
                account,
                message,
                { name: contact.profile.name, wa_id: contact.wa_id }
              );
            }
          }
          
          // Process statuses
          if (value.statuses) {
            for (const status of value.statuses) {
              await processStatusUpdate(supabase, account, status);
            }
          }
        }
      }
      
      return new Response("OK", {
        status: 200,
        headers: corsHeaders,
      });
    } catch (error: any) {
      console.error("Webhook error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }
  
  return new Response("Method not allowed", { status: 405 });
});
