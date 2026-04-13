
SELECT cron.schedule(
  'generate-recurring-expenses-monthly',
  '0 6 1 * *',
  $$
  SELECT net.http_post(
    url := 'https://bzzzecvzoahauqrhkvds.supabase.co/functions/v1/generate-recurring-expenses',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6enplY3Z6b2FoYXVxcmhrdmRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MTE2NTYsImV4cCI6MjA3NDI4NzY1Nn0.lKxGWQj9vu18vSpxojBF25IvoujL-1sH3LqUu4SNJcA"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
