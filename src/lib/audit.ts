import { supabase } from '@/lib/supabase';
import type { AuditAction } from '../features/appointments/types';

/**
 * logActivity — Registra una acción en la bitácora de auditoría (NOM-024-SSA3-2012).
 * Se llama en puntos clave: guardar expediente, ver expediente, eliminar paciente, etc.
 * Los logs son inmutables (sin policy de UPDATE/DELETE en Supabase).
 */
export async function logActivity(params: {
    appId: string;
    patientId?: string;
    action: AuditAction;
    details?: Record<string, any>;
}) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('audit_logs').insert({
            app_id: params.appId,
            user_id: user?.id ?? null,
            patient_id: params.patientId ?? null,
            action: params.action,
            details: params.details ?? {},
        });
    } catch {
        // Los errores de audit no deben interrumpir el flujo del médico
        console.warn('[Audit] Error registrando log:', params.action);
    }
}
