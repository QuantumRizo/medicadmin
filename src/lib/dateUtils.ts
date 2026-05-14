
// ═══════════════════════════════════════════════════════════
// Central Timezone Module — MedicAdmin
// Toda la app usa esta constante para cálculos de fecha/hora.
// Cambiar APP_TIMEZONE aquí afecta TODO el sistema.
// ═══════════════════════════════════════════════════════════

/** Zona horaria de la clínica. Configurable en un solo lugar. */
export const APP_TIMEZONE = 'America/Mexico_City';

/**
 * Retorna un Date ajustado a la zona horaria de la clínica.
 * Usar en lugar de `new Date()` para TODA lógica de negocio.
 */
export function getNow(): Date {
    const mxTimeString = new Date().toLocaleString("en-US", { timeZone: APP_TIMEZONE });
    return new Date(mxTimeString);
}

/**
 * Retorna la fecha de HOY como "yyyy-MM-dd" en la zona horaria de la clínica.
 * Usar para comparar contra fechas de citas almacenadas.
 */
export function getTodayStr(): string {
    const now = getNow();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * Checa si un string de fecha "yyyy-MM-dd" corresponde a HOY en la zona de la clínica.
 * Reemplaza `isToday(parseISO(dateStr))` de date-fns que depende del browser.
 */
export function isTodayMX(dateStr: string): boolean {
    return dateStr === getTodayStr();
}

/**
 * Checa si un string de fecha "yyyy-MM-dd" cae en la semana actual (lunes–domingo)
 * según la zona horaria de la clínica.
 * Reemplaza `isThisWeek(parseISO(dateStr))` de date-fns.
 */
export function isThisWeekMX(dateStr: string): boolean {
    const now = getNow();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon ... 6=Sat
    // Calcular lunes de esta semana
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    // Calcular domingo de esta semana
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const target = new Date(dateStr + 'T12:00:00'); // noon para evitar edge cases de DST
    return target >= monday && target <= sunday;
}

/**
 * Checks if a given appointment date and time have already passed
 * evaluated against the 'America/Mexico_City' timezone perfectly.
 */
export const isAppointmentPast = (date: string, time: string): boolean => {
    try {
        if (!date || !time) return false;

        const nowMx = getNow();
        const aptDateTime = new Date(`${date}T${time}:00`);

        return aptDateTime < nowMx;
    } catch (e) {
        console.error("Error validating past appointment", e);
        return false;
    }
};
