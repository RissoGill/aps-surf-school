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

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    let created = 0;

    for (const rec of recurring) {
      // Use each template's own start_date
      const startDateStr = rec.start_date || "2025-09-01";
      const [sY, sM, sD] = startDateStr.split("-").map(Number);

      // Iterate months from start_date to current month
      let y = sY;
      let m = sM;

      // Determine end boundary from end_date if set
      let endYear = currentYear;
      let endMonth = currentMonth;
      if (rec.end_date) {
        const [eY, eM] = rec.end_date.split("-").map(Number);
        // Use the earlier of end_date or current month
        if (eY < currentYear || (eY === currentYear && eM < currentMonth)) {
          endYear = eY;
          endMonth = eM;
        }
      }

      while (y < endYear || (y === endYear && m <= endMonth)) {
        // Clamp day to last day of month
        const lastDayOfMonth = new Date(y, m, 0).getDate();
        const day = Math.min(sD, lastDayOfMonth);
        const expenseDate = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        const firstDay = `${y}-${String(m).padStart(2, "0")}-01`;
        const lastDayStr = `${y}-${String(m).padStart(2, "0")}-${String(lastDayOfMonth).padStart(2, "0")}`;

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
        if (existing && existing.length > 0) {
          // Move to next month
          m++;
          if (m > 12) { m = 1; y++; }
          continue;
        }

        const { error: insertError } = await supabase.from("expenses").insert({
          name: rec.name,
          category: rec.category,
          subcategory: rec.subcategory,
          sub_subcategory: rec.sub_subcategory,
          amount: rec.amount,
          expense_date: expenseDate,
          created_by: "recurring-auto",
        });

        if (insertError) {
          console.error(`Failed to insert recurring expense ${rec.name} for ${expenseDate}:`, insertError);
        } else {
          created++;
        }

        m++;
        if (m > 12) { m = 1; y++; }
      }
    }

    return new Response(JSON.stringify({ created, total: recurring.length }), {
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
