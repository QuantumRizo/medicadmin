
// ═══════════════════════════════════════════════════════════
// Central Timezone Module — MedicAdmin
// Toda la app usa esta constante para cálculos de fecha/hora.
// Cambiar APP_TIMEZONE aquí afecta TODO el sistema.
// ═══════════════════════════════════════════════════════════

/** Zona horaria de la clínica. Configurable en un solo lugar. */
export const APP_TIMEZONE = 'America/Mexico_City';

type MexicoCityDateTimeParts = {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
};

function getMexicoCityDateTimeParts(): MexicoCityDateTimeParts {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: APP_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
    });
    const parts = Object.fromEntries(formatter.formatToParts(new Date())
        .filter(({ type }) => type !== 'literal')
        .map(({ type, value }) => [type, Number(value)]));

    return parts as unknown as MexicoCityDateTimeParts;
}

/**
 * Retorna un Date ajustado a la zona horaria de la clínica.
 * Usar en lugar de `new Date()` para TODA lógica de negocio.
 */
export function getNow(): Date {
    const { year, month, day, hour, minute, second } = getMexicoCityDateTimeParts();
    // Date de presentación: conserva el reloj de CDMX sin depender del huso del navegador.
    return new Date(year, month - 1, day, hour, minute, second);
}

/**
 * Retorna la fecha de HOY como "yyyy-MM-dd" en la zona horaria de la clínica.
 * Usar para comparar contra fechas de citas almacenadas.
 */
export function getTodayStr(): string {
    const { year, month, day } = getMexicoCityDateTimeParts();
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Hora actual de la clínica en formato comparable HH:mm. */
export function getCurrentTimeStr(): string {
    const { hour, minute } = getMexicoCityDateTimeParts();
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/** Compara dos citas locales de CDMX sin convertirlas a UTC. */
export function compareClinicDateTimes(dateA: string, timeA: string, dateB: string, timeB: string): number {
    const first = `${dateA}T${timeA}`;
    const second = `${dateB}T${timeB}`;
    return first.localeCompare(second);
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
        return compareClinicDateTimes(date, time, getTodayStr(), getCurrentTimeStr()) <= 0;
    } catch (e) {
        console.error("Error validating past appointment", e);
        return false;
    }
};
