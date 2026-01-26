import { supabase } from "@/integrations/supabase/client";

export interface DailyBalance {
  athleteId: string;
  totalTrainings: number;
  totalAmountDue: number;
  totalAmountPaid: number;
  outstandingBalance: number;
  dailyRate: number;
}

/**
 * Calculate the daily training balance for an athlete with plan_type = 'daily'
 * Returns total trainings attended, amounts due/paid, and outstanding balance
 */
export async function calculateDailyBalance(athleteId: string): Promise<DailyBalance | null> {
  // Get athlete daily_rate
  const { data: athlete, error: athleteError } = await supabase
    .from('atletas')
    .select('plan_type, daily_rate')
    .eq('athlete_id', athleteId)
    .single();

  if (athleteError || !athlete) {
    console.error('Error fetching athlete:', athleteError);
    return null;
  }

  // Only calculate for daily plan athletes
  if (athlete.plan_type !== 'daily') {
    return null;
  }

  const dailyRate = Number(athlete.daily_rate) || 35; // Default to 35 EUR

  // Get all daily payments for this athlete (current season: Sep 2025 - Sep 2026)
  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('amount_due, amount_paid')
    .eq('athlete_id', athleteId)
    .eq('plan_type', 'daily');

  if (paymentsError) {
    console.error('Error fetching daily payments:', paymentsError);
    return null;
  }

  const totalAmountDue = payments?.reduce((sum, p) => sum + (Number(p.amount_due) || 0), 0) || 0;
  const totalAmountPaid = payments?.reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0) || 0;
  const totalTrainings = payments?.length || 0;

  return {
    athleteId,
    totalTrainings,
    totalAmountDue,
    totalAmountPaid,
    outstandingBalance: totalAmountDue - totalAmountPaid,
    dailyRate,
  };
}

/**
 * Create a daily payment record for an attendance
 */
export async function createDailyPayment(
  athleteId: string,
  attendanceDate: string,
  dailyRate: number
): Promise<{ success: boolean; paymentId?: string; error?: string }> {
  try {
    // Get next payment ID
    const { data: maxPayment } = await supabase
      .from('payments')
      .select('payment_id')
      .order('payment_id', { ascending: false })
      .limit(1)
      .maybeSingle();

    let nextPaymentNum = 1;
    if (maxPayment?.payment_id) {
      const match = maxPayment.payment_id.match(/PAY(\d+)/);
      if (match) {
        nextPaymentNum = parseInt(match[1]) + 1;
      }
    }

    const paymentId = `PAY${nextPaymentNum}`;
    
    // Parse date to get month and year
    const date = new Date(attendanceDate);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    // Insert payment record
    const { error } = await supabase
      .from('payments')
      .insert({
        payment_id: paymentId,
        athlete_id: athleteId,
        month: month,
        year: year,
        amount_due: dailyRate,
        amount_paid: 0,
        status: 'Unpaid',
        plan_type: 'daily',
        notes: `Treino: ${attendanceDate}`,
        payment_date: null,
      });

    if (error) {
      console.error('Error creating daily payment:', error);
      return { success: false, error: error.message };
    }

    return { success: true, paymentId };
  } catch (error: any) {
    console.error('Error creating daily payment:', error);
    return { success: false, error: error.message };
  }
}
