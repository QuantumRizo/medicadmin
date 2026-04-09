import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    User, 
    Building2, 
    Calendar, 
    Clock, 
    FileText, 
    Edit2, 
    Trash2, 
    X, 
    Check,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Appointment, Patient, Hospital } from '../../appointments/types';
import { formatTime, getStatusLabel, getApptColor } from '../../appointments/utils';
import { isAppointmentPast } from '@/lib/dateUtils';

interface AppointmentDetailDialogProps {
    appointment: Appointment | null;
    patient: Patient | undefined;
    hospitals: Hospital[];
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onDelete: (id: string) => Promise<void>;
    onUpdate: (id: string, updates: Partial<Appointment>) => Promise<void>;
    getAvailableSlots: (date: string, hospitalId: string) => string[];
}

export const AppointmentDetailDialog = ({
    appointment,
    patient,
    hospitals,
    isOpen,
    onOpenChange,
    onDelete,
    onUpdate,
    getAvailableSlots
}: AppointmentDetailDialogProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editDate, setEditDate] = useState("");
    const [editTime, setEditTime] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!appointment) return null;

    const hospitalIndex = hospitals.findIndex(h => h.id === appointment.hospitalId);
    const color = getApptColor(appointment.reason, appointment.status, hospitalIndex >= 0 ? hospitalIndex : 0);

    const handleStartEditing = () => {
        setEditDate(appointment.date);
        setEditTime(appointment.time);
        setIsEditing(true);
    };

    const handleCancelEditing = () => {
        setIsEditing(false);
    };

    const handleSaveReschedule = async () => {
        if (!editDate || !editTime) return;
        setIsSubmitting(true);
        try {
            await onUpdate(appointment.id, { date: editDate, time: editTime });
            setIsEditing(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setIsEditing(false);
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) handleClose();
            else onOpenChange(true);
        }}>
            <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none rounded-3xl shadow-2xl max-h-[95vh] flex flex-col">
                <DialogTitle className="sr-only">Detalle de Cita</DialogTitle>
                <div className="flex flex-col overflow-y-auto custom-scrollbar">

                    <div className={`p-8 ${color.bg} border-b ${color.border} relative`}>
                        <div className="flex justify-between items-start mb-6">
                            <Badge className={`px-3 py-1 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] border-none shadow-sm ${color.text} bg-white/90`}>
                                DETALLE DE CITA
                            </Badge>
                            <div className="flex gap-2">
                                {appointment.status === 'confirmed' && (
                                    <Badge className="bg-emerald-500 text-white border-none rounded-xl px-3 py-1 font-black text-[10px] flex gap-1 items-center">
                                        CONFIRMADA
                                    </Badge>
                                )}
                                {appointment.status === 'cancelled' && (
                                    <Badge className="bg-rose-500 text-white border-none rounded-xl px-3 py-1 font-black text-[10px] flex gap-1 items-center">
                                        CANCELADA
                                    </Badge>
                                )}
                                {appointment.reason === 'blocked' && <Badge className="bg-slate-900 text-white border-none rounded-xl px-3 py-1 font-black text-[10px]">BLOQUEADO</Badge>}
                                <Badge className={`bg-white/90 ${color.text} border-none rounded-xl px-3 py-1 font-black text-[10px]`}>{getStatusLabel(appointment.reason)}</Badge>
                            </div>
                        </div>
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center text-slate-900 border border-slate-100 shrink-0">
                                <User className="w-8 h-8" />
                            </div>
                            <div className="min-w-0 pr-4">
                                <h2 className="text-2xl font-black text-slate-900 leading-tight tracking-tight break-words line-clamp-2">{patient?.name || 'Bloqueo'}</h2>
                                <p className="text-slate-500 font-bold flex items-center gap-2 mt-1 truncate">
                                    <Building2 className="w-4 h-4 shrink-0" />
                                    {hospitals.find(h => h.id === appointment.hospitalId)?.name || 'Sede'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 bg-white space-y-8">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-5 rounded-3xl bg-slate-50/80 border border-slate-100 flex flex-col gap-1 shadow-sm">
                                <div className="flex items-center gap-2 text-slate-400 mb-1">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Fecha</span>
                                </div>
                                <span className="text-sm font-black text-slate-900">{format(parseISO(appointment.date), 'PPPP', { locale: es })}</span>
                            </div>
                            <div className="p-5 rounded-3xl bg-slate-50/80 border border-slate-100 flex flex-col gap-1 shadow-sm">
                                <div className="flex items-center gap-2 text-slate-400 mb-1">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Horario</span>
                                </div>
                                <span className="text-sm font-black text-slate-900">{formatTime(appointment.time)}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Información Adicional
                            </label>
                            <div className="p-5 rounded-3xl border border-slate-100 bg-slate-50/50 flex flex-col gap-3 font-bold text-slate-700">
                                <div className="flex items-center justify-between text-sm gap-2">
                                    <span className="opacity-60 shrink-0">Motivo:</span>
                                    <span className="text-slate-900 font-black text-right break-words">{appointment.reason === 'specific-service' ? appointment.serviceName : (appointment.reason === 'first-visit' ? 'Primera visita' : 'Seguimiento')}</span>
                                </div>
                                {appointment.specificService && (
                                    <div className="flex flex-col gap-1 pt-2 border-t border-slate-100">
                                        <span className="opacity-60 text-sm">Detalles técnicos:</span>
                                        <span className="text-sm text-slate-900 bg-sky-50 p-4 rounded-2xl border border-sky-100 mt-1">{appointment.specificService}</span>
                                    </div>
                                )}
                                {patient?.phone && (
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-sm gap-2">
                                        <span className="opacity-60 shrink-0">Teléfono:</span>
                                        <span className="text-slate-900 font-black text-right">{patient!.phone}</span>
                                    </div>
                                )}
                                {appointment.status === 'confirmed' && (
                                    <div className="flex items-center justify-between pt-2 border-t border-emerald-100 text-sm gap-2 text-emerald-700">
                                        <span className="font-bold shrink-0">WhatsApp:</span>
                                        <span className="font-black text-right">Confirmó por WhatsApp</span>
                                    </div>
                                )}
                                {appointment.status === 'cancelled' && (
                                    <div className="flex items-center justify-between pt-2 border-t border-rose-100 text-sm gap-2 text-rose-700">
                                        <span className="font-bold shrink-0">WhatsApp:</span>
                                        <span className="font-black text-right">Canceló por WhatsApp</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Check className="w-4 h-4" />
                                Gestionar Estado
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => onUpdate(appointment.id, { status: 'attended' })}
                                    className={`h-11 rounded-xl font-bold border-slate-200 ${appointment.status === 'attended' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'hover:bg-slate-50'}`}
                                >
                                    Asistió
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => onUpdate(appointment.id, { status: 'no-show' })}
                                    className={`h-11 rounded-xl font-bold border-slate-200 ${appointment.status === 'no-show' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'hover:bg-slate-50'}`}
                                >
                                    No llegó
                                </Button>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            {!isAppointmentPast(appointment.date, appointment.time) && (
                                <Button 
                                    onClick={handleStartEditing}
                                    className="flex-1 h-14 rounded-2xl bg-[#1c334a] hover:bg-slate-900 text-white font-black shadow-xl shadow-slate-200 transition-all active:scale-95 text-sm"
                                >
                                    <Edit2 className="w-4 h-4 mr-2" /> REPROGRAMAR
                                </Button>
                            )}
                            <Button 
                                variant="outline" 
                                onClick={() => onDelete(appointment.id)}
                                className="w-14 h-14 rounded-2xl border-none bg-red-50 hover:bg-red-100 text-red-600 shadow-sm transition-all active:scale-95 group"
                            >
                                <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </Button>
                        </div>
                    </div>

                    {/* Edit Mode Overlay */}
                    {isEditing && (
                        <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm p-8 flex flex-col animate-in fade-in zoom-in duration-200">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-2xl font-black text-slate-900 uppercase">Reprogramar</h3>
                                <Button variant="ghost" size="icon" onClick={handleCancelEditing} className="rounded-xl"><X className="w-6 h-6" /></Button>
                            </div>
                            
                            <div className="space-y-8 flex-1">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Calendar className="w-4 h-4" />
                                        <label className="text-[10px] font-black uppercase tracking-widest">Nueva Fecha</label>
                                    </div>
                                    <Input 
                                        type="date" 
                                        value={editDate} 
                                        onChange={(e) => setEditDate(e.target.value)}
                                        className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 font-black text-slate-900"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Clock className="w-4 h-4" />
                                        <label className="text-[10px] font-black uppercase tracking-widest">Nuevo Horario</label>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {getAvailableSlots(editDate, appointment.hospitalId).slice(0, 9).map((slot) => (
                                            <button
                                                key={slot}
                                                onClick={() => setEditTime(slot)}
                                                className={`h-12 rounded-xl text-xs font-black transition-all ${
                                                    editTime === slot 
                                                        ? 'bg-[#1c334a] text-white shadow-lg scale-105' 
                                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                                }`}
                                            >
                                                {formatTime(slot)}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => setEditTime(appointment.time)}
                                            className={`h-12 rounded-xl text-xs font-black transition-all col-span-3 mt-2 ${
                                                editTime === appointment.time
                                                    ? 'bg-sky-600 border border-sky-200 text-white shadow-lg'
                                                    : 'bg-sky-50 text-sky-700 hover:bg-sky-100'
                                            }`}
                                        >
                                            MANTENER ACTUAL: {formatTime(appointment.time)}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <Button 
                                onClick={handleSaveReschedule}
                                disabled={isSubmitting || !editDate || !editTime}
                                className="h-16 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-black shadow-xl shadow-sky-200 transition-all active:scale-95 text-base mt-auto"
                            >
                                {isSubmitting ? 'Guardando...' : 'CONFIRMAR CAMBIO'}
                                <Check className="w-5 h-5 ml-2" />
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
