-- Enable RLS on Users table
ALTER TABLE public."Users" ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to select from Users table for authentication
CREATE POLICY "Allow anonymous to select Users for authentication"
ON public."Users"
FOR SELECT
TO anon
USING (true);

-- Allow authenticated users to select from Users table
CREATE POLICY "Allow authenticated to select Users"
ON public."Users"
FOR SELECT
TO authenticated
USING (true);