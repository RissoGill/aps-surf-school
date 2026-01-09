-- Create table for prior balance payment history
CREATE TABLE public.prior_balance_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL,
  notes TEXT,
  invoice_number TEXT,
  entity TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT
);

-- Enable RLS
ALTER TABLE public.prior_balance_payments ENABLE ROW LEVEL SECURITY;

-- Policies for viewing (anonymous and authenticated can view)
CREATE POLICY "Anonymous can view prior balance payments"
ON public.prior_balance_payments FOR SELECT
USING (true);

CREATE POLICY "Authenticated can view prior balance payments"
ON public.prior_balance_payments FOR SELECT
USING (true);

-- Policies for insert/update/delete (anonymous can write due to localStorage auth)
CREATE POLICY "Anonymous can insert prior balance payments"
ON public.prior_balance_payments FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anonymous can update prior balance payments"
ON public.prior_balance_payments FOR UPDATE
USING (true) WITH CHECK (true);

CREATE POLICY "Anonymous can delete prior balance payments"
ON public.prior_balance_payments FOR DELETE
USING (true);

-- Create index for faster lookups by athlete
CREATE INDEX idx_prior_balance_payments_athlete_id ON public.prior_balance_payments(athlete_id);