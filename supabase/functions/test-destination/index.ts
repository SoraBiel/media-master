import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TELEGRAM_API_BASE = "https://api.telegram.org/bot";

interface TestResult {
  success: boolean;
  error?: string;
  botInfo?: {
    username: string;
    can_send_messages: boolean;
    can_send_media: boolean;
  };
  chatInfo?: {
    title: string;
    type: string;
    members_count?: number;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { destinationId } = await req.json();

    if (!destinationId) {
      return new Response(JSON.stringify({ error: "destinationId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get destination
    const { data: destination, error: destError } = await supabase
      .from("destinations")
      .select("*")
      .eq("id", destinationId)
      .eq("user_id", user.id)
      .single();

    if (destError || !destination) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Destino não encontrado" 
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get bot token
    let botToken: string | null = null;

    if (destination.telegram_integration_id) {
      const { data: integration } = await supabase
        .from("telegram_integrations")
        .select("bot_token, bot_username")
        .eq("id", destination.telegram_integration_id)
        .single();
      botToken = integration?.bot_token || null;
    }

    if (!botToken) {
      const { data: integrations } = await supabase
        .from("telegram_integrations")
        .select("bot_token, bot_username")
        .eq("user_id", user.id)
        .eq("is_connected", true)
        .limit(1);
      botToken = integrations?.[0]?.bot_token || null;
    }

    if (!botToken) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Nenhum bot conectado. Adicione um bot primeiro na aba 'Bots'." 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const chatId = destination.chat_id;
    const result: TestResult = { success: false };

    // Step 1: Validate bot token
    console.log("Testing bot token...");
    const getMeRes = await fetch(`${TELEGRAM_API_BASE}${botToken}/getMe`);
    const getMeData = await getMeRes.json();

    if (!getMeData.ok) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Token do bot inválido: ${getMeData.description || "erro desconhecido"}` 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    result.botInfo = {
      username: getMeData.result.username,
      can_send_messages: true,
      can_send_media: true,
    };

    // Step 2: Try to get chat info
    console.log(`Testing chat access for ${chatId}...`);
    const getChatRes = await fetch(`${TELEGRAM_API_BASE}${botToken}/getChat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId }),
    });
    const getChatData = await getChatRes.json();

    if (!getChatData.ok) {
      const errorMsg = getChatData.description || "Erro desconhecido";
      let friendlyError = errorMsg;

      if (errorMsg.includes("chat not found")) {
        friendlyError = "Chat não encontrado. Verifique se o Chat ID está correto e se o bot foi adicionado ao grupo/canal.";
      } else if (errorMsg.includes("bot is not a member")) {
        friendlyError = "O bot não é membro deste grupo/canal. Adicione o bot como administrador.";
      } else if (errorMsg.includes("Forbidden")) {
        friendlyError = "O bot não tem permissão para acessar este chat. Verifique se ele foi adicionado como administrador.";
      }

      return new Response(JSON.stringify({ 
        success: false, 
        error: friendlyError,
        botInfo: result.botInfo,
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    result.chatInfo = {
      title: getChatData.result.title || getChatData.result.first_name || "Chat",
      type: getChatData.result.type,
    };

    // Step 3: Check bot permissions in chat (for groups/channels)
    if (["group", "supergroup", "channel"].includes(getChatData.result.type)) {
      console.log("Checking bot permissions...");
      const getChatMemberRes = await fetch(`${TELEGRAM_API_BASE}${botToken}/getChatMember`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          chat_id: chatId, 
          user_id: getMeData.result.id 
        }),
      });
      const getChatMemberData = await getChatMemberRes.json();

      if (getChatMemberData.ok) {
        const member = getChatMemberData.result;
        const status = member.status;

        if (status === "left" || status === "kicked") {
          return new Response(JSON.stringify({ 
            success: false, 
            error: "O bot foi removido deste grupo/canal. Adicione-o novamente como administrador.",
            botInfo: result.botInfo,
            chatInfo: result.chatInfo,
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Check if bot can post messages
        const canPost = status === "administrator" || status === "creator" || 
                       (status === "member" && getChatData.result.type !== "channel");

        if (!canPost) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: getChatData.result.type === "channel" 
              ? "O bot precisa ser administrador do canal para enviar mensagens."
              : "O bot não tem permissão para enviar mensagens neste grupo.",
            botInfo: result.botInfo,
            chatInfo: result.chatInfo,
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Check specific permissions for admins
        if (status === "administrator") {
          result.botInfo.can_send_messages = member.can_post_messages !== false;
          result.botInfo.can_send_media = member.can_send_media_messages !== false;

          if (!result.botInfo.can_send_messages) {
            return new Response(JSON.stringify({ 
              success: false, 
              error: "O bot não tem permissão para postar mensagens. Ative 'Post Messages' nas configurações do administrador.",
              botInfo: result.botInfo,
              chatInfo: result.chatInfo,
            }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      }
    }

    // Step 4: Send a test message
    console.log("Sending test message...");
    const testMessage = `✅ Teste de conexão bem-sucedido!\n\n📍 Destino: ${destination.name}\n🤖 Bot: @${result.botInfo.username}\n⏰ ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`;

    const sendRes = await fetch(`${TELEGRAM_API_BASE}${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: testMessage,
        parse_mode: "HTML",
      }),
    });
    const sendData = await sendRes.json();

    if (!sendData.ok) {
      const errorMsg = sendData.description || "Erro ao enviar mensagem";
      let friendlyError = errorMsg;

      if (errorMsg.includes("not enough rights")) {
        friendlyError = "O bot não tem permissões suficientes. Verifique se ele é administrador com permissão de enviar mensagens.";
      } else if (errorMsg.includes("CHAT_WRITE_FORBIDDEN")) {
        friendlyError = "O bot não pode escrever neste chat. Verifique as permissões de administrador.";
      }

      return new Response(JSON.stringify({ 
        success: false, 
        error: friendlyError,
        botInfo: result.botInfo,
        chatInfo: result.chatInfo,
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update destination status to verified
    await supabase
      .from("destinations")
      .update({ 
        status: "verified",
        chat_title: result.chatInfo.title,
        chat_type: result.chatInfo.type,
        updated_at: new Date().toISOString(),
      })
      .eq("id", destinationId);

    result.success = true;

    console.log(`Test successful for destination ${destinationId}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Test destination error:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || "Erro interno" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
