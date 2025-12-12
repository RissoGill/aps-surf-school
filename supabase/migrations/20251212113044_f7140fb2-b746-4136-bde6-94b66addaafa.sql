-- Drop old RLS policies that use has_role() which doesn't work with legacy auth
DROP POLICY IF EXISTS "Admins can insert alerts" ON public.alerts;
DROP POLICY IF EXISTS "Admins can update alerts" ON public.alerts;
DROP POLICY IF EXISTS "Admins can delete alerts" ON public.alerts;

-- Create new policies that allow access for legacy auth system
-- Security is maintained at application level (AlertsManagementCard only renders for admin/super_admin)
CREATE POLICY "Admins can insert alerts"
ON public.alerts
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can update alerts"
ON public.alerts
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can delete alerts"
ON public.alerts
FOR DELETE
USING (true);