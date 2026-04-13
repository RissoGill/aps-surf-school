
CREATE TABLE public.recurring_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text,
  subcategory text,
  sub_subcategory text,
  amount numeric NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon full access recurring_expenses"
  ON public.recurring_expenses
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated full access recurring_expenses"
  ON public.recurring_expenses
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
