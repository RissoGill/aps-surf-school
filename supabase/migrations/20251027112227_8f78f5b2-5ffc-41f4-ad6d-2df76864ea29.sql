-- Add UPDATE policy for atletas table to allow admins to update athlete information
CREATE POLICY "Admins can update athlete records"
ON public.atletas
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));