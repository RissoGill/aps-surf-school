CREATE OR REPLACE FUNCTION public.handle_new_athlete() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  athlete_number TEXT; next_payment_id INTEGER; month_counter INTEGER; year_counter INTEGER;
  months TEXT[] := ARRAY['January','February','March','April','May','June','July','August','September','October','November','December'];
  is_learning BOOLEAN := lower(trim(coalesce(NEW.surf_level,''))) = 'learning';
BEGIN
  athlete_number := SUBSTRING(NEW.athlete_id FROM 2);
  SELECT COALESCE(MAX(CAST(SUBSTRING(payment_id FROM 4) AS INTEGER)), 0) + 1 INTO next_payment_id FROM payments;
  INSERT INTO users (id, athlete_id, athlete_user_id, athlete_password, athlete_role, guardian_id, guardian_password, guardian_role)
  SELECT COALESCE(MAX(id), 0) + 1, NEW.athlete_id, NEW.athlete_id, 'Aps1234', 'athlete', 'PA' || athlete_number, 'APSPAIS', 'guardian' FROM users;
  IF NEW.plan_type IS NULL OR (NOT NEW.plan_type LIKE 'pack%' AND NEW.plan_type != 'daily') THEN
    month_counter := EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER;
    year_counter := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;
    LOOP
      IF NOT (is_learning AND month_counter IN (7, 8)) THEN
        INSERT INTO payments (payment_id, athlete_id, month, year, amount_due, amount_paid, status)
        VALUES ('PAY' || next_payment_id, NEW.athlete_id, months[month_counter], year_counter, 0, 0, 'Unpaid');
        next_payment_id := next_payment_id + 1;
      END IF;
      EXIT WHEN month_counter = 8;
      IF month_counter = 12 THEN month_counter := 1; year_counter := year_counter + 1;
      ELSE month_counter := month_counter + 1; END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END; $$;