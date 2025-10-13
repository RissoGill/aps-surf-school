-- Temporarily make guardians table readable by authenticated users for testing
DROP POLICY IF EXISTS "Guardians can view own profile" ON public.guardians;

CREATE POLICY "Guardians can view own profile"
ON public.guardians
FOR SELECT
TO authenticated
USING (auth.uid() = auth_uid);

-- Also add a policy for anonymous (just in case)
CREATE POLICY "Anon can view guardians"
ON public.guardians
FOR SELECT
TO anon
USING (true);