import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TELEGRAM_API_BASE = "https://api.telegram.org/bot";
const CHUNK_SIZE = 30; // Process 30 items per invocation

function isVideoUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes(".mp4") || lowerUrl.includes(".mov") || lowerUrl.includes(".webm") ||
         lowerUrl.includes(".avi") || lowerUrl.includes(".mkv") || lowerUrl.includes(".flv");
}

function encodeStoragePath(path: string): string {
  return path.split("/").map((part) => encodeURIComponent(part)).join("/");
}

function getFileExtension(url: string): string {
  const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/i);
  return match ? match[1].toLowerCase() : "jpg";
}

function getMimeType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    mp4: "video/mp4",
    mov: "video/quicktime",
    webm: "video/webm",
  };
  return mimeTypes[ext] || "application/octet-stream";
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

// Download and send via FormData (more reliable than URL)
async function downloadAndSendMedia(
  botToken: string,
  chatId: string,
  mediaUrl: string,
  caption?: string
): Promise<any> {
  const isVideo = isVideoUrl(mediaUrl);
  const ext = getFileExtension(mediaUrl);
  const mimeType = getMimeType(ext);
  const fileName = `media_${Date.now()}.${ext}`;

  const response = await fetch(mediaUrl);
  if (!response.ok) {
    throw new Error(`Failed to download media: ${response.status}`);
  }

  const fileBlob = await response.blob();
  
  let method = isVideo ? "sendVideo" : "sendPhoto";
  let fileField = isVideo ? "video" : "photo";

  const formData = new FormData();
  formData.append("chat_id", chatId);
  formData.append(fileField, new File([fileBlob], fileName, { type: mimeType }));

  if (caption) {
    formData.append("caption", caption);
    formData.append("parse_mode", "HTML");
  }

  if (isVideo) {
    formData.append("supports_streaming", "true");
  }

  const url = `${TELEGRAM_API_BASE}${botToken}/${method}`;

  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      const telegramResponse = await fetch(url, {
        method: "POST",
        body: formData,
      });

      const data = await telegramResponse.json();

      if (!data.ok) {
        if (data.error_code === 429) {
          const retryAfter = data.parameters?.retry_after || 30;
          console.log(`Rate limited, waiting ${retryAfter}s`);
          await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
          continue;
        }

        // Try as document if video/photo failed
        if (data.description?.includes("file is too big") || 
            data.description?.includes("video_file_invalid") ||
            data.description?.includes("PHOTO_INVALID_DIMENSIONS")) {
          console.log("Trying as document...");
          const docFormData = new FormData();
          docFormData.append("chat_id", chatId);
          docFormData.append("document", new File([fileBlob], fileName, { type: mimeType }));
          if (caption) {
            docFormData.append("caption", caption);
            docFormData.append("parse_mode", "HTML");
          }

          const docResponse = await fetch(`${TELEGRAM_API_BASE}${botToken}/sendDocument`, {
            method: "POST",
            body: docFormData,
          });
          const docData = await docResponse.json();
          if (docData.ok) return docData.result;
          throw new Error(docData.description || "Failed to send as document");
        }

        throw new Error(data.description || "Telegram API error");
      }

      return data.result;
    } catch (error: any) {
      if (attempt === 2) throw error;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
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
    // Use atomic lock to prevent concurrent processing
    const lockToken = crypto.randomUUID();
    const lockExpires = new Date(Date.now() + 120000).toISOString(); // 2 min lock
    const now = new Date().toISOString();

    // First, try to find an unlocked campaign (lock columns null)
    let targetCampaign: any = null;

    const { data: unlocked, error: unlockedError } = await supabase
      .from("campaigns")
      .select("*")
      .eq("status", "running")
      .or("runner_lock_token.is.null,runner_lock_expires_at.is.null")
      .order("updated_at", { ascending: true })
      .limit(1);

    if (unlockedError) {
      console.error("Error finding unlocked campaign:", unlockedError);
      return new Response(JSON.stringify({ error: unlockedError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (unlocked && unlocked.length > 0) {
      targetCampaign = unlocked[0];
    } else {
      // Then, try to find a campaign whose lock is expired
      const { data: expired, error: expiredError } = await supabase
        .from("campaigns")
        .select("*")
        .eq("status", "running")
        .lt("runner_lock_expires_at", now)
        .order("updated_at", { ascending: true })
        .limit(1);

      if (expiredError) {
        console.error("Error finding expired-lock campaign:", expiredError);
        return new Response(JSON.stringify({ error: expiredError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (expired && expired.length > 0) {
        targetCampaign = expired[0];
      }
    }

    if (!targetCampaign) {
      console.log("No running campaigns to process");
      return new Response(JSON.stringify({ message: "No campaigns to process" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found campaign ${targetCampaign.id}, attempting lock...`);

    // Atomically claim by updating only if lock conditions still match
    let claimQuery = supabase
      .from("campaigns")
      .update({
        runner_lock_token: lockToken,
        runner_lock_expires_at: lockExpires,
        updated_at: now,
      })
      .eq("id", targetCampaign.id)
      .eq("status", "running");

    if (targetCampaign.runner_lock_expires_at) {
      // If we picked it because it's expired, enforce that
      claimQuery = claimQuery.lt("runner_lock_expires_at", now);
    } else {
      // If we picked it because it's unlocked, enforce that
      claimQuery = claimQuery.or("runner_lock_token.is.null,runner_lock_expires_at.is.null");
    }

    const { data: campaigns, error: campError } = await claimQuery.select("*");

    if (campError) {
      console.error("Error claiming campaign:", campError);
      return new Response(JSON.stringify({ error: campError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!campaigns || campaigns.length === 0) {
      console.log("Campaign was claimed by another runner");
      return new Response(JSON.stringify({ message: "Campaign already being processed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Locked campaign ${targetCampaign.id} with token ${lockToken}`);

    const campaign = campaigns[0];
    const campaignId = campaign.id;
    const userId = campaign.user_id;
    const mediaPackId = campaign.media_pack_id;
    const delaySeconds = campaign.delay_seconds || 2;
    const packSize = campaign.pack_size || 1;
    const totalCount = campaign.total_count || 0;

    // Use atomic counter - first reserve the batch by incrementing sent_count
    const startOffset = campaign.sent_count || 0;
    const endOffset = Math.min(startOffset + CHUNK_SIZE, totalCount);
    const batchSize = endOffset - startOffset;

    console.log(`Processing campaign ${campaignId}: batch ${startOffset}-${endOffset} of ${totalCount}`);

    // Immediately update sent_count to reserve this batch (prevents duplicates)
    const { error: reserveError } = await supabase
      .from("campaigns")
      .update({ 
        sent_count: endOffset,
        updated_at: new Date().toISOString()
      })
      .eq("id", campaignId)
      .eq("runner_lock_token", lockToken);

    if (reserveError) {
      console.error("Error reserving batch:", reserveError);
      return new Response(JSON.stringify({ error: "Failed to reserve batch" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if already completed
    if (startOffset >= totalCount) {
      await supabase.from("campaigns").update({
        status: "completed",
        progress: 100,
        completed_at: new Date().toISOString(),
        runner_lock_token: null,
        runner_lock_expires_at: null,
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
        runner_lock_token: null,
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
        runner_lock_token: null,
      }).eq("id", campaignId);

      return new Response(JSON.stringify({ error: "No bot connected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const chatId = destination.chat_id;

    // Load media URLs for this batch
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
        const batchFiles = rawFiles.slice(startOffset, endOffset);

        for (const file of batchFiles) {
          const url = typeof file === "string" ? file : file.url;
          if (url) mediaUrls.push(url);
        }
      }
    } else {
      const { data: userFiles } = await supabase.storage
        .from("user-media")
        .list(userId, {
          limit: batchSize,
          offset: startOffset,
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
        runner_lock_token: null,
      }).eq("id", campaignId);

      console.log(`Campaign ${campaignId} completed (no more media)`);
      return new Response(JSON.stringify({ message: "Campaign completed", campaignId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Loaded ${mediaUrls.length} URLs for batch ${startOffset}-${endOffset}`);

    // Process media
    let successCount = campaign.success_count || 0;
    let errorCount = campaign.error_count || 0;
    const errorsLog: any[] = Array.isArray(campaign.errors_log) ? campaign.errors_log.slice(-50) : [];
    const sendTimes: number[] = [];

    const caption = startOffset === 0 ? campaign.caption : null;

    // Process in packs
    const chunks: string[][] = [];
    for (let i = 0; i < mediaUrls.length; i += packSize) {
      chunks.push(mediaUrls.slice(i, i + packSize));
    }

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];
      const startTime = Date.now();
      const captionForChunk = chunkIndex === 0 ? caption : null;

      for (let i = 0; i < chunk.length; i++) {
        try {
          await downloadAndSendMedia(
            botToken,
            chatId,
            chunk[i],
            i === 0 ? (captionForChunk || undefined) : undefined
          );
          successCount++;
        } catch (error: any) {
          console.error(`Error sending item ${startOffset + chunkIndex * packSize + i}:`, error.message);
          errorCount++;
          errorsLog.push({
            index: startOffset + chunkIndex * packSize + i,
            url: chunk[i].substring(0, 80),
            error: String(error.message).substring(0, 100),
            timestamp: new Date().toISOString(),
          });
        }

        // Small delay between items
        if (i < chunk.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
      }

      const endTime = Date.now();
      sendTimes.push(endTime - startTime);

      // Delay between chunks
      if (chunkIndex < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
      }

      // Update progress in real-time after each chunk
      const currentProgress = Math.min(100, Math.round((endOffset / totalCount) * 100));
      await supabase.from("campaigns").update({
        success_count: successCount,
        error_count: errorCount,
        errors_log: errorsLog.slice(-50),
        progress: currentProgress,
      }).eq("id", campaignId).eq("runner_lock_token", lockToken);
    }

    // Final update
    const progress = Math.min(100, Math.round((endOffset / totalCount) * 100));
    const avgSendTime = sendTimes.length > 0 
      ? Math.round(sendTimes.reduce((a, b) => a + b, 0) / sendTimes.length)
      : campaign.avg_send_time_ms || 0;

    const isComplete = endOffset >= totalCount;

    await supabase.from("campaigns").update({
      success_count: successCount,
      error_count: errorCount,
      errors_log: errorsLog.slice(-50),
      progress,
      avg_send_time_ms: avgSendTime,
      status: isComplete ? "completed" : "running",
      completed_at: isComplete ? new Date().toISOString() : null,
      runner_lock_token: null,
      runner_lock_expires_at: null,
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

    console.log(`Campaign ${campaignId} batch done: ${progress}% (${endOffset}/${totalCount})`);

    // Self-invoke immediately if there's more work
    if (!isComplete) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

      // Non-blocking invoke
      fetch(`${supabaseUrl}/functions/v1/campaign-runner`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({ trigger: "self-invoke" }),
      }).catch(() => {});
    }

    return new Response(JSON.stringify({
      success: true,
      campaignId,
      progress,
      sentCount: endOffset,
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
