-- Allow all authenticated users to update atletas (temporary until full admin auth is wired)
CREATE POLICY "Authenticated can update atletas"
ON public.atletas
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);