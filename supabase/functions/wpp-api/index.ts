import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GRAPH_API_URL = "https://graph.facebook.com/v18.0";

interface SendMessagePayload {
  action: "validate" | "send" | "sendTemplate" | "sendMedia";
  phoneNumberId: string;
  accessToken: string;
  to?: string;
  message?: string;
  messageType?: "text" | "template" | "image" | "video" | "document" | "audio";
  templateData?: {
    name: string;
    language: string;
    components?: any[];
  };
  mediaUrl?: string;
  mediaCaption?: string;
}

async function callGraphAPI(
  endpoint: string,
  accessToken: string,
  method: string = "GET",
  body?: any
): Promise<any> {
  const url = `${GRAPH_API_URL}${endpoint}`;
  
  const options: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  console.log(`Calling Graph API: ${method} ${url}`);
  
  const response = await fetch(url, options);
  const data = await response.json();
  
  if (!response.ok) {
    console.error("Graph API error:", data);
    throw new Error(data.error?.message || "Graph API error");
  }
  
  return data;
}

async function validateToken(phoneNumberId: string, accessToken: string): Promise<any> {
  try {
    const data = await callGraphAPI(`/${phoneNumberId}`, accessToken);
    return {
      success: true,
      data: {
        id: data.id,
        display_phone_number: data.display_phone_number,
        verified_name: data.verified_name,
        quality_rating: data.quality_rating,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function sendTextMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  message: string
): Promise<any> {
  const body = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: {
      preview_url: true,
      body: message,
    },
  };
  
  const data = await callGraphAPI(`/${phoneNumberId}/messages`, accessToken, "POST", body);
  
  return {
    success: true,
    messageId: data.messages?.[0]?.id,
    data,
  };
}

async function sendTemplateMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  templateData: { name: string; language: string; components?: any[] }
): Promise<any> {
  const body = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "template",
    template: {
      name: templateData.name,
      language: {
        code: templateData.language,
      },
      components: templateData.components || [],
    },
  };
  
  const data = await callGraphAPI(`/${phoneNumberId}/messages`, accessToken, "POST", body);
  
  return {
    success: true,
    messageId: data.messages?.[0]?.id,
    data,
  };
}

async function sendMediaMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  mediaType: "image" | "video" | "document" | "audio",
  mediaUrl: string,
  caption?: string
): Promise<any> {
  const mediaObject: any = {
    link: mediaUrl,
  };
  
  if (caption && (mediaType === "image" || mediaType === "video" || mediaType === "document")) {
    mediaObject.caption = caption;
  }
  
  const body = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: mediaType,
    [mediaType]: mediaObject,
  };
  
  const data = await callGraphAPI(`/${phoneNumberId}/messages`, accessToken, "POST", body);
  
  return {
    success: true,
    messageId: data.messages?.[0]?.id,
    data,
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const payload: SendMessagePayload = await req.json();
    const { action, phoneNumberId, accessToken, to, message, messageType, templateData, mediaUrl, mediaCaption } = payload;
    
    console.log(`WPP API action: ${action}`);
    
    let result;
    
    switch (action) {
      case "validate":
        result = await validateToken(phoneNumberId, accessToken);
        break;
      
      case "send":
        if (!to) {
          throw new Error("Destinatário obrigatório");
        }
        
        if (messageType === "template" && templateData) {
          result = await sendTemplateMessage(phoneNumberId, accessToken, to, templateData);
        } else if (messageType && ["image", "video", "document", "audio"].includes(messageType) && mediaUrl) {
          result = await sendMediaMessage(
            phoneNumberId,
            accessToken,
            to,
            messageType as "image" | "video" | "document" | "audio",
            mediaUrl,
            mediaCaption
          );
        } else if (message) {
          result = await sendTextMessage(phoneNumberId, accessToken, to, message);
        } else {
          throw new Error("Mensagem ou template obrigatório");
        }
        break;
      
      case "sendTemplate":
        if (!to || !templateData) {
          throw new Error("Destinatário e dados do template obrigatórios");
        }
        result = await sendTemplateMessage(phoneNumberId, accessToken, to, templateData);
        break;
      
      case "sendMedia":
        if (!to || !mediaUrl || !messageType) {
          throw new Error("Destinatário, URL da mídia e tipo obrigatórios");
        }
        result = await sendMediaMessage(
          phoneNumberId,
          accessToken,
          to,
          messageType as "image" | "video" | "document" | "audio",
          mediaUrl,
          mediaCaption
        );
        break;
      
      default:
        throw new Error(`Ação desconhecida: ${action}`);
    }
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("WPP API error:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
