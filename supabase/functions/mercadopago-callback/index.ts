import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const clientId = Deno.env.get('MERCADOPAGO_CLIENT_ID');
    const clientSecret = Deno.env.get('MERCADOPAGO_CLIENT_SECRET');
    const appUrl = Deno.env.get('APP_URL') || 'https://preview--nexotelegram.lovable.app';

    if (error) {
      console.error('OAuth error:', error);
      return Response.redirect(`${appUrl}/integrations?error=${error}`, 302);
    }

    if (!code || !state) {
      return Response.redirect(`${appUrl}/integrations?error=missing_params`, 302);
    }

    // Decode state
    let stateData;
    try {
      stateData = JSON.parse(atob(state));
    } catch {
      return Response.redirect(`${appUrl}/integrations?error=invalid_state`, 302);
    }

    const { user_id, environment } = stateData;

    if (!user_id) {
      return Response.redirect(`${appUrl}/integrations?error=missing_user`, 302);
    }

    // Exchange code for tokens
    const redirectUri = `${supabaseUrl}/functions/v1/mercadopago-callback`;
    
    const tokenResponse = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId!,
        client_secret: clientSecret!,
        code: code,
        redirect_uri: redirectUri
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokenData);
      return Response.redirect(`${appUrl}/integrations?error=token_exchange_failed`, 302);
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
        user_id: user_id,
        provider: 'mercadopago',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: expiresAt,
        provider_user_id: String(tokenData.user_id),
        provider_email: userInfo.email || null,
        provider_name: `${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim() || null,
        environment: environment || 'sandbox',
        status: 'active',
        last_sync_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,provider'
      });

    if (upsertError) {
      console.error('Failed to save integration:', upsertError);
      return Response.redirect(`${appUrl}/integrations?error=save_failed`, 302);
    }

    console.log('Successfully connected Mercado Pago for user:', user_id);
    return Response.redirect(`${appUrl}/integrations?success=true`, 302);

  } catch (error) {
    console.error('Error in mercadopago-callback:', error);
    const appUrl = Deno.env.get('APP_URL') || 'https://preview--nexotelegram.lovable.app';
    return Response.redirect(`${appUrl}/integrations?error=unknown`, 302);
  }
});
