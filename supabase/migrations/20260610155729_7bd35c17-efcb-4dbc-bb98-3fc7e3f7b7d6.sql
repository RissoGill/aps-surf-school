-- Storage RLS policies for the news-flyers bucket.
-- These are intentionally permissive because this project uses legacy localStorage admin sessions,
-- so Supabase receives requests as anon instead of an authenticated Supabase user.
DROP POLICY IF EXISTS "Public read news-flyers" ON storage.objects;
DROP POLICY IF EXISTS "Public upload to news-flyers" ON storage.objects;
DROP POLICY IF EXISTS "Public update news-flyers" ON storage.objects;
DROP POLICY IF EXISTS "Public delete news-flyers" ON storage.objects;

CREATE POLICY "Public read news-flyers"
ON storage.objects
AS PERMISSIVE
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'news-flyers');

CREATE POLICY "Public upload to news-flyers"
ON storage.objects
AS PERMISSIVE
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'news-flyers');

CREATE POLICY "Public update news-flyers"
ON storage.objects
AS PERMISSIVE
FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'news-flyers')
WITH CHECK (bucket_id = 'news-flyers');

CREATE POLICY "Public delete news-flyers"
ON storage.objects
AS PERMISSIVE
FOR DELETE
TO anon, authenticated
USING (bucket_id = 'news-flyers');

-- Keep public.news compatible with legacy admin sessions.
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.news TO anon, authenticated;
GRANT ALL ON public.news TO service_role;

DROP POLICY IF EXISTS "Public can read news" ON public.news;
DROP POLICY IF EXISTS "Public can read active news" ON public.news;
DROP POLICY IF EXISTS "Legacy admins can create news" ON public.news;
DROP POLICY IF EXISTS "Legacy admins can update news" ON public.news;
DROP POLICY IF EXISTS "Legacy admins can delete news" ON public.news;

CREATE POLICY "Public can read news"
ON public.news
AS PERMISSIVE
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Legacy admins can create news"
ON public.news
AS PERMISSIVE
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Legacy admins can update news"
ON public.news
AS PERMISSIVE
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Legacy admins can delete news"
ON public.news
AS PERMISSIVE
FOR DELETE
TO anon, authenticated
USING (true);