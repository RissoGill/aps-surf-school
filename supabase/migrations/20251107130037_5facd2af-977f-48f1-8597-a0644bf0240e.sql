-- Add RLS policy for admins to view all payments
CREATE POLICY "Admins can view all payments"
ON public.payments FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);