-- Create guardian profile for existing user
INSERT INTO public.guardians (auth_uid, email, first_name, last_name)
VALUES (
  '30755b3d-4e34-4e5a-8077-8d9f3cdc008f',
  'pa01@aps.com',
  'Guardian',
  'Pa01'
)
ON CONFLICT (auth_uid) DO NOTHING;

-- Ensure the trigger function exists
CREATE OR REPLACE FUNCTION public.handle_new_guardian()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.guardians (auth_uid, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'Guardian'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  )
  ON CONFLICT (auth_uid) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Recreate trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_guardian_created'
  ) THEN
    CREATE TRIGGER on_auth_guardian_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_guardian();
  END IF;
END $$;