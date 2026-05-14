import { format, parseISO, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Appointment, Patient, Hospital } from '../../../appointments/types';
import { getNow } from '@/lib/dateUtils';
import { formatTime } from '../../../appointments/utils';
import { AppointmentDetailDialog } from '../AppointmentDetailDialog';

interface PatientAppointmentsProps {
    appointments: Appointment[];
    patient: Patient;
    hospitals: Hospital[];
    selectedDetailApt: Appointment | null;
    setSelectedDetailApt: (appt: Appointment | null) => void;
    onDeleteAppointment: (apptId: string) => Promise<void>;
    onUpdateAppointment: (apptId: string, data: any) => Promise<void>;
    getAvailableSlots: (date: string, hospitalId: string) => string[];
}

export const PatientAppointments = ({
    appointments,
    patient,
    hospitals,
    selectedDetailApt,
    setSelectedDetailApt,
    onDeleteAppointment,
    onUpdateAppointment,
    getAvailableSlots
}: PatientAppointmentsProps) => {

    const patientAppointments = appointments
        .filter(a => a.patientId === patient.id)
        .sort((a, b) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime());

    const todayDate = getNow();
    const upcomingAppts = patientAppointments.filter(a => {
        const apptDate = new Date(a.date + 'T' + a.time);
        return isAfter(apptDate, todayDate) && a.reason !== 'blocked';
    });
    const pastAppts = patientAppointments.filter(a => {
        const apptDate = new Date(a.date + 'T' + a.time);
        return !isAfter(apptDate, todayDate) || a.reason === 'blocked';
    });

    return (
        <div className="flex flex-col gap-6">
            {/* Upcoming Appointments */}
            <Card className="shadow-sm border-0 ring-1 ring-gray-100">
                <CardHeader className="pb-3 border-b bg-gray-50/50">
                    <CardTitle className="text-xs font-bold text-gray-600 uppercase tracking-widest text-center">Citas Agendadas</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {upcomingAppts.length === 0 ? (
                        <div className="p-6 text-center text-sm text-gray-400 italic">No hay citas próximas.</div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {upcomingAppts.map(appt => (
                                <div key={appt.id} className="p-4 flex flex-col gap-2 hover:bg-[#1c334a]/5 transition-colors group">
                                    <div className="flex items-center justify-between min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-extrabold text-sm text-[#1c334a] uppercase tracking-wide">{format(parseISO(appt.date), 'dd MMM', { locale: es })}</span>
                                            <span className="text-xs font-semibold text-gray-500">{formatTime(appt.time)}</span>
                                        </div>
                                        <Badge variant="outline" className="text-[10px] uppercase font-bold px-2 py-0 border-blue-200 text-blue-700 bg-blue-50 shrink-0">Agendada</Badge>
                                    </div>
                                    <div className="text-xs text-gray-600 font-medium truncate">{appt.reason === 'specific-service' ? appt.serviceName : appt.reason === 'first-visit' ? 'Primera vez' : appt.reason === 'follow-up' ? 'Seguimiento' : appt.reason}</div>
                                    
                                    <div className="flex gap-1 items-center mt-1">
                                        <Button 
                                            size="sm" 
                                            className="h-7 text-[10px] px-2 bg-[#1c334a] text-white hover:bg-[#152738] flex-1"
                                            onClick={() => setSelectedDetailApt(appt)}
                                        >
                                            DETALLES / EDITAR
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50" 
                                            onClick={() => {
                                                if (confirm('¿Eliminar cita?')) {
                                                    onDeleteAppointment(appt.id);
                                                }
                                            }}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Past Appointments */}
            <Card className="shadow-sm border-0 ring-1 ring-gray-100">
                <CardHeader className="pb-3 border-b bg-gray-50/50">
                    <CardTitle className="text-xs font-bold text-gray-600 uppercase tracking-widest text-center">Historial de Citas</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[400px]">
                        {pastAppts.length === 0 ? (
                            <div className="p-6 text-center text-sm text-gray-400 italic">No hay historial de citas.</div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {pastAppts.map(appt => (
                                    <div key={appt.id} className="p-4 flex flex-col gap-2 hover:bg-gray-50 transition-colors opacity-80 hover:opacity-100 group">
                                        <div className="flex items-center justify-between min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm text-gray-700 uppercase tracking-wide">{format(parseISO(appt.date), 'dd MMM yy', { locale: es })}</span>
                                                <span className="text-xs font-medium text-gray-400">{formatTime(appt.time)}</span>
                                            </div>
                                            <Badge variant="outline" className={`text-[9px] uppercase font-bold px-1.5 py-0 ${appt.reason === 'blocked' ? 'border-gray-200 text-gray-400 bg-gray-50' : 'border-gray-200 text-gray-500 bg-gray-50'}`}>
                                                {appt.reason === 'blocked' ? 'Bloqueada' : 'Pasada'}
                                            </Badge>
                                        </div>
                                        <div className="text-xs text-gray-500 truncate">{appt.reason === 'specific-service' ? appt.serviceName : appt.reason === 'first-visit' ? 'Primera vez' : appt.reason === 'follow-up' ? 'Seguimiento' : appt.reason}</div>
                                        
                                        <div className="flex gap-1 items-center mt-1">
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                onClick={() => setSelectedDetailApt(appt)}
                                                className="h-6 text-[10px] px-2 text-gray-500 flex-1"
                                            >
                                                VER DETALLE
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50" 
                                                onClick={() => {
                                                    if (confirm('¿Eliminar cita?')) {
                                                        onDeleteAppointment(appt.id);
                                                    }
                                                }}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>

            <AppointmentDetailDialog
                appointment={selectedDetailApt}
                patient={patient}
                hospitals={hospitals}
                isOpen={!!selectedDetailApt}
                onOpenChange={(open) => !open && setSelectedDetailApt(null)}
                onDelete={onDeleteAppointment}
                onUpdate={onUpdateAppointment}
                getAvailableSlots={getAvailableSlots}
            />
        </div>
    );
};
