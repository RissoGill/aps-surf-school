-- Allow anonymous users to read championship registrations so athlete dashboards can reflect registrations without auth
-- Table: public.campeonatos_atletas

-- Ensure RLS is enabled (it already should be, but this is safe)
ALTER TABLE public.campeonatos_atletas ENABLE ROW LEVEL SECURITY;

-- Create a permissive SELECT policy for anonymous access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'campeonatos_atletas' 
      AND policyname = 'Anonymous can view championship registrations'
  ) THEN
    CREATE POLICY "Anonymous can view championship registrations"
      ON public.campeonatos_atletas
      FOR SELECT
      USING (true);
  END IF;
END$$;