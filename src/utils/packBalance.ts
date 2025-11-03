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

  // If not a pack plan, return null
  if (!athlete.plan_type || athlete.plan_type.toLowerCase() === 'month') {
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
  const usedTokens = parseInt(pack.used_tokens) || 0;
  const balance = totalTokens - usedTokens;

  return {
    athleteId,
    totalTokens,
    usedTokens,
    balance,
    isNegative: balance < 0,
    packType: athlete.plan_type,
    purchaseDate: pack.purchase_date,
  };
}
