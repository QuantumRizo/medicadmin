-- ============================================================
-- SQL: Automatización de Perfiles y Multi-tenancy
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Función para generar un app_id aleatorio (ej: MED-1234-5678)
CREATE OR REPLACE FUNCTION public.generate_unique_app_id()
RETURNS TEXT AS $$
DECLARE
    new_app_id TEXT;
    done BOOLEAN DEFAULT FALSE;
BEGIN
    WHILE NOT done LOOP
        new_app_id := 'MED-' || floor(random() * 9000 + 1000)::text || '-' || floor(random() * 9000 + 1000)::text;
        
        -- Verificar que no exista ya ese ID
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE app_id = new_app_id) THEN
            done := TRUE;
        END IF;
    END LOOP;
    RETURN new_app_id;
END;
$$ LANGUAGE plpgsql;

-- 2. Función disparadora (Trigger) para crear el perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, app_id, can_upload_files, updated_at)
    VALUES (
        new.id, 
        COALESCE(new.raw_user_meta_data->>'full_name', 'Nuevo Doctor'), 
        public.generate_unique_app_id(),
        false, -- Por defecto no tienen Premium (subida de archivos)
        now()
    );

    -- Opcional: Crear también una entrada inicial en clinic_settings
    INSERT INTO public.clinic_settings (app_id, doctor_name, updated_at)
    VALUES (
        (SELECT app_id FROM public.profiles WHERE id = new.id),
        COALESCE(new.raw_user_meta_data->>'full_name', 'Doctor'),
        now()
    );

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Crear el Trigger en la tabla auth.users
-- Nota: Primero borramos si ya existe para evitar errores al re-ejecutar
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
