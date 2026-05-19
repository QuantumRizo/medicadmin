import { useState, useEffect } from 'react';
import { useAppointments } from '../../appointments/hooks/useAppointments';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { LayoutDashboard, Calendar as CalendarIcon, Users, CalendarPlus, UserPlus, CreditCard, Ban } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AdminOverview } from './AdminOverview';
import { AdminCalendar } from './AdminCalendar';
import { PatientDirectory } from './PatientDirectory';
import { AddPatientDialog } from './AddPatientDialog';
import { AdminAppointmentDialog } from './AdminAppointmentDialog';
import { BookingTypeDialog } from './BookingTypeDialog';
import { AdminLayout } from './AdminLayout';
import { ClinicSettingsPage } from './ClinicSettingsPage';
import { RecetarioPage } from './RecetarioPage';
import { SubscriptionPage } from './SubscriptionPage';
import { useSearchParams } from 'react-router-dom';

export const AdminDashboard = () => {
    const { hospitals, blockSlot, saveAppointment, addPatient, getAvailableSlots, patients } = useAppointments();

    const [blockHospitalId, setBlockHospitalId] = useState('');

    useEffect(() => {
        if (hospitals.length > 0 && !blockHospitalId) {
            setBlockHospitalId(hospitals[0].id);
        }
    }, [hospitals]);

    const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
    const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);
    const [isBookingTypeDialogOpen, setIsBookingTypeDialogOpen] = useState(false);
    const [isAddPatientDialogOpen, setIsAddPatientDialogOpen] = useState(false);

    const [blockDate, setBlockDate] = useState('');
    const [blockTime, setBlockTime] = useState('');
    const [blockSlotCount, setBlockSlotCount] = useState(2);
    const [isBlocking, setIsBlocking] = useState(false);

    const blockSlotOptions = [1, 2, 3, 4, 6, 8];
    const blockIntervalMinutes = hospitals.find(h => h.id === blockHospitalId)?.slotInterval || 15;

    const [bookingPatientData, setBookingPatientData] = useState<{ name: string, email: string, phone: string, notes?: string } | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const currentTab = searchParams.get('tab') || 'overview';

    const handleBlockSlot = async () => {
        if (!blockDate || !blockTime) return;
        setIsBlocking(true);
        try {
            if (!blockHospitalId) {
                alert("Seleccione un hospital");
                setIsBlocking(false);
                return;
            }
            await blockSlot(blockHospitalId, blockDate, blockTime, blockSlotCount);
            setBlockDate('');
            setBlockTime('');
            setBlockSlotCount(2);
            setIsBlockDialogOpen(false);
        } catch (error: any) {
            alert(error?.message || "Error al bloquear horario");
        } finally {
            setIsBlocking(false);
        }
    };

    const NavItems = [
        { id: 'overview', label: 'Tablero', icon: LayoutDashboard },
        { id: 'calendar', label: 'Calendario', icon: CalendarIcon },
        { id: 'patients', label: 'Pacientes', icon: Users },
        { id: 'prescriptions', label: 'Recetario', icon: LayoutDashboard },
        { id: 'subscription', label: 'Suscripción', icon: CreditCard },
        { id: 'settings', label: 'Configuración', icon: LayoutDashboard },
    ];

    const formatTime = (timeStr: string) => {
        if (!timeStr) return '';
        const [hours, minutes] = timeStr.split(':');
        const date = new Date();
        date.setHours(parseInt(hours, 10));
        date.setMinutes(parseInt(minutes, 10));
        return new Intl.DateTimeFormat('es-MX', { hour: 'numeric', minute: '2-digit', hour12: true }).format(date);
    };

    return (
        <AdminLayout
            currentTab={currentTab}
            onTabChange={(val) => setSearchParams({ tab: val })}
            title={NavItems.find(i => i.id === currentTab)?.label || 'Panel'}
            headerActions={
                <>
                    <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="flex-1 md:flex-none border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl h-12 px-6 shadow-sm font-semibold transition-all active:scale-95">
                                <Ban className="w-4 h-4 mr-2 text-slate-500" />
                                <span>NO CITAR</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
                            <div className="bg-[#0f172a] p-6 text-white text-center">
                                <DialogHeader>
                                    <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-500/20 flex items-center justify-center text-slate-300 mb-4">
                                        <Ban className="w-7 h-7" />
                                    </div>
                                    <DialogTitle className="text-2xl font-extrabold tracking-tight">NO CITAR</DialogTitle>
                                    <DialogDescription className="text-slate-400 font-medium mt-2">
                                        Agendar un espacio de tiempo para no citar.
                                    </DialogDescription>
                                </DialogHeader>
                            </div>

                            <div className="p-6 grid gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Sede / Hospital</label>
                                    <select
                                        className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-sm focus:ring-2 focus:ring-red-500 transition-all outline-none appearance-none font-bold text-slate-700"
                                        value={blockHospitalId}
                                        onChange={(e) => setBlockHospitalId(e.target.value)}
                                    >
                                        {hospitals.map(h => (
                                            <option key={h.id} value={h.id}>{h.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Fecha</label>
                                        <Input
                                            type="date"
                                            className="h-12 rounded-xl border-slate-200 bg-slate-50/50 px-4 focus:ring-2 focus:ring-red-500 font-bold text-slate-700"
                                            value={blockDate}
                                            onChange={(e) => setBlockDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Hora</label>
                                        <select
                                            className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-sm focus:ring-2 focus:ring-red-500 transition-all outline-none appearance-none font-bold text-slate-700"
                                            value={blockTime}
                                            onChange={(e) => setBlockTime(e.target.value)}
                                        >
                                            <option value="">Hora...</option>
                                            {(blockDate && blockHospitalId)
                                                ? (getAvailableSlots ? getAvailableSlots(blockDate, blockHospitalId).map(slot => (
                                                    <option key={slot} value={slot}>{formatTime(slot)}</option>
                                                )) : null)
                                                : <option disabled>...</option>
                                            }
                                        </select>
                                    </div>
                                </div>
                                <div className="pt-2">
                                    {/* Slot count picker */}
                                    <div className="space-y-2 mb-4">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                                            ¿Cuánto tiempo bloquear?
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {blockSlotOptions.map(n => {
                                                const mins = n * blockIntervalMinutes;
                                                const label = mins >= 60
                                                    ? `${Math.floor(mins/60)}h${mins%60 ? ` ${mins%60}m` : ''}`
                                                    : `${mins} min`;
                                                const isSelected = blockSlotCount === n;
                                                return (
                                                    <button
                                                        key={n}
                                                        type="button"
                                                        onClick={() => setBlockSlotCount(n)}
                                                        className={`h-12 rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center border-2 ${
                                                            isSelected
                                                                ? 'bg-slate-800 text-white border-slate-800 shadow-lg scale-105'
                                                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-400'
                                                        }`}
                                                    >
                                                        <span>{label}</span>
                                                        <span className={`text-[9px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>{n}s</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {blockTime && (
                                            <div className="flex items-center gap-2 p-2.5 bg-slate-100 rounded-xl text-xs text-slate-600 font-bold">
                                                <span>🔒</span>
                                                <span>
                                                    Bloqueando {formatTime(blockTime)} → {(() => {
                                                        const [h, m] = blockTime.split(':').map(Number);
                                                        const endMin = h * 60 + m + blockSlotCount * blockIntervalMinutes;
                                                        const eh = Math.floor(endMin / 60);
                                                        const em = endMin % 60;
                                                        return formatTime(`${eh.toString().padStart(2,'0')}:${em.toString().padStart(2,'0')}`);
                                                    })()} · {blockSlotCount * blockIntervalMinutes} min
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <Button onClick={handleBlockSlot} disabled={isBlocking || !blockDate || !blockTime || !blockHospitalId} className="w-full h-14 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold shadow-xl shadow-slate-200 transition-all active:scale-95">
                                        {isBlocking ? "Guardando..." : "Confirmar NO CITAR"}
                                    </Button>
                                    <Button variant="ghost" onClick={() => setIsBlockDialogOpen(false)} className="w-full mt-2 rounded-xl h-10 font-bold text-slate-400">Cancelar</Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Button
                        className="bg-[#1e293b] hover:bg-[#0f172a] text-white rounded-2xl h-12 px-6 shadow-xl shadow-slate-200 flex-1 md:flex-none font-semibold transition-all active:scale-95"
                        onClick={() => setIsBookingTypeDialogOpen(true)}
                    >
                        <CalendarPlus className="w-5 h-5 mr-2" />
                        <span>Agendar Cita</span>
                    </Button>

                    <Button
                        className="bg-slate-800 hover:bg-slate-900 text-white rounded-2xl h-12 px-6 shadow-xl shadow-slate-200 flex-1 md:flex-none font-semibold transition-all active:scale-95"
                        onClick={() => setIsAddPatientDialogOpen(true)}
                    >
                        <UserPlus className="w-5 h-5 mr-2" />
                        <span>Nuevo Paciente</span>
                    </Button>
                </>
            }
        >
            {/* Tabs Content */}
            <Tabs value={currentTab} onValueChange={(val) => setSearchParams({ tab: val })} className="w-full">
                <TabsContent value="overview" className="mt-0 focus-visible:outline-none outline-none border-none">
                    <AdminOverview />
                </TabsContent>

                <TabsContent value="calendar" className="mt-0 focus-visible:outline-none outline-none border-none">
                    <AdminCalendar />
                </TabsContent>

                <TabsContent value="patients" className="mt-0 focus-visible:outline-none outline-none border-none">
                    <PatientDirectory
                        onBookAppointment={(data: any) => {
                            setBookingPatientData(data);
                            setIsAppointmentDialogOpen(true);
                        }}
                    />
                </TabsContent>

                <TabsContent value="settings" className="mt-0 focus-visible:outline-none outline-none border-none p-6">
                    <ClinicSettingsPage />
                </TabsContent>

                <TabsContent value="prescriptions" className="mt-0 focus-visible:outline-none outline-none border-none p-6">
                    <RecetarioPage />
                </TabsContent>

                <TabsContent value="subscription" className="mt-0 focus-visible:outline-none outline-none border-none p-6">
                    <SubscriptionPage />
                </TabsContent>
            </Tabs>

            {/* Dialogs */}
            <AdminAppointmentDialog
                hospitals={hospitals}
                onSave={saveAppointment}
                getAvailableSlots={getAvailableSlots}
                open={isAppointmentDialogOpen}
                onOpenChange={(val) => {
                    setIsAppointmentDialogOpen(val);
                    if (!val) setBookingPatientData(null);
                }}
                initialPatientData={bookingPatientData}
            />

            <BookingTypeDialog
                open={isBookingTypeDialogOpen}
                onOpenChange={setIsBookingTypeDialogOpen}
                patients={patients}
                onNewPatient={() => {
                    setIsBookingTypeDialogOpen(false);
                    setIsAddPatientDialogOpen(true);
                }}
                onExistingPatient={(patient) => {
                    setIsBookingTypeDialogOpen(false);
                    setBookingPatientData({
                        name: patient.name,
                        email: patient.email,
                        phone: patient.phone,
                        notes: ''
                    });
                    setIsAppointmentDialogOpen(true);
                }}
            />

            <AddPatientDialog
                open={isAddPatientDialogOpen}
                onOpenChange={setIsAddPatientDialogOpen}
                onSave={addPatient}
                onBookAppointment={(data: any) => {
                    setBookingPatientData(data);
                    setIsAppointmentDialogOpen(true);
                }}
            />
        </AdminLayout>
    );
};
