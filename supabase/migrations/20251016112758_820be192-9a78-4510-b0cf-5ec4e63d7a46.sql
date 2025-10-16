-- Add RLS policy to allow anonymous users to view attendance records
-- This is necessary because athletes use localStorage authentication instead of Supabase auth
CREATE POLICY "Allow anonymous to view attendance records"
ON public.attendance
FOR SELECT
USING (true);