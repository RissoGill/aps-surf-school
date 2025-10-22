-- Allow anonymous users (admins) to update payments
DROP POLICY IF EXISTS "Authenticated can update payments" ON public.payments;

CREATE POLICY "Anyone can update payments"
ON public.payments
FOR UPDATE
USING (true)
WITH CHECK (true);