import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TELEGRAM_API_BASE = "https://api.telegram.org/bot";
const CHUNK_SIZE = 30; // Process 30 items per invocation to keep execution short

function isVideoUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes(".mp4") || lowerUrl.includes(".mov") || lowerUrl.includes(".webm") ||
         lowerUrl.includes(".avi") || lowerUrl.includes(".mkv") || lowerUrl.includes(".flv");
}

function encodeStoragePath(path: string): string {
  return path.split("/").map((part) => encodeURIComponent(part)).join("/");
}

function maybeForceDownload(url: string): string {
  if (url.includes("/storage/v1/object/public/") && !url.includes("download=")) {
    return `${url}${url.includes("?") ? "&" : "?"}download=1`;
  }
  return url;
}

async function telegramPostJson(botToken: string, method: string, payload: Record<string, any>): Promise<any> {
  const url = `${TELEGRAM_API_BASE}${botToken}/${method}`;

  for (let attempt = 0; attempt <= 2; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);

    if (!data?.ok) {
      const errorCode = data?.error_code;
      const description = data?.description || `Telegram API error (HTTP ${res.status})`;

      if (errorCode === 429) {
        const retryAfter = data?.parameters?.retry_after || 30;
        console.log(`Rate limited, waiting ${retryAfter}s`);
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
        continue;
      }

      throw new Error(description);
    }

    return data.result;
  }

  throw new Error("Telegram API retry limit reached");
}

async function sendMediaByUrl(
  botToken: string,
  chatId: string,
  mediaUrl: string,
  caption?: string,
  sendMode: string = "media"
): Promise<any> {
  const url = maybeForceDownload(mediaUrl);
  const isVideo = isVideoUrl(url);

  if (sendMode === "document") {
    return telegramPostJson(botToken, "sendDocument", {
      chat_id: chatId,
      document: url,
      caption,
      parse_mode: caption ? "HTML" : undefined,
      disable_content_type_detection: true,
    });
  }

  if (!isVideo) {
    try {
      return await telegramPostJson(botToken, "sendPhoto", {
        chat_id: chatId,
        photo: url,
        caption,
        parse_mode: caption ? "HTML" : undefined,
      });
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (
        msg.toLowerCase().includes("wrong type of the web page content") ||
        msg.toLowerCase().includes("failed to get http url content") ||
        msg.includes("WEBPAGE_CURL_FAILED")
      ) {
        return telegramPostJson(botToken, "sendDocument", {
          chat_id: chatId,
          document: url,
          caption,
          parse_mode: caption ? "HTML" : undefined,
          disable_content_type_detection: true,
        });
      }
      throw e;
    }
  }

  try {
    return await telegramPostJson(botToken, "sendVideo", {
      chat_id: chatId,
      video: url,
      caption,
      parse_mode: caption ? "HTML" : undefined,
      supports_streaming: true,
    });
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (
      msg.includes("WEBPAGE_CURL_FAILED") ||
      msg.toLowerCase().includes("failed to get http url content") ||
      msg.toLowerCase().includes("wrong type of the web page content") ||
      msg.toLowerCase().includes("file is too big") ||
      msg.toLowerCase().includes("video_file_invalid")
    ) {
      return telegramPostJson(botToken, "sendDocument", {
        chat_id: chatId,
        document: url,
        caption,
        parse_mode: caption ? "HTML" : undefined,
        disable_content_type_detection: true,
      });
    }
    throw e;
  }
}

