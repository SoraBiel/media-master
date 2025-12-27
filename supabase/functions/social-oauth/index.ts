import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

// Meta OAuth URLs
const META_AUTH_URL = 'https://www.facebook.com/v18.0/dialog/oauth';
const META_TOKEN_URL = 'https://graph.facebook.com/v18.0/oauth/access_token';
const META_APP_ID = Deno.env.get('META_APP_ID');
const META_APP_SECRET = Deno.env.get('META_APP_SECRET');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, platform, code, redirect_uri } = await req.json();
    console.log(`OAuth action: ${action}, platform: ${platform}`);

    if (action === 'get_auth_url') {
      let authUrl = '';
      
      if (platform === 'instagram' || platform === 'facebook' || platform === 'threads') {
        // Meta OAuth - same for Instagram, Facebook, and Threads
        const scopes = platform === 'instagram' 
          ? 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement'
          : platform === 'threads'
          ? 'threads_basic,threads_content_publish'
          : 'pages_show_list,pages_read_engagement,pages_manage_posts,public_profile';
        
        const state = JSON.stringify({ platform, user_id: user.id });
        authUrl = `${META_AUTH_URL}?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=${encodeURIComponent(scopes)}&response_type=code&state=${encodeURIComponent(state)}`;
      } else if (platform === 'x') {
        // Twitter uses OAuth 1.0a - we'll handle it differently
        return new Response(JSON.stringify({ 
          error: 'Twitter/X requires OAuth 1.0a setup. Please configure access tokens directly.',
          setup_instructions: 'Go to developer.twitter.com, create an app, and get your Access Token and Access Token Secret'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ auth_url: authUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'exchange_code') {
      if (platform === 'instagram' || platform === 'facebook' || platform === 'threads') {
        // Exchange code for access token
        const tokenResponse = await fetch(`${META_TOKEN_URL}?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirect_uri)}&client_secret=${META_APP_SECRET}&code=${code}`);
        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
          console.error('Meta token error:', tokenData);
          return new Response(JSON.stringify({ error: tokenData.error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get user info
        const userInfoResponse = await fetch(`https://graph.facebook.com/me?access_token=${tokenData.access_token}&fields=id,name`);
        const userInfo = await userInfoResponse.json();

        // For Instagram, get Instagram account info
        let accountInfo = userInfo;
        if (platform === 'instagram') {
          const pagesResponse = await fetch(`https://graph.facebook.com/me/accounts?access_token=${tokenData.access_token}`);
          const pagesData = await pagesResponse.json();
          
          if (pagesData.data && pagesData.data.length > 0) {
            const pageId = pagesData.data[0].id;
            const igResponse = await fetch(`https://graph.facebook.com/${pageId}?fields=instagram_business_account&access_token=${tokenData.access_token}`);
            const igData = await igResponse.json();
            
            if (igData.instagram_business_account) {
              const igUserResponse = await fetch(`https://graph.facebook.com/${igData.instagram_business_account.id}?fields=id,username,name,profile_picture_url&access_token=${tokenData.access_token}`);
              accountInfo = await igUserResponse.json();
            }
          }
        }

        // Get long-lived token
        const longTokenResponse = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${tokenData.access_token}`);
        const longTokenData = await longTokenResponse.json();

        // Save to database
        const { error: insertError } = await supabase
          .from('social_accounts')
          .upsert({
            user_id: user.id,
            platform: platform,
            platform_user_id: accountInfo.id || userInfo.id,
            account_name: accountInfo.name || userInfo.name,
            account_username: accountInfo.username || null,
            account_avatar_url: accountInfo.profile_picture_url || null,
            access_token: longTokenData.access_token || tokenData.access_token,
            token_expires_at: longTokenData.expires_in 
              ? new Date(Date.now() + longTokenData.expires_in * 1000).toISOString()
              : null,
            is_connected: true,
            last_used_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,platform'
          });

        if (insertError) {
          console.error('Insert error:', insertError);
          return new Response(JSON.stringify({ error: 'Failed to save account' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ 
          success: true, 
          account: {
            platform,
            name: accountInfo.name || userInfo.name,
            username: accountInfo.username
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('OAuth error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
