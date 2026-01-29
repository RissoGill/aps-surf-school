import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body for all methods except GET
    let body: { action?: string; userId?: string; role?: string } = {};
    if (req.method !== 'GET') {
      try {
        body = await req.json();
      } catch {
        body = {};
      }
    }

    // For GET requests, parse action from URL params
    const url = new URL(req.url);
    const action = body.action || url.searchParams.get('action') || 'count';
    const userId = body.userId || url.searchParams.get('userId');
    const role = body.role || url.searchParams.get('role');

    // Validate role - only admin or super_admin can access
    if (!role || (role !== 'admin' && role !== 'super_admin')) {
      console.error('Unauthorized access attempt:', { userId, role });
      return new Response(
        JSON.stringify({ error: 'Unauthorized. Admin or Super Admin role required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for RLS bypass
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Processing action:', action, 'by user:', userId, 'with role:', role);

    switch (action) {
      case 'count': {
        // Count ghost records (shift=NULL, status=NULL, coach_id=NULL)
        const { count: ghostCount, error: ghostError } = await supabase
          .from('attendance')
          .select('*', { count: 'exact', head: true })
          .is('shift', null)
          .is('status', null)
          .is('coach_id', null);

        if (ghostError) {
          console.error('Error counting ghosts:', ghostError);
          throw ghostError;
        }

        // Count legacy records (shift=NULL but has data)
        const { data: legacyData, error: legacyError } = await supabase
          .from('attendance')
          .select('id')
          .is('shift', null)
          .or('status.not.is.null,coach_id.not.is.null');

        if (legacyError) {
          console.error('Error counting legacy:', legacyError);
          throw legacyError;
        }

        return new Response(
          JSON.stringify({ 
            ghostCount: ghostCount || 0, 
            legacyCount: legacyData?.length || 0 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'export': {
        // Get all ghost records for CSV export
        const { data, error } = await supabase
          .from('attendance')
          .select('id, athlete_id, date')
          .is('shift', null)
          .is('status', null)
          .is('coach_id', null)
          .order('date', { ascending: true })
          .order('athlete_id', { ascending: true });

        if (error) {
          console.error('Error exporting ghosts:', error);
          throw error;
        }

        return new Response(
          JSON.stringify({ records: data || [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete': {
        // Delete ghost records
        const { data, error } = await supabase
          .from('attendance')
          .delete()
          .is('shift', null)
          .is('status', null)
          .is('coach_id', null)
          .select('id');

        if (error) {
          console.error('Error deleting ghosts:', error);
          throw error;
        }

        console.log('Deleted ghost records:', data?.length || 0, 'by user:', userId);

        return new Response(
          JSON.stringify({ deletedCount: data?.length || 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'fix-shift': {
        // First, get legacy records that need fixing
        const { data: legacyRecords, error: fetchError } = await supabase
          .from('attendance')
          .select('id, athlete_id, date')
          .is('shift', null)
          .or('status.not.is.null,coach_id.not.is.null');

        if (fetchError) {
          console.error('Error fetching legacy records:', fetchError);
          throw fetchError;
        }

        if (!legacyRecords || legacyRecords.length === 0) {
          return new Response(
            JSON.stringify({ updatedCount: 0 }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // For each legacy record, check if a Morning record already exists
        let updatedCount = 0;
        const errors: string[] = [];

        for (const record of legacyRecords) {
          // Check for existing Morning record
          const { data: existingMorning } = await supabase
            .from('attendance')
            .select('id')
            .eq('athlete_id', record.athlete_id)
            .eq('date', record.date)
            .ilike('shift', 'morning')
            .neq('id', record.id)
            .limit(1);

          if (existingMorning && existingMorning.length > 0) {
            // Skip this record - Morning already exists
            console.log('Skipping record', record.id, '- Morning already exists for', record.athlete_id, 'on', record.date);
            continue;
          }

          // Update to Morning
          const { error: updateError } = await supabase
            .from('attendance')
            .update({ shift: 'Morning' })
            .eq('id', record.id);

          if (updateError) {
            console.error('Error updating record', record.id, ':', updateError);
            errors.push(`${record.id}: ${updateError.message}`);
          } else {
            updatedCount++;
          }
        }

        console.log('Fixed legacy records:', updatedCount, 'by user:', userId, 'errors:', errors.length);

        return new Response(
          JSON.stringify({ 
            updatedCount, 
            totalProcessed: legacyRecords.length,
            errors: errors.length > 0 ? errors : undefined 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use: count, export, delete, or fix-shift' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
