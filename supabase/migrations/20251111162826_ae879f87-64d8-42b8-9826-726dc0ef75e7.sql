-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can insert coach payments" ON public.coach_payments;
DROP POLICY IF EXISTS "Admins can update coach payments" ON public.coach_payments;
DROP POLICY IF EXISTS "Admins can delete coach payments" ON public.coach_payments;
DROP POLICY IF EXISTS "Admins can view all coach payments" ON public.coach_payments;

-- Create new policies that allow both admin and super_admin roles
CREATE POLICY "Admins and super admins can insert coach payments"
ON public.coach_payments
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Admins and super admins can update coach payments"
ON public.coach_payments
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Admins and super admins can delete coach payments"
ON public.coach_payments
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Admins and super admins can view all coach payments"
ON public.coach_payments
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'super_admin'::app_role)
);