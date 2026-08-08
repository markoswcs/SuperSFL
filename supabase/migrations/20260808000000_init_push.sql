CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id BIGINT NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(farm_id)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert" ON public.push_subscriptions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select" ON public.push_subscriptions
    FOR SELECT USING (true);
    
CREATE POLICY "Allow public update" ON public.push_subscriptions
    FOR UPDATE USING (true);

-- Create a table for logs to avoid duplicate notifications (handled entirely by the edge function but good to have)
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id BIGINT NOT NULL,
    notification_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(farm_id, notification_id)
);

ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all" ON public.notification_logs FOR ALL USING (true) WITH CHECK (true);

-- Schedule CRON JOB every 5 minutes to trigger the Edge Function
SELECT cron.schedule(
  'check-farm-push',
  '*/5 * * * *',
  $$
    SELECT net.http_post(
      url:='https://ykbpkhsrxtnnisnorwhd.supabase.co/functions/v1/check-farm',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer sb_publishable_Txki7crNaFMuqseK9G6JKw_aR4TsulA"}'::jsonb
    );
  $$
);
