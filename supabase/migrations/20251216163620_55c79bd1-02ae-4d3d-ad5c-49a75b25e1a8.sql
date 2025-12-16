
-- Function to handle new athlete registration
CREATE OR REPLACE FUNCTION public.handle_new_athlete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  athlete_number TEXT;
  next_payment_id INTEGER;
  current_month INTEGER;
  current_year INTEGER;
  month_counter INTEGER;
  year_counter INTEGER;
  month_name TEXT;
  months TEXT[] := ARRAY['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
BEGIN
  -- Extract the number from athlete_id (e.g., "A91" -> "91")
  athlete_number := SUBSTRING(NEW.athlete_id FROM 2);
  
  -- Get the next payment_id sequence number
  SELECT COALESCE(MAX(CAST(SUBSTRING(payment_id FROM 4) AS INTEGER)), 0) + 1 
  INTO next_payment_id 
  FROM payments;
  
  -- Create user record
  INSERT INTO users (
    id,
    athlete_id,
    athlete_user_id,
    athlete_password,
    athlete_role,
    guardian_id,
    guardian_password,
    guardian_role
  )
  SELECT 
    COALESCE(MAX(id), 0) + 1,
    NEW.athlete_id,
    NEW.athlete_id,
    'Aps1234',
    'athlete',
    'PA' || athlete_number,
    'APSPAIS',
    'guardian'
  FROM users;
  
  -- Only create payments for non-pack plans
  IF NEW.plan_type IS NULL OR NOT NEW.plan_type LIKE 'pack%' THEN
    -- Get current month and year
    current_month := EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER;
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;
    
    -- Initialize counters
    month_counter := current_month;
    year_counter := current_year;
    
    -- Create payments from current month until August
    LOOP
      month_name := months[month_counter];
      
      INSERT INTO payments (
        payment_id,
        athlete_id,
        month,
        year,
        amount_due,
        amount_paid,
        status
      ) VALUES (
        'PAY' || next_payment_id,
        NEW.athlete_id,
        month_name,
        year_counter,
        0,
        0,
        'Unpaid'
      );
      
      next_payment_id := next_payment_id + 1;
      
      -- Exit when we reach August
      EXIT WHEN month_counter = 8;
      
      -- Move to next month
      IF month_counter = 12 THEN
        month_counter := 1;
        year_counter := year_counter + 1;
      ELSE
        month_counter := month_counter + 1;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on atletas table
DROP TRIGGER IF EXISTS on_athlete_created ON public.atletas;
CREATE TRIGGER on_athlete_created
  AFTER INSERT ON public.atletas
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_athlete();
