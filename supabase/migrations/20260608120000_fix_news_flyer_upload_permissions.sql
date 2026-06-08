GRANT SELECT, INSERT, UPDATE, DELETE ON public.news TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news TO authenticated;
GRANT ALL ON public.news TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'news'
      AND policyname = 'Legacy admins can create news'
  ) THEN
    CREATE POLICY "Legacy admins can create news"
    ON public.news
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'news'
      AND policyname = 'Legacy admins can update news'
  ) THEN
    CREATE POLICY "Legacy admins can update news"
    ON public.news
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'news'
      AND policyname = 'Legacy admins can delete news'
  ) THEN
    CREATE POLICY "Legacy admins can delete news"
    ON public.news
    FOR DELETE
    TO anon, authenticated
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Legacy admins can upload news flyers'
  ) THEN
    CREATE POLICY "Legacy admins can upload news flyers"
    ON storage.objects
    FOR INSERT
    TO public
    WITH CHECK (bucket_id = 'news-flyers');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Legacy admins can update news flyers'
  ) THEN
    CREATE POLICY "Legacy admins can update news flyers"
    ON storage.objects
    FOR UPDATE
    TO public
    USING (bucket_id = 'news-flyers')
    WITH CHECK (bucket_id = 'news-flyers');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Legacy admins can delete news flyers'
  ) THEN
    CREATE POLICY "Legacy admins can delete news flyers"
    ON storage.objects
    FOR DELETE
    TO public
    USING (bucket_id = 'news-flyers');
  END IF;
END $$;
