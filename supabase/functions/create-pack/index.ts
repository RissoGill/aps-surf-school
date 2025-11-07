import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreatePackRequest {
  athleteId: string;
  planType: 'pack1' | 'pack5' | 'pack10';
  paymentDate: string; // YYYY-MM-DD
  paymentId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ ok: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ ok: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: roles, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (roleError || !roles?.some(r => r.role === 'admin' || r.role === 'super_admin')) {
      console.error('User not admin:', user.id);
      return new Response(
        JSON.stringify({ ok: false, error: 'Forbidden: Admin role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate request
    const body: CreatePackRequest = await req.json();
    const { athleteId, planType, paymentDate, paymentId } = body;

    if (!athleteId || !planType || !paymentDate || !paymentId) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate plan type and extract tokens
    const tokenMatch = planType.match(/pack(\d+)/);
    if (!tokenMatch) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Invalid plan type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const totalTokens = tokenMatch[1];

    // Check for idempotency - if pack already exists with this payment_id, return success
    const { data: existingPackByPayment } = await supabaseAdmin
      .from('packs')
      .select('id')
      .eq('payment_id', paymentId)
      .maybeSingle();

    if (existingPackByPayment) {
      console.info('Pack already exists for payment:', paymentId);
      return new Response(
        JSON.stringify({ ok: true, packId: existingPackByPayment.id, message: 'Pack already exists' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get existing active pack for balance calculation
    const { data: existingPack } = await supabaseAdmin
      .from('packs')
      .select('*')
      .eq('athlete_id', athleteId)
      .eq('active', true)
      .order('purchase_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    let carriedOverTokens = 0;

    // Calculate negative balance to carry forward
    if (existingPack) {
      const existingTotal = parseInt(existingPack.total_tokens) || 0;
      const existingUsed = parseInt(existingPack.used_tokens) || 0;
      const balance = existingTotal - existingUsed;

      if (balance < 0) {
        carriedOverTokens = Math.abs(balance);
        console.info(`Carrying over ${carriedOverTokens} negative tokens from pack ${existingPack.id}`);
      }

      // Deactivate the old pack
      const { error: deactivateError } = await supabaseAdmin
        .from('packs')
        .update({ active: false })
        .eq('id', existingPack.id);

      if (deactivateError) {
        console.error('Failed to deactivate old pack:', deactivateError);
        throw deactivateError;
      }
    }

    // Generate pack ID
    const ymd = paymentDate.replace(/-/g, '');
    const packId = `pack${totalTokens}-${athleteId}-${ymd}`;

    // Insert new pack using service role (bypasses RLS)
    const { error: insertError } = await supabaseAdmin
      .from('packs')
      .insert({
        id: packId,
        athlete_id: athleteId,
        total_tokens: totalTokens,
        used_tokens: carriedOverTokens.toString(),
        purchase_date: paymentDate,
        active: true,
        payment_id: paymentId,
      });

    if (insertError) {
      console.error('Pack insert failed:', insertError);
      throw insertError;
    }

    console.info('Pack created successfully:', { packId, athleteId, totalTokens, paymentId });

    // Update athlete's plan_type
    const { error: updateError } = await supabaseAdmin
      .from('atletas')
      .update({ plan_type: planType })
      .eq('athlete_id', athleteId);

    if (updateError) {
      console.warn('Failed to update athlete plan_type:', updateError);
    }

    return new Response(
      JSON.stringify({ ok: true, packId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in create-pack function:', error);
    return new Response(
      JSON.stringify({ ok: false, error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
