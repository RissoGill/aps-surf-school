-- Migration 1: Create guardians table, add enum value, update function
-- Step 1: Create the missing guardians table
CREATE TABLE IF NOT EXISTS public.guardians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_uid text UNIQUE NOT NULL,
  email text NOT NULL,
  first_name text,
  last_name text,
  phone text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on guardians
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;

-- RLS Policies for guardians
CREATE POLICY "Guardians can view their own profile"
ON public.guardians FOR SELECT
TO authenticated
USING (auth_uid = (auth.uid())::text);

CREATE POLICY "Guardians can update their own profile"
ON public.guardians FOR UPDATE
TO authenticated
USING (auth_uid = (auth.uid())::text)
WITH CHECK (auth_uid = (auth.uid())::text);

-- Step 2: Add super_admin to the app_role enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'super_admin' AND enumtypid = 'app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'super_admin';
  END IF;
END $$;

-- Step 3: Update the handle_new_guardian function
CREATE OR REPLACE FUNCTION public.handle_new_guardian()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only create guardian profile if email matches any athlete's parent email
  IF EXISTS (
    SELECT 1 FROM public.atletas 
    WHERE mother_email = NEW.email OR father_email = NEW.email
  ) THEN
    INSERT INTO public.guardians (auth_uid, email, first_name, last_name)
    VALUES (
      NEW.id::text,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'first_name', 'Guardian'),
      COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    )
    ON CONFLICT (auth_uid) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;