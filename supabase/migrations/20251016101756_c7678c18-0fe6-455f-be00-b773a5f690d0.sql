-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Coaches can insert attendance records" ON public.attendance;
DROP POLICY IF EXISTS "Coaches can view their attendance records" ON public.attendance;
DROP POLICY IF EXISTS "Coaches can update their attendance records" ON public.attendance;
DROP POLICY IF EXISTS "Authenticated users can view all attendance" ON public.attendance;

-- Enable RLS on attendance table (if not already enabled)
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Allow coaches to insert their own attendance records
CREATE POLICY "Coaches can insert attendance records"
ON public.attendance
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid()::text IN (
    SELECT auth_uid FROM public.coach WHERE coach_id = attendance.coach_id
  )
);

-- Allow coaches to view attendance records they created
CREATE POLICY "Coaches can view their attendance records"
ON public.attendance
FOR SELECT
TO authenticated
USING (
  auth.uid()::text IN (
    SELECT auth_uid FROM public.coach WHERE coach_id = attendance.coach_id
  )
);

-- Allow coaches to update their own attendance records
CREATE POLICY "Coaches can update their attendance records"
ON public.attendance
FOR UPDATE
TO authenticated
USING (
  auth.uid()::text IN (
    SELECT auth_uid FROM public.coach WHERE coach_id = attendance.coach_id
  )
);

-- Allow authenticated users to view all attendance (for athletes/guardians)
CREATE POLICY "Authenticated users can view all attendance"
ON public.attendance
FOR SELECT
TO authenticated
USING (true);