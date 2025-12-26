import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MERCADOPAGO_AUTH_URL = 'https://auth.mercadopago.com/authorization';
const MERCADOPAGO_TOKEN_URL = 'https://api.mercadopago.com/oauth/token';

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { action, code, environment = 'sandbox' } = body;

    // Get user's integration to get client credentials
    const { data: integration } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'mercadopago')
      .maybeSingle();

    // For now, we'll use environment variables for the app credentials
    // In production, each user would have their own app credentials
    const clientId = Deno.env.get('MERCADOPAGO_CLIENT_ID');
    const clientSecret = Deno.env.get('MERCADOPAGO_CLIENT_SECRET');
    const redirectUri = Deno.env.get('MERCADOPAGO_REDIRECT_URI') || `${supabaseUrl}/functions/v1/mercadopago-callback`;

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: 'Mercado Pago credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (action) {
      case 'get_auth_url': {
        // Generate OAuth authorization URL
        const state = btoa(JSON.stringify({ user_id: user.id, environment }));
        
        // Log the configuration for debugging
        console.log('Generating auth URL with:', {
          clientId: clientId ? `${clientId.substring(0, 10)}...` : 'NOT SET',
          redirectUri,
          environment
        });
        
        // Mercado Pago OAuth URL format
        const authUrl = new URL(MERCADOPAGO_AUTH_URL);
        authUrl.searchParams.set('client_id', clientId);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('platform_id', 'mp');
        authUrl.searchParams.set('state', state);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        
        console.log('Generated auth URL:', authUrl.toString());
        
        return new Response(
          JSON.stringify({ auth_url: authUrl.toString() }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'exchange_code': {
        // Exchange authorization code for tokens
        if (!code) {
          return new Response(
            JSON.stringify({ error: 'Authorization code required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const tokenResponse = await fetch(MERCADOPAGO_TOKEN_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: clientId,
            client_secret: clientSecret,
            code: code,
            redirect_uri: redirectUri
          })
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
          console.error('Token exchange failed:', tokenData);
          return new Response(
            JSON.stringify({ error: 'Failed to exchange code', details: tokenData }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get user info from Mercado Pago
        const userInfoResponse = await fetch('https://api.mercadopago.com/users/me', {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`
          }
        });
        const userInfo = await userInfoResponse.json();

        // Calculate token expiration
        const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString();

        // Upsert integration
        const { error: upsertError } = await supabase
          .from('integrations')
          .upsert({
            user_id: user.id,
            provider: 'mercadopago',
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            token_expires_at: expiresAt,
            provider_user_id: String(tokenData.user_id),
            provider_email: userInfo.email || null,
            provider_name: `${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim() || null,
            environment: environment,
            status: 'active',
            last_sync_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,provider'
          });

        if (upsertError) {
          console.error('Failed to save integration:', upsertError);
          return new Response(
            JSON.stringify({ error: 'Failed to save integration' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'refresh_token': {
        if (!integration?.refresh_token) {
          return new Response(
            JSON.stringify({ error: 'No refresh token available' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const tokenResponse = await fetch(MERCADOPAGO_TOKEN_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: integration.refresh_token
          })
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
          console.error('Token refresh failed:', tokenData);
          return new Response(
            JSON.stringify({ error: 'Failed to refresh token' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString();

        // Update integration
        await supabase
          .from('integrations')
          .update({
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            token_expires_at: expiresAt,
            last_sync_at: new Date().toISOString()
          })
          .eq('id', integration.id);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error in mercadopago-oauth:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
