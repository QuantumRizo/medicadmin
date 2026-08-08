-- ============================================================
-- Agregar columna email a la tabla public.profiles
-- y actualizar la función de registro handle_new_user_signup()
-- ============================================================

-- 1. Agregar columna email a profiles
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Llenar los correos existentes desde auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email != u.email);

-- 3. Actualizar la función handle_new_user_signup para incluir new.email
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
    new_app_id TEXT;
BEGIN
    new_app_id := public.generate_unique_app_id();

    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        app_id,
        subscription_status,
        plan_name,
        trial_ends_at,
        whatsapp_reminders_enabled,
        whatsapp_limit,
        max_file_size_mb,
        storage_limit_mb,
        updated_at
    )
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Nuevo Doctor'),
        new_app_id,
        'trial',
        'Free',
        (now() + interval '30 days'),
        true,
        30,
        5,
        100,
        now()
    );

    INSERT INTO public.clinic_settings (app_id, doctor_name, updated_at)
    VALUES (
        new_app_id,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Nuevo Doctor'),
        now()
    )
    ON CONFLICT (app_id) DO NOTHING;

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
