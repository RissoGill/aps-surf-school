CREATE TABLE public.pro_account_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id text NOT NULL,
  entry_date date NOT NULL,
  type text NOT NULL,
  category text NOT NULL,
  description text,
  amount numeric NOT NULL,
  invoice_number text,
  created_at timestamptz DEFAULT now(),
  created_by text
);

ALTER TABLE public.pro_account_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon full access pro_account_entries"
  ON public.pro_account_entries FOR ALL TO anon
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access pro_account_entries"
  ON public.pro_account_entries FOR ALL TO authenticated
  USING (true) WITH CHECK (true);