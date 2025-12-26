import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// UTMify API endpoint
const UTMIFY_API_URL = 'https://api.utmify.com.br/api-credentials/orders';

// UTMify API payload format
interface UTMifyOrderPayload {
  orderId: string;
  platform: string;
  paymentMethod: 'credit_card' | 'boleto' | 'pix' | 'paypal' | 'free_price';
  status: 'waiting_payment' | 'paid' | 'refused' | 'refunded' | 'chargedback';
  createdAt: string; // YYYY-MM-DD HH:MM:SS UTC
  approvedDate?: string | null; // YYYY-MM-DD HH:MM:SS UTC
  refundedAt?: string | null; // YYYY-MM-DD HH:MM:SS UTC
  customer: {
    name: string;
    email: string;
    phone?: string | null;
    document?: string | null;
    country?: string;
    ip?: string;
  };
  products: Array<{
    id: string;
    name: string;
    planId?: string | null;
    planName?: string | null;
    quantity: number;
    priceInCents: number;
  }>;
  trackingParameters?: {
    src?: string | null;
    sck?: string | null;
    utm_source?: string | null;
    utm_campaign?: string | null;
    utm_medium?: string | null;
    utm_content?: string | null;
    utm_term?: string | null;
  };
  commission?: {
    totalPriceInCents: number;
    gatewayFeeInCents: number;
    userCommissionInCents: number;
    currency?: 'BRL' | 'USD' | 'EUR' | 'GBP' | 'ARS' | 'CAD';
  };
  isTest?: boolean;
}

// Store sent events to prevent duplicates (in-memory, per instance)
const sentEvents = new Map<string, string>();

