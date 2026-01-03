import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TELEGRAM_API_BASE = "https://api.telegram.org/bot";
const CHUNK_SIZE = 50; // Process 50 items per invocation
const MAX_FILE_SIZE = 45 * 1024 * 1024; // 45MB - Telegram limit is 50MB
const PARALLEL_SENDS = 10; // Send 10 items in parallel for faster processing
const MIN_DELAY_MS = 1; // Minimum 1ms delay for "turbo" mode

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

// Try sending via URL first (much faster), fallback to download
async function sendMediaSmart(
  botToken: string,
  chatId: string,
  mediaUrl: string,
  caption?: string
): Promise<any> {
  const isVideo = isVideoUrl(mediaUrl);
  
  // First attempt: Send via URL (fastest)
  try {
    const method = isVideo ? "sendVideo" : "sendPhoto";
    const payload: Record<string, any> = {
      chat_id: chatId,
      [isVideo ? "video" : "photo"]: mediaUrl,
    };
    
    if (caption) {
      payload.caption = caption;
      payload.parse_mode = "HTML";
    }
    
    if (isVideo) {
      payload.supports_streaming = true;
    }
    
    const result = await telegramPostJsonFast(botToken, method, payload);
    return result;
  } catch (urlError: any) {
    const errorMsg = String(urlError.message || "");
    
    // If URL method failed due to file issues, try download approach
    if (errorMsg.includes("WEBPAGE_CURL_FAILED") || 
        errorMsg.includes("wrong file identifier") ||
        errorMsg.includes("failed to get HTTP URL content")) {
      console.log(`URL send failed, trying download for: ${mediaUrl.substring(0, 50)}`);
      return await downloadAndSendMedia(botToken, chatId, mediaUrl, caption);
    }
    
    // For file too large errors, try as document
    if (errorMsg.includes("Request Entity Too Large") ||
        errorMsg.includes("file is too big") ||
        errorMsg.includes("PHOTO_INVALID_DIMENSIONS")) {
      console.log(`File too large, trying as document: ${mediaUrl.substring(0, 50)}`);
      return await sendAsDocument(botToken, chatId, mediaUrl, caption);
    }
    
    throw urlError;
  }
}

// Fast Telegram API call with minimal retries
async function telegramPostJsonFast(botToken: string, method: string, payload: Record<string, any>): Promise<any> {
  const url = `${TELEGRAM_API_BASE}${botToken}/${method}`;

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
      const retryAfter = data?.parameters?.retry_after || 5;
      console.log(`Rate limited, waiting ${retryAfter}s`);
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
      
      // Retry once after rate limit
      const retryRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const retryData = await retryRes.json().catch(() => null);
      if (retryData?.ok) return retryData.result;
      throw new Error(retryData?.description || "Retry failed");
    }

    throw new Error(description);
  }

  return data.result;
}

// Send as document (works for larger files)
async function sendAsDocument(
  botToken: string,
  chatId: string,
  mediaUrl: string,
  caption?: string
): Promise<any> {
  // Try URL method first
  const payload: Record<string, any> = {
    chat_id: chatId,
    document: mediaUrl,
    disable_content_type_detection: true,
  };
  
  if (caption) {
    payload.caption = caption;
    payload.parse_mode = "HTML";
  }

  try {
    return await telegramPostJsonFast(botToken, "sendDocument", payload);
  } catch (error: any) {
    // If URL fails, download and send
    if (String(error.message).includes("WEBPAGE_CURL_FAILED") ||
        String(error.message).includes("wrong file identifier")) {
      return await downloadAndSendAsDocument(botToken, chatId, mediaUrl, caption);
    }
    throw error;
  }
}

