-- Create coach_payments table
CREATE TABLE public.coach_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id text NOT NULL REFERENCES public.coach(coach_id) ON DELETE CASCADE,
  payment_date date NOT NULL,
  amount numeric(10, 2) NOT NULL,
  payment_month text NOT NULL,
  payment_year integer NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX idx_coach_payments_coach_id ON public.coach_payments(coach_id);
CREATE INDEX idx_coach_payments_date ON public.coach_payments(payment_date DESC);

-- Enable RLS
ALTER TABLE public.coach_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can do everything
CREATE POLICY "Admins can insert coach payments"
ON public.coach_payments
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update coach payments"
ON public.coach_payments
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete coach payments"
ON public.coach_payments
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all coach payments"
ON public.coach_payments
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Coaches can view their own payments
CREATE POLICY "Coaches can view their own payments"
ON public.coach_payments
FOR SELECT
TO authenticated
USING (
  coach_id IN (
    SELECT coach.coach_id 
    FROM public.coach 
    WHERE coach.auth_uid = auth.uid()::text
  )
);

-- Create update trigger function
CREATE OR REPLACE FUNCTION public.update_coach_payment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
CREATE TRIGGER coach_payments_updated_at
  BEFORE UPDATE ON public.coach_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_coach_payment_timestamp();