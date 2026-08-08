-- ============================================================
-- WhatsApp Usage Tracking & Quota System
-- ============================================================
-- Tabla para rastrear mensajes enviados por app_id por mes
CREATE TABLE IF NOT EXISTS public.whatsapp_usage (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id          TEXT NOT NULL,
    year_month      TEXT NOT NULL,          -- Formato: '2026-08'
    messages_sent   INT  NOT NULL DEFAULT 0,
    updated_at      TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT whatsapp_usage_app_month_unique UNIQUE (app_id, year_month)
);

-- RLS: solo el propio app_id puede leer su uso
ALTER TABLE public.whatsapp_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own whatsapp usage"
    ON public.whatsapp_usage FOR SELECT
    USING (
        app_id = (
            SELECT app_id FROM public.profiles
            WHERE id = auth.uid()
        )
    );

-- Actualizar default de whatsapp_limit: Plan Free = 30, Pro = 300
-- (el dueño del sistema cambia manualmente a 300 en profiles para clientes Pro)
ALTER TABLE public.profiles
    ALTER COLUMN whatsapp_limit SET DEFAULT 30;

-- Actualizar registros existentes que tienen el default antiguo de 300 → 30
-- (solo los que nunca fueron cambiados manualmente)
UPDATE public.profiles
SET whatsapp_limit = 30
WHERE whatsapp_limit = 300 OR whatsapp_limit IS NULL;

-- ============================================================
-- Función: obtener mensajes restantes del mes actual
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_whatsapp_remaining(p_app_id TEXT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_limit       INT;
    v_sent        INT;
    v_year_month  TEXT;
BEGIN
    v_year_month := TO_CHAR(NOW() AT TIME ZONE 'America/Mexico_City', 'YYYY-MM');

    -- Obtener el límite del plan
    SELECT COALESCE(whatsapp_limit, 30)
    INTO v_limit
    FROM public.profiles
    WHERE app_id = p_app_id
    LIMIT 1;

    -- Obtener mensajes enviados este mes
    SELECT COALESCE(messages_sent, 0)
    INTO v_sent
    FROM public.whatsapp_usage
    WHERE app_id = p_app_id
      AND year_month = v_year_month;

    RETURN GREATEST(0, v_limit - COALESCE(v_sent, 0));
END;
$$;

-- ============================================================
-- pg_cron: Ejecutar recordatorios todos los días a las 8 AM CDMX
-- CDMX = UTC-6 (invierno) / UTC-5 (verano)
-- Usamos 13:00 UTC como aproximación segura (8 AM CDT / verano)
-- ============================================================
-- NOTA: Descomenta esta sección SOLO si pg_cron está activado en Supabase
-- La URL de la edge function debe actualizarse con tu Project ID real

-- SELECT cron.schedule(
--     'send-whatsapp-reminders-daily',
--     '0 13 * * *',
--     $$
--     SELECT net.http_post(
--         url := 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/send-whatsapp-reminders',
--         headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY"}'::jsonb,
--         body := '{}'::jsonb
--     );
--     $$
-- );
