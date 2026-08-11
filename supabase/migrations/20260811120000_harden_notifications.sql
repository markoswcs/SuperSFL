-- Mantém o backend de notificações consistente para instalações novas e existentes.
-- O cliente usa a chave pública; por isso as políticas abaixo preservam o modelo
-- atual de acesso por Farm ID e permitem que o upsert da agenda funcione.

CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE TABLE IF NOT EXISTS public.farm_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id BIGINT NOT NULL,
  item_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  item_category TEXT NOT NULL,
  ready_at TIMESTAMPTZ NOT NULL,
  notification_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.farm_schedules
  ADD COLUMN IF NOT EXISTS item_name TEXT,
  ADD COLUMN IF NOT EXISTS item_category TEXT,
  ADD COLUMN IF NOT EXISTS ready_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS farm_schedules_farm_item_unique
  ON public.farm_schedules (farm_id, item_id);

CREATE INDEX IF NOT EXISTS farm_schedules_due_idx
  ON public.farm_schedules (notification_sent, ready_at);

ALTER TABLE public.farm_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select farm schedules" ON public.farm_schedules;
DROP POLICY IF EXISTS "Allow public insert farm schedules" ON public.farm_schedules;
DROP POLICY IF EXISTS "Allow public update farm schedules" ON public.farm_schedules;
DROP POLICY IF EXISTS "Allow public delete farm schedules" ON public.farm_schedules;

CREATE POLICY "Allow public select farm schedules"
  ON public.farm_schedules FOR SELECT USING (true);
CREATE POLICY "Allow public insert farm schedules"
  ON public.farm_schedules FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update farm schedules"
  ON public.farm_schedules FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete farm schedules"
  ON public.farm_schedules FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public delete push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Allow public delete push subscriptions"
  ON public.push_subscriptions FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.set_farm_schedule_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS set_farm_schedule_updated_at ON public.farm_schedules;
CREATE TRIGGER set_farm_schedule_updated_at
  BEFORE UPDATE ON public.farm_schedules
  FOR EACH ROW EXECUTE FUNCTION public.set_farm_schedule_updated_at();

-- Remove as tarefas antigas, que podiam executar a mesma função mais de uma vez
-- ou não existir em novas instalações do projeto.
DO $migration$
DECLARE
  job_to_remove BIGINT;
BEGIN
  FOR job_to_remove IN
    SELECT jobid
    FROM cron.job
    WHERE jobname IN ('check-farm-push', 'check_farm_push_cron', 'invoke-check-farm')
  LOOP
    PERFORM cron.unschedule(job_to_remove);
  END LOOP;
END;
$migration$;

SELECT cron.schedule(
  'invoke-check-farm',
  '* * * * *',
  $command$
    SELECT net.http_post(
      url := 'https://ykbpkhsrxtnnisnorwhd.supabase.co/functions/v1/check-farm',
      headers := '{"Content-Type":"application/json","Authorization":"Bearer sb_publishable_Txki7crNaFMuqseK9G6JKw_aR4TsulA"}'::jsonb,
      body := '{}'::jsonb
    );
  $command$
);
