create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'group-offer-expire-every-15min',
  '*/15 * * * *',
  $$
  select net.http_post(
    url:='https://ougpesguavrqbeethbjl.supabase.co/functions/v1/group-offer-expire',
    headers:='{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91Z3Blc2d1YXZycWJlZXRoYmpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MTIzNzQsImV4cCI6MjA5MzQ4ODM3NH0.6nTuDdy-QWGKKhnFLFEVjeWEeqM-A6C9nRGnAykiIdk"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);