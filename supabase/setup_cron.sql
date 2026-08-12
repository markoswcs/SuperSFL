CREATE EXTENSION IF NOT EXISTS pg_cron; 
SELECT cron.schedule('check_farm_push_cron', '* * * * *', 
  
    select net.http_post(
      url:='https://ykbpkhsrxtnnisnorwhd.supabase.co/functions/v1/check-farm',
      headers:='{"Authorization": "Bearer sb_publishable_Txki7crNaFMuqseK9G6JKw_aR4TsulA"}'::jsonb
    );
  
);
