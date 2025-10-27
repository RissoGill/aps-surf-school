-- Temporarily allow anonymous users to update atletas to unblock edits in preview
CREATE POLICY "Anonymous can update atletas"
ON public.atletas
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);