// Download and send as document
async function downloadAndSendAsDocument(
  botToken: string,
  chatId: string,
  mediaUrl: string,
  caption?: string
): Promise<any> {
  const ext = getFileExtension(mediaUrl);
  const mimeType = getMimeType(ext);
  const fileName = `media_${Date.now()}.${ext}`;

  const response = await fetch(mediaUrl);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status}`);
  }

  const contentLength = response.headers.get("content-length");
  const fileSize = contentLength ? parseInt(contentLength) : 0;
  
  // Skip if file is too large even for documents (50MB limit)
  if (fileSize > MAX_FILE_SIZE) {
    throw new Error(`File too large: ${Math.round(fileSize / 1024 / 1024)}MB exceeds 45MB limit`);
  }

  const fileBlob = await response.blob();

  const formData = new FormData();
  formData.append("chat_id", chatId);
  formData.append("document", new File([fileBlob], fileName, { type: mimeType }));
  formData.append("disable_content_type_detection", "true");
  
  if (caption) {
    formData.append("caption", caption);
    formData.append("parse_mode", "HTML");
  }

  const url = `${TELEGRAM_API_BASE}${botToken}/sendDocument`;
  const telegramResponse = await fetch(url, {
    method: "POST",
    body: formData,
  });

  const data = await telegramResponse.json();
  if (!data.ok) {
    throw new Error(data.description || "Failed to send document");
  }

  return data.result;
}

// Download and send via FormData (fallback)
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
    throw new Error(`Failed to download: ${response.status}`);
  }

  const contentLength = response.headers.get("content-length");
  const fileSize = contentLength ? parseInt(contentLength) : 0;
  
  // If file is too large for photo/video, send as document
  if (fileSize > 10 * 1024 * 1024) { // >10MB, use document
    return await downloadAndSendAsDocument(botToken, chatId, mediaUrl, caption);
  }

  const fileBlob = await response.blob();
  
  const method = isVideo ? "sendVideo" : "sendPhoto";
  const fileField = isVideo ? "video" : "photo";

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
  const telegramResponse = await fetch(url, {
    method: "POST",
    body: formData,
  });

  const data = await telegramResponse.json();

  if (!data.ok) {
    if (data.error_code === 429) {
      const retryAfter = data.parameters?.retry_after || 5;
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
      const retryRes = await fetch(url, { method: "POST", body: formData });
      const retryData = await retryRes.json();
      if (retryData.ok) return retryData.result;
    }

    // Try as document if photo/video fails
    if (data.description?.includes("file is too big") || 
        data.description?.includes("video_file_invalid") ||
        data.description?.includes("PHOTO_INVALID_DIMENSIONS")) {
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
}

// Process items in parallel batches
async function processInParallel<T>(
  items: T[],
  processor: (item: T, index: number) => Promise<{ success: boolean; error?: string }>,
  parallelCount: number
): Promise<{ successes: number; errors: { index: number; error: string }[] }> {
  const results: { successes: number; errors: { index: number; error: string }[] } = {
    successes: 0,
    errors: [],
  };

  for (let i = 0; i < items.length; i += parallelCount) {
    const batch = items.slice(i, i + parallelCount);
    const promises = batch.map((item, batchIndex) => 
      processor(item, i + batchIndex).catch(error => ({
        success: false,
        error: String(error.message || error).substring(0, 100),
      }))
    );

    const batchResults = await Promise.all(promises);
    
    for (let j = 0; j < batchResults.length; j++) {
      const result = batchResults[j];
      if (result.success) {
        results.successes++;
      } else {
        results.errors.push({
          index: i + j,
          error: result.error || "Unknown error",
        });
      }
    }

    // Minimal delay between parallel batches to avoid rate limits
    if (i + parallelCount < items.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
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
    const now = new Date().toISOString();

    // Find the oldest running campaign
    const { data: candidates, error: findError } = await supabase
      .from("campaigns")
      .select("*")
      .eq("status", "running")
      .order("updated_at", { ascending: true })
      .limit(1);

    if (findError) {
      console.error("Error finding running campaign:", findError);
      return new Response(JSON.stringify({ error: findError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const targetCampaign: any = candidates?.[0];

    if (!targetCampaign) {
      console.log("No running campaigns to process");
      return new Response(JSON.stringify({ message: "No campaigns to process" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const campaignId = targetCampaign.id;
    const totalCount = targetCampaign.total_count || 0;
    const startOffset = targetCampaign.sent_count || 0;
    const endOffset = Math.min(startOffset + CHUNK_SIZE, totalCount);

    // If already complete, finalize
    if (startOffset >= totalCount) {
      await supabase.from("campaigns").update({
        status: "completed",
        progress: 100,
        completed_at: now,
      }).eq("id", campaignId);

      console.log(`Campaign ${campaignId} completed`);
      return new Response(JSON.stringify({ message: "Campaign completed", campaignId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found campaign ${campaignId}, processing batch ${startOffset}-${endOffset}...`);

    // Just mark as processing (don't advance sent_count yet)
    const { data: reservedRows, error: reserveError } = await supabase
      .from("campaigns")
      .update({
        updated_at: now,
      })
      .eq("id", campaignId)
      .eq("status", "running")
      .select("*");

    if (reserveError) {
      console.error("Error reserving campaign batch:", reserveError);
      return new Response(JSON.stringify({ error: reserveError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reserved = Array.isArray(reservedRows) && reservedRows.length > 0;

    if (!reserved) {
      console.log("Campaign not running anymore");
      return new Response(JSON.stringify({ message: "Campaign not running" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const campaign: any = reservedRows![0];
    const userId = campaign.user_id;
    const mediaPackId = campaign.media_pack_id;
    // Support sub-second delays (e.g., 0.001 = 1ms for turbo mode)
    const delaySeconds = Math.max(0.001, campaign.delay_seconds || 1);

    console.log(`Processing campaign ${campaignId}: batch ${startOffset}-${endOffset} of ${totalCount}, delay=${delaySeconds}s`);

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
          limit: endOffset - startOffset,
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

    console.log(`Loaded ${mediaUrls.length} URLs, processing in parallel batches of ${PARALLEL_SENDS}...`);

    // Process media in parallel
    let successCount = campaign.success_count || 0;
    let errorCount = campaign.error_count || 0;
    const errorsLog: any[] = Array.isArray(campaign.errors_log) ? campaign.errors_log.slice(-50) : [];
    
    const startTime = Date.now();
    const caption = startOffset === 0 ? campaign.caption : null;

    const results = await processInParallel(
      mediaUrls,
      async (url, index) => {
        try {
          await sendMediaSmart(
            botToken!,
            chatId,
            url,
            index === 0 ? (caption || undefined) : undefined
          );
          return { success: true };
        } catch (error: any) {
          return { 
            success: false, 
            error: String(error.message || error).substring(0, 100) 
          };
        }
      },
      PARALLEL_SENDS
    );

    successCount += results.successes;
    errorCount += results.errors.length;

    for (const err of results.errors) {
      errorsLog.push({
        index: startOffset + err.index,
        url: mediaUrls[err.index]?.substring(0, 80) || "unknown",
        error: err.error,
        timestamp: new Date().toISOString(),
      });
    }

    const endTime = Date.now();
    const batchTime = endTime - startTime;
    const avgPerItem = mediaUrls.length > 0 ? Math.round(batchTime / mediaUrls.length) : 0;

    // Calculate actual sent count (only count what was actually processed)
    const actualSentThisBatch = results.successes + results.errors.length;
    const newSentCount = startOffset + actualSentThisBatch;
    const progress = Math.min(100, Math.round((newSentCount / totalCount) * 100));
    const isComplete = newSentCount >= totalCount;

    // Update with real counts AFTER sending
    await supabase.from("campaigns").update({
      sent_count: newSentCount,
      success_count: successCount,
      error_count: errorCount,
      errors_log: errorsLog.slice(-50),
      progress,
      avg_send_time_ms: avgPerItem,
      status: isComplete ? "completed" : "running",
      completed_at: isComplete ? new Date().toISOString() : null,
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

    console.log(`Campaign ${campaignId} batch done: ${progress}% (${newSentCount}/${totalCount}) - ${avgPerItem}ms/item - ${results.successes} ok, ${results.errors.length} err`);

    // Self-invoke immediately if there's more work
    if (!isComplete) {
      const supabaseUrlEnv = Deno.env.get("SUPABASE_URL") ?? "";
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

      // Use actual delay setting - for turbo mode (0.001s), use minimal delay
      const batchDelayMs = Math.max(MIN_DELAY_MS, Math.min(delaySeconds * 1000, 2000));
      await new Promise(resolve => setTimeout(resolve, batchDelayMs));

      // Non-blocking invoke
      fetch(`${supabaseUrlEnv}/functions/v1/campaign-runner`, {
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
      sentCount: newSentCount,
      successCount,
      errorCount,
      totalCount,
      isComplete,
      avgTimePerItem: avgPerItem,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Campaign runner error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
