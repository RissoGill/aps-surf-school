import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation helpers
const isValidAthleteId = (id: unknown): id is string =>
  typeof id === 'string' && /^A\d{1,4}$/.test(id);

const isValidPlanType = (planType: unknown): planType is 'pack1' | 'pack5' | 'pack10' =>
  typeof planType === 'string' && ['pack1', 'pack5', 'pack10'].includes(planType);

const isValidDate = (date: unknown): date is string =>
  typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date);

const isValidPaymentId = (id: unknown): id is string =>
  typeof id === 'string' && id.length > 0 && id.length <= 100;

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
    // Create service role client (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    let body: CreatePackRequest & { role?: string; userId?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ ok: false, error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Legacy auth: verify admin credentials against users table
    const { role, userId } = body;
    if (!userId || !role) {
      console.error('Missing userId or role in request body');
      return new Response(
        JSON.stringify({ ok: false, error: 'Unauthorized: missing credentials' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('users')
      .select('admin_id, admin_role')
      .eq('admin_id', userId)
      .single();

    if (adminError || !adminData || !['admin', 'super_admin'].includes(adminData.admin_role || '')) {
      console.error('User not admin:', userId);
      return new Response(
        JSON.stringify({ ok: false, error: 'Forbidden: Admin role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { athleteId, planType, paymentDate, paymentId } = body;

    // Validate all required fields with strict validation
    if (!isValidAthleteId(athleteId)) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Invalid athleteId format (must be A followed by 1-4 digits)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isValidPlanType(planType)) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Invalid planType (must be pack1, pack5, or pack10)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isValidDate(paymentDate)) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Invalid paymentDate format (must be YYYY-MM-DD)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isValidPaymentId(paymentId)) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Invalid paymentId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify athlete exists
    const { data: athlete, error: athleteError } = await supabaseAdmin
      .from('atletas')
      .select('athlete_id')
      .eq('athlete_id', athleteId)
      .maybeSingle();

    if (athleteError || !athlete) {
      console.error('Athlete not found:', athleteId);
      return new Response(
        JSON.stringify({ ok: false, error: 'Athlete not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract tokens from validated plan type
    const tokenMap: Record<string, string> = { pack1: '1', pack5: '5', pack10: '10' };
    const totalTokens = tokenMap[planType];

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

  } catch (error: unknown) {
    console.error('Error in create-pack function:', error);
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
