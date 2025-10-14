-- Enable Row Level Security on Campeonatos table
ALTER TABLE public."Campeonatos" ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view championships
CREATE POLICY "Anyone can view championships"
ON public."Campeonatos"
FOR SELECT
USING (true);

-- Enable Row Level Security on campeonatos_atletas table
ALTER TABLE public."campeonatos_atletas" ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view championship registrations
CREATE POLICY "Authenticated users can view championship registrations"
ON public."campeonatos_atletas"
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert championship registrations
CREATE POLICY "Authenticated users can insert championship registrations"
ON public."campeonatos_atletas"
FOR INSERT
TO authenticated
WITH CHECK (true);