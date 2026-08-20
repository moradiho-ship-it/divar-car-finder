do $$
begin
  if exists (select 1 from cron.job where jobname = 'divar-car-finder-hourly') then
    perform cron.unschedule('divar-car-finder-hourly');
  end if;
end $$;

select cron.schedule(
  'divar-car-finder-hourly',
  '17 * * * *',
  $job$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'edge_function_url'),
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_publishable_key'),
      'x-schedule-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'crawl_schedule_secret')
    ),
    body := jsonb_build_object('source', 'supabase-pg-cron', 'triggered_at', now()),
    timeout_milliseconds := 60000
  );
  $job$
);
