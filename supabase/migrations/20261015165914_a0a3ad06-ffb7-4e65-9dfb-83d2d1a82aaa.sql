CREATE TABLE public.coach_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id TEXT,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Outro',
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.coach_documents TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_documents TO authenticated;
GRANT ALL ON public.coach_documents TO service_role;

ALTER TABLE public.coach_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read coach documents" ON public.coach_documents FOR SELECT USING (true);
CREATE POLICY "Anyone can insert coach documents" ON public.coach_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update coach documents" ON public.coach_documents FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete coach documents" ON public.coach_documents FOR DELETE USING (true);

CREATE TRIGGER update_coach_documents_updated_at BEFORE UPDATE ON public.coach_documents FOR EACH ROW EXECUTE FUNCTION public.update_coach_payment_timestamp();

-- Storage policies for coach-documents bucket (legacy localStorage auth => permissive, consistent with project)
CREATE POLICY "Anyone can read coach documents files" ON storage.objects FOR SELECT USING (bucket_id = 'coach-documents');
CREATE POLICY "Anyone can upload coach documents files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'coach-documents');
CREATE POLICY "Anyone can update coach documents files" ON storage.objects FOR UPDATE USING (bucket_id = 'coach-documents') WITH CHECK (bucket_id = 'coach-documents');
CREATE POLICY "Anyone can delete coach documents files" ON storage.objects FOR DELETE USING (bucket_id = 'coach-documents');