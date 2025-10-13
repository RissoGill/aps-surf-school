-- Create storage bucket for attendance media
INSERT INTO storage.buckets (id, name, public)
VALUES ('attendance-media', 'attendance-media', true)
ON CONFLICT (id) DO NOTHING;

-- Add media columns to Attendance table
ALTER TABLE public."Attendance"
ADD COLUMN IF NOT EXISTS photos text[],
ADD COLUMN IF NOT EXISTS videos text[];

-- Create RLS policies for attendance media bucket
CREATE POLICY "Anyone can view attendance media"
ON storage.objects FOR SELECT
USING (bucket_id = 'attendance-media');

CREATE POLICY "Authenticated users can upload attendance media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'attendance-media' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update their attendance media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'attendance-media' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete attendance media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'attendance-media' 
  AND auth.role() = 'authenticated'
);