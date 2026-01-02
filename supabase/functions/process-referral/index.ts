import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { referral_code, referred_id } = await req.json();

    if (!referral_code || !referred_id) {
      return new Response(
        JSON.stringify({ error: "Missing referral_code or referred_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Processing referral:", { referral_code, referred_id });

    // Use service role to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Normalize the referral code
    const codeToMatch = referral_code.toLowerCase();

    // Find the referrer by matching the first 8 chars of user_id
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("user_id");

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return new Response(
        JSON.stringify({ error: "Error fetching profiles" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find the referrer whose user_id starts with the referral code
    const referrerProfile = profiles?.find(p => 
      p.user_id.substring(0, 8).toLowerCase() === codeToMatch
    );

    if (!referrerProfile) {
      console.log("Referrer not found for code:", referral_code);
      return new Response(
        JSON.stringify({ error: "Referrer not found", code: referral_code }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const referrerId = referrerProfile.user_id;

    // Prevent self-referral
    if (referrerId === referred_id) {
      console.log("Self-referral attempted");
      return new Response(
        JSON.stringify({ error: "Self-referral not allowed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if referral already exists
    const { data: existingReferral } = await supabaseAdmin
      .from("referrals")
      .select("id")
      .eq("referred_id", referred_id)
      .maybeSingle();

    if (existingReferral) {
      console.log("Referral already exists for this user");
      return new Response(
        JSON.stringify({ message: "Referral already exists", id: existingReferral.id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the referral record
    const { data: referral, error: refError } = await supabaseAdmin
      .from("referrals")
      .insert({
        referrer_id: referrerId,
        referred_id: referred_id,
        referral_code: referral_code.toUpperCase(),
        status: "pending",
      })
      .select()
      .single();

    if (refError) {
      console.error("Error creating referral:", refError);
      return new Response(
        JSON.stringify({ error: "Error creating referral", details: refError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Referral created successfully:", referral);

    return new Response(
      JSON.stringify({ success: true, referral }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Unexpected error", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
