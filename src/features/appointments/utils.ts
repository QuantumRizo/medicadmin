import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { AppointmentReason } from './types';

export const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return format(date, 'h:mm a', { locale: es });
};

export const getStatusLabel = (reason: AppointmentReason | string) => {
    switch (reason) {
        case 'blocked': return 'Bloqueo';
        case 'first-visit': return 'Primera vez';
        case 'specific-service': return 'Servicio Específico';
        default: return 'Seguimiento';
    }
};

export const getApptColor = (reason: AppointmentReason | string) => {
    if (reason === 'blocked') {
        return {
            bg: 'bg-slate-100',
            border: 'border-slate-300',
            text: 'text-slate-600',
            name: 'slate'
        };
    }
    return {
        bg: 'bg-sky-50',
        border: 'border-sky-200',
        text: 'text-sky-700',
        name: 'sky'
    };
};

export const getHospitalAcronym = (name?: string) => {
    if (!name) return '';
    const words = name.trim().split(/\s+/).filter(w => w.length > 0 && w.toLowerCase() !== 'de' && w.toLowerCase() !== 'la' && w.toLowerCase() !== 'el');
    if (words.length > 1) {
        return words.map(w => w[0]).join('').substring(0, 3).toUpperCase();
    }
    return name.substring(0, 3).toUpperCase();
};

