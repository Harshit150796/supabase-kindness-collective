
SELECT cron.schedule(
  'email-scheduler-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://vbnbacowuoeeojjdrzzp.supabase.co/functions/v1/email-scheduler',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZibmJhY293dW9lZW9qamRyenpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3ODU0NjIsImV4cCI6MjA4MjM2MTQ2Mn0.9zk-njOwZ6YrG0HKwpUj6rvK-rsGKkxIukh0XydlcOU"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
