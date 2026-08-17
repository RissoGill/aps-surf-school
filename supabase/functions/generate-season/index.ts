import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SEASON_MONTHS: { name: string; monthNumber: number }[] = [
  { name: 'September', monthNumber: 9 },
  { name: 'October', monthNumber: 10 },
  { name: 'November', monthNumber: 11 },
  { name: 'December', monthNumber: 12 },
  { name: 'January', monthNumber: 1 },
  { name: 'February', monthNumber: 2 },
  { name: 'March', monthNumber: 3 },
  { name: 'April', monthNumber: 4 },
  { name: 'May', monthNumber: 5 },
  { name: 'June', monthNumber: 6 },
  { name: 'July', monthNumber: 7 },
  { name: 'August', monthNumber: 8 },
];

const normalize = (s?: string) =>
  (s || '').trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    let body: { userId?: string; seasonStart?: number };
    try {
      body = await req.json();
    } catch {
      return json({ ok: false, error: 'Invalid JSON body' }, 400);
    }

    const { userId, seasonStart } = body;

    if (!userId || typeof userId !== 'string') {
      return json({ ok: false, error: 'Unauthorized: missing userId' }, 401);
    }

    if (
      typeof seasonStart !== 'number' ||
      !Number.isInteger(seasonStart) ||
      seasonStart < 2000 ||
      seasonStart > 2100
    ) {
      return json({ ok: false, error: 'Invalid seasonStart (expected a year between 2000 and 2100)' }, 400);
    }

    // Legacy auth: verify the requester is a super_admin
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('users')
      .select('admin_id, admin_role')
      .eq('admin_id', userId)
      .maybeSingle();

    if (adminError || !adminData || adminData.admin_role !== 'super_admin') {
      console.error('Forbidden generate-season attempt by:', userId);
      return json({ ok: false, error: 'Forbidden: super_admin role required' }, 403);
    }

    const [athletesRes, existingRes, allPaymentsRes] = await Promise.all([
      supabaseAdmin.from('atletas').select('athlete_id, plan_type').eq('is_active', true).limit(10000),
      supabaseAdmin
        .from('payments')
        .select('athlete_id, month, year')
        .in('year', [seasonStart, seasonStart + 1])
        .limit(10000),
      supabaseAdmin.from('payments').select('payment_id').limit(10000),
    ]);

    if (athletesRes.error) throw athletesRes.error;
    if (existingRes.error) throw existingRes.error;
    if (allPaymentsRes.error) throw allPaymentsRes.error;

    const monthlyAthletes = (athletesRes.data || []).filter((a) => {
      const plan = (a.plan_type || '').toLowerCase().trim();
      return plan === '' || (!plan.startsWith('pack') && plan !== 'daily');
    });

    const existingKeys = new Set(
      (existingRes.data || []).map((p) => `${p.athlete_id}|${normalize(p.month as string)}|${Number(p.year)}`),
    );

    let nextId = (allPaymentsRes.data || []).reduce((max: number, p) => {
      const n = parseInt(String(p.payment_id || '').replace(/^\D+/, ''), 10);
      return Number.isFinite(n) && n > max ? n : max;
    }, 0) + 1;

    const rows: Record<string, unknown>[] = [];
    for (const a of monthlyAthletes) {
      for (const { name, monthNumber } of SEASON_MONTHS) {
        const year = monthNumber >= 9 ? seasonStart : seasonStart + 1;
        const key = `${a.athlete_id}|${normalize(name)}|${year}`;
        if (existingKeys.has(key)) continue;
        rows.push({
          payment_id: `PAY${nextId++}`,
          athlete_id: a.athlete_id,
          month: name,
          year,
          amount_due: 0,
          amount_paid: 0,
          status: 'Unpaid',
        });
      }
    }

    if (rows.length === 0) {
      return json({ ok: true, created: 0 });
    }

    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await supabaseAdmin.from('payments').insert(rows.slice(i, i + 500));
      if (error) {
        console.error('Payment insert failed:', error);
        throw error;
      }
    }

    console.info(`generate-season created ${rows.length} payments for season ${seasonStart}/${seasonStart + 1}`);
    return json({ ok: true, created: rows.length });
  } catch (error) {
    console.error('Error in generate-season function:', error);
    return json({ ok: false, error: 'Internal server error' }, 500);
  }
});
