import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Bot detection patterns
const BOT_PATTERNS = [
  /googlebot/i, /bingbot/i, /yandex/i, /baiduspider/i,
  /facebookexternalhit/i, /twitterbot/i, /rogerbot/i,
  /linkedinbot/i, /embedly/i, /quora link preview/i,
  /showyoubot/i, /outbrain/i, /pinterest/i, /slackbot/i,
  /vkshare/i, /w3c_validator/i, /whatsapp/i, /flipboard/i,
  /tumblr/i, /bitlybot/i, /skypeuripreview/i, /nuzzel/i,
  /discordbot/i, /qwantify/i, /pinterestbot/i, /bitrix/i,
  /xing-contenttabreceiver/i, /chrome-lighthouse/i, /telegrambot/i,
  /bot/i, /crawler/i, /spider/i, /scraper/i, /facebook/i,
];

function isBot(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return BOT_PATTERNS.some(pattern => pattern.test(userAgent));
}

function getDeviceType(userAgent: string | null): string {
  if (!userAgent) return 'unknown';
  if (/mobile/i.test(userAgent)) return 'mobile';
  if (/tablet/i.test(userAgent)) return 'tablet';
  return 'desktop';
}

function getBrowser(userAgent: string | null): string {
  if (!userAgent) return 'unknown';
  if (/chrome/i.test(userAgent) && !/edg/i.test(userAgent)) return 'Chrome';
  if (/firefox/i.test(userAgent)) return 'Firefox';
  if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) return 'Safari';
  if (/edg/i.test(userAgent)) return 'Edge';
  if (/opera|opr/i.test(userAgent)) return 'Opera';
  return 'Other';
}

function getOS(userAgent: string | null): string {
  if (!userAgent) return 'unknown';
  if (/windows/i.test(userAgent)) return 'Windows';
  if (/macintosh|mac os x/i.test(userAgent)) return 'macOS';
  if (/linux/i.test(userAgent) && !/android/i.test(userAgent)) return 'Linux';
  if (/android/i.test(userAgent)) return 'Android';
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'iOS';
  return 'Other';
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');

    if (!slug) {
      return new Response(JSON.stringify({ error: 'Slug is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch media by slug
    const { data: media, error: mediaError } = await supabase
      .from('cloaker_media')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (mediaError || !media) {
      return new Response(JSON.stringify({ error: 'Media not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get visitor info
    const userAgent = req.headers.get('user-agent');
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
               req.headers.get('cf-connecting-ip') || 
               'unknown';
    const referrer = req.headers.get('referer') || null;
    const country = req.headers.get('cf-ipcountry') || null;

    // Detect bot and other info
    const isBotVisitor = isBot(userAgent);
    const deviceType = getDeviceType(userAgent);
    const browser = getBrowser(userAgent);
    const os = getOS(userAgent);

    // Determine if visitor should be blocked
    let wasBlocked = false;
    let serveType: 'safe' | 'offer' = 'offer';

    // Check bot blocking
    if (media.block_bots && isBotVisitor) {
      wasBlocked = true;
      serveType = 'safe';
    }

    // Check country restrictions
    if (!wasBlocked && media.allowed_countries && media.allowed_countries.length > 0) {
      if (!country || !media.allowed_countries.includes(country)) {
        wasBlocked = true;
        serveType = 'safe';
      }
    }

    // Log the view
    await supabase.from('cloaker_media_views').insert({
      media_id: media.id,
      ip_address: ip,
      user_agent: userAgent,
      country,
      device_type: deviceType,
      browser,
      os,
      is_bot: isBotVisitor,
      is_vpn: false, // Would need external API for VPN detection
      was_blocked: wasBlocked,
      served_type: serveType,
      referrer,
    });

    // Increment view count
    await supabase
      .from('cloaker_media')
      .update({ total_views: (media.total_views || 0) + 1 })
      .eq('id', media.id);

    // Determine what to serve
    let mediaUrl: string | null = null;
    let shouldRedirectToDestination = false;

    if (serveType === 'safe') {
      // Serve safe media for bots/blocked
      if (media.safe_url) {
        mediaUrl = media.safe_url;
      } else if (media.safe_file_path) {
        const { data } = supabase.storage
          .from('cloaker-media')
          .getPublicUrl(media.safe_file_path);
        mediaUrl = data.publicUrl;
      }
    } else {
      // For real users: redirect to destination URL if available
      if (media.destination_url) {
        shouldRedirectToDestination = true;
        mediaUrl = media.destination_url;
      } else if (media.offer_url) {
        mediaUrl = media.offer_url;
      } else if (media.offer_file_path) {
        const { data } = supabase.storage
          .from('cloaker-media')
          .getPublicUrl(media.offer_file_path);
        mediaUrl = data.publicUrl;
      }
    }

    if (!mediaUrl) {
      return new Response(JSON.stringify({ error: 'No media configured' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Redirect to destination or media
    if (url.searchParams.get('redirect') === 'true' || shouldRedirectToDestination) {
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': mediaUrl,
        },
      });
    }

    // Option 2: Return media info as JSON
    return new Response(JSON.stringify({
      url: mediaUrl,
      type: media.media_type,
      served: serveType,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Cloaker media error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
