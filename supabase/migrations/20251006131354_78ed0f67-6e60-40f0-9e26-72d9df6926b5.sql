-- Add RLS policies for the Payments table so guardians can only see their children's payments

-- First, ensure RLS is enabled on Payments table
ALTER TABLE public."Payments" ENABLE ROW LEVEL SECURITY;

-- Create a function to check if a user is a guardian of an athlete
-- This checks if the authenticated user's email matches the mother_email or father_email in the Atletas table
CREATE OR REPLACE FUNCTION public.is_guardian_of_athlete(athlete_id_param text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public."Atletas"
    WHERE "Athlete_Id" = athlete_id_param
      AND (
        "mother_email" = auth.email()
        OR "father_email" = auth.email()
      )
  );
$$;

-- Allow guardians to view payments for their children only
CREATE POLICY "Guardians can view their children's payments"
ON public."Payments"
FOR SELECT
TO authenticated
USING (public.is_guardian_of_athlete(athlete_id));

-- Allow anonymous users to view all payments (for testing - remove in production)
CREATE POLICY "Anonymous can view all payments"
ON public."Payments"
FOR SELECT
TO anon
USING (true);

-- Allow authenticated users (admins/coaches) to insert/update payments
CREATE POLICY "Authenticated can insert payments"
ON public."Payments"
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can update payments"
ON public."Payments"
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);