-- Fix guardian check function to reference correct table and column names
CREATE OR REPLACE FUNCTION public.is_guardian_of_athlete(athlete_id_param text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.atletas
    WHERE athlete_id = athlete_id_param
      AND (
        mother_email = auth.email()
        OR father_email = auth.email()
      )
  );
$function$;