// Helper to format date to YYYY-MM-DD HH:MM:SS format
function formatDateForUtmify(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, payment_id, user_id, event_type, api_token } = await req.json();
    console.log(`UTMify track called: action=${action}, payment_id=${payment_id}, event_type=${event_type}`);

    // Test API Token action - validates if the token works
    if (action === 'test_token') {
      if (!api_token) {
        return new Response(JSON.stringify({ ok: false, error: 'API Token não informado' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Testing UTMify API Token...');

      // Send a test request to validate the token with all required fields
      const testPayload: UTMifyOrderPayload = {
        orderId: `test_${Date.now()}`,
        platform: 'nexo_funnels',
        paymentMethod: 'pix',
        status: 'waiting_payment',
        createdAt: formatDateForUtmify(new Date().toISOString()),
        approvedDate: null,
        refundedAt: null,
        customer: {
          name: 'Teste Conexão Nexo',
          email: 'teste@nexo.app',
          phone: null,
          document: null,
        },
        products: [
          {
            id: 'test_product',
            name: 'Teste de Conexão',
            planId: null,
            planName: null,
            quantity: 1,
            priceInCents: 100,
          },
        ],
        trackingParameters: {
          src: null,
          sck: null,
          utm_source: 'nexo_test',
          utm_medium: 'api_test',
          utm_campaign: null,
          utm_content: null,
          utm_term: null,
        },
        commission: {
          totalPriceInCents: 100,
          gatewayFeeInCents: 0,
          userCommissionInCents: 100,
          currency: 'BRL',
        },
        isTest: true,
      };

      try {
        const testResponse = await fetch(UTMIFY_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-token': api_token,
          },
          body: JSON.stringify(testPayload),
        });

        const testResult = await testResponse.text();
        console.log('UTMify API test response:', testResponse.status, testResult);

        // Status 200, 201, 202, 204 means success
        if (testResponse.ok || testResponse.status === 204) {
          return new Response(JSON.stringify({ 
            ok: true, 
            valid: true, 
            message: 'Token válido! Conexão testada com sucesso.' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Status 401 or 403 means invalid/expired token
        if (testResponse.status === 401 || testResponse.status === 403) {
          return new Response(JSON.stringify({ 
            ok: false, 
            valid: false, 
            error: 'Token inválido ou expirado. Verifique a credencial na UTMify.',
            details: testResult 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Status 404 means wrong endpoint
        if (testResponse.status === 404) {
          return new Response(JSON.stringify({ 
            ok: false, 
            valid: false, 
            error: 'Endpoint não encontrado. Verifique se o token é válido.',
            details: testResult 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Other status codes
        return new Response(JSON.stringify({ 
          ok: false, 
          valid: false, 
          error: `Resposta inesperada: ${testResponse.status}`,
          details: testResult 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (fetchError) {
        console.error('UTMify API test fetch error:', fetchError);
        return new Response(JSON.stringify({ 
          ok: false, 
          valid: false, 
          error: 'Erro de conexão com UTMify. Tente novamente.',
          details: String(fetchError) 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

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

      // Check for API token
      const apiToken = utmifyIntegration?.api_token;
      if (!utmifyIntegration || !apiToken) {
        console.log('UTMify tracking not enabled or no API token for user:', user_id);
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
      const idempotencyKey = `${payment.provider_payment_id || payment.id}:${event_type}`;
      if (sentEvents.has(idempotencyKey)) {
        console.log('Duplicate event, skipping:', idempotencyKey);
        return new Response(JSON.stringify({ ok: true, skipped: true, reason: 'duplicate' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Map our status to UTMify status
      let utmifyStatus: UTMifyOrderPayload['status'];
      switch (event_type) {
        case 'pending':
          utmifyStatus = 'waiting_payment';
          break;
        case 'approved':
        case 'paid':
          utmifyStatus = 'paid';
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
          utmifyStatus = 'chargedback';
          break;
        default:
          utmifyStatus = 'waiting_payment';
      }

      const product = payment.funnel_products;

      // Build UTMify API payload with all required fields
      const utmifyPayload: UTMifyOrderPayload = {
        orderId: String(payment.provider_payment_id || payment.id),
        platform: 'nexo_funnels',
        paymentMethod: 'pix',
        status: utmifyStatus,
        createdAt: formatDateForUtmify(payment.created_at),
        // approvedDate is required even for pending - use null for non-paid
        approvedDate: (utmifyStatus === 'paid' && payment.paid_at) 
          ? formatDateForUtmify(payment.paid_at) 
          : null,
        refundedAt: utmifyStatus === 'refunded' 
          ? formatDateForUtmify(new Date().toISOString()) 
          : null,
        customer: {
          name: payment.lead_name || 'Cliente',
          email: `lead_${payment.lead_chat_id}@telegram.user`,
          phone: null,
          document: null,
        },
        products: [
          {
            id: product?.id || payment.product_id || 'unknown',
            name: product?.name || 'Produto',
            // planId and planName are required by UTMify
            planId: product?.id || payment.product_id || 'default_plan',
            planName: product?.name || 'Plano Padrão',
            quantity: 1,
            priceInCents: payment.amount_cents,
          },
        ],
        trackingParameters: {
          src: null,
          sck: null,
          utm_source: payment.utm_source || null,
          utm_medium: payment.utm_medium || null,
          utm_campaign: payment.utm_campaign || null,
          utm_content: payment.utm_content || null,
          utm_term: payment.utm_term || null,
        },
        commission: {
          totalPriceInCents: payment.amount_cents,
          gatewayFeeInCents: 0,
          userCommissionInCents: payment.amount_cents,
          currency: 'BRL',
        },
      };

      console.log('Sending to UTMify API:', JSON.stringify(utmifyPayload).slice(0, 500));

      // Send to UTMify API
      const utmifyResponse = await fetch(UTMIFY_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-token': apiToken,
        },
        body: JSON.stringify(utmifyPayload),
      });

      const utmifyResult = await utmifyResponse.text();
      console.log('UTMify API response:', utmifyResponse.status, utmifyResult);

      if (!utmifyResponse.ok && utmifyResponse.status !== 204) {
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
