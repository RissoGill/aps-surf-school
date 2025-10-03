-- Enable RLS (idempotent if already enabled)
ALTER TABLE public."Atletas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Attendance" ENABLE ROW LEVEL SECURITY;

-- Allow public (anon) and authenticated read access to Atletas
CREATE POLICY "anon can select Atletas"
ON public."Atletas"
FOR SELECT
TO anon
USING (true);

CREATE POLICY "authenticated can select Atletas"
ON public."Atletas"
FOR SELECT
TO authenticated
USING (true);

-- Allow public (anon) and authenticated read access to Attendance
CREATE POLICY "anon can select Attendance"
ON public."Attendance"
FOR SELECT
TO anon
USING (true);

CREATE POLICY "authenticated can select Attendance"
ON public."Attendance"
FOR SELECT
TO authenticated
USING (true);