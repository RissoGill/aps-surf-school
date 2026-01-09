-- Política para INSERT anónimo
CREATE POLICY "Anonymous can insert coach payments"
ON public.coach_payments
FOR INSERT
TO anon
WITH CHECK (true);

-- Política para UPDATE anónimo
CREATE POLICY "Anonymous can update coach payments"
ON public.coach_payments
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Política para DELETE anónimo
CREATE POLICY "Anonymous can delete coach payments"
ON public.coach_payments
FOR DELETE
TO anon
USING (true);