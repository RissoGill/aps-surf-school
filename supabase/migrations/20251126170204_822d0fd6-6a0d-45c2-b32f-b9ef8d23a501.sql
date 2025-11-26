-- Create RLS policies for reports_viewer role (read-only access)

-- Policy for coach payments
DROP POLICY IF EXISTS "Reports viewers can view all coach payments" ON public.coach_payments;
CREATE POLICY "Reports viewers can view all coach payments"
ON public.coach_payments
FOR SELECT
USING (has_role(auth.uid(), 'reports_viewer'));

-- Policy for payments
DROP POLICY IF EXISTS "Reports viewers can view all payments" ON public.payments;
CREATE POLICY "Reports viewers can view all payments"
ON public.payments
FOR SELECT
USING (has_role(auth.uid(), 'reports_viewer'));

-- Policy for athletes
DROP POLICY IF EXISTS "Reports viewers can view all athletes" ON public.atletas;
CREATE POLICY "Reports viewers can view all athletes"
ON public.atletas
FOR SELECT
USING (has_role(auth.uid(), 'reports_viewer'));

-- Policy for attendance
DROP POLICY IF EXISTS "Reports viewers can view all attendance" ON public.attendance;
CREATE POLICY "Reports viewers can view all attendance"
ON public.attendance
FOR SELECT
USING (has_role(auth.uid(), 'reports_viewer'));

-- Policy for coaches
DROP POLICY IF EXISTS "Reports viewers can view all coaches" ON public.coach;
CREATE POLICY "Reports viewers can view all coaches"
ON public.coach
FOR SELECT
USING (has_role(auth.uid(), 'reports_viewer'));