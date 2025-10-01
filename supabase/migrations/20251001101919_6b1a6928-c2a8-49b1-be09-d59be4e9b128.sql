-- Enable RLS on Atletas table if not already enabled
ALTER TABLE public."Atletas" ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to all athletes
-- This allows coaches and others to view athlete data
CREATE POLICY "Allow public read access to athletes"
ON public."Atletas"
FOR SELECT
USING (true);