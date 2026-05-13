CREATE TABLE public.news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  news_date DATE NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT,
  expires_at DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "News are publicly readable"
ON public.news FOR SELECT
TO anon, authenticated
USING (true);

CREATE INDEX idx_news_active_date ON public.news (is_active, news_date DESC);

INSERT INTO storage.buckets (id, name, public)
VALUES ('news-flyers', 'news-flyers', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "News flyers are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'news-flyers');