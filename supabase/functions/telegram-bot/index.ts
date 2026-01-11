import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TelegramRequest {
  action?:
    | "ping"
    | "validate"
    | "getMe"
    | "sendMessage"
    | "getUpdates"
    | "sendPhoto"
    | "sendVideo"
    | "sendMediaGroup"
    | "getChats";
  botToken?: string;
  chatId?: string;
  message?: string;
  mediaUrl?: string;
  mediaType?: "photo" | "video";
  mediaGroup?: Array<{ type: string; media: string; caption?: string }>;
  // health-check payloads
  ping?: boolean;
  test?: boolean;
}

const TELEGRAM_API_BASE = "https://api.telegram.org/bot";

async function callTelegramAPI(
  botToken: string,
  method: string,
  params?: Record<string, any>,
) {
  const url = `${TELEGRAM_API_BASE}${botToken}/${method}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: params ? JSON.stringify(params) : undefined,
  });

  const data = await response.json();
  console.log(`Telegram API ${method} response:`, data);

  if (!data.ok) {
    throw new Error(data.description || "Telegram API error");
  }

  return data.result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Get the auth user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let body: TelegramRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Health check path (used by admin T.I. tests)
    if (body?.ping || body?.action === "ping") {
      return new Response(
        JSON.stringify({ success: true, data: { ok: true, service: "telegram-bot" } }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { action, botToken, chatId, message, mediaUrl, mediaType, mediaGroup } = body;

    if (!action) {
      return new Response(JSON.stringify({ error: "Missing action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!botToken) {
      return new Response(JSON.stringify({ error: "Missing botToken" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Telegram bot action: ${action} for user: ${user.id}`);

    let result;

    switch (action) {
      case "validate":
      case "getMe": {
        result = await callTelegramAPI(botToken, "getMe");
        break;
      }

      case "getUpdates": {
        // Delete webhook first to allow getUpdates
        await callTelegramAPI(botToken, "deleteWebhook").catch(() => {});
        result = await callTelegramAPI(botToken, "getUpdates", {
          offset: -10,
          limit: 100,
        });
        break;
      }

      case "getChats": {
        // Delete webhook first to allow getUpdates
        await callTelegramAPI(botToken, "deleteWebhook").catch(() => {});
        // Get updates to find chats the bot is in
        const updates = await callTelegramAPI(botToken, "getUpdates", {
          offset: -100,
          limit: 100,
        });
        
        // Extract unique chats from updates
        const chatsMap = new Map();
        for (const update of updates) {
          const chat = update.message?.chat || update.channel_post?.chat;
          if (chat && (chat.type === "group" || chat.type === "supergroup" || chat.type === "channel")) {
            chatsMap.set(chat.id, {
              id: chat.id,
              title: chat.title,
              type: chat.type,
              username: chat.username,
            });
          }
        }
        
        result = Array.from(chatsMap.values());
        break;
      }

      case "sendMessage": {
        if (!chatId || !message) {
          throw new Error("chatId and message are required for sendMessage");
        }
        result = await callTelegramAPI(botToken, "sendMessage", {
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
        });
        
      // Log the event
      await supabaseClient.from("user_events").insert({
        user_id: user.id,
        event_type: "telegram_message_sent",
        event_data: { chat_id: chatId, message_length: message.length },
      });
      
      // Update metrics - increment total_actions
      try {
        const { data: currentMetrics } = await supabaseClient
          .from("user_metrics")
          .select("total_actions")
          .eq("user_id", user.id)
          .single();
        
        await supabaseClient
          .from("user_metrics")
          .update({ 
            total_actions: (currentMetrics?.total_actions || 0) + 1,
            last_activity_at: new Date().toISOString() 
          })
          .eq("user_id", user.id);
      } catch (e) {
        console.log("Metrics update failed, skipping:", e);
      }
        
        break;
      }

      case "sendPhoto": {
        if (!chatId || !mediaUrl) {
          throw new Error("chatId and mediaUrl are required for sendPhoto");
        }
        result = await callTelegramAPI(botToken, "sendPhoto", {
          chat_id: chatId,
          photo: mediaUrl,
          caption: message || "",
          parse_mode: "HTML",
        });
        
        await supabaseClient.from("user_events").insert({
          user_id: user.id,
          event_type: "telegram_photo_sent",
          event_data: { chat_id: chatId },
        });
        break;
      }

      case "sendVideo": {
        if (!chatId || !mediaUrl) {
          throw new Error("chatId and mediaUrl are required for sendVideo");
        }
        result = await callTelegramAPI(botToken, "sendVideo", {
          chat_id: chatId,
          video: mediaUrl,
          caption: message || "",
          parse_mode: "HTML",
        });
        
        await supabaseClient.from("user_events").insert({
          user_id: user.id,
          event_type: "telegram_video_sent",
          event_data: { chat_id: chatId },
        });
        break;
      }

      case "sendMediaGroup": {
        if (!chatId || !mediaGroup || mediaGroup.length === 0) {
          throw new Error("chatId and mediaGroup are required for sendMediaGroup");
        }
        result = await callTelegramAPI(botToken, "sendMediaGroup", {
          chat_id: chatId,
          media: mediaGroup,
        });
        
        await supabaseClient.from("user_events").insert({
          user_id: user.id,
          event_type: "telegram_media_group_sent",
          event_data: { chat_id: chatId, media_count: mediaGroup.length },
        });
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in telegram-bot:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
