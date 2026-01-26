// supabase/functions/attendance-admin/index.ts
// Edge Function to perform admin updates and deletes on attendance using service role
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const SUPABASE_URL = "https://bzzzecvzoahauqrhkvds.supabase.co";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,GET,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation helpers
const isValidId = (id: unknown): id is string => 
  typeof id === 'string' && id.length > 0 && id.length <= 100;

const isValidDate = (date: unknown): date is string =>
  typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date);

const isValidStatus = (status: unknown): status is string =>
  typeof status === 'string' && ['Present', 'Absent', 'Justified', 'Late'].includes(status);

const isValidAthleteId = (id: unknown): id is string =>
  typeof id === 'string' && /^A\d+$/.test(id) && id.length <= 10;

const isValidCoachId = (id: unknown): id is string =>
  typeof id === 'string' && /^T\d+$/.test(id) && id.length <= 10;

const isValidShift = (shift: unknown): shift is string | null =>
  shift === null || shift === undefined || (typeof shift === 'string' && shift.length <= 50);

const isValidText = (text: unknown, maxLength = 500): text is string | null =>
  text === null || text === undefined || (typeof text === 'string' && text.length <= maxLength);

const sanitizeText = (text: string | null | undefined): string | null => {
  if (!text) return null;
  // Basic HTML entity encoding to prevent XSS
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim()
    .slice(0, 500);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create admin client for operations (service role)
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Parse request body
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }), 
        { status: 400, headers: { "content-type": "application/json", ...corsHeaders } }
      );
    }

    // Legacy authentication: validate role and userId from request body
    const { role, userId } = body as { role?: string; userId?: string };
    
    if (!role || !['coach', 'admin', 'super_admin'].includes(role)) {
      console.error('Missing or invalid role:', role);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid or missing role' }), 
        { status: 401, headers: { "content-type": "application/json", ...corsHeaders } }
      );
    }

    // Verify role against database (legacy authentication)
    if (role === 'coach') {
      if (!userId || !isValidCoachId(userId)) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Invalid coach ID' }), 
          { status: 401, headers: { "content-type": "application/json", ...corsHeaders } }
        );
      }
      // Verify coach exists
      const { data: coachData, error: coachError } = await supabase
        .from('coach')
        .select('coach_id')
        .eq('coach_id', userId)
        .single();
      
      if (coachError || !coachData) {
        console.error('Coach verification failed:', coachError);
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Coach not found' }), 
          { status: 401, headers: { "content-type": "application/json", ...corsHeaders } }
        );
      }
    } else if (role === 'admin' || role === 'super_admin') {
      // Verify admin exists in users table
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Invalid admin ID' }), 
          { status: 401, headers: { "content-type": "application/json", ...corsHeaders } }
        );
      }
      const { data: adminData, error: adminError } = await supabase
        .from('users')
        .select('admin_id, admin_role')
        .eq('admin_id', userId)
        .single();
      
      if (adminError || !adminData) {
        console.error('Admin verification failed:', adminError);
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Admin not found' }), 
          { status: 401, headers: { "content-type": "application/json", ...corsHeaders } }
        );
      }
    }

    const url = new URL(req.url);
    console.log('attendance-admin call', { method: req.method, path: url.pathname, role, userId });

    if (req.method === "PATCH") {
      const { id, updates } = body as { id?: unknown; updates?: unknown };
      
      // Validate id
      if (!isValidId(id)) {
        return new Response(
          JSON.stringify({ error: "Invalid id format" }), 
          { status: 400, headers: { "content-type": "application/json", ...corsHeaders } }
        );
      }
      
      if (!updates || typeof updates !== "object") {
        return new Response(
          JSON.stringify({ error: "Missing updates object" }), 
          { status: 400, headers: { "content-type": "application/json", ...corsHeaders } }
        );
      }

      // Validate and sanitize updates
      const cleanUpdates: Record<string, unknown> = {};
      
      if ('date' in updates) {
        if (!isValidDate(updates.date)) {
          return new Response(
            JSON.stringify({ error: "Invalid date format (YYYY-MM-DD required)" }), 
            { status: 400, headers: { "content-type": "application/json", ...corsHeaders } }
          );
        }
        cleanUpdates.date = updates.date;
      }
      
      if ('status' in updates) {
        if (!isValidStatus(updates.status)) {
          return new Response(
            JSON.stringify({ error: "Invalid status value" }), 
            { status: 400, headers: { "content-type": "application/json", ...corsHeaders } }
          );
        }
        cleanUpdates.status = updates.status;
      }
      
      if ('athlete_id' in updates) {
        if (!isValidAthleteId(updates.athlete_id)) {
          return new Response(
            JSON.stringify({ error: "Invalid athlete_id format" }), 
            { status: 400, headers: { "content-type": "application/json", ...corsHeaders } }
          );
        }
        cleanUpdates.athlete_id = updates.athlete_id;
      }
      
      if ('coach_id' in updates) {
        if (!isValidCoachId(updates.coach_id)) {
          return new Response(
            JSON.stringify({ error: "Invalid coach_id format" }), 
            { status: 400, headers: { "content-type": "application/json", ...corsHeaders } }
          );
        }
        cleanUpdates.coach_id = updates.coach_id;
      }
      
      if ('shift' in updates) {
        if (!isValidShift(updates.shift)) {
          return new Response(
            JSON.stringify({ error: "Invalid shift value" }), 
            { status: 400, headers: { "content-type": "application/json", ...corsHeaders } }
          );
        }
        cleanUpdates.shift = updates.shift ? String(updates.shift).trim() : null;
      }
      
      if ('beach_location' in updates) {
        if (!isValidText(updates.beach_location, 200)) {
          return new Response(
            JSON.stringify({ error: "beach_location too long" }), 
            { status: 400, headers: { "content-type": "application/json", ...corsHeaders } }
          );
        }
        cleanUpdates.beach_location = sanitizeText(updates.beach_location);
      }
      
      if ('notes' in updates) {
        if (!isValidText(updates.notes, 1000)) {
          return new Response(
            JSON.stringify({ error: "notes too long" }), 
            { status: 400, headers: { "content-type": "application/json", ...corsHeaders } }
          );
        }
        cleanUpdates.notes = sanitizeText(updates.notes);
      }
      
      if ('photos' in updates) {
        if (!isValidText(updates.photos, 2000)) {
          return new Response(
            JSON.stringify({ error: "photos field too long" }), 
            { status: 400, headers: { "content-type": "application/json", ...corsHeaders } }
          );
        }
        cleanUpdates.photos = updates.photos;
      }
      
      if ('videos' in updates) {
        if (!isValidText(updates.videos, 2000)) {
          return new Response(
            JSON.stringify({ error: "videos field too long" }), 
            { status: 400, headers: { "content-type": "application/json", ...corsHeaders } }
          );
        }
        cleanUpdates.videos = updates.videos;
      }

      // Handle ID change if provided
      if ('id' in updates && updates.id !== id) {
        if (!isValidId(updates.id)) {
          return new Response(
            JSON.stringify({ error: "Invalid new id format" }), 
            { status: 400, headers: { "content-type": "application/json", ...corsHeaders } }
          );
        }
        cleanUpdates.id = updates.id;
      }

      const newId = cleanUpdates.id as string | undefined;
      const hasIdChange = !!newId && newId !== id;

      if (hasIdChange) {
        const { id: _omitId, ...nonIdUpdates } = cleanUpdates;
        console.log("Attempting ID change", { from: id, to: newId, nonIdUpdates });

        // Check if target ID already exists
        const { data: target, error: selErr } = await supabase
          .from("attendance")
          .select("id")
          .eq("id", newId)
          .maybeSingle();
        if (selErr) {
          console.error("Select target error:", selErr);
          return new Response(JSON.stringify({ error: "Database error" }), { status: 400, headers: { "content-type": "application/json", ...corsHeaders } });
        }

        if (target) {
          // Merge: update existing target row, then delete old row
          const { data: source, error: srcErr } = await supabase
            .from("attendance")
            .select("coach_id, athlete_id")
            .eq("id", id)
            .maybeSingle();
          if (srcErr) {
            console.error("Select source error:", srcErr);
          }

          const finalUpdates: Record<string, unknown> = { ...nonIdUpdates };
          if (!("coach_id" in finalUpdates) && source?.coach_id) {
            finalUpdates.coach_id = source.coach_id;
          }
          if (!("athlete_id" in finalUpdates) && source?.athlete_id) {
            finalUpdates.athlete_id = source.athlete_id;
          }

          const { error: updTargetErr } = await supabase
            .from("attendance")
            .update(finalUpdates)
            .eq("id", newId);
          if (updTargetErr) {
            console.error("Update target error:", updTargetErr);
            return new Response(JSON.stringify({ error: "Update failed" }), { status: 400, headers: { "content-type": "application/json", ...corsHeaders } });
          }
          const { error: delErr } = await supabase
            .from("attendance")
            .delete()
            .eq("id", id);
          if (delErr) {
            console.error("Delete old error:", delErr);
            return new Response(JSON.stringify({ error: "Cleanup failed" }), { status: 400, headers: { "content-type": "application/json", ...corsHeaders } });
          }
          return new Response(JSON.stringify({ success: true, merged: true }), { headers: { "content-type": "application/json", ...corsHeaders } });
        } else {
          const { error: updErr } = await supabase
            .from("attendance")
            .update(cleanUpdates)
            .eq("id", id);
          if (updErr) {
            console.error("Update (id change) error:", updErr);
            return new Response(JSON.stringify({ error: "Update failed" }), { status: 400, headers: { "content-type": "application/json", ...corsHeaders } });
          }
          return new Response(JSON.stringify({ success: true, moved: true }), { headers: { "content-type": "application/json", ...corsHeaders } });
        }
      }

      // Simple update without ID change
      const { error } = await supabase
        .from("attendance")
        .update(cleanUpdates)
        .eq("id", id);

      if (error) {
        console.error("Update error:", error);
        const errorMsg = error.message || '';
        if (errorMsg.includes('Attendance for this athlete and shift already exists on this date')) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              duplicate: true, 
              message: 'Attendance for this athlete and shift already exists on this date.' 
            }), 
            { status: 200, headers: { "content-type": "application/json", ...corsHeaders } }
          );
        }
        return new Response(JSON.stringify({ error: "Update failed" }), { status: 400, headers: { "content-type": "application/json", ...corsHeaders } });
      }

      return new Response(JSON.stringify({ success: true }), { headers: { "content-type": "application/json", ...corsHeaders } });
    }

    if (req.method === "POST") {
      // body already parsed above
      
      // Validate required fields
      if (!isValidId(body.id)) {
        return new Response(JSON.stringify({ error: "Invalid id format" }), { status: 400, headers: { "content-type": "application/json", ...corsHeaders } });
      }
      if (!isValidAthleteId(body.athlete_id)) {
        return new Response(JSON.stringify({ error: "Invalid athlete_id format" }), { status: 400, headers: { "content-type": "application/json", ...corsHeaders } });
      }
      if (!isValidDate(body.date)) {
        return new Response(JSON.stringify({ error: "Invalid date format (YYYY-MM-DD required)" }), { status: 400, headers: { "content-type": "application/json", ...corsHeaders } });
      }
      if (!isValidStatus(body.status)) {
        return new Response(JSON.stringify({ error: "Invalid status value" }), { status: 400, headers: { "content-type": "application/json", ...corsHeaders } });
      }
      if (!isValidCoachId(body.coach_id)) {
        return new Response(JSON.stringify({ error: "Invalid coach_id format" }), { status: 400, headers: { "content-type": "application/json", ...corsHeaders } });
      }

      const insertData: Record<string, unknown> = {
        id: body.id,
        athlete_id: body.athlete_id,
        date: body.date,
        status: body.status,
        coach_id: body.coach_id,
        shift: isValidShift(body.shift) ? (body.shift ? String(body.shift).trim() : null) : null,
        beach_location: isValidText(body.beach_location, 200) ? sanitizeText(body.beach_location) : null,
        notes: isValidText(body.notes, 1000) ? sanitizeText(body.notes) : null,
        photos: isValidText(body.photos, 2000) ? body.photos : null,
        videos: isValidText(body.videos, 2000) ? body.videos : null,
      };

      const { error } = await supabase.from("attendance").insert(insertData);
      if (error) {
        console.error("Insert error:", error);
        const errorMsg = error.message || '';
        if (errorMsg.includes('Attendance for this athlete and shift already exists on this date')) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              duplicate: true, 
              message: 'Attendance for this athlete and shift already exists on this date.' 
            }), 
            { status: 200, headers: { "content-type": "application/json", ...corsHeaders } }
          );
        }
        return new Response(JSON.stringify({ error: "Insert failed" }), { status: 400, headers: { "content-type": "application/json", ...corsHeaders } });
      }

      // Check if athlete has daily plan and create payment if status is Present
      if (insertData.status === 'Present') {
        const { data: athleteData } = await supabase
          .from('atletas')
          .select('plan_type, daily_rate')
          .eq('athlete_id', insertData.athlete_id)
          .single();

        if (athleteData?.plan_type === 'daily') {
          const dailyRate = Number(athleteData.daily_rate) || 35;
          
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
          const date = new Date(insertData.date as string);
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                              'July', 'August', 'September', 'October', 'November', 'December'];

          await supabase.from('payments').insert({
            payment_id: paymentId,
            athlete_id: insertData.athlete_id,
            month: monthNames[date.getMonth()],
            year: date.getFullYear(),
            amount_due: dailyRate,
            amount_paid: 0,
            status: 'Unpaid',
            plan_type: 'daily',
            notes: `Treino: ${insertData.date}`,
          });
          
          console.info('Daily payment created:', { paymentId, athleteId: insertData.athlete_id, dailyRate });
        }
      }

      return new Response(JSON.stringify({ success: true }), { headers: { "content-type": "application/json", ...corsHeaders } });

    if (req.method === "DELETE") {
      const { id } = body as { id?: unknown };
      if (!isValidId(id)) {
        return new Response(JSON.stringify({ error: "Invalid id format" }), { status: 400, headers: { "content-type": "application/json", ...corsHeaders } });
      }

      const { error } = await supabase.from("attendance").delete().eq("id", id);
      if (error) {
        console.error("Delete error:", error);
        return new Response(JSON.stringify({ error: "Delete failed" }), { status: 400, headers: { "content-type": "application/json", ...corsHeaders } });
      }

      return new Response(JSON.stringify({ success: true }), { headers: { "content-type": "application/json", ...corsHeaders } });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "content-type": "application/json", ...corsHeaders } });
  } catch (e) {
    console.error("Function error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: { "content-type": "application/json", ...corsHeaders } });
  }
});
