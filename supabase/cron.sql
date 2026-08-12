SELECT cron.schedule(
  'invoke-check-farm',
  '* * * * *',
  $$
    SELECT net.http_post(
        url:='https://ykbpkhsrxtnnisnorwhd.supabase.co/functions/v1/check-farm',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer sb_publishable_Txki7crNaFMuqseK9G6JKw_aR4TsulA"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);
