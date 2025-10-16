-- Add DELETE policy for coaches to delete their own attendance records
CREATE POLICY "Coaches can delete their attendance records"
ON public.attendance
FOR DELETE
TO authenticated
USING (
  (auth.uid())::text IN (
    SELECT coach.auth_uid
    FROM public.coach
    WHERE coach.coach_id = attendance.coach_id
  )
);