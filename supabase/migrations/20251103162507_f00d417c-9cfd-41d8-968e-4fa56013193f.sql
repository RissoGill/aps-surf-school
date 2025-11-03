-- Function to handle new pack purchases and carry over negative balance
CREATE OR REPLACE FUNCTION handle_new_pack_purchase()
RETURNS TRIGGER AS $$
DECLARE
  previous_balance INTEGER;
BEGIN
  -- Get balance from previous active pack
  SELECT (total_tokens::INTEGER - used_tokens::INTEGER) INTO previous_balance
  FROM packs
  WHERE athlete_id = NEW.athlete_id
    AND active = true
    AND id != NEW.id
  ORDER BY purchase_date DESC
  LIMIT 1;
  
  -- If previous balance was negative, carry it forward
  IF previous_balance IS NOT NULL AND previous_balance < 0 THEN
    NEW.used_tokens := ABS(previous_balance)::TEXT;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to run before pack insertion
CREATE TRIGGER before_pack_insert
  BEFORE INSERT ON packs
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_pack_purchase();