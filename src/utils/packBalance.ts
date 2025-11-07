import { supabase } from "@/integrations/supabase/client";

export interface PackBalance {
  athleteId: string;
  totalTokens: number;
  usedTokens: number;
  balance: number;
  isNegative: boolean;
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

  if (!pack) {
    // No active pack found, but athlete has pack plan
    return null;
  }

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
    packType: athlete.plan_type,
    purchaseDate: pack.purchase_date,
  };
}
