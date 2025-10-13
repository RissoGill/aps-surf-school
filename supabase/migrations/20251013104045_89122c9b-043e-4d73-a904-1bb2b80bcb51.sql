-- Create guardians profile table
CREATE TABLE IF NOT EXISTS public.guardians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_uid uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE,
  first_name text,
  last_name text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on guardians table
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;

-- Guardians can view their own profile
CREATE POLICY "Guardians can view own profile"
ON public.guardians
FOR SELECT
USING (auth.uid() = auth_uid);

-- Guardians can update their own profile
CREATE POLICY "Guardians can update own profile"
ON public.guardians
FOR UPDATE
USING (auth.uid() = auth_uid);

-- Authenticated users can insert their profile
CREATE POLICY "Authenticated can insert guardian profile"
ON public.guardians
FOR INSERT
WITH CHECK (auth.uid() = auth_uid);

-- Update Atletas RLS to allow guardians to view their athletes
CREATE POLICY "Guardians can view their athletes"
ON public."Atletas"
FOR SELECT
USING (
  guardian_id IN (
    SELECT id FROM public.guardians WHERE auth_uid = auth.uid()
  )
);

-- Function to automatically create guardian profile on signup
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
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  )
  ON CONFLICT (auth_uid) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger to create guardian profile on user signup
DROP TRIGGER IF EXISTS on_auth_guardian_created ON auth.users;
CREATE TRIGGER on_auth_guardian_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_guardian();