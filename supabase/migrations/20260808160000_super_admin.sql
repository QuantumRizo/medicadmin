-- ============================================================
-- Super Admin: acceso para el dueño del sistema
-- ============================================================

-- 1. Columna is_super_admin en profiles
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;

-- 2. Márca TU usuario como super admin.
--    Ejecuta esto UNA VEZ con tu email real:
--
-- UPDATE public.profiles
-- SET is_super_admin = TRUE
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'tu@email.com');

-- 3. Función SECURITY DEFINER para leer stats de todos los doctores
--    Solo el super admin puede llamarla (verificación interna).
CREATE OR REPLACE FUNCTION public.get_admin_doctor_stats()
RETURNS TABLE (
    profile_id          UUID,
    app_id              TEXT,
    full_name           TEXT,
    email               TEXT,
    subscription_status TEXT,
    plan_name           TEXT,
    trial_ends_at       TIMESTAMPTZ,
    whatsapp_enabled    BOOLEAN,
    whatsapp_limit      INT,
    whatsapp_sent       INT,        -- mensajes enviados este mes
    max_file_size_mb    INT,
    storage_limit_mb    INT,
    storage_used_bytes  BIGINT,     -- almacenamiento total usado
    appointments_month  INT,        -- citas agendadas este mes
    created_at          TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_year_month TEXT;
    v_month_start DATE;
    v_month_end DATE;
BEGIN
    -- Verificar que el llamador es super admin
    SELECT is_super_admin INTO v_is_admin
    FROM public.profiles
    WHERE id = auth.uid();

    IF NOT COALESCE(v_is_admin, FALSE) THEN
        RAISE EXCEPTION 'Acceso denegado: se requieren permisos de super administrador.';
    END IF;

    v_year_month  := TO_CHAR(NOW() AT TIME ZONE 'America/Mexico_City', 'YYYY-MM');
    v_month_start := DATE_TRUNC('month', NOW() AT TIME ZONE 'America/Mexico_City')::DATE;
    v_month_end   := (DATE_TRUNC('month', NOW() AT TIME ZONE 'America/Mexico_City') + INTERVAL '1 month - 1 day')::DATE;

    RETURN QUERY
    SELECT
        p.id                                                        AS profile_id,
        p.app_id,
        p.full_name,
        u.email::TEXT,
        p.subscription_status,
        p.plan_name,
        p.trial_ends_at,
        COALESCE(p.whatsapp_reminders_enabled, TRUE)               AS whatsapp_enabled,
        COALESCE(p.whatsapp_limit, 30)                             AS whatsapp_limit,
        COALESCE(wu.messages_sent, 0)::INT                         AS whatsapp_sent,
        COALESCE(p.max_file_size_mb, 5)                            AS max_file_size_mb,
        p.storage_limit_mb,
        COALESCE(SUM(pu.file_size_bytes), 0)::BIGINT               AS storage_used_bytes,
        COUNT(DISTINCT a.id) FILTER (
            WHERE a.date >= v_month_start
              AND a.date <= v_month_end
              AND a.reason != 'blocked'
        )::INT                                                      AS appointments_month,
        u.created_at
    FROM public.profiles p
    LEFT JOIN auth.users u
        ON u.id = p.id
    LEFT JOIN public.whatsapp_usage wu
        ON wu.app_id = p.app_id AND wu.year_month = v_year_month
    LEFT JOIN public.patients pat
        ON pat.app_id = p.app_id
    LEFT JOIN public.patient_uploads pu
        ON pu.patient_id = pat.id
    LEFT JOIN public.appointments a
        ON a.app_id = p.app_id
    WHERE p.is_super_admin IS NOT TRUE  -- no se muestra a sí mismo
    GROUP BY
        p.id, p.app_id, p.full_name, u.email, p.subscription_status,
        p.plan_name, p.trial_ends_at, p.whatsapp_reminders_enabled,
        p.whatsapp_limit, wu.messages_sent, p.max_file_size_mb,
        p.storage_limit_mb, u.created_at
    ORDER BY u.created_at DESC;
END;
$$;

-- 4. Función para actualizar el plan de un doctor (solo super admin)
CREATE OR REPLACE FUNCTION public.admin_set_plan(
    p_app_id            TEXT,
    p_plan              TEXT  -- 'Free' o 'Pro'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    SELECT is_super_admin INTO v_is_admin
    FROM public.profiles WHERE id = auth.uid();

    IF NOT COALESCE(v_is_admin, FALSE) THEN
        RAISE EXCEPTION 'Acceso denegado';
    END IF;

    IF p_plan = 'Pro' THEN
        UPDATE public.profiles
        SET subscription_status = 'active',
            plan_name           = 'Pro',
            whatsapp_limit      = 300,
            max_file_size_mb    = 25,
            storage_limit_mb    = NULL
        WHERE app_id = p_app_id;
    ELSIF p_plan = 'Free' THEN
        UPDATE public.profiles
        SET subscription_status = 'trial',
            plan_name           = 'Free',
            whatsapp_limit      = 30,
            max_file_size_mb    = 5,
            storage_limit_mb    = 100,
            trial_ends_at       = GREATEST(trial_ends_at, NOW() + INTERVAL '30 days')
        WHERE app_id = p_app_id;
    ELSE
        RAISE EXCEPTION 'Plan inválido: usa "Free" o "Pro"';
    END IF;
END;
$$;
