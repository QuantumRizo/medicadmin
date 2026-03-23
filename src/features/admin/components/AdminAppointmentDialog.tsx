import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { type Hospital } from "@/features/appointments/types";
import { ArrowLeft, Building2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useAppointments } from "../../appointments/hooks/useAppointments";
import { standardizePhone } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

interface AdminAppointmentDialogProps {
    hospitals: Hospital[];
    onSave: (appointmentData: any, patientData: any) => Promise<boolean>;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    getAvailableSlots: (date: string, hospitalId: string) => string[];
    initialPatientData?: { name: string, email: string, phone: string, notes?: string } | null;
}

export const AdminAppointmentDialog = ({ hospitals, onSave, open, onOpenChange, getAvailableSlots, initialPatientData }: AdminAppointmentDialogProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { patients } = useAppointments();
    const [existingMatch, setExistingMatch] = useState<any>(null);

    // Helper helper
    const formatTime = (timeStr: string) => {
        if (!timeStr) return '';
        const [hours, minutes] = timeStr.split(':');
        const date = new Date();
        date.setHours(parseInt(hours, 10));
        date.setMinutes(parseInt(minutes, 10));
        return new Intl.DateTimeFormat('es-MX', { hour: 'numeric', minute: '2-digit', hour12: true }).format(date);
    };

    // Controls the flow: if null, show selection screen. If set, show form.
    const [bookingHospitalId, setBookingHospitalId] = useState<string | null>(null);

    // Reset flow when dialog opens/closes
    useEffect(() => {
        if (open) {
            setBookingHospitalId(null); // Always ask "Where?" on open
            setExistingMatch(null);
            // If we have initial data, we might want to auto-select hospital if provided, but for now just prefill data
            if (initialPatientData) {
                setPatient({
                    name: initialPatientData.name,
                    email: initialPatientData.email,
                    emailError: '',
                    phone: initialPatientData.phone,
                    notes: initialPatientData.notes || ''
                });
            } else {
                // Reset to empty if no initial data
                setPatient({
                    name: '',
                    email: '',
                    emailError: '',
                    phone: '',
                    notes: ''
                });
            }
        }
    }, [open, initialPatientData]);

    // Form State
    const [patient, setPatient] = useState({
        name: '',
        email: '',
        emailError: '',
        phone: '',
        notes: ''
    });

    const [appointment, setAppointment] = useState({
        serviceName: '', // Added for specific service description
        date: '',
        time: '',
        reason: ''
    });

    const handlePatientChange = (key: string, value: string) => {
        setPatient(prev => ({ ...prev, [key]: value }));
        
        if (key === 'phone') {
            const safe = standardizePhone(value);
            if (safe.length >= 8) {
                const match = patients.find(p => standardizePhone(p.phone) === safe);
                setExistingMatch(match || null);
            } else {
                setExistingMatch(null);
            }
        }
    };

    const handleAppointmentChange = (key: string, value: string) => {
        setAppointment(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async () => {
        if (!bookingHospitalId) return;

        // Basic Validation
        if (!patient.name || !patient.phone || !appointment.date || !appointment.time || !appointment.reason) {
            toast.error("Datos incompletos", { description: "Por favor complete todos los campos obligatorios." });
            return;
        }

        if (appointment.reason === 'specific-service' && !appointment.serviceName) {
            toast.error("Datos incompletos", { description: "Por favor describa el servicio específico." });
            return;
        }

        setIsSubmitting(true);
        try {
            await onSave(
                {
                    hospitalId: bookingHospitalId,
                    serviceName: appointment.reason === 'specific-service' ? appointment.serviceName : undefined,
                    date: appointment.date,
                    time: appointment.time,
                    reason: appointment.reason,
                    specificService: appointment.reason === 'specific-service' ? appointment.serviceName : undefined
                },
                patient
            );
            onOpenChange(false);
            // Reset form
            setPatient({ name: '', email: '', emailError: '', phone: '', notes: '' });
            setAppointment({ serviceName: '', date: '', time: '', reason: '' });
            setBookingHospitalId(null);
        } catch (error: any) {
            console.error("Error scheduling:", error);
            toast.error("Error al agendar la cita", { description: error.message || "Verifique los datos." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedHospital = hospitals.find(h => h.id === bookingHospitalId);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[95vh] overflow-y-auto rounded-2xl border-none shadow-2xl p-0">
                <div className="bg-[#0f172a] p-6 text-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-xl font-bold">
                            {bookingHospitalId && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10 rounded-full" onClick={() => setBookingHospitalId(null)}>
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                            )}
                            <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400">
                                <Building2 className="w-6 h-6" />
                            </div>
                            {bookingHospitalId ? `Agendar en ${selectedHospital?.name}` : "Seleccione Sucursal"}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 mt-2 font-medium">
                            {bookingHospitalId
                                ? "Complete los datos para confirmar la cita médica."
                                : "¿En qué sede desea programar la atención?"}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6">

                {!bookingHospitalId ? (
                    <div className="grid gap-4 py-2">
                        {hospitals.map(hospital => (
                            <button
                                key={hospital.id}
                                onClick={() => setBookingHospitalId(hospital.id)}
                                className="flex items-center gap-5 p-5 rounded-2xl border border-slate-100 hover:border-sky-500 hover:bg-sky-50/50 transition-all text-left group shadow-sm hover:shadow-md w-full"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-sky-500 group-hover:text-white transition-all duration-300">
                                    <Building2 className="w-7 h-7" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-900 group-hover:text-sky-600 text-lg transition-colors">{hospital.name}</h3>
                                    <p className="text-sm text-slate-500 font-medium">{hospital.address}</p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-sky-100 group-hover:text-sky-600 transition-all">
                                    <ChevronRight className="w-5 h-5" />
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    // STEP 2: Form
                    <div className="grid gap-6 py-4 animate-in slide-in-from-right-4 fade-in duration-300">
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-8 h-[2px] bg-sky-200 rounded-full"></span>
                                Datos del Paciente
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="admin-name" className="text-slate-700 font-bold ml-1">Nombre Completo *</Label>
                                    <Input
                                        id="admin-name"
                                        value={patient.name}
                                        onChange={(e) => handlePatientChange('name', e.target.value)}
                                        placeholder="Nombre del paciente"
                                        className="rounded-xl border-slate-200 h-11 focus-visible:ring-sky-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="admin-phone" className="text-slate-700 font-bold ml-1">Teléfono *</Label>
                                    <Input
                                        id="admin-phone"
                                        value={patient.phone}
                                        onChange={(e) => handlePatientChange('phone', e.target.value)}
                                        placeholder="55 1234 5678"
                                        className={`rounded-xl border-slate-200 h-11 focus-visible:ring-sky-500 ${existingMatch ? 'border-amber-400 bg-amber-50' : ''}`}
                                    />
                                    {existingMatch && (
                                        <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-amber-100/50 text-amber-800 text-[11px] font-bold border border-amber-200 animate-in fade-in slide-in-from-top-1">
                                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                            <span>Paciente ya registrado: {existingMatch.name}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="admin-email" className="text-slate-700 font-bold ml-1">Correo Electrónico (Opcional)</Label>
                                <Input
                                    id="admin-email"
                                    type="email"
                                    value={patient.email}
                                    onChange={(e) => handlePatientChange('email', e.target.value)}
                                    placeholder="correo@ejemplo.com"
                                    className="rounded-xl border-slate-200 h-11 focus-visible:ring-sky-500"
                                />
                            </div>
                        </div>

                        {/* Section: Detalles de la Cita */}
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Detalles de la Cita</h3>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="admin-reason" className="text-slate-700 font-bold ml-1">Motivo de la Cita</Label>
                                    <select
                                        id="admin-reason"
                                        className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-sm focus:ring-2 focus:ring-sky-500 transition-all outline-none font-bold text-slate-700"
                                        value={appointment.reason}
                                        onChange={(e) => handleAppointmentChange('reason', e.target.value)}
                                    >
                                        <option value="">Seleccionar motivo...</option>
                                        <option value="first-visit">Primera Vez</option>
                                        <option value="follow-up">Seguimiento</option>
                                        <option value="specific-service">Servicio Específico</option>
                                    </select>
                                </div>

                                {appointment.reason === 'specific-service' && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                        <Label htmlFor="admin-service-desc" className="text-slate-700 font-bold ml-1">Descripción del Servicio</Label>
                                        <Input
                                            id="admin-service-desc"
                                            value={appointment.serviceName || ''}
                                            onChange={(e) => handleAppointmentChange('serviceName', e.target.value)}
                                            placeholder="Ej: Consulta de tal, Revisión..."
                                            className="rounded-xl border-slate-200 h-12 focus-visible:ring-sky-500 font-bold text-slate-700"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="admin-date" className="text-slate-700 font-bold ml-1">Fecha *</Label>
                                    <Input
                                        id="admin-date"
                                        type="date"
                                        value={appointment.date}
                                        min={(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })()}
                                        onChange={(e) => handleAppointmentChange('date', e.target.value)}
                                        className="rounded-xl border-slate-200 h-12 focus-visible:ring-sky-500 font-bold text-slate-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="admin-time" className="text-slate-700 font-bold ml-1">Hora *</Label>
                                    <select
                                        id="admin-time"
                                        className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-sm focus:ring-2 focus:ring-sky-500 transition-all outline-none font-bold text-slate-700"
                                        value={appointment.time}
                                        onChange={(e) => handleAppointmentChange('time', e.target.value)}
                                    >
                                        <option value="">Seleccionar hora...</option>
                                        {(appointment.date && bookingHospitalId) ? (
                                            getAvailableSlots(appointment.date, bookingHospitalId).map(slot => (
                                                <option key={slot} value={slot}>{formatTime(slot)}</option>
                                            ))
                                        ) : (
                                            <option disabled>Seleccione una fecha primero</option>
                                        )}
                                    </select>
                                </div>
                            </div>

                            <div className="text-sm text-gray-500 mt-2">
                                <span className="font-semibold">Recordatorio Importante: </span>
                                Recuerda completar los datos completos de historia clínica del paciente en la sección pacientes después de agendar.
                            </div>


                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
                            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="rounded-xl h-12 px-6 font-bold text-slate-500 hover:bg-slate-50 transition-all">Cancelar</Button>
                            <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-sky-500 hover:bg-sky-600 text-white rounded-xl h-12 px-8 font-bold shadow-xl shadow-sky-100 transition-all active:scale-95 min-w-[160px]">
                                {isSubmitting ? "Agendando..." : "Confirmar Cita"}
                            </Button>
                        </div>
                    </div>
                )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
