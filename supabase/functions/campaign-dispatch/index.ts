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

// Call Telegram API with retry logic
async function callTelegramAPI(botToken: string, method: string, params?: Record<string, any>, retries = 2): Promise<any> {
  const url = `${TELEGRAM_API_BASE}${botToken}/${method}`;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: params ? JSON.stringify(params) : undefined,
      });
      
      const data = await response.json();
      console.log(`Telegram API ${method} response (attempt ${attempt + 1}):`, JSON.stringify(data).substring(0, 500));
      
      if (!data.ok) {
        // If it's a specific error about file being too large, try sendDocument instead
        if (data.description?.includes("file is too big") || data.description?.includes("video_file_invalid")) {
          throw new Error(`FILE_TOO_BIG:${data.description}`);
        }
        
        // Rate limit - wait and retry
        if (data.error_code === 429) {
          const retryAfter = data.parameters?.retry_after || 30;
          console.log(`Rate limited, waiting ${retryAfter}s before retry`);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          continue;
        }
        
        throw new Error(data.description || "Telegram API error");
      }
      
      return data.result;
    } catch (error: any) {
      if (attempt === retries || error.message?.startsWith("FILE_TOO_BIG")) {
        throw error;
      }
      console.log(`Attempt ${attempt + 1} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

// Send media group (album) to Telegram
async function sendMediaGroup(botToken: string, chatId: string, mediaUrls: string[], caption?: string): Promise<any> {
  const media = mediaUrls.map((url, index) => {
    const isVideo = isVideoUrl(url);
    return {
      type: isVideo ? "video" : "photo",
      media: url,
      caption: index === 0 && caption ? caption : undefined,
      parse_mode: index === 0 && caption ? "HTML" : undefined,
    };
  });

  return callTelegramAPI(botToken, "sendMediaGroup", {
    chat_id: chatId,
    media,
  });
}

// Send single media item with fallback to document for large files
async function sendSingleMedia(botToken: string, chatId: string, mediaUrl: string, caption?: string, isFirstInBatch = true): Promise<any> {
  const isVideo = isVideoUrl(mediaUrl);
  
  try {
    // First try the standard method
    const method = isVideo ? "sendVideo" : "sendPhoto";
    const params: Record<string, any> = {
      chat_id: chatId,
      [isVideo ? "video" : "photo"]: mediaUrl,
      parse_mode: "HTML",
    };
    
    if (isFirstInBatch && caption) {
      params.caption = caption;
    }

    // For videos, add support for long videos
    if (isVideo) {
      params.supports_streaming = true;
    }

    return await callTelegramAPI(botToken, method, params);
  } catch (error: any) {
    // If file is too big for sendVideo, try sendDocument
    if (error.message?.startsWith("FILE_TOO_BIG") && isVideo) {
      console.log("Video too large for sendVideo, trying sendDocument...");
      const docParams: Record<string, any> = {
        chat_id: chatId,
        document: mediaUrl,
        parse_mode: "HTML",
      };
      
      if (isFirstInBatch && caption) {
        docParams.caption = caption;
      }
      
      return await callTelegramAPI(botToken, "sendDocument", docParams);
    }
    throw error;
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

    // Get destination first
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

    // Determine media source: admin media pack OR user's own media
    let mediaUrls: string[] = [];
    
    if (campaign.media_pack_id) {
      // Using admin media pack
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

      // Extract media URLs from admin pack - create signed URLs for storage files
      const rawMediaFiles = mediaPack.media_files as (string | { url: string; type?: string; name?: string })[] || [];
      
      for (const file of rawMediaFiles) {
        const url = typeof file === 'string' ? file : file.url;
        if (!url) continue;
        
        // Check if it's a Supabase storage URL and create signed URL
        if (url.includes('/storage/v1/object/public/')) {
          // Extract bucket and path from public URL
          const match = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/);
          if (match) {
            const [, bucket, path] = match;
            const { data: signedUrlData } = await supabaseClient.storage
              .from(bucket)
              .createSignedUrl(decodeURIComponent(path), 3600);
            
            if (signedUrlData?.signedUrl) {
              mediaUrls.push(signedUrlData.signedUrl);
              continue;
            }
          }
        }
        // Use original URL if not a storage URL or signing failed
        mediaUrls.push(url);
      }

      console.log(`Using admin media pack: ${mediaPack.name} with ${mediaUrls.length} files (signed URLs)`);
    } else {
      // Using user's own media from storage
      console.log(`Fetching user media from storage for user: ${user.id}`);
      
      const { data: userFiles, error: storageError } = await supabaseClient.storage
        .from("user-media")
        .list(user.id, {
          limit: 1000,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (storageError) {
        console.error("Error fetching user media:", storageError);
        await supabaseClient.from("campaigns").update({
          status: "failed",
          error_message: "Erro ao buscar mídias do usuário",
        }).eq("id", campaignId);
        
        return new Response(JSON.stringify({ error: "Erro ao buscar mídias" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Filter out placeholder files and generate signed URLs (more reliable for Telegram)
      const validFiles = (userFiles || []).filter(f => 
        f.name !== ".emptyFolderPlaceholder" && 
        !f.name.startsWith(".")
      );

      // Use signed URLs instead of public URLs - Telegram needs direct access
      for (const file of validFiles) {
        const { data: signedUrlData, error: signedError } = await supabaseClient.storage
          .from("user-media")
          .createSignedUrl(`${user.id}/${file.name}`, 3600); // 1 hour expiry
        
        if (signedUrlData?.signedUrl && !signedError) {
          mediaUrls.push(signedUrlData.signedUrl);
        } else {
          console.warn(`Failed to create signed URL for ${file.name}:`, signedError);
        }
      }

      console.log(`Using user's own media: ${mediaUrls.length} files with signed URLs`);
    }

    if (mediaUrls.length === 0) {
      console.error("No media files found");
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
    console.log(`Dispatching ${mediaUrls.length} media files to chat ${destination.chat_id} with pack_size=${packSize}`);

    // Return response immediately and continue processing in background
    EdgeRuntime.waitUntil(dispatchMediaInBackground(
      supabaseClient,
      campaignId,
      mediaUrls,
      telegramIntegration.bot_token,
      destination.chat_id,
      campaign.delay_seconds || 10,
      campaign.caption,
      user.id,
      packSize,
      campaign.send_mode || "media"
    ));

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Iniciando envio de ${mediaUrls.length} mídias em packs de ${packSize}`,
      total: mediaUrls.length,
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
  supabase: any,
  campaignId: string,
  mediaFiles: string[],
  botToken: string,
  chatId: string,
  delaySeconds: number,
  caption: string | null,
  userId: string,
  packSize: number = 1,
  sendMode: string = "media"
) {
  let sentCount = 0;
  let successCount = 0;
  let errorCount = 0;
  const errorsLog: { index: number; url: string; error: string; timestamp: string }[] = [];
  const sendTimes: number[] = [];

  console.log(`Background dispatch started for campaign ${campaignId} with ${mediaFiles.length} files, packSize=${packSize}`);

  // Chunk the media files according to pack size
  const chunks: string[][] = [];
  for (let i = 0; i < mediaFiles.length; i += packSize) {
    chunks.push(mediaFiles.slice(i, i + packSize));
  }

  console.log(`Created ${chunks.length} chunks from ${mediaFiles.length} files with pack size ${packSize}`);

  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
    // Check if campaign is still running
    const { data: currentCampaign } = await supabase
      .from("campaigns")
      .select("status")
      .eq("id", campaignId)
      .single();
    
    if (currentCampaign?.status !== "running") {
      console.log(`Campaign ${campaignId} stopped (status: ${currentCampaign?.status}), aborting dispatch at chunk ${chunkIndex}/${chunks.length}`);
      break;
    }

    const chunk = chunks[chunkIndex];
    const startTime = Date.now();
    
    try {
      console.log(`Sending chunk ${chunkIndex + 1}/${chunks.length} with ${chunk.length} items`);
      
      if (chunk.length === 1 || sendMode === "document") {
        // Send individually
        for (let i = 0; i < chunk.length; i++) {
          const mediaUrl = chunk[i];
          const isFirstInChunk = i === 0;
          
          if (sendMode === "document") {
            // Always use sendDocument mode
            const docParams: Record<string, any> = {
              chat_id: chatId,
              document: mediaUrl,
              parse_mode: "HTML",
            };
            
            if (isFirstInChunk && chunkIndex === 0 && caption) {
              docParams.caption = caption;
            }
            
            await callTelegramAPI(botToken, "sendDocument", docParams);
          } else {
            await sendSingleMedia(botToken, chatId, mediaUrl, 
              (isFirstInChunk && chunkIndex === 0) ? caption || undefined : undefined, 
              isFirstInChunk && chunkIndex === 0);
          }
          
          sentCount++;
          successCount++;
          
          // Small delay between individual items in same chunk
          if (i < chunk.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      } else {
        // Send as media group (album)
        const captionForChunk = chunkIndex === 0 ? caption : null;
        await sendMediaGroup(botToken, chatId, chunk, captionForChunk || undefined);
        sentCount += chunk.length;
        successCount += chunk.length;
      }

      const endTime = Date.now();
      sendTimes.push(endTime - startTime);
      
      console.log(`Successfully sent chunk ${chunkIndex + 1}/${chunks.length}`);

    } catch (error: any) {
      console.error(`Error sending chunk ${chunkIndex + 1}:`, error.message);
      
      // Try sending individually if album failed
      if (chunk.length > 1 && sendMode !== "document") {
        console.log("Album failed, trying to send individually...");
        for (let i = 0; i < chunk.length; i++) {
          try {
            await sendSingleMedia(botToken, chatId, chunk[i], 
              (i === 0 && chunkIndex === 0) ? caption || undefined : undefined,
              i === 0 && chunkIndex === 0);
            sentCount++;
            successCount++;
            await new Promise(resolve => setTimeout(resolve, 1500));
          } catch (innerError: any) {
            console.error(`Error sending individual item ${i}:`, innerError.message);
            errorCount++;
            errorsLog.push({
              index: chunkIndex * packSize + i,
              url: chunk[i].substring(0, 100),
              error: innerError.message,
              timestamp: new Date().toISOString(),
            });
            sentCount++;
          }
        }
      } else {
        errorCount += chunk.length;
        for (let i = 0; i < chunk.length; i++) {
          errorsLog.push({
            index: chunkIndex * packSize + i,
            url: chunk[i].substring(0, 100),
            error: error.message,
            timestamp: new Date().toISOString(),
          });
        }
        sentCount += chunk.length;
      }
    }

    // Calculate average send time
    const avgSendTime = sendTimes.length > 0 
      ? Math.round(sendTimes.reduce((a, b) => a + b, 0) / sendTimes.length)
      : 0;

    // Update progress in database
    const progress = Math.round((sentCount / mediaFiles.length) * 100);
    await supabase.from("campaigns").update({
      sent_count: sentCount,
      progress,
      success_count: successCount,
      error_count: errorCount,
      errors_log: errorsLog,
      avg_send_time_ms: avgSendTime,
    }).eq("id", campaignId);

    console.log(`Progress: ${progress}% (${sentCount}/${mediaFiles.length})`);

    // Wait for delay before next chunk (if not last chunk)
    if (chunkIndex < chunks.length - 1) {
      console.log(`Waiting ${delaySeconds} seconds before next chunk...`);
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