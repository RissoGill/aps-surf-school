import { supabase } from "@/integrations/supabase/client";

export interface PackBalance {
  athleteId: string;
  totalTokens: number;
  usedTokens: number;
  balance: number;
  isNegative: boolean;
  isExhausted: boolean;
  packType: string;
  purchaseDate: string;
}

export async function calculatePackBalance(athleteId: string): Promise<PackBalance | null> {
  // Get athlete plan_type
  const { data: athlete, error: athleteError } = await supabase
    .from('atletas')
    .select('plan_type')
    .eq('athlete_id', athleteId)
    .single();

  if (athleteError || !athlete) {
    console.error('Error fetching athlete:', athleteError);
    return null;
  }

  // Get active pack
  const { data: pack, error: packError } = await supabase
    .from('packs')
    .select('*')
    .eq('athlete_id', athleteId)
    .eq('active', true)
    .order('purchase_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (packError) {
    console.error('Error fetching pack:', packError);
    return null;
  }

  // If no active pack found, try payment-based fallback
  if (!pack) {
    console.info('No active pack in packs table, trying payment fallback for athlete', athleteId);
    
    // Query latest pack payment
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('athlete_id', athleteId)
      .in('plan_type', ['pack1', 'pack5', 'pack10'])
      .not('payment_date', 'is', null)
      .order('payment_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (paymentError) {
      console.error('Error fetching payment:', paymentError);
      return null;
    }

    if (!payment) {
      console.info('No pack payment found for athlete', athleteId);
      return null;
    }

    console.info('Found pack payment fallback', { athleteId, paymentId: payment.payment_id, planType: payment.plan_type, paymentDate: payment.payment_date });

    // Derive totalTokens from plan_type
    const planTypeMap: Record<string, number> = {
      pack1: 1,
      pack5: 5,
      pack10: 10,
    };
    const totalTokens = planTypeMap[payment.plan_type] || 0;

    // Count attendance since payment date
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('attendance')
      .select('date, status')
      .eq('athlete_id', athleteId)
      .gte('date', payment.payment_date)
      .eq('status', 'Present');

    if (attendanceError) {
      console.error('Error fetching attendance for payment fallback:', attendanceError);
    }

    const actualUsedTokens = attendanceRecords?.length || 0;
    const balance = totalTokens - actualUsedTokens;

    return {
      athleteId,
      totalTokens,
      usedTokens: actualUsedTokens,
      balance,
      isNegative: balance < 0,
      isExhausted: balance === 0,
      packType: payment.plan_type,
      purchaseDate: payment.payment_date,
    };
  }

  // Use pack from packs table
  const totalTokens = parseInt(pack.total_tokens) || 0;

  // Count actual attendance from purchase date
  const { data: attendanceRecords, error: attendanceError } = await supabase
    .from('attendance')
    .select('date, status')
    .eq('athlete_id', athleteId)
    .gte('date', pack.purchase_date)
    .eq('status', 'Present');

  if (attendanceError) {
    console.error('Error fetching attendance:', attendanceError);
  }

  const actualUsedTokens = attendanceRecords?.length || 0;
  const balance = totalTokens - actualUsedTokens;

  return {
    athleteId,
    totalTokens,
    usedTokens: actualUsedTokens,
    balance,
    isNegative: balance < 0,
    isExhausted: balance === 0,
    packType: athlete.plan_type,
    purchaseDate: pack.purchase_date,
  };
}
