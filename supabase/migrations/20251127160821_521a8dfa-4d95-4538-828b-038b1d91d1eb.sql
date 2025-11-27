-- Add anonymous and authenticated read access to coach_payments table
-- This supports legacy authentication system while maintaining write protection

CREATE POLICY "Anonymous can view coach payments"
ON public.coach_payments
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Authenticated can view coach payments"
ON public.coach_payments
FOR SELECT
TO authenticated
USING (true);