async function sendMediaGroupByUrl(
  botToken: string,
  chatId: string,
  mediaUrls: string[],
  caption?: string
): Promise<any> {
  const media = mediaUrls
    .slice(0, 10)
    .map((rawUrl, idx) => {
      const url = maybeForceDownload(rawUrl);
      const isVideo = isVideoUrl(url);
      return {
        type: isVideo ? "video" : "photo",
        media: url,
        caption: idx === 0 ? caption : undefined,
        parse_mode: idx === 0 && caption ? "HTML" : undefined,
      };
    });

  return telegramPostJson(botToken, "sendMediaGroup", {
    chat_id: chatId,
    media: JSON.stringify(media),
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Find campaigns that need processing
    const { data: campaigns, error: campError } = await supabase
      .from("campaigns")
      .select("*")
      .eq("status", "running")
      .order("updated_at", { ascending: true })
      .limit(1);

    if (campError) {
      console.error("Error fetching campaigns:", campError);
      return new Response(JSON.stringify({ error: campError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!campaigns || campaigns.length === 0) {
      console.log("No running campaigns found");
      return new Response(JSON.stringify({ message: "No campaigns to process" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const campaign = campaigns[0];
    const campaignId = campaign.id;
    const userId = campaign.user_id;
    const mediaPackId = campaign.media_pack_id;
    const delaySeconds = campaign.delay_seconds || 10;
    const packSize = campaign.pack_size || 1;
    const sendMode = campaign.send_mode || "media";
    const totalCount = campaign.total_count || 0;

    let sentCount = campaign.sent_count || 0;
    let successCount = campaign.success_count || 0;
    let errorCount = campaign.error_count || 0;
    const errorsLog: any[] = Array.isArray(campaign.errors_log) ? campaign.errors_log.slice(-100) : [];
    const sendTimes: number[] = [];

    console.log(`Processing campaign ${campaignId}: ${sentCount}/${totalCount} sent`);

    // Check if already completed
    if (sentCount >= totalCount) {
      await supabase.from("campaigns").update({
        status: "completed",
        progress: 100,
        completed_at: new Date().toISOString(),
      }).eq("id", campaignId);

      console.log(`Campaign ${campaignId} completed`);
      return new Response(JSON.stringify({ message: "Campaign completed", campaignId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get destination
    const { data: destination } = await supabase
      .from("destinations")
      .select("*")
      .eq("id", campaign.destination_id)
      .single();

    if (!destination?.chat_id) {
      await supabase.from("campaigns").update({
        status: "failed",
        error_message: "Destino não encontrado",
      }).eq("id", campaignId);

      return new Response(JSON.stringify({ error: "Destination not found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get bot token
    let botToken: string | null = null;

    if (destination.telegram_integration_id) {
      const { data: integration } = await supabase
        .from("telegram_integrations")
        .select("bot_token")
        .eq("id", destination.telegram_integration_id)
        .single();
      botToken = integration?.bot_token || null;
    }

    if (!botToken) {
      const { data: integrations } = await supabase
        .from("telegram_integrations")
        .select("bot_token")
        .eq("user_id", userId)
        .eq("is_connected", true)
        .limit(1);
      botToken = integrations?.[0]?.bot_token || null;
    }

    if (!botToken) {
      await supabase.from("campaigns").update({
        status: "failed",
        error_message: "Nenhum bot conectado",
      }).eq("id", campaignId);

      return new Response(JSON.stringify({ error: "No bot connected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const chatId = destination.chat_id;

    // Load media URLs for this chunk
    const offset = sentCount;
    const mediaUrls: string[] = [];
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";

    if (mediaPackId) {
      const { data: mediaPack } = await supabase
        .from("admin_media")
        .select("media_files")
        .eq("id", mediaPackId)
        .single();

      if (mediaPack?.media_files) {
        const rawFiles = mediaPack.media_files as (string | { url: string })[];
        const batchFiles = rawFiles.slice(offset, offset + CHUNK_SIZE);

        for (const file of batchFiles) {
          const url = typeof file === "string" ? file : file.url;
          if (url) mediaUrls.push(url);
        }
      }
    } else {
      const { data: userFiles } = await supabase.storage
        .from("user-media")
        .list(userId, {
          limit: CHUNK_SIZE,
          offset: offset,
          sortBy: { column: "created_at", order: "desc" },
        });

      const validFiles = (userFiles || []).filter(f => 
        f.name !== ".emptyFolderPlaceholder" && !f.name.startsWith(".")
      );

      for (const file of validFiles) {
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/user-media/${userId}/${encodeStoragePath(file.name)}`;
        mediaUrls.push(publicUrl);
      }
    }

    if (mediaUrls.length === 0) {
      // No more media, mark as completed
      await supabase.from("campaigns").update({
        status: "completed",
        progress: 100,
        completed_at: new Date().toISOString(),
      }).eq("id", campaignId);

      console.log(`Campaign ${campaignId} completed (no more media)`);
      return new Response(JSON.stringify({ message: "Campaign completed", campaignId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Loaded ${mediaUrls.length} URLs for chunk starting at ${offset}`);

    // Process media in packs
    const chunks: string[][] = [];
    for (let i = 0; i < mediaUrls.length; i += packSize) {
      chunks.push(mediaUrls.slice(i, i + packSize));
    }

    const caption = sentCount === 0 ? campaign.caption : null;

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];
      const startTime = Date.now();
      const captionForChunk = chunkIndex === 0 ? caption : null;

      try {
        const hasVideo = chunk.some((u) => isVideoUrl(u));

        if (hasVideo || sendMode === "document" || chunk.length === 1) {
          // Send one by one for videos, documents, or single items
          for (let i = 0; i < chunk.length; i++) {
            try {
              await sendMediaByUrl(
                botToken,
                chatId,
                chunk[i],
                i === 0 ? (captionForChunk || undefined) : undefined,
                hasVideo || sendMode === "document" ? sendMode : "media"
              );
              sentCount++;
              successCount++;
            } catch (innerError: any) {
              console.error(`Error sending item:`, innerError.message);
              errorCount++;
              errorsLog.push({
                index: offset + chunkIndex * packSize + i,
                url: chunk[i].substring(0, 100),
                error: String(innerError.message),
                timestamp: new Date().toISOString(),
              });
              sentCount++;
            }
            if (i < chunk.length - 1) {
              await new Promise((resolve) => setTimeout(resolve, 1200));
            }
          }
        } else if (chunk.length <= 10) {
          // Send as album
          try {
            await sendMediaGroupByUrl(botToken, chatId, chunk, captionForChunk || undefined);
            sentCount += chunk.length;
            successCount += chunk.length;
          } catch (albumError: any) {
            console.error(`Album failed, sending individually:`, albumError.message);
            // Fallback to individual
            for (let i = 0; i < chunk.length; i++) {
              try {
                await sendMediaByUrl(botToken, chatId, chunk[i], undefined, sendMode);
                sentCount++;
                successCount++;
              } catch (innerError: any) {
                errorCount++;
                errorsLog.push({
                  index: offset + chunkIndex * packSize + i,
                  url: chunk[i].substring(0, 100),
                  error: String(innerError.message),
                  timestamp: new Date().toISOString(),
                });
                sentCount++;
              }
              await new Promise((resolve) => setTimeout(resolve, 800));
            }
          }
        }

        const endTime = Date.now();
        sendTimes.push(endTime - startTime);

      } catch (error: any) {
        console.error(`Error processing chunk:`, error.message);
        // Mark items as errors but continue
        for (let i = 0; i < chunk.length; i++) {
          errorCount++;
          errorsLog.push({
            index: offset + chunkIndex * packSize + i,
            url: chunk[i].substring(0, 100),
            error: String(error.message),
            timestamp: new Date().toISOString(),
          });
          sentCount++;
        }
      }

      // Delay between chunks
      if (chunkIndex < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
      }
    }

    // Update campaign progress
    const progress = Math.min(100, Math.round((sentCount / totalCount) * 100));
    const avgSendTime = sendTimes.length > 0 
      ? Math.round(sendTimes.reduce((a, b) => a + b, 0) / sendTimes.length)
      : campaign.avg_send_time_ms || 0;

    const isComplete = sentCount >= totalCount;

    await supabase.from("campaigns").update({
      sent_count: sentCount,
      success_count: successCount,
      error_count: errorCount,
      errors_log: errorsLog.slice(-100),
      progress,
      avg_send_time_ms: avgSendTime,
      status: isComplete ? "completed" : "running",
      completed_at: isComplete ? new Date().toISOString() : null,
      error_message: errorCount > 0 ? `${errorCount} erros durante o envio` : null,
    }).eq("id", campaignId);

    // Update user metrics if completed
    if (isComplete) {
      try {
        const { data: metrics } = await supabase
          .from("user_metrics")
          .select("media_sent, total_actions")
          .eq("user_id", userId)
          .single();

        await supabase.from("user_metrics").update({
          media_sent: (metrics?.media_sent || 0) + successCount,
          total_actions: (metrics?.total_actions || 0) + 1,
          last_activity_at: new Date().toISOString(),
        }).eq("user_id", userId);
      } catch {
        console.log("Metrics update failed, skipping");
      }
    }

    console.log(`Campaign ${campaignId} progress: ${progress}% (${sentCount}/${totalCount})`);

    // Self-invoke if there's more work to do (job runner pattern)
    if (!isComplete) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

      // Schedule next run in 2 seconds (non-blocking)
      setTimeout(async () => {
        try {
          await fetch(`${supabaseUrl}/functions/v1/campaign-runner`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({ trigger: "self-invoke" }),
          });
        } catch (e) {
          console.log("Self-invoke failed, will be picked up by cron:", e);
        }
      }, 2000);
    }

    return new Response(JSON.stringify({
      success: true,
      campaignId,
      progress,
      sentCount,
      totalCount,
      isComplete,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in campaign-runner:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
