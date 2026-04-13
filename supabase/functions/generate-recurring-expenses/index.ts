import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Parse optional from_date from request body
    let fromDate: string | null = null;
    try {
      const body = await req.json();
      fromDate = body?.from_date || null;
    } catch {
      // No body or invalid JSON - use current month
    }

    // Get all active recurring expenses
    const { data: recurring, error: fetchError } = await supabase
      .from("recurring_expenses")
      .select("*")
      .eq("is_active", true);

    if (fetchError) throw fetchError;
    if (!recurring || recurring.length === 0) {
      return new Response(JSON.stringify({ created: 0, message: "No active recurring expenses" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build list of months to process
    const now = new Date();
    const months: { year: number; month: number }[] = [];

    if (fromDate) {
      const [startYear, startMonth] = fromDate.split("-").map(Number);
      let y = startYear;
      let m = startMonth;
      while (y < now.getFullYear() || (y === now.getFullYear() && m <= now.getMonth() + 1)) {
        months.push({ year: y, month: m });
        m++;
        if (m > 12) { m = 1; y++; }
      }
    } else {
      months.push({ year: now.getFullYear(), month: now.getMonth() + 1 });
    }

    let created = 0;

    for (const { year, month } of months) {
      const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;
      const lastDayDate = new Date(year, month, 0);
      const lastDayStr = `${year}-${String(month).padStart(2, "0")}-${String(lastDayDate.getDate()).padStart(2, "0")}`;

      for (const rec of recurring) {
        // Check if already exists this month
        let query = supabase
          .from("expenses")
          .select("id")
          .eq("name", rec.name)
          .gte("expense_date", firstDay)
          .lte("expense_date", lastDayStr);

        if (rec.category) {
          query = query.eq("category", rec.category);
        } else {
          query = query.is("category", null);
        }

        const { data: existing } = await query;
        if (existing && existing.length > 0) continue;

        const { error: insertError } = await supabase.from("expenses").insert({
          name: rec.name,
          category: rec.category,
          subcategory: rec.subcategory,
          sub_subcategory: rec.sub_subcategory,
          amount: rec.amount,
          expense_date: firstDay,
          created_by: "recurring-auto",
        });

        if (insertError) {
          console.error(`Failed to insert recurring expense ${rec.name} for ${firstDay}:`, insertError);
          continue;
        }
        created++;
      }
    }

    return new Response(JSON.stringify({ created, total: recurring.length, months_processed: months.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating recurring expenses:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
