import { useAppointments } from '../../appointments/hooks/useAppointments';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Calendar, TrendingUp, Clock, MapPin } from 'lucide-react';
import { format, isToday, parseISO, isThisWeek, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from 'react';
import { toast } from 'sonner';
import { AppointmentDetailDialog } from './AppointmentDetailDialog';
import { formatTime } from '../../appointments/utils';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import type { Appointment } from '../../appointments/types';

interface AdminOverviewProps { }

export const AdminOverview = ({ }: AdminOverviewProps) => {
    const { appointments, patients, hospitals, updateAppointment, getAvailableSlots, deleteAppointment } = useAppointments();
    const { fullName } = useAuth();

    const [selectedDetailApt, setSelectedDetailApt] = useState<Appointment | null>(null);

    const handleDeleteAppointment = async (apptId: string) => {
        try {
            await deleteAppointment(apptId);
            toast.success('Cita eliminada correctamente');
            setSelectedDetailApt(null);
        } catch (e) {
            toast.error('Error al eliminar la cita');
        }
    };

    const handleUpdateAppointment = async (apptId: string, data: any) => {
        try {
            await updateAppointment(apptId, data);
            toast.success('Cita reprogramada correctamente');
            setSelectedDetailApt(null);
        } catch (e: any) {
            toast.error('Error al reprogramar cita', { description: e.message });
        }
    };



    // Metric calculations for Global View

    // Metrics
    // Metrics (Global Aggregation)
    const todayAppointments = appointments.filter(a =>
        isToday(parseISO(a.date))
    );

    const activeHospitalsCount = new Set(
        appointments.map(a => a.hospitalId)
    ).size;

    // const newPatientsThisWeek = ... // Removed unused variable

    const weekAppointments = appointments.filter(a =>
        isThisWeek(parseISO(a.date))
    );

    const totalActivePatients = new Set(
        appointments.map(a => a.patientId)
    ).size;

    const isNewUser = fullName === 'Nuevo Doctor' || hospitals.some(h => h.name === 'Consultorio Principal');

    return (
        <>
            <div className="space-y-6 animate-fade-in max-w-full overflow-hidden px-1 sm:px-0">
                {/* Onboarding Alert */}
                {isNewUser && (
                    <Card className="border-none shadow-xl shadow-sky-500/10 bg-gradient-to-r from-sky-600 to-[#1c334a] overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                            <Sparkles className="w-32 h-32 text-white" />
                        </div>
                        <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 relative z-10 text-white text-center sm:text-left">
                            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
                                <AlertCircle className="w-8 h-8 text-sky-200" />
                            </div>
                            <div className="flex-1 space-y-1">
                                <h3 className="text-xl font-black tracking-tight">¡Bienvenido a tu nueva Clínica Digital!</h3>
                                <p className="text-sky-100 text-sm font-medium opacity-90 max-w-2xl">
                                    Hemos creado un consultorio base para que la agenda funcione de inmediato. Te recomendamos personalizar el nombre de tu clínica, dirección y horarios en la configuración.
                                </p>
                            </div>
                            <Button 
                                onClick={() => window.dispatchEvent(new CustomEvent('changeTab', { detail: 'settings' }))}
                                className="bg-white text-[#1c334a] hover:bg-sky-50 rounded-xl font-bold px-6 h-12 shadow-lg shadow-black/10 group/btn shrink-0"
                            >
                                Configurar Ahora
                                <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* KPI Grid - Stacked on very small, 2 cols on mobile, 4 on desktop */}
                <div className="grid gap-4 grid-cols-1 xs:grid-cols-2 lg:grid-cols-4">
                    <Card className="rounded-2xl shadow-xl shadow-slate-200/50 border-none bg-white transition-all hover:translate-y-[-2px]">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-2">
                            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                                Citas Hoy
                            </CardTitle>
                            <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
                                <Calendar className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 pt-1">
                            <div className="text-3xl font-extrabold text-slate-900">{todayAppointments.length}</div>
                            <p className="text-xs text-slate-400 mt-1 font-medium">
                                {todayAppointments.length === 0 ? "Sin citas" : "Agendadas para hoy"}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="rounded-2xl shadow-xl shadow-slate-200/50 border-none bg-white transition-all hover:translate-y-[-2px]">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-2">
                            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                                Pacientes
                            </CardTitle>
                            <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
                                <Users className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 pt-1">
                            <div className="text-3xl font-extrabold text-slate-900">{totalActivePatients}</div>
                            <p className="text-xs text-slate-400 mt-1 font-medium">
                                Activos en el sistema
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="rounded-2xl shadow-xl shadow-slate-200/50 border-none bg-white transition-all hover:translate-y-[-2px]">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-2">
                            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                                Sedes
                            </CardTitle>
                            <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
                                <MapPin className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 pt-1">
                            <div className="text-3xl font-extrabold text-slate-900">{activeHospitalsCount}</div>
                            <p className="text-xs text-slate-400 mt-1 font-medium">
                                Sedes con actividad
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="rounded-2xl shadow-xl shadow-slate-200/50 border-none bg-white transition-all hover:translate-y-[-2px]">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-2">
                            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                                Esta Semana
                            </CardTitle>
                            <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
                                <TrendingUp className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 pt-1">
                            <div className="text-3xl font-extrabold text-slate-900">{weekAppointments.length}</div>
                            <p className="text-xs text-slate-400 mt-1 font-medium">
                                Próximos 7 días
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-12 items-start">
                    {/* Main Column: Toda's Agenda (Now smaller 6 cols) */}
                    <Card className="md:col-span-6 lg:col-span-6 rounded-2xl shadow-xl shadow-slate-200/50 border-none bg-white flex flex-col h-full overflow-hidden">
                        <CardHeader className="p-6 pb-2 border-b border-slate-50 bg-slate-50/30">
                            <CardTitle className="text-lg font-extrabold text-[#0f172a]">Agenda de Hoy</CardTitle>
                            <CardDescription className="text-sm font-medium text-slate-400 mt-1 capitalize">
                                {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 pt-4 max-h-[500px] overflow-x-hidden overflow-y-auto custom-scrollbar">
                            {todayAppointments.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-300">
                                    <div className="p-3 bg-sky-50 rounded-2xl text-sky-600 shadow-sm border border-sky-100/50">
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm font-medium">No hay citas programadas para hoy.</p>
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    {todayAppointments.sort((a, b) => a.time.localeCompare(b.time)).map(apt => {
                                        const patient = patients.find(p => p.id === apt.patientId);
                                        return (
                                            <div key={apt.id} className="flex items-center justify-between p-2 border rounded-md bg-gray-50/50 hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                    <div className="flex flex-col items-center justify-center w-10 h-10 bg-white border rounded-md shadow-sm shrink-0">
                                                        <span className="text-[10px] font-bold text-[#1c334a] leading-none text-center">
                                                            {formatTime(apt.time).split(' ')[0]}<br />
                                                            <span className="text-[8px] font-normal">{formatTime(apt.time).split(' ')[1]}</span>
                                                        </span>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="font-semibold text-gray-900 text-xs truncate max-w-full">{patient?.name || 'Paciente Desconocido'}</h4>
                                                        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 text-[10px] text-gray-500 overflow-hidden">
                                                            <span className="flex items-center gap-1 truncate max-w-full">
                                                                <MapPin className="w-2 h-2 shrink-0" />
                                                                <span className="truncate">{hospitals.find(h => h.id === apt.hospitalId)?.name}</span>
                                                            </span>
                                                            <span className="hidden sm:inline text-gray-300 shrink-0">|</span>
                                                            <span className="truncate max-w-full">
                                                                {apt.reason === 'specific-service' ? apt.serviceName : (
                                                                    apt.reason === 'first-visit' ? 'Primera vez' :
                                                                        apt.reason === 'follow-up' ? 'Seguimiento' :
                                                                            apt.reason
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0 pl-2">
                                                    {apt.reason === 'blocked' && (
                                                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-medium border bg-gray-50 text-gray-700 border-gray-100">
                                                            Bloqueado
                                                        </span>
                                                    )}
                                                    <Button 
                                            size="sm" 
                                            className="h-9 px-4 rounded-xl font-bold bg-[#1c334a] text-white hover:bg-slate-900 shadow-lg shadow-slate-200"
                                            onClick={() => setSelectedDetailApt(apt)}
                                        >
                                            DETALLE
                                        </Button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Right Column: Next Up & Hospital Stats (Wider to balance) */}
                    <div className="md:col-span-6 lg:col-span-6 space-y-4">
                        {/* Next Up */}
                        <Card className="rounded-2xl shadow-xl shadow-slate-200/50 border-none bg-white overflow-hidden">
                            <CardHeader className="p-6 pb-2">
                                <CardTitle className="text-lg font-extrabold text-[#0f172a]">Próximas Citas</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 pt-0">
                                <div className="space-y-4">
                                    {weekAppointments
                                        .filter(a => !isToday(parseISO(a.date)) && isAfter(parseISO(a.date), new Date()))
                                        .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime())
                                        .slice(0, 5)
                                        .map(apt => {
                                            const patient = patients.find(p => p.id === apt.patientId);
                                            return (
                                                <div key={apt.id} className="flex items-center justify-between pb-2 border-b last:border-0 last:pb-0 p-2 -mx-2 rounded hover:bg-gray-50 transition-colors">
                                                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                                        <div className="mt-1 bg-sky-50 p-1 rounded-full text-sky-600 shrink-0">
                                                            <Clock className="w-2.5 h-2.5" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-medium text-xs text-gray-800 truncate max-w-full">{patient?.name}</p>
                                                            <p className="text-[10px] text-gray-500 truncate max-w-full">
                                                                {format(parseISO(apt.date), "dd MMM", { locale: es })} • {formatTime(apt.time)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Button 
                                                        size="sm" 
                                                        onClick={() => setSelectedDetailApt(apt)}
                                                        className="h-8 text-[10px] px-3 bg-[#1e293b] text-white hover:bg-[#0f172a] rounded-lg shadow-md shadow-slate-50 font-semibold transition-all active:scale-95"
                                                    >
                                                        DETALLE
                                                    </Button>
                                                </div>
                                            )
                                        })
                                    }
                                    {weekAppointments.length === 0 && (
                                        <p className="text-xs text-muted-foreground text-center py-2">Sin actividad próxima.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Consolidated Hospital Stats */}
                        <Card className="rounded-2xl shadow-xl shadow-slate-200/50 border-none bg-white overflow-hidden">
                            <CardHeader className="p-6 pb-2">
                                <CardTitle className="text-lg font-extrabold text-[#0f172a]">Estado de Sedes</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 pt-0">
                                <div className="space-y-4">
                                    {hospitals.map(hospital => {
                                        const hospitalAppts = appointments.filter(a => a.hospitalId === hospital.id);
                                        // const hospitalPatients = new Set(hospitalAppts.map(a => a.patientId)).size;
                                        const todayHospitalAppts = hospitalAppts.filter(a => isToday(parseISO(a.date))).length;

                                        return (
                                            <div key={hospital.id} className="flex items-center justify-between pb-2 border-b last:border-0 last:pb-0">
                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                    <div className="p-1.5 bg-gray-100 rounded-md shrink-0">
                                                        <MapPin className="w-3 h-3 text-gray-600" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-xs font-bold text-gray-900 truncate max-w-full">{hospital.name}</p>
                                                            {hospital.isDentalClinic && (
                                                                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 h-4 px-1.5 text-[8px] font-extrabold border-none tracking-tighter">DENT</Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-gray-500 truncate max-w-full">{hospital.address || 'Ubicación registrada'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end shrink-0">
                                                    <span className="text-xs font-bold text-[#1c334a]">{todayHospitalAppts}</span>
                                                    <span className="text-[10px] text-gray-400">citas hoy</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>


            <AppointmentDetailDialog
                appointment={selectedDetailApt}
                patient={patients.find(p => p.id === selectedDetailApt?.patientId)}
                hospitals={hospitals}
                isOpen={!!selectedDetailApt}
                onOpenChange={(open: boolean) => !open && setSelectedDetailApt(null)}
                onDelete={handleDeleteAppointment}
                onUpdate={handleUpdateAppointment}
                getAvailableSlots={getAvailableSlots}
            />
        </>
    );
};
