-- Add subject column
ALTER TABLE public.alerts ADD COLUMN subject TEXT;

-- Add target_ids array column
ALTER TABLE public.alerts ADD COLUMN target_ids TEXT[];

-- Migrate existing data from target_id to target_ids
UPDATE public.alerts 
SET target_ids = ARRAY[target_id] 
WHERE target_id IS NOT NULL;

-- Drop old target_id column
ALTER TABLE public.alerts DROP COLUMN target_id;