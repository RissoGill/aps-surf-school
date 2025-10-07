-- Allow anonymous users to insert attendance records for demo mode
CREATE POLICY "anon can insert Attendance" 
ON public."Attendance" 
FOR INSERT 
TO anon
WITH CHECK (true);

-- Allow anonymous users to delete attendance records for demo mode
CREATE POLICY "anon can delete Attendance" 
ON public."Attendance" 
FOR DELETE 
TO anon
USING (true);