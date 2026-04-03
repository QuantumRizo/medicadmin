import React, { useState } from 'react';
import { useAppointments } from '../../appointments/hooks/useAppointments';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Clock,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    parseISO,
    isToday,
    addWeeks,
    subWeeks
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppointmentDetailDialog } from './AppointmentDetailDialog';
import type { Appointment } from '../../appointments/types';
import { formatTime, getStatusLabel, getApptColor, getHospitalAcronym } from '../../appointments/utils';
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';

interface AdminCalendarProps {
}

export const AdminCalendar = (_props: AdminCalendarProps) => {
    const { appointments, patients, hospitals, updateAppointment, getAvailableSlots, deleteAppointment } = useAppointments();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [selectedHospitalFilter, setSelectedHospitalFilter] = useState<string>('all');
    const [view, setView] = useState<'month' | 'week'>('week');
    const [selectedDetailApt, setSelectedDetailApt] = useState<Appointment | null>(null);
    const [hoveredAptId, setHoveredAptId] = useState<string | null>(null);

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { locale: es, weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { locale: es, weekStartsOn: 0 });
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
 
    const weekStart = startOfWeek(currentDate, { locale: es, weekStartsOn: 1 });
    const weekEnd = endOfWeek(weekStart, { locale: es, weekStartsOn: 1 });
    const currentWeekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
 
    const weekDaysShort = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
 
    const nextPeriod = () => {
        if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
        else setCurrentDate(addWeeks(currentDate, 1));
    };
 
    const prevPeriod = () => {
        if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
        else setCurrentDate(subWeeks(currentDate, 1));
    };
 
    const getDayAppointments = (day: Date) => {
        return appointments.filter(a => {
            const matchesDay = isSameDay(parseISO(a.date), day);
            const matchesHospital = selectedHospitalFilter === 'all' || a.hospitalId === selectedHospitalFilter;
            return matchesDay && matchesHospital;
        }).sort((a, b) => a.time.localeCompare(b.time));
    };

    const handleDeleteAppointment = async (apptId: string) => {
        try {
            await deleteAppointment(apptId);
            toast.success('Cita eliminada correctamente');
            setSelectedDetailApt(null);
        } catch (e) {
            toast.error('Error al eliminar la cita');
        }
    };

    const handleUpdateAppointment = async (apptId: string, updates: Partial<Appointment>) => {
        try {
            await updateAppointment(apptId, updates);
            toast.success('Cita actualizada correctamente');
        } catch (e: any) {
            toast.error('Error al actualizar cita', { description: e.message });
            throw e;
        }
    };

    const hours = Array.from({ length: 13 }, (_, i) => i + 8);

    return (
        <Card className="h-full border-none shadow-none md:border md:shadow-sm">
            <CardHeader className="flex flex-col md:flex-row items-center justify-between pb-4 space-y-4 md:space-y-0">
                <CardTitle className="text-xl font-bold capitalize">
                    {format(currentDate, 'MMMM yyyy', { locale: es })}
                </CardTitle>

                <div className="flex flex-wrap items-center gap-3">
                    <select
                        className="h-11 rounded-xl border border-slate-200 bg-white px-4 py-1 text-sm shadow-sm transition-all focus:ring-2 focus:ring-sky-500 outline-none appearance-none cursor-pointer font-medium min-w-[180px]"
                        value={selectedHospitalFilter}
                        onChange={(e) => setSelectedHospitalFilter(e.target.value)}
                    >
                        <option value="all">Sede: Todas las Sedes</option>
                        {hospitals.map(h => (
                            <option key={h.id} value={h.id}>{h.name}{h.isDentalClinic ? ' (Dental)' : ''}</option>
                        ))}
                    </select>

                    <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1 shadow-sm h-11">
                        <Button
                            variant={view === 'week' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setView('week')}
                            className={`rounded-lg h-9 px-4 font-bold transition-all ${view === 'week' ? 'bg-[#1e293b] text-white shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-white'}`}
                        >
                            Semana
                        </Button>
                        <Button
                            variant={view === 'month' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setView('month')}
                            className={`rounded-lg h-9 px-4 font-bold transition-all ${view === 'month' ? 'bg-[#1e293b] text-white shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-white'}`}
                        >
                            Mes
                        </Button>
                    </div>

                    <div className="flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm h-11">
                        <Button variant="ghost" size="icon" onClick={prevPeriod} className="h-full w-10 hover:bg-slate-50 transition-colors border-r border-slate-100 rounded-none">
                            <ChevronLeft className="h-5 w-5 text-slate-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={nextPeriod} className="h-full w-10 hover:bg-slate-50 transition-colors rounded-none">
                            <ChevronRight className="h-5 w-5 text-slate-600" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="hidden md:block">
                    {view === 'month' ? (
                        <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white mx-6 mb-6 shadow-xl shadow-slate-200/50">
                            <div className="grid grid-cols-7 bg-slate-50/50 border-b border-slate-100">
                                {weekDaysShort.map(day => (
                                    <div key={day} className="py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                                        {day}
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 auto-rows-[120px]">
                                {calendarDays.map((day, idx) => {
                                    const dayAppts = getDayAppointments(day);
                                    const isCurrentMonth = isSameMonth(day, monthStart);
                                    return (
                                        <div
                                            key={day.toISOString()}
                                            className={`
                                                border-b border-r border-slate-50 p-2 transition-all hover:bg-slate-50/50 flex flex-col gap-1 relative overflow-hidden group
                                                ${!isCurrentMonth ? 'bg-slate-50/30 text-slate-300' : 'bg-white'}
                                                ${(idx + 1) % 7 === 0 ? 'border-r-0' : ''}
                                                ${isToday(day) ? 'bg-sky-50/50' : ''}
                                            `}
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className={`
                                                    text-xs font-bold h-7 w-7 flex items-center justify-center rounded-xl transition-all
                                                    ${isToday(day) ? 'bg-[#1c334a] text-white shadow-lg shadow-blue-900/20' : 'text-slate-600 group-hover:bg-slate-100'}
                                                `}>
                                                    {format(day, 'd')}
                                                </span>
                                            </div>

                                            <div className="flex flex-col gap-0.5 overflow-hidden flex-1 pb-6">
                                                {dayAppts.slice(0, 2).map(apt => {
                                                    const patient = patients.find(p => p.id === apt.patientId);
                                                    const color = getApptColor(apt.reason, apt.status);
                                                    return (
                                                        <div 
                                                            key={apt.id} 
                                                            className={`p-1.5 rounded-lg border-l-4 shadow-sm mb-1 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 ${color.bg} ${color.border} ${color.text} group`}
                                                            onClick={() => setSelectedDetailApt(apt)}
                                                        >
                                                            <div className="flex flex-col gap-0.5">
                                                                <div className="flex items-center justify-between">
                                                                    {apt.status === 'cancelled' && <XCircle className="w-2.5 h-2.5 shrink-0" />}
                                                                    <span className="font-extrabold mr-1">{formatTime(apt.time).split(' ')[0]}</span>
                                                                    <span className="truncate">{patient?.name.split(' ')[0]}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {dayAppts.length > 2 && (
                                                    <div className="text-[9px] text-slate-400 font-bold pl-1 pt-0.5">
                                                        +{dayAppts.length - 2} más
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {dayAppts.length > 2 && (
                                                <button 
                                                    className="absolute bottom-2 right-2 w-6 h-6 rounded-lg bg-[#1c334a] text-white text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center shadow-lg"
                                                    onClick={(e) => { e.stopPropagation(); setSelectedDay(day); }}
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white mx-6 mb-6 shadow-xl shadow-slate-200/50 flex flex-col">
                            <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-slate-100 bg-slate-50/50 sticky top-0 z-20">
                                <div className="py-4 border-r border-slate-100 flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-slate-300" />
                                </div>
                                {currentWeekDays.map((day, idx) => (
                                    <div key={idx} className={`py-4 px-2 border-r last:border-r-0 border-slate-100 flex flex-col items-center gap-1.5 ${isToday(day) ? 'bg-sky-50/50' : ''}`}>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{weekDaysShort[idx]}</span>
                                        <span className={`text-sm font-extrabold w-9 h-9 flex items-center justify-center rounded-xl transition-all ${isToday(day) ? 'bg-[#1c334a] text-white shadow-lg shadow-blue-900/20' : 'text-slate-600 bg-slate-100/50 font-black'}`}>
                                            {format(day, 'd')}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="relative overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(100vh - 400px)' }}>
                                <div className="grid grid-cols-[80px_repeat(7,1fr)] auto-rows-[100px]">
                                    {hours.map(hour => (
                                        <React.Fragment key={hour}>
                                            <div className="border-r border-b border-slate-100 p-2 flex justify-center items-start pt-4 bg-slate-50/20">
                                                <span className="text-[10px] font-black text-slate-400">
                                                    {hour < 12 ? `${hour}:00 AM` : (hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`)}
                                                </span>
                                            </div>
                                            {currentWeekDays.map((day, dayIdx) => (
                                                <div key={dayIdx} className={`border-r last:border-r-0 border-b border-slate-50 relative ${isToday(day) ? 'bg-blue-50/10' : ''}`} />
                                            ))}
                                        </React.Fragment>
                                    ))}
                                </div>

                                <div className="absolute inset-0 pointer-events-none grid grid-cols-[80px_repeat(7,1fr)]">
                                    <div />
                                    {currentWeekDays.map((day, dayIdx) => {
                                        const dayAppts = getDayAppointments(day);
                                        return (
                                            <div key={dayIdx} className="relative h-full pointer-events-auto border-r last:border-r-0 border-slate-100/30">
                                                {dayAppts.map((apt, aptIdx) => {
                                                    const [h, m] = apt.time.split(':').map(Number);
                                                    const startHour = 8;
                                                    const hourHeight = 100;
                                                    const top = (h - startHour) * hourHeight + (m / 60) * hourHeight;
                                                    const height = hourHeight - 6;
                                                    const patient = patients.find(p => p.id === apt.patientId);
                                                    const color = getApptColor(apt.reason, apt.status);

                                                    return (
                                                        <div
                                                            key={apt.id}
                                                            className={`absolute right-1 rounded-xl border-l-4 p-3 shadow-md shadow-slate-200/50 text-xs cursor-pointer transition-all hover:scale-[1.02] hover:shadow-2xl group ${color.bg} ${color.border} ${color.text}`}
                                                            style={{ 
                                                                top: `${top + 3}px`, 
                                                                height: `${height}px`, 
                                                                zIndex: hoveredAptId === apt.id ? 100 : 10 + aptIdx,
                                                                left: `${4 + (aptIdx * 8)}px`
                                                            }}
                                                            onMouseEnter={() => setHoveredAptId(apt.id)}
                                                            onMouseLeave={() => setHoveredAptId(null)}
                                                            onClick={() => {
                                                                setHoveredAptId(null);
                                                                setSelectedDetailApt(apt);
                                                            }}
                                                        >
                                                            <div className="flex flex-col h-full">
                                                                <div className="flex items-center justify-between gap-1 mb-1.5">
                                                                    <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider opacity-80 bg-white/40 px-1.5 py-0.5 rounded-lg">
                                                                        <Clock className="w-2.5 h-2.5" />
                                                                        {formatTime(apt.time)}
                                                                    </div>
                                                                    <div className="flex gap-1">
                                                                        {apt.status === 'confirmed' && <Badge className="text-[8px] h-4 px-1 bg-emerald-500 text-white border-none uppercase font-black gap-0.5"><CheckCircle2 className="w-2 h-2" /> Confirmada</Badge>}
                                                                        {apt.status === 'cancelled' && <Badge className="text-[8px] h-4 px-1 bg-rose-500 text-white border-none uppercase font-black gap-0.5"><XCircle className="w-2 h-2" /> Cancelada</Badge>}
                                                                        {apt.reason === 'blocked' && <Badge className="text-[8px] h-4 px-1 bg-slate-900/10 text-slate-900 border-none uppercase font-black">Bloq</Badge>}
                                                                    </div>
                                                                </div>
                                                                <div className="font-black text-[11px] leading-[1.1] mb-0.5 truncate group-hover:whitespace-normal transition-all">
                                                                    {patient?.name || 'ESPACIO BLOQUEADO'}
                                                                </div>
                                                                <div className="mt-auto flex items-center justify-between">
                                                                    <span className="text-[9px] font-bold opacity-60 italic truncate">
                                                                        {apt.reason === 'specific-service' ? apt.serviceName : (apt.reason === 'first-visit' ? 'Primera vez' : 'Seguimiento')}
                                                                    </span>
                                                                    <span className="text-[9px] font-black uppercase tracking-widest bg-white/30 px-1.5 rounded-md">
                                                                        {getHospitalAcronym(hospitals.find(h => h.id === apt.hospitalId)?.name)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="md:hidden space-y-4 px-4 pb-6">
                    <div className="flex items-center justify-between py-2 border-b border-slate-100">
                        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Citas del día</span>
                        <Badge variant="outline" className="rounded-lg bg-sky-50 text-sky-700 border-none font-black">{getDayAppointments(currentDate).length}</Badge>
                    </div>
                    {getDayAppointments(currentDate).length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center text-slate-300 gap-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                            <Plus className="w-10 h-10 opacity-20" />
                            <p className="text-sm font-medium">No hay citas para hoy</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {getDayAppointments(currentDate).sort((a,b) => a.time.localeCompare(b.time)).map(apt => {
                                const patient = patients.find(p => p.id === apt.patientId);
                                const color = getApptColor(apt.reason, apt.status);
                                return (
                                    <div 
                                        key={apt.id} 
                                        className={`flex items-center gap-4 p-4 rounded-2xl border border-slate-100 shadow-sm transition-all active:scale-[0.98] bg-white`}
                                        onClick={() => setSelectedDetailApt(apt)}
                                    >
                                        <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl border shrink-0 ${color.bg} ${color.border} ${color.text}`}>
                                            <span className="text-sm font-black">{formatTime(apt.time).split(' ')[0]}</span>
                                            <span className="text-[9px] font-bold uppercase opacity-70">{formatTime(apt.time).split(' ')[1]}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-extrabold text-slate-900 truncate">{patient?.name || 'Bloqueo'}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="secondary" className="text-[9px] h-4 rounded-md bg-slate-100 text-slate-600 border-none">{hospitals.find(h => h.id === apt.hospitalId)?.name}</Badge>
                                                <span className="text-[10px] text-slate-400 font-medium truncate italic">{apt.reason === 'specific-service' ? apt.serviceName : (apt.reason === 'first-visit' ? '1ra vez' : 'Seg.')}</span>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <Dialog open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
                    <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none rounded-3xl shadow-2xl">
                        <div className="p-8 bg-[#1c334a] text-white">
                            <h2 className="text-2xl font-black uppercase tracking-tight">Citas del día</h2>
                            <p className="text-sky-300 font-bold opacity-80 mt-1">{selectedDay && format(selectedDay!, "PPPP", { locale: es })}</p>
                        </div>
                        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar bg-slate-50">
                            {selectedDay && getDayAppointments(selectedDay!).sort((a,b) => a.time.localeCompare(b.time)).map(apt => {
                                const patient = patients.find(p => p.id === apt.patientId);
                                const color = getApptColor(apt.reason, apt.status);
                                return (
                                    <div
                                        key={apt.id}
                                        className="p-4 flex gap-4 items-center bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group"
                                        onClick={() => {
                                            setSelectedDay(null);
                                            setTimeout(() => setSelectedDetailApt(apt), 200);
                                        }}
                                    >
                                        <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center border ${color.border} ${color.bg} ${color.text}`}>
                                            <span className="text-xs font-black">{formatTime(apt.time).split(' ')[0]}</span>
                                            <span className="text-[8px] font-bold uppercase">{formatTime(apt.time).split(' ')[1]}</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-black text-slate-900 leading-tight">{patient?.name || 'Bloqueo'}</p>
                                            <p className="text-[10px] font-bold text-slate-400 mt-0.5 italic">
                                                {getStatusLabel(apt.reason)}
                                            </p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                                    </div>
                                );
                            })}
                        </div>
                    </DialogContent>
                </Dialog>

                <AppointmentDetailDialog
                    appointment={selectedDetailApt}
                    patient={patients.find(p => p.id === selectedDetailApt?.patientId)}
                    hospitals={hospitals}
                    isOpen={!!selectedDetailApt}
                    onOpenChange={(open) => !open && setSelectedDetailApt(null)}
                    onDelete={handleDeleteAppointment}
                    onUpdate={handleUpdateAppointment}
                    getAvailableSlots={getAvailableSlots || (() => [])}
                />
            </CardContent>
        </Card>
    );
};
