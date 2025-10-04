-- Allow authenticated users (coaches) to insert and update attendance records
CREATE POLICY "authenticated can insert Attendance" 
ON public."Attendance" 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "authenticated can update Attendance" 
ON public."Attendance" 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);