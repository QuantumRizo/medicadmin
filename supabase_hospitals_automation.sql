-- ============================================================
-- SQL: Automatización de Sucursales (Hospitals)
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Actualizamos la función handle_new_user_signup para incluir la sucursal predeterminada
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
    new_app_id TEXT;
BEGIN
    -- 1. Generar el app_id
    new_app_id := public.generate_unique_app_id();

    -- 2. Crear el perfil
    INSERT INTO public.profiles (id, full_name, app_id, can_upload_files, updated_at)
    VALUES (
        new.id, 
        COALESCE(new.raw_user_meta_data->>'full_name', 'Nuevo Doctor'), 
        new_app_id,
        false,
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

    -- 4. Crear la sucursal (hospital) predeterminada (ESTO EVITA QUE LA AGENDA ESTÉ VACÍA)
    INSERT INTO public.hospitals (app_id, name, address, start_time, end_time, slot_interval, is_dental_clinic)
    VALUES (
        new_app_id,
        'Consultorio Principal',
        'Por favor completa tu dirección en Configuración',
        '09:00',
        '18:00',
        30,      -- Intervalo de 30 minutos por defecto
        false   -- No es dental por defecto
    );

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
