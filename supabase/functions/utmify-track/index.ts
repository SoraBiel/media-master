import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const UTMIFY_API_URL = 'https://api.utmify.com.br/api/v1/sales';

interface UTMifyEvent {
  api_token: string;
  orderId: string;
  platform: string;
  paymentMethod: string;
  status: 'pending' | 'approved' | 'refused' | 'refunded' | 'chargeback';
  createdAt: string;
  approvedAt?: string;
  refundedAt?: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
    document?: string;
  };
  products: Array<{
    id: string;
    name: string;
    planId?: string;
    planName?: string;
    quantity: number;
    priceInCents: number;
  }>;
  producer?: {
    name?: string;
    document?: string;
    email?: string;
  };
  commission?: {
    totalPriceInCents: number;
    source?: string;
  };
  trackingParameters?: {
    src?: string;
    sck?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
  };
}

// Store sent events to prevent duplicates (in-memory, per instance)
const sentEvents = new Map<string, string>();

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, payment_id, user_id, event_type } = await req.json();
    console.log(`UTMify track called: action=${action}, payment_id=${payment_id}, event_type=${event_type}`);

    if (action === 'track_event') {
      // Get UTMify integration for user
      const { data: utmifyIntegration, error: intError } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user_id)
        .eq('provider', 'utmify')
        .eq('tracking_enabled', true)
        .maybeSingle();

      if (intError) {
        console.error('Error fetching UTMify integration:', intError);
        return new Response(JSON.stringify({ error: 'Integration error' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!utmifyIntegration || !utmifyIntegration.api_token) {
        console.log('UTMify tracking not enabled or no token for user:', user_id);
        return new Response(JSON.stringify({ ok: true, skipped: true, reason: 'tracking_disabled' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get payment details
      const { data: payment, error: paymentError } = await supabase
        .from('funnel_payments')
        .select('*, funnel_products(*)')
        .eq('id', payment_id)
        .maybeSingle();

      if (paymentError || !payment) {
        console.error('Payment not found:', payment_id);
        return new Response(JSON.stringify({ error: 'Payment not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check for duplicate (idempotency by order_id + event_type)
      const idempotencyKey = `${payment.provider_payment_id}:${event_type}`;
      if (sentEvents.has(idempotencyKey)) {
        console.log('Duplicate event, skipping:', idempotencyKey);
        return new Response(JSON.stringify({ ok: true, skipped: true, reason: 'duplicate' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Map our status to UTMify status
      let utmifyStatus: UTMifyEvent['status'];
      switch (event_type) {
        case 'pending':
          utmifyStatus = 'pending';
          break;
        case 'approved':
          utmifyStatus = 'approved';
          break;
        case 'refused':
        case 'expired':
        case 'cancelled':
          utmifyStatus = 'refused';
          break;
        case 'refunded':
          utmifyStatus = 'refunded';
          break;
        case 'chargeback':
        case 'charged_back':
          utmifyStatus = 'chargeback';
          break;
        default:
          utmifyStatus = 'pending';
      }

      const product = payment.funnel_products;

      // Build UTMify payload
      const utmifyPayload: UTMifyEvent = {
        api_token: utmifyIntegration.api_token,
        orderId: String(payment.provider_payment_id || payment.id),
        platform: 'nexo_funnels',
        paymentMethod: 'pix',
        status: utmifyStatus,
        createdAt: payment.created_at,
        customer: {
          name: payment.lead_name || 'Cliente',
          email: `lead_${payment.lead_chat_id}@telegram.user`, // Placeholder email
          phone: undefined,
          document: undefined,
        },
        products: [
          {
            id: product?.id || payment.product_id || 'unknown',
            name: product?.name || 'Produto',
            quantity: 1,
            priceInCents: payment.amount_cents,
          },
        ],
        trackingParameters: {
          utm_source: payment.utm_source || undefined,
          utm_medium: payment.utm_medium || undefined,
          utm_campaign: payment.utm_campaign || undefined,
          utm_content: payment.utm_content || undefined,
          utm_term: payment.utm_term || undefined,
        },
      };

      // Add timestamps based on status
      if (utmifyStatus === 'approved' && payment.paid_at) {
        utmifyPayload.approvedAt = payment.paid_at;
      }
      if (utmifyStatus === 'refunded') {
        utmifyPayload.refundedAt = new Date().toISOString();
      }

      console.log('Sending to UTMify:', JSON.stringify(utmifyPayload).slice(0, 500));

      // Send to UTMify API
      const utmifyResponse = await fetch(UTMIFY_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-token': utmifyIntegration.api_token,
        },
        body: JSON.stringify(utmifyPayload),
      });

      const utmifyResult = await utmifyResponse.text();
      console.log('UTMify response:', utmifyResponse.status, utmifyResult);

      if (!utmifyResponse.ok) {
        console.error('UTMify API error:', utmifyResponse.status, utmifyResult);
        // Don't fail the whole request, just log the error
        return new Response(JSON.stringify({ 
          ok: false, 
          error: 'UTMify API error', 
          status: utmifyResponse.status,
          details: utmifyResult 
        }), {
          status: 200, // Return 200 to not block the caller
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Mark as sent to prevent duplicates
      sentEvents.set(idempotencyKey, new Date().toISOString());

      return new Response(JSON.stringify({ ok: true, sent: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in utmify-track:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
