-- ============================================================
-- Simplificación del sistema de planes: Free (trial 30 días) y Pro
-- ============================================================

-- 1. Eliminar columnas redundantes / que nunca se usan
ALTER TABLE public.profiles
    DROP COLUMN IF EXISTS can_upload_files,
    DROP COLUMN IF EXISTS subscription_ends_at;

-- 2. Normalizar plan_name existente a 'Free' o 'Pro'
UPDATE public.profiles
SET plan_name = 'Pro'
WHERE subscription_status = 'active';

UPDATE public.profiles
SET plan_name = 'Free'
WHERE subscription_status IN ('trial', 'expired', 'locked') OR plan_name IS NULL;

-- 3. Normalizar subscription_status: 'expired' y 'locked' → 'trial'
--    (usuarios caducados vuelven a verse como Free para simplificar)
UPDATE public.profiles
SET subscription_status = 'trial'
WHERE subscription_status IN ('expired', 'locked');

-- 4. Asegurar que whatsapp_limit sea consistente con el plan
UPDATE public.profiles SET whatsapp_limit = 300 WHERE subscription_status = 'active';
UPDATE public.profiles SET whatsapp_limit = 30  WHERE subscription_status = 'trial';

-- 5. CHECK constraints en plan_name y subscription_status
--    (primero eliminamos cualquier constraint previo si existe)
ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS profiles_plan_name_check,
    DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;

ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_plan_name_check
        CHECK (plan_name IN ('Free', 'Pro')),
    ADD CONSTRAINT profiles_subscription_status_check
        CHECK (subscription_status IN ('trial', 'active'));

-- 6. Actualizar el trigger de signup para nuevos usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
    new_app_id TEXT;
BEGIN
    -- Generar app_id único
    new_app_id := public.generate_unique_app_id();

    -- Crear perfil: Plan Free con 30 días de prueba
    INSERT INTO public.profiles (
        id,
        full_name,
        app_id,
        subscription_status,
        plan_name,
        trial_ends_at,
        whatsapp_reminders_enabled,
        whatsapp_limit,
        updated_at
    )
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Nuevo Doctor'),
        new_app_id,
        'trial',                            -- Plan Free
        'Free',
        (now() + interval '30 days'),        -- 1 mes de prueba
        true,                               -- Recordatorios activados por default
        30,                                 -- Límite WhatsApp Free
        now()
    );

    -- Crear configuración inicial de clínica
    INSERT INTO public.clinic_settings (app_id, doctor_name, updated_at)
    VALUES (
        new_app_id,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Nuevo Doctor'),
        now()
    )
    ON CONFLICT (app_id) DO NOTHING;

    -- Crear sucursal predeterminada
    INSERT INTO public.hospitals (id, app_id, name, address, start_time, end_time, slot_interval, is_dental_clinic)
    VALUES (
        gen_random_uuid()::text,
        new_app_id,
        'Consultorio Principal',
        'Por favor completa tu dirección en Configuración',
        '09:00',
        '18:00',
        30,
        false
    );

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear el trigger por si acaso
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();

-- ============================================================
-- Para subir a un usuario a Plan Pro (hacerlo manualmente):
-- UPDATE profiles
-- SET subscription_status = 'active',
--     plan_name = 'Pro',
--     whatsapp_limit = 300
-- WHERE app_id = 'MED-XXXX-XXXX';
-- ============================================================
