-- ============================================================
-- SQL: Gestión de Suscripciones y Periodo de Prueba
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Añadir columnas de suscripción a la tabla de perfiles
ALTER TABLE IF EXISTS public.profiles 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'expired', 'locked')),
ADD COLUMN IF NOT EXISTS plan_name TEXT DEFAULT 'Premium Monthly',
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days'),
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMP WITH TIME ZONE;

-- 2. Actualizar la función handle_new_user_signup para incluir la lógica de suscripción
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
    new_app_id TEXT;
BEGIN
    -- 1. Generar el app_id
    new_app_id := public.generate_unique_app_id();

    -- 2. Crear el perfil con 30 días de prueba
    INSERT INTO public.profiles (
        id, 
        full_name, 
        app_id, 
        can_upload_files, 
        subscription_status,
        plan_name,
        trial_ends_at,
        updated_at
    )
    VALUES (
        new.id, 
        COALESCE(new.raw_user_meta_data->>'full_name', 'Nuevo Doctor'), 
        new_app_id,
        true,           -- Les damos Premium (subida de archivos) durante la prueba
        'trial',        -- Estado inicial: Prueba
        'Premium Monthly',
        (now() + interval '30 days'), -- 30 días exactos de regalo
        now()
    );

    -- 3. Crear la configuración inicial de la clínica
    INSERT INTO public.clinic_settings (app_id, doctor_name, clinic_name, updated_at)
    VALUES (
        new_app_id,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Nuevo Doctor'),
        'Mi Clínica Médica',
        now()
    );

    -- 4. Crear la sucursal predeterminada
    INSERT INTO public.hospitals (app_id, name, address, start_time, end_time, slot_interval, is_dental_clinic)
    VALUES (
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

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
