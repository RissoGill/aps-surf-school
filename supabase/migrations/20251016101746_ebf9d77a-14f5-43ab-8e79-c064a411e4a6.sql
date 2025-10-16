-- Add RLS policies for coach table
-- Allow coaches to view their own profile
CREATE POLICY "Coaches can view their own profile"
ON public.coach
FOR SELECT
TO authenticated
USING (auth.uid()::text = auth_uid);

-- Allow coaches to update their own profile
CREATE POLICY "Coaches can update their own profile"
ON public.coach
FOR UPDATE
TO authenticated
USING (auth.uid()::text = auth_uid)
WITH CHECK (auth.uid()::text = auth_uid);

-- Allow authenticated users to view all coaches (for displaying trainer info)
CREATE POLICY "Authenticated users can view all coaches"
ON public.coach
FOR SELECT
TO authenticated
USING (true);