import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const EdgeRuntime: {
  waitUntil(promise: Promise<any>): void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TELEGRAM_API_BASE = "https://api.telegram.org/bot";

interface DispatchRequest {
  campaignId: string;
}

async function callTelegramAPI(botToken: string, method: string, params?: Record<string, any>) {
  const url = `${TELEGRAM_API_BASE}${botToken}/${method}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: params ? JSON.stringify(params) : undefined,
  });
  
  const data = await response.json();
  console.log(`Telegram API ${method} response:`, JSON.stringify(data).substring(0, 500));
  
  if (!data.ok) {
    throw new Error(data.description || "Telegram API error");
  }
  
  return data.result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
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

    const body: DispatchRequest = await req.json();
    const { campaignId } = body;

    console.log(`Starting campaign dispatch: ${campaignId} for user: ${user.id}`);

    // Get campaign details
    const { data: campaign, error: campError } = await supabaseClient
      .from("campaigns")
      .select("*")
      .eq("id", campaignId)
      .eq("user_id", user.id)
      .single();

    if (campError || !campaign) {
      console.error("Campaign not found:", campError);
      return new Response(JSON.stringify({ error: "Campanha não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get media pack
    const { data: mediaPack, error: mediaError } = await supabaseClient
      .from("admin_media")
      .select("*")
      .eq("id", campaign.media_pack_id)
      .single();

    if (mediaError || !mediaPack) {
      console.error("Media pack not found:", mediaError);
      await supabaseClient.from("campaigns").update({
        status: "failed",
        error_message: "Pacote de mídia não encontrado",
      }).eq("id", campaignId);
      
      return new Response(JSON.stringify({ error: "Pacote de mídia não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get destination
    const { data: destination, error: destError } = await supabaseClient
      .from("destinations")
      .select("*")
      .eq("id", campaign.destination_id)
      .single();

    if (destError || !destination || !destination.chat_id) {
      console.error("Destination not found:", destError);
      await supabaseClient.from("campaigns").update({
        status: "failed",
        error_message: "Destino não encontrado ou sem chat_id",
      }).eq("id", campaignId);
      
      return new Response(JSON.stringify({ error: "Destino não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get telegram integration - first from destination, then any connected bot
    let telegramIntegration = null;
    
    if (destination.telegram_integration_id) {
      const { data: integration } = await supabaseClient
        .from("telegram_integrations")
        .select("id, bot_token, chat_id")
        .eq("id", destination.telegram_integration_id)
        .single();
      telegramIntegration = integration;
    }
    
    if (!telegramIntegration) {
      const { data: integrations } = await supabaseClient
        .from("telegram_integrations")
        .select("id, bot_token, chat_id")
        .eq("user_id", user.id)
        .eq("is_connected", true)
        .limit(1);
      
      if (integrations && integrations.length > 0) {
        telegramIntegration = integrations[0];
      }
    }

    if (!telegramIntegration?.bot_token) {
      console.error("No connected bot found for user:", user.id);
      await supabaseClient.from("campaigns").update({
        status: "failed",
        error_message: "Nenhum bot conectado encontrado",
      }).eq("id", campaignId);
      
      return new Response(JSON.stringify({ error: "Nenhum bot conectado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract media URLs
    const rawMediaFiles = mediaPack.media_files as (string | { url: string; type?: string; name?: string })[] || [];
    const mediaUrls = rawMediaFiles.map((file: string | { url: string }) => {
      if (typeof file === 'string') return file;
      return file.url;
    }).filter(Boolean);

    if (mediaUrls.length === 0) {
      console.error("No media files in pack");
      await supabaseClient.from("campaigns").update({
        status: "failed",
        error_message: "Pacote de mídia sem arquivos",
      }).eq("id", campaignId);
      
      return new Response(JSON.stringify({ error: "Pacote sem arquivos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Dispatching ${mediaUrls.length} media files to chat ${destination.chat_id}`);

    // Return response immediately and continue processing in background
    EdgeRuntime.waitUntil(dispatchMediaInBackground(
      supabaseClient,
      campaignId,
      mediaUrls,
      telegramIntegration.bot_token,
      destination.chat_id,
      campaign.delay_seconds || 10,
      campaign.caption,
      user.id
    ));

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Iniciando envio de ${mediaUrls.length} mídias`,
      total: mediaUrls.length 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in campaign-dispatch:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function dispatchMediaInBackground(
  supabase: any,
  campaignId: string,
  mediaFiles: string[],
  botToken: string,
  chatId: string,
  delaySeconds: number,
  caption: string | null,
  userId: string
) {
  let sentCount = 0;
  let successCount = 0;
  let errorCount = 0;
  const errorsLog: { index: number; url: string; error: string; timestamp: string }[] = [];
  const sendTimes: number[] = [];

  console.log(`Background dispatch started for campaign ${campaignId} with ${mediaFiles.length} files`);

  for (let i = 0; i < mediaFiles.length; i++) {
    // Check if campaign is still running
    const { data: currentCampaign } = await supabase
      .from("campaigns")
      .select("status")
      .eq("id", campaignId)
      .single();
    
    if (currentCampaign?.status !== "running") {
      console.log(`Campaign ${campaignId} stopped (status: ${currentCampaign?.status}), aborting dispatch at ${i}/${mediaFiles.length}`);
      break;
    }

    const mediaUrl = mediaFiles[i];
    const isVideo = mediaUrl.toLowerCase().includes(".mp4") || 
                    mediaUrl.toLowerCase().includes(".mov") || 
                    mediaUrl.toLowerCase().includes(".webm") ||
                    mediaUrl.toLowerCase().includes(".avi");
    
    const startTime = Date.now();
    
    try {
      console.log(`Sending media ${i + 1}/${mediaFiles.length}: ${mediaUrl.substring(0, 100)}...`);
      
      const method = isVideo ? "sendVideo" : "sendPhoto";
      const params: Record<string, any> = {
        chat_id: chatId,
        [isVideo ? "video" : "photo"]: mediaUrl,
        parse_mode: "HTML",
      };
      
      // Only add caption to first media
      if (i === 0 && caption) {
        params.caption = caption;
      }

      await callTelegramAPI(botToken, method, params);
      
      const endTime = Date.now();
      sendTimes.push(endTime - startTime);
      
      sentCount++;
      successCount++;
      console.log(`Successfully sent media ${i + 1}/${mediaFiles.length}`);

    } catch (error: any) {
      console.error(`Error sending media ${i + 1}:`, error.message);
      errorCount++;
      errorsLog.push({
        index: i,
        url: mediaUrl.substring(0, 100),
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      sentCount++; // Count as processed even if failed
    }

    // Calculate average send time
    const avgSendTime = sendTimes.length > 0 
      ? Math.round(sendTimes.reduce((a, b) => a + b, 0) / sendTimes.length)
      : 0;

    // Update progress in database
    const progress = Math.round(((i + 1) / mediaFiles.length) * 100);
    await supabase.from("campaigns").update({
      sent_count: sentCount,
      progress,
      success_count: successCount,
      error_count: errorCount,
      errors_log: errorsLog,
      avg_send_time_ms: avgSendTime,
    }).eq("id", campaignId);

    console.log(`Progress: ${progress}% (${sentCount}/${mediaFiles.length})`);

    // Wait for delay before next send (if not last item)
    if (i < mediaFiles.length - 1) {
      console.log(`Waiting ${delaySeconds} seconds before next send...`);
      await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
    }
  }

  // Mark campaign as completed
  const finalStatus = errorCount === mediaFiles.length ? "failed" : "completed";
  const avgSendTime = sendTimes.length > 0 
    ? Math.round(sendTimes.reduce((a, b) => a + b, 0) / sendTimes.length)
    : 0;

  await supabase.from("campaigns").update({
    status: finalStatus,
    completed_at: new Date().toISOString(),
    progress: 100,
    success_count: successCount,
    error_count: errorCount,
    errors_log: errorsLog,
    avg_send_time_ms: avgSendTime,
    error_message: errorCount > 0 ? `${errorCount} erros durante o envio` : null,
  }).eq("id", campaignId);

  // Update user metrics
  try {
    const { data: currentMetrics } = await supabase
      .from("user_metrics")
      .select("media_sent, total_actions")
      .eq("user_id", userId)
      .single();
    
    await supabase
      .from("user_metrics")
      .update({ 
        media_sent: (currentMetrics?.media_sent || 0) + successCount,
        total_actions: (currentMetrics?.total_actions || 0) + 1,
        last_activity_at: new Date().toISOString() 
      })
      .eq("user_id", userId);
  } catch (e) {
    console.log("Metrics update failed, skipping:", e);
  }

  console.log(`Campaign ${campaignId} completed: ${successCount} sent, ${errorCount} errors`);
}
