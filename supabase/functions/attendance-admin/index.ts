// supabase/functions/attendance-admin/index.ts
// Edge Function to perform admin updates and deletes on attendance using service role
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const SUPABASE_URL = "https://bzzzecvzoahauqrhkvds.supabase.co";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,GET,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    console.log('attendance-admin call', { method: req.method, path: url.pathname });

    if (req.method === "PATCH") {
      const { id, updates } = await req.json();
      if (!id || !updates || typeof updates !== "object") {
        return new Response(JSON.stringify({ error: "Missing id or updates" }), { status: 400, headers: { "content-type": "application/json", ...corsHeaders } });
      }

      // Normalize updates: keep only allowed fields
      const allowed = ["date", "status", "beach_location", "notes", "coach_id", "photos", "videos", "id", "athlete_id"];
      const cleanUpdates: Record<string, unknown> = {};
      for (const key of allowed) {
        if (key in updates) cleanUpdates[key] = updates[key];
      }

      const newId = (cleanUpdates as any).id as string | undefined;
      const hasIdChange = !!newId && newId !== id;

      if (hasIdChange) {
        const { id: _omitId, ...nonIdUpdates } = cleanUpdates as any;
        console.log("Attempting ID change", { from: id, to: newId, nonIdUpdates });

        // Check if target ID already exists
        const { data: target, error: selErr } = await supabase
          .from("attendance")
          .select("id")
          .eq("id", newId)
          .maybeSingle();
        if (selErr) {
          console.error("Select target error:", selErr);
          return new Response(JSON.stringify({ error: selErr.message }), { status: 400, headers: { "content-type": "application/json", ...corsHeaders } });
        }

        if (target) {
          // Merge: update existing target row, then delete old row
          const { error: updTargetErr } = await supabase
            .from("attendance")
            .update(nonIdUpdates)
            .eq("id", newId);
          if (updTargetErr) {
            console.error("Update target error:", updTargetErr);
            return new Response(JSON.stringify({ error: updTargetErr.message }), { status: 400, headers: { "content-type": "application/json", ...corsHeaders } });
          }
          const { error: delErr } = await supabase
            .from("attendance")
            .delete()
            .eq("id", id);
          if (delErr) {
            console.error("Delete old error:", delErr);
            return new Response(JSON.stringify({ error: delErr.message }), { status: 400, headers: { "content-type": "application/json", ...corsHeaders } });
          }
          return new Response(JSON.stringify({ success: true, merged: true }), { headers: { "content-type": "application/json", ...corsHeaders } });
        } else {
          // Safe to update primary key and other fields in place
          const { error: updErr } = await supabase
            .from("attendance")
            .update(cleanUpdates)
            .eq("id", id);
          if (updErr) {
            console.error("Update (id change) error:", updErr);
            return new Response(JSON.stringify({ error: updErr.message }), { status: 400, headers: { "content-type": "application/json", ...corsHeaders } });
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
        return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { "content-type": "application/json", ...corsHeaders } });
      }

      return new Response(JSON.stringify({ success: true }), { headers: { "content-type": "application/json", ...corsHeaders } });
    }

    if (req.method === "DELETE") {
      const { id } = await req.json();
      if (!id) {
        return new Response(JSON.stringify({ error: "Missing id" }), { status: 400, headers: { "content-type": "application/json", ...corsHeaders } });
      }

      const { error } = await supabase.from("attendance").delete().eq("id", id);
      if (error) {
        console.error("Delete error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { "content-type": "application/json", ...corsHeaders } });
      }

      return new Response(JSON.stringify({ success: true }), { headers: { "content-type": "application/json", ...corsHeaders } });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "content-type": "application/json", ...corsHeaders } });
  } catch (e) {
    console.error("Function error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: { "content-type": "application/json", ...corsHeaders } });
  }
});
