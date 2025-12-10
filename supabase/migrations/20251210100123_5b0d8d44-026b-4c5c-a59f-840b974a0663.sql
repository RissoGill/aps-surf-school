-- Create alerts table for admin notifications
CREATE TABLE public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  target_type text NOT NULL DEFAULT 'all' CHECK (target_type IN ('all', 'coaches', 'athletes', 'guardians', 'specific_coach', 'specific_athlete')),
  target_id text, -- coach_id or athlete_id when target_type is specific_coach or specific_athlete
  is_resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamp with time zone,
  resolved_by text,
  created_by text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Read access for all (legacy auth compatibility)
CREATE POLICY "Anonymous can view alerts"
ON public.alerts
FOR SELECT
USING (true);

CREATE POLICY "Authenticated can view alerts"
ON public.alerts
FOR SELECT
USING (true);

-- Write access only for admin and super_admin
CREATE POLICY "Admins can insert alerts"
ON public.alerts
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can update alerts"
ON public.alerts
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can delete alerts"
ON public.alerts
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_alerts_updated_at
BEFORE UPDATE ON public.alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_coach_payment_timestamp();