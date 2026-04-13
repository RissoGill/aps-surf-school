
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  expense_date date NOT NULL,
  amount numeric NOT NULL,
  invoice_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon full access expenses" ON public.expenses FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access expenses" ON public.expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO storage.buckets (id, name, public) VALUES ('expense-invoices', 'expense-invoices', true);

CREATE POLICY "Anyone can upload expense invoices" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'expense-invoices');
CREATE POLICY "Anyone can view expense invoices" ON storage.objects FOR SELECT TO public USING (bucket_id = 'expense-invoices');
CREATE POLICY "Anyone can delete expense invoices" ON storage.objects FOR DELETE TO public USING (bucket_id = 'expense-invoices');
