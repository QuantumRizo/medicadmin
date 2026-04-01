-- ============================================================
-- MedicAdmin — Cumplimiento NOM-024-SSA3-2012 y Ley ARCO
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. TABLA: audit_logs
--    Bitácora permanente de actividad clínica (quién, cuándo, qué)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id      TEXT NOT NULL,
    user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    patient_id  UUID,                          -- puede ser NULL si la acción no es sobre un paciente
    action      TEXT NOT NULL,                 -- 'VIEW_RECORD' | 'SAVE_RECORD' | 'DELETE_PATIENT' | 'LOGIN' | 'LOGOUT'
    details     JSONB DEFAULT '{}'::jsonb,     -- e.g. { "fields_changed": ["diagnosis", "medications"] }
    ip_address  TEXT,                          -- opcional, para auditoría de acceso
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_audit_logs_app_id ON public.audit_logs(app_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_patient_id ON public.audit_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- RLS: Solo usuarios autenticados de la misma app pueden leer sus propios logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs: read own app logs" ON public.audit_logs;
CREATE POLICY "audit_logs: read own app logs" ON public.audit_logs
    FOR SELECT USING (app_id = (
        SELECT app_id FROM public.profiles WHERE id = auth.uid()
    ));

DROP POLICY IF EXISTS "audit_logs: insert own app logs" ON public.audit_logs;
CREATE POLICY "audit_logs: insert own app logs" ON public.audit_logs
    FOR INSERT WITH CHECK (app_id = (
        SELECT app_id FROM public.profiles WHERE id = auth.uid()
    ));

-- Los logs NUNCA se pueden actualizar ni borrar (integridad NOM-024)
-- No se crean policies de UPDATE ni DELETE → solo lectura/inserción.


-- ============================================================
-- 2. TABLA: clinic_settings
--    Perfil del médico/clínica por app_id (datos para recetas, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clinic_settings (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id               TEXT NOT NULL UNIQUE,  -- un registro por clínica
    clinic_name          TEXT,
    doctor_name          TEXT,
    cedula_profesional   TEXT,
    especialidad         TEXT,
    institucion_egreso   TEXT,
    telefono_clinica     TEXT,
    direccion_clinica    TEXT,
    logo_url             TEXT,                  -- URL a imagen en Supabase Storage
    aviso_privacidad     TEXT,                  -- Texto del aviso de privacidad personalizable
    updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Solo el usuario de esa app puede leer/escribir su propia configuración
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clinic_settings: read own" ON public.clinic_settings;
CREATE POLICY "clinic_settings: read own" ON public.clinic_settings
    FOR SELECT USING (app_id = (
        SELECT app_id FROM public.profiles WHERE id = auth.uid()
    ));

DROP POLICY IF EXISTS "clinic_settings: upsert own" ON public.clinic_settings;
CREATE POLICY "clinic_settings: upsert own" ON public.clinic_settings
    FOR ALL USING (app_id = (
        SELECT app_id FROM public.profiles WHERE id = auth.uid()
    ));


-- ============================================================
-- 3. REFUERZO RLS en tabla `patients`
--    Ya debería existir, pero verificamos que esté activo
-- ============================================================
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Solo puedes ver/editar pacientes de tu app_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'patients' AND policyname = 'patients: own app only'
    ) THEN
        DROP POLICY IF EXISTS "patients: own app only" ON public.patients;
        CREATE POLICY "patients: own app only" ON public.patients
            FOR ALL USING (app_id = (
                SELECT app_id FROM public.profiles WHERE id = auth.uid()
            ));
    END IF;
END $$;


-- ============================================================
-- FIN DEL SCRIPT
-- Después de ejecutar este SQL:
--   1. Verifica en Table Editor que existen: audit_logs, clinic_settings
--   2. Verifica en Authentication > Policies que las RLS están activas
-- ============================================================
