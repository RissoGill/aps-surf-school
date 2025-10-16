-- Add policy to allow anonymous users to view coaches
CREATE POLICY "Anonymous users can view all coaches"
ON public.coach
FOR SELECT
TO anon
USING (true);