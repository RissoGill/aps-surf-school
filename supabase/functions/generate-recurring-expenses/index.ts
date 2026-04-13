import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.49.1/cors";

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
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed
    const firstDay = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month + 1, 0);
    const lastDayStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay.getDate()).padStart(2, "0")}`;

    let created = 0;

    for (const rec of recurring) {
      // Check if already exists this month (by name + category)
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
        console.error(`Failed to insert recurring expense ${rec.name}:`, insertError);
        continue;
      }
      created++;
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
