-- Enable RLS on packs table (if not already enabled)
ALTER TABLE packs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view packs (since athletes use localStorage auth, not Supabase auth)
CREATE POLICY "Anyone can view packs"
ON packs
FOR SELECT
USING (true);

-- Allow admins to manage packs
CREATE POLICY "Admins can insert packs"
ON packs
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update packs"
ON packs
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete packs"
ON packs
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));