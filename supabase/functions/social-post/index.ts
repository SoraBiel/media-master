import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "node:crypto";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

// Twitter credentials
const TWITTER_API_KEY = Deno.env.get("TWITTER_CONSUMER_KEY")?.trim();
const TWITTER_API_SECRET = Deno.env.get("TWITTER_CONSUMER_SECRET")?.trim();
const TWITTER_ACCESS_TOKEN = Deno.env.get("TWITTER_ACCESS_TOKEN")?.trim();
const TWITTER_ACCESS_TOKEN_SECRET = Deno.env.get("TWITTER_ACCESS_TOKEN_SECRET")?.trim();

function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  const signatureBaseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(
    Object.entries(params)
      .sort()
      .map(([k, v]) => `${k}=${v}`)
      .join("&")
  )}`;
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  const hmacSha1 = createHmac("sha1", signingKey);
  return hmacSha1.update(signatureBaseString).digest("base64");
}

function generateOAuthHeader(method: string, url: string): string {
  const oauthParams = {
    oauth_consumer_key: TWITTER_API_KEY!,
    oauth_nonce: Math.random().toString(36).substring(2),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: TWITTER_ACCESS_TOKEN!,
    oauth_version: "1.0",
  };

  const signature = generateOAuthSignature(
    method,
    url,
    oauthParams,
    TWITTER_API_SECRET!,
    TWITTER_ACCESS_TOKEN_SECRET!
  );

  const signedOAuthParams = {
    ...oauthParams,
    oauth_signature: signature,
  };

  return (
    "OAuth " +
    Object.entries(signedOAuthParams)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
      .join(", ")
  );
}

async function postToTwitter(content: string): Promise<{ success: boolean; post_id?: string; error?: string }> {
  if (!TWITTER_API_KEY || !TWITTER_API_SECRET || !TWITTER_ACCESS_TOKEN || !TWITTER_ACCESS_TOKEN_SECRET) {
    return { success: false, error: 'Twitter credentials not configured' };
  }

  const url = "https://api.x.com/2/tweets";
  const oauthHeader = generateOAuthHeader("POST", url);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: oauthHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: content }),
    });

    const data = await response.json();
    console.log('Twitter response:', data);

    if (!response.ok) {
      return { success: false, error: data.detail || data.title || 'Failed to post' };
    }

    return { success: true, post_id: data.data?.id };
  } catch (error: unknown) {
    console.error('Twitter error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

async function postToMeta(
  platform: string, 
  content: string, 
  accessToken: string,
  mediaUrls?: string[]
): Promise<{ success: boolean; post_id?: string; error?: string }> {
  try {
    if (platform === 'facebook') {
      // Get user's pages
      const pagesResponse = await fetch(`https://graph.facebook.com/me/accounts?access_token=${accessToken}`);
      const pagesData = await pagesResponse.json();
      
      if (!pagesData.data || pagesData.data.length === 0) {
        return { success: false, error: 'No Facebook pages found' };
      }

      const page = pagesData.data[0];
      const pageAccessToken = page.access_token;

      // Post to page
      let postUrl = `https://graph.facebook.com/${page.id}/feed`;
      let postBody: any = { message: content, access_token: pageAccessToken };

      if (mediaUrls && mediaUrls.length > 0) {
        // Post with photo
        postUrl = `https://graph.facebook.com/${page.id}/photos`;
        postBody = { 
          url: mediaUrls[0], 
          caption: content, 
          access_token: pageAccessToken 
        };
      }

      const postResponse = await fetch(postUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postBody),
      });

      const postData = await postResponse.json();
      console.log('Facebook response:', postData);

      if (postData.error) {
        return { success: false, error: postData.error.message };
      }

      return { success: true, post_id: postData.id || postData.post_id };
    }

    if (platform === 'instagram') {
      // Get Instagram business account
      const pagesResponse = await fetch(`https://graph.facebook.com/me/accounts?access_token=${accessToken}`);
      const pagesData = await pagesResponse.json();
      
      if (!pagesData.data || pagesData.data.length === 0) {
        return { success: false, error: 'No connected pages found' };
      }

      const pageId = pagesData.data[0].id;
      const igResponse = await fetch(`https://graph.facebook.com/${pageId}?fields=instagram_business_account&access_token=${accessToken}`);
      const igData = await igResponse.json();

      if (!igData.instagram_business_account) {
        return { success: false, error: 'No Instagram business account connected' };
      }

      const igAccountId = igData.instagram_business_account.id;

      if (!mediaUrls || mediaUrls.length === 0) {
        return { success: false, error: 'Instagram requires at least one image' };
      }

      // Create media container
      const containerResponse = await fetch(`https://graph.facebook.com/${igAccountId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: mediaUrls[0],
          caption: content,
          access_token: accessToken,
        }),
      });

      const containerData = await containerResponse.json();
      console.log('Instagram container:', containerData);

      if (containerData.error) {
        return { success: false, error: containerData.error.message };
      }

      // Publish the container
      const publishResponse = await fetch(`https://graph.facebook.com/${igAccountId}/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: containerData.id,
          access_token: accessToken,
        }),
      });

      const publishData = await publishResponse.json();
      console.log('Instagram publish:', publishData);

      if (publishData.error) {
        return { success: false, error: publishData.error.message };
      }

      return { success: true, post_id: publishData.id };
    }

    if (platform === 'threads') {
      // Get user ID for Threads
      const userResponse = await fetch(`https://graph.threads.net/me?access_token=${accessToken}`);
      const userData = await userResponse.json();
      
      if (userData.error) {
        return { success: false, error: userData.error.message };
      }

      const userId = userData.id;

      // Create container
      let containerBody: any = {
        media_type: 'TEXT',
        text: content,
        access_token: accessToken,
      };

      if (mediaUrls && mediaUrls.length > 0) {
        containerBody = {
          media_type: 'IMAGE',
          image_url: mediaUrls[0],
          text: content,
          access_token: accessToken,
        };
      }

      const containerResponse = await fetch(`https://graph.threads.net/${userId}/threads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(containerBody),
      });

      const containerData = await containerResponse.json();
      console.log('Threads container:', containerData);

      if (containerData.error) {
        return { success: false, error: containerData.error.message };
      }

      // Publish
      const publishResponse = await fetch(`https://graph.threads.net/${userId}/threads_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: containerData.id,
          access_token: accessToken,
        }),
      });

      const publishData = await publishResponse.json();
      console.log('Threads publish:', publishData);

      if (publishData.error) {
        return { success: false, error: publishData.error.message };
      }

      return { success: true, post_id: publishData.id };
    }

    return { success: false, error: 'Unsupported platform' };
  } catch (error: unknown) {
    console.error(`${platform} error:`, error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

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

    const { post_id, platforms, content, media_urls } = await req.json();
    console.log(`Publishing to platforms: ${platforms.join(', ')}`);

    const results: Record<string, { success: boolean; post_id?: string; error?: string }> = {};

    for (const platform of platforms) {
      if (platform === 'x') {
        results[platform] = await postToTwitter(content);
      } else {
        // Get user's social account for this platform
        const { data: account, error: accountError } = await supabase
          .from('social_accounts')
          .select('access_token')
          .eq('user_id', user.id)
          .eq('platform', platform)
          .eq('is_connected', true)
          .single();

        if (accountError || !account) {
          results[platform] = { success: false, error: 'Account not connected' };
          continue;
        }

        results[platform] = await postToMeta(platform, content, account.access_token, media_urls);
      }

      // Update post_platform_logs
      if (post_id) {
        await supabase
          .from('post_platform_logs')
          .update({
            status: results[platform].success ? 'published' : 'failed',
            platform_post_id: results[platform].post_id,
            error_message: results[platform].error,
            posted_at: results[platform].success ? new Date().toISOString() : null,
          })
          .eq('post_id', post_id)
          .eq('platform', platform);
      }
    }

    // Update scheduled_posts status
    if (post_id) {
      const allSuccess = Object.values(results).every(r => r.success);
      const anySuccess = Object.values(results).some(r => r.success);
      
      await supabase
        .from('scheduled_posts')
        .update({
          status: allSuccess ? 'published' : anySuccess ? 'partial' : 'failed',
        })
        .eq('id', post_id);
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Post error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
