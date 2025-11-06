-- Performance indices for duplicate checking
CREATE INDEX IF NOT EXISTS idx_attendance_athlete_date_shift 
ON attendance (athlete_id, date, shift);

CREATE INDEX IF NOT EXISTS idx_attendance_athlete_date_nullshift 
ON attendance (athlete_id, date) WHERE shift IS NULL;

-- Trigger function to prevent duplicate attendance
CREATE OR REPLACE FUNCTION public.prevent_duplicate_attendance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM attendance a
    WHERE a.athlete_id = NEW.athlete_id
      AND a.date = NEW.date
      AND a.id != COALESCE(NEW.id, '')
      AND (
        (a.shift IS NULL AND NEW.shift IS NULL)
        OR (
          a.shift IS NOT NULL AND NEW.shift IS NOT NULL
          AND lower(trim(a.shift)) = lower(trim(NEW.shift))
        )
      )
  ) THEN
    RAISE EXCEPTION 'Attendance for this athlete and shift already exists on this date.';
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trg_attendance_no_duplicates ON attendance;
CREATE TRIGGER trg_attendance_no_duplicates
BEFORE INSERT OR UPDATE ON attendance
FOR EACH ROW EXECUTE FUNCTION public.prevent_duplicate_attendance();