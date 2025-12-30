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

// Helper to detect if media is a video
function isVideoUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes(".mp4") || 
         lowerUrl.includes(".mov") || 
         lowerUrl.includes(".webm") ||
         lowerUrl.includes(".avi") ||
         lowerUrl.includes(".mkv") ||
         lowerUrl.includes(".flv") ||
         lowerUrl.includes(".wmv");
}

// Get file extension from URL
function getFileExtension(url: string): string {
  const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/i);
  return match ? match[1].toLowerCase() : "jpg";
}

// Get MIME type from extension
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
    avi: "video/x-msvideo",
    mkv: "video/x-matroska",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

function encodeStoragePath(path: string): string {
  // Keep folder separators but encode each segment safely
  return path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

// Send using Telegrams ability to fetch the URL directly (low memory)
async function telegramPostJson(
  botToken: string,
  method: string,
  payload: Record<string, any>
): Promise<any> {
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

async function sendTextMessage(
  botToken: string,
  chatId: string,
  text: string
): Promise<any> {
  return telegramPostJson(botToken, "sendMessage", {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
  });
}

async function sendMediaByUrl(
  botToken: string,
  chatId: string,
  mediaUrl: string,
  caption?: string,
  sendMode: string = "media"
): Promise<any> {
  const isVideo = isVideoUrl(mediaUrl);

  // If caller forces document, just do it.
  if (sendMode === "document") {
    return telegramPostJson(botToken, "sendDocument", {
      chat_id: chatId,
      document: mediaUrl,
      caption,
      parse_mode: caption ? "HTML" : undefined,
    });
  }

  // Photos
  if (!isVideo) {
    return telegramPostJson(botToken, "sendPhoto", {
      chat_id: chatId,
      photo: mediaUrl,
      caption,
      parse_mode: caption ? "HTML" : undefined,
    });
  }

  // Videos: try sendVideo first, fallback to sendDocument (some videos fail as video)
  try {
    return await telegramPostJson(botToken, "sendVideo", {
      chat_id: chatId,
      video: mediaUrl,
      caption,
      parse_mode: caption ? "HTML" : undefined,
      supports_streaming: true,
    });
  } catch (e: any) {
    const msg = String(e?.message || "");

    // If Telegram couldn't fetch or couldn't treat as a video, try as document
    if (
      msg.includes("WEBPAGE_CURL_FAILED") ||
      msg.toLowerCase().includes("file is too big") ||
      msg.toLowerCase().includes("video_file_invalid")
    ) {
      return telegramPostJson(botToken, "sendDocument", {
        chat_id: chatId,
        document: mediaUrl,
        caption,
        parse_mode: caption ? "HTML" : undefined,
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
  const media = mediaUrls.slice(0, 10).map((url, idx) => {
    const isVideo = isVideoUrl(url);
    return {
      type: isVideo ? "video" : "photo",
      media: url,
      caption: idx === 0 ? caption : undefined,
      parse_mode: idx === 0 && caption ? "HTML" : undefined,
    };
  });

  // Telegram expects a JSON-serialized array for `media`
  return telegramPostJson(botToken, "sendMediaGroup", {
    chat_id: chatId,
    media: JSON.stringify(media),
  });
}

// Download file and send via FormData (fallback for when Telegram cant fetch URL)
async function downloadAndSendMedia(
  botToken: string,
  chatId: string,
  mediaUrl: string,
  caption?: string,
  sendMode: string = "media"
): Promise<any> {
  const isVideo = isVideoUrl(mediaUrl);
  const ext = getFileExtension(mediaUrl);
  const mimeType = getMimeType(ext);
  const fileName = `media_${Date.now()}.${ext}`;

  const response = await fetch(mediaUrl);
  if (!response.ok) {
    throw new Error(`Failed to download media: ${response.status} ${response.statusText}`);
  }

  const fileBlob = await response.blob();

  let method: string;
  let fileField: string;

  if (sendMode === "document") {
    method = "sendDocument";
    fileField = "document";
  } else if (isVideo) {
    method = "sendVideo";
    fileField = "video";
  } else {
    method = "sendPhoto";
    fileField = "photo";
  }

  const formData = new FormData();
  formData.append("chat_id", chatId);
  formData.append(fileField, new File([fileBlob], fileName, { type: mimeType }));

  if (caption) {
    formData.append("caption", caption);
    formData.append("parse_mode", "HTML");
  }

  if (isVideo && method === "sendVideo") {
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

        if (
          method === "sendVideo" &&
          (data.description?.includes("file is too big") ||
            data.description?.includes("video_file_invalid"))
        ) {
          console.log("Video failed, trying as document...");
          const docFormData = new FormData();
          docFormData.append("chat_id", chatId);
          docFormData.append(
            "document",
            new File([fileBlob], fileName, { type: mimeType })
          );
          if (caption) {
            docFormData.append("caption", caption);
            docFormData.append("parse_mode", "HTML");
          }

          const docResponse = await fetch(
            `${TELEGRAM_API_BASE}${botToken}/sendDocument`,
            {
              method: "POST",
              body: docFormData,
            }
          );
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

// FormData album sender (fallback only; can be memory-heavy)
async function sendMediaGroupFormData(
  botToken: string,
  chatId: string,
  mediaUrls: string[],
  caption?: string
): Promise<any> {
  const formData = new FormData();
  formData.append("chat_id", chatId);

  const media: any[] = [];

  for (let i = 0; i < mediaUrls.length; i++) {
    const url = mediaUrls[i];
    const isVideo = isVideoUrl(url);
    const ext = getFileExtension(url);
    const mimeType = getMimeType(ext);
    const attachName = `file${i}`;
    const fileName = `media_${i}_${Date.now()}.${ext}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download media ${i}: ${response.status}`);
    }

    const fileBlob = await response.blob();
    formData.append(attachName, new File([fileBlob], fileName, { type: mimeType }));

    media.push({
      type: isVideo ? "video" : "photo",
      media: `attach://${attachName}`,
      caption: i === 0 && caption ? caption : undefined,
      parse_mode: i === 0 && caption ? "HTML" : undefined,
    });
  }

  formData.append("media", JSON.stringify(media));

  const telegramUrl = `${TELEGRAM_API_BASE}${botToken}/sendMediaGroup`;

  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      const response = await fetch(telegramUrl, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!data.ok) {
        if (data.error_code === 429) {
          const retryAfter = data.parameters?.retry_after || 30;
          console.log(`Rate limited, waiting ${retryAfter}s`);
          await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
          continue;
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

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
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

    // Get telegram integration
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

    // Get total count of media files WITHOUT loading all URLs yet
    let totalMediaCount = 0;
    let mediaPackId: string | null = campaign.media_pack_id;
    
    if (mediaPackId) {
      // Get count from admin media pack
      const { data: mediaPack } = await supabaseClient
        .from("admin_media")
        .select("media_files, file_count")
        .eq("id", mediaPackId)
        .single();
      
      if (mediaPack) {
        // Use file_count if available, otherwise count from array
        totalMediaCount = mediaPack.file_count || (Array.isArray(mediaPack.media_files) ? mediaPack.media_files.length : 0);
      }
      console.log(`Media pack has ${totalMediaCount} files`);
    } else {
      // Count user files
      const { data: userFiles } = await supabaseClient.storage
        .from("user-media")
        .list(user.id, { limit: 100000 });
      
      totalMediaCount = (userFiles || []).filter(f => 
        f.name !== ".emptyFolderPlaceholder" && !f.name.startsWith(".")
      ).length;
      console.log(`User has ${totalMediaCount} media files`);
    }

    if (totalMediaCount === 0) {
      await supabaseClient.from("campaigns").update({
        status: "failed",
        error_message: "Nenhum arquivo de mídia encontrado",
      }).eq("id", campaignId);
      
      return new Response(JSON.stringify({ error: "Nenhum arquivo encontrado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const packSize = campaign.pack_size || 1;
    console.log(`Will dispatch ${totalMediaCount} media files with pack_size=${packSize}`);

    // Update campaign with total count (resume-safe: don't reset counters if already started)
    const alreadyStarted = (campaign.sent_count ?? 0) > 0;
    const startedAt = campaign.started_at || new Date().toISOString();

    await supabaseClient
      .from("campaigns")
      .update({
        total_count: totalMediaCount,
        status: "running",
        started_at: startedAt,
        ...(alreadyStarted
          ? {}
          : {
              progress: 0,
              sent_count: 0,
              success_count: 0,
              error_count: 0,
              errors_log: [],
              avg_send_time_ms: 0,
              error_message: null,
            }),
      })
      .eq("id", campaignId);

    // Start background dispatch - pass only IDs and configs, not the data
    EdgeRuntime.waitUntil(dispatchMediaInBackground(
      campaignId,
      mediaPackId,
      user.id,
      telegramIntegration.bot_token,
      destination.chat_id,
      campaign.delay_seconds || 10,
      campaign.caption,
      packSize,
      campaign.send_mode || "media",
      totalMediaCount
    ));

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Iniciando envio de ${totalMediaCount} mídias em packs de ${packSize}`,
      total: totalMediaCount,
      packSize
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
  campaignId: string,
  mediaPackId: string | null,
  userId: string,
  botToken: string,
  chatId: string,
  delaySeconds: number,
  caption: string | null,
  packSize: number = 1,
  sendMode: string = "media",
  totalMediaCount: number
) {
  // Create a new Supabase client for background processing
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // Resume-safe counters (in case the runtime shuts down mid-campaign)
  const { data: existingCampaign } = await supabase
    .from("campaigns")
    .select("status, sent_count, success_count, error_count, errors_log, total_count")
    .eq("id", campaignId)
    .single();

  if (existingCampaign?.status && ["completed", "failed"].includes(existingCampaign.status)) {
    console.log(`Campaign ${campaignId} already ${existingCampaign.status}, skipping dispatch`);
    return;
  }

  let sentCount = Math.max(0, existingCampaign?.sent_count ?? 0);
  let successCount = Math.max(0, existingCampaign?.success_count ?? 0);
  let errorCount = Math.max(0, existingCampaign?.error_count ?? 0);

  const errorsLog: { index: number; url: string; error: string; timestamp: string }[] =
    Array.isArray(existingCampaign?.errors_log)
      ? (existingCampaign!.errors_log as any[])
          .filter((e) => e && typeof e === "object")
          .map((e) => ({
            index: Number(e.index ?? 0),
            url: String(e.url ?? ""),
            error: String(e.error ?? ""),
            timestamp: String(e.timestamp ?? new Date().toISOString()),
          }))
          .slice(-100)
      : [];

  const sendTimes: number[] = [];

  // Process in batches to avoid memory issues with large media packs
  const BATCH_SIZE = 100; // Process 100 files at a time
  let offset = Math.min(sentCount, totalMediaCount);

  console.log(
    `Background dispatch started for campaign ${campaignId} at offset=${offset} of ${totalMediaCount} (packSize=${packSize})`
  );

  try {
    while (offset < totalMediaCount) {
      // Check if campaign is still running
      const { data: currentCampaign } = await supabase
        .from("campaigns")
        .select("status")
        .eq("id", campaignId)
        .single();
      
      if (currentCampaign?.status !== "running") {
        console.log(`Campaign ${campaignId} stopped at offset ${offset}`);
        break;
      }

      // Load batch of media URLs
      const mediaUrls: string[] = [];
      const batchEnd = Math.min(offset + BATCH_SIZE, totalMediaCount);
      
      console.log(`Loading batch ${offset}-${batchEnd} of ${totalMediaCount}`);

      if (mediaPackId) {
        // Load from admin media pack
        const { data: mediaPack } = await supabase
          .from("admin_media")
          .select("media_files")
          .eq("id", mediaPackId)
          .single();

        if (mediaPack?.media_files) {
          const rawMediaFiles = mediaPack.media_files as (string | { url: string })[];
          const batchFiles = rawMediaFiles.slice(offset, batchEnd);
          
          for (const file of batchFiles) {
            const url = typeof file === "string" ? file : file.url;
            if (!url) continue;

            // Buckets are public in this project; prefer direct public URLs (faster + Telegram can fetch them)
            mediaUrls.push(url);
          }
        }
      } else {
        // Load from user storage
        const { data: userFiles } = await supabase.storage
          .from("user-media")
          .list(userId, {
            limit: BATCH_SIZE,
            offset: offset,
            sortBy: { column: "created_at", order: "desc" },
          });

        const validFiles = (userFiles || []).filter(f => 
          f.name !== ".emptyFolderPlaceholder" && !f.name.startsWith(".")
        );

        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";

        for (const file of validFiles) {
          // Public bucket: send direct URL so Telegram can fetch without us downloading
          const publicUrl = `${supabaseUrl}/storage/v1/object/public/user-media/${userId}/${encodeStoragePath(file.name)}`;
          mediaUrls.push(publicUrl);
        }
      }

      if (mediaUrls.length === 0) {
        console.log(`No media URLs loaded for batch ${offset}-${batchEnd}, skipping`);
        offset = batchEnd;
        continue;
      }

      console.log(`Loaded ${mediaUrls.length} URLs for batch, starting dispatch`);

      // Chunk the batch into packs
      const chunks: string[][] = [];
      for (let i = 0; i < mediaUrls.length; i += packSize) {
        chunks.push(mediaUrls.slice(i, i + packSize));
      }

      // Process chunks
      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        // Check status periodically
        if (chunkIndex % 10 === 0) {
          const { data: statusCheck } = await supabase
            .from("campaigns")
            .select("status")
            .eq("id", campaignId)
            .single();
          
          if (statusCheck?.status !== "running") {
            console.log(`Campaign stopped during chunk processing`);
            break;
          }
        }

        const chunk = chunks[chunkIndex];
        const startTime = Date.now();
        
        try {
          const captionForChunk = (offset === 0 && chunkIndex === 0) ? caption : null;

          // Prefer URL-based sending to avoid memory spikes (Telegram fetches the file itself)
          const hasVideo = chunk.some((u) => isVideoUrl(u));

          // Videos (especially large ones) are more reliable one-by-one than albums
          if (hasVideo) {
            for (let i = 0; i < chunk.length; i++) {
              await sendMediaByUrl(
                botToken,
                chatId,
                chunk[i],
                i === 0 ? (captionForChunk || undefined) : undefined,
                sendMode
              );
              sentCount++;
              successCount++;
              if (i < chunk.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, 1200));
              }
            }
          } else if (sendMode === "document") {
            for (let i = 0; i < chunk.length; i++) {
              await sendMediaByUrl(
                botToken,
                chatId,
                chunk[i],
                i === 0 ? (captionForChunk || undefined) : undefined,
                "document"
              );
              sentCount++;
              successCount++;
              if (i < chunk.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, 800));
              }
            }
          } else if (chunk.length === 1) {
            await sendMediaByUrl(
              botToken,
              chatId,
              chunk[0],
              captionForChunk || undefined,
              sendMode
            );
            sentCount++;
            successCount++;
          } else if (chunk.length <= 10) {
            await sendMediaGroupByUrl(botToken, chatId, chunk, captionForChunk || undefined);
            sentCount += chunk.length;
            successCount += chunk.length;
          } else {
            for (let subI = 0; subI < chunk.length; subI += 10) {
              const subChunk = chunk.slice(subI, subI + 10);
              await sendMediaGroupByUrl(
                botToken,
                chatId,
                subChunk,
                subI === 0 ? (captionForChunk || undefined) : undefined
              );
              sentCount += subChunk.length;
              successCount += subChunk.length;
              if (subI + 10 < chunk.length) {
                await new Promise((resolve) => setTimeout(resolve, 1200));
              }
            }
          }

          const endTime = Date.now();
          sendTimes.push(endTime - startTime);

        } catch (error: any) {
          console.error(`Error sending chunk:`, error.message);

          // Fallback: try individually by URL only (no download to avoid memory spikes with large videos)
          for (let i = 0; i < chunk.length; i++) {
            try {
              await sendMediaByUrl(botToken, chatId, chunk[i], undefined, sendMode);
              sentCount++;
              successCount++;
              await new Promise((resolve) => setTimeout(resolve, 1200));
            } catch (innerError: any) {
              const message = String(innerError?.message || "");
              console.error(`Error sending item:`, message);

              // As last resort, post the link in the group so nothing gets silently lost
              try {
                await sendTextMessage(
                  botToken,
                  chatId,
                  `Não consegui enviar este vídeo como mídia. Link: ${chunk[i]}`
                );
              } catch {
                // ignore
              }

              errorCount++;
              errorsLog.push({
                index: offset + chunkIndex * packSize + i,
                url: chunk[i].substring(0, 100),
                error: message,
                timestamp: new Date().toISOString(),
              });
              sentCount++;
            }
          }
        }

        // Update progress every 5 chunks or at the end
        if (chunkIndex % 5 === 0 || chunkIndex === chunks.length - 1) {
          const avgSendTime = sendTimes.length > 0 
            ? Math.round(sendTimes.reduce((a, b) => a + b, 0) / sendTimes.length)
            : 0;

          const progress = Math.round((sentCount / totalMediaCount) * 100);
          await supabase.from("campaigns").update({
            sent_count: sentCount,
            progress,
            success_count: successCount,
            error_count: errorCount,
            errors_log: errorsLog.slice(-100), // Keep last 100 errors
            avg_send_time_ms: avgSendTime,
          }).eq("id", campaignId);

          console.log(`Progress: ${progress}% (${sentCount}/${totalMediaCount})`);
        }

        // Wait before next chunk
        if (chunkIndex < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
        }
      }

      // Move to next batch
      offset = batchEnd;
      
      // Small delay between batches
      if (offset < totalMediaCount) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  } catch (fatalError: any) {
    console.error(`Fatal error in campaign dispatch:`, fatalError);
    await supabase.from("campaigns").update({
      status: "failed",
      error_message: `Erro fatal: ${fatalError.message}`,
      completed_at: new Date().toISOString(),
    }).eq("id", campaignId);
    return;
  }

  // Mark campaign as completed
  const finalStatus = errorCount === totalMediaCount ? "failed" : "completed";
  const avgSendTime = sendTimes.length > 0 
    ? Math.round(sendTimes.reduce((a, b) => a + b, 0) / sendTimes.length)
    : 0;

  await supabase.from("campaigns").update({
    status: finalStatus,
    completed_at: new Date().toISOString(),
    progress: 100,
    sent_count: sentCount,
    success_count: successCount,
    error_count: errorCount,
    errors_log: errorsLog.slice(-100),
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
    console.log("Metrics update failed, skipping");
  }

  console.log(`Campaign ${campaignId} completed: ${successCount} sent, ${errorCount} errors`);
}
