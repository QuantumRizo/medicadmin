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

export const getApptColor = (_reason: AppointmentReason | string, _status?: string, hospitalIndex: number = 0) => {
    const palette = [
        { bg: 'bg-[#dcfce7]', border: 'border-[#bbf7d0]', text: 'text-[#166534]' }, // Verde tenue (emerald-100)
        { bg: 'bg-[#fef3c7]', border: 'border-[#fde68a]', text: 'text-[#92400e]' }, // Amarillo tenue (amber-100)
        { bg: 'bg-[#e0f2fe]', border: 'border-[#bae6fd]', text: 'text-[#075985]' }, // Azul claro tenue (sky-100)
        { bg: 'bg-[#f3e8ff]', border: 'border-[#e9d5ff]', text: 'text-[#6b21a8]' }, // Morado tenue (purple-100)
        { bg: 'bg-[#ffe4e6]', border: 'border-[#fecdd3]', text: 'text-[#9f1239]' }, // Rosa tenue (rose-100)
    ];

    return palette[hospitalIndex % palette.length];
};

export const getHospitalAcronym = (name?: string) => {
    if (!name) return '';
    const words = name.trim().split(/\s+/).filter(w => w.length > 0 && w.toLowerCase() !== 'de' && w.toLowerCase() !== 'la' && w.toLowerCase() !== 'el');
    if (words.length > 1) {
        return words.map(w => w[0]).join('').substring(0, 3).toUpperCase();
    }
    return name.substring(0, 3).toUpperCase();
};

