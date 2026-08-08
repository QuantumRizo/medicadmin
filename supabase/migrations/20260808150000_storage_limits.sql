-- ============================================================
-- Límites de almacenamiento por plan
-- Free: 5 MB por archivo, 100 MB total
-- Pro:  25 MB por archivo, sin límite total
-- ============================================================

-- 1. Agregar columna file_size_bytes a patient_uploads (si no existe)
ALTER TABLE public.patient_uploads
    ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT DEFAULT 0;

-- 2. Agregar columnas de cuota a profiles
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS max_file_size_mb   INT DEFAULT 5,    -- Free: 5 MB por archivo
    ADD COLUMN IF NOT EXISTS storage_limit_mb   INT DEFAULT 100;  -- Free: 100 MB total (NULL = ilimitado en Pro)

-- 3. Ajustar valores según plan actual
--    Plan Free (trial) → 5 MB / archivo, 100 MB total
UPDATE public.profiles
SET max_file_size_mb = 5,
    storage_limit_mb = 100
WHERE subscription_status = 'trial';

--    Plan Pro (active) → 25 MB / archivo, sin límite total (NULL)
UPDATE public.profiles
SET max_file_size_mb = 25,
    storage_limit_mb = NULL
WHERE subscription_status = 'active';

-- 4. Actualizar el trigger de signup para incluir los límites Free
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
    new_app_id TEXT;
BEGIN
    new_app_id := public.generate_unique_app_id();

    INSERT INTO public.profiles (
        id, full_name, app_id,
        subscription_status, plan_name,
        trial_ends_at,
        whatsapp_reminders_enabled, whatsapp_limit,
        max_file_size_mb, storage_limit_mb,
        updated_at
    )
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Nuevo Doctor'),
        new_app_id,
        'trial', 'Free',
        (now() + interval '30 days'),
        true, 30,
        5,      -- 5 MB por archivo (Free)
        100,    -- 100 MB total (Free)
        now()
    );

    INSERT INTO public.clinic_settings (app_id, doctor_name, updated_at)
    VALUES (new_app_id, COALESCE(new.raw_user_meta_data->>'full_name', 'Nuevo Doctor'), now())
    ON CONFLICT (app_id) DO NOTHING;

    INSERT INTO public.hospitals (id, app_id, name, address, start_time, end_time, slot_interval, is_dental_clinic)
    VALUES (
        gen_random_uuid()::text, new_app_id,
        'Consultorio Principal',
        'Por favor completa tu dirección en Configuración',
        '09:00', '18:00', 30, false
    );

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();

-- ============================================================
-- Para subir a Pro (cambia límites junto con el plan):
-- UPDATE profiles
-- SET subscription_status = 'active', plan_name = 'Pro',
--     whatsapp_limit = 300,
--     max_file_size_mb = 25,
--     storage_limit_mb = NULL   -- sin límite total
-- WHERE app_id = 'MED-XXXX-XXXX';
-- ============================================================
