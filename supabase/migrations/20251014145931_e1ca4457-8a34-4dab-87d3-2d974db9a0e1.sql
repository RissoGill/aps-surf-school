-- Enable RLS on estagio_atletas table
ALTER TABLE public.estagio_atletas ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view estagio registrations
CREATE POLICY "Authenticated users can view estagio registrations"
ON public.estagio_atletas
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert estagio registrations
CREATE POLICY "Authenticated users can insert estagio registrations"
ON public.estagio_atletas
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Enable RLS on Estagio table if not already enabled
ALTER TABLE public."Estagio" ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view estagios
CREATE POLICY "Anyone can view estagios"
ON public."Estagio"
FOR SELECT
USING (true);