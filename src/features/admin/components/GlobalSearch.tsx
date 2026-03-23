
import { useState, useRef, useEffect } from "react";
import { Search, ArrowRight } from "lucide-react";
import { useAppointments } from "../../appointments/hooks/useAppointments";
import type { Patient, Appointment } from "../../appointments/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface GlobalSearchProps {
    onSelectPatient?: (patient: Patient) => void;
}

export const GlobalSearch = ({ onSelectPatient }: GlobalSearchProps) => {
    const { patients, appointments, hospitals } = useAppointments();
    const [searchTerm, setSearchTerm] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Patient Preview Dialog State
    const [previewPatient, setPreviewPatient] = useState<Patient | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const suggestions = patients.filter((p: Patient) => {
        if (searchTerm.length < 2) return false;
        const search = searchTerm.toLowerCase();
        return (
            (p.name || '').toLowerCase().includes(search) ||
            (p.email || '').toLowerCase().includes(search)
        );
    }).slice(0, 5);

    const handleSelect = (patient: Patient) => {
        setSearchTerm("");
        setIsOpen(false);
        if (onSelectPatient) {
            onSelectPatient(patient);
        } else {
            setPreviewPatient(patient);
        }
    };

    const getPatientHospitalName = (patientId: string) => {
        // Find most recent appointment to guess hospital
        const lastAppt = appointments
            .filter((a: Appointment) => a.patientId === patientId)
            .sort((a: Appointment, b: Appointment) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        if (!lastAppt) return "Sin historial";
        return hospitals.find((h: any) => h.id === lastAppt.hospitalId)?.name || "Desconocido";
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to start of day

    return (
        <div className="relative w-full max-w-xl mx-auto md:mx-0" ref={containerRef}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                <input
                    className="w-full bg-white/10 border border-white/20 rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                    placeholder="Buscar paciente global..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                />
            </div>

            {isOpen && searchTerm.length >= 2 && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/50 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 text-[10px] font-bold text-slate-400 bg-slate-50/50 border-b border-slate-100 uppercase tracking-widest">
                        Pacientes Encontrados
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                        {suggestions.map((patient: Patient) => (
                            <button
                                key={patient.id}
                                onClick={() => handleSelect(patient)}
                                className="w-full text-left px-5 py-4 hover:bg-sky-50 transition-colors flex items-center justify-between group border-b border-slate-50 last:border-0"
                            >
                                <div className="min-w-0 pr-4">
                                    <div className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors truncate">{patient.name}</div>
                                    <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-sky-400"></div>
                                        <span className="truncate">{getPatientHospitalName(patient.id)}</span>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-sky-100 group-hover:text-sky-600 transition-all">
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
            {/* Quick Preview Dialog for Global Search */}
            <Dialog open={!!previewPatient} onOpenChange={(open) => !open && setPreviewPatient(null)}>
                <DialogContent className="sm:max-w-[450px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
                    <div className="bg-[#0f172a] p-6 text-white">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-extrabold tracking-tight">Vista Rápida: {previewPatient?.name}</DialogTitle>
                            <DialogDescription className="text-slate-400 font-medium text-xs mt-1">Información general y últimas citas.</DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 gap-4 text-sm">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Contacto</label>
                                <div className="flex flex-col gap-1">
                                    <div className="font-bold text-slate-900 flex items-center gap-2">
                                        <span className="text-slate-400 text-xs">Email:</span> {previewPatient?.email || 'N/A'}
                                    </div>
                                    <div className="font-bold text-sky-600 flex items-center gap-2 text-lg">
                                        <span className="text-slate-400 text-xs">Tel:</span> {previewPatient?.phone}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                                <span className="w-6 h-[2px] bg-sky-200 rounded-full"></span>
                                Historial Reciente
                            </h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                {appointments
                                    .filter((a: Appointment) => a.patientId === previewPatient?.id)
                                    .sort((a: Appointment, b: Appointment) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                    .map((appt: Appointment) => (
                                        <div key={appt.id} className="p-3 rounded-xl border border-slate-50 bg-white flex justify-between items-center shadow-sm group hover:border-sky-100 transition-all">
                                            <div>
                                                <div className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                                                    {format(parseISO(appt.date), "dd MMMM, yyyy", { locale: es })}
                                                </div>
                                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mt-0.5">
                                                    {appt.serviceName || (appt.reason === 'first-visit' ? 'Primera vez' : appt.reason === 'follow-up' ? 'Seguimiento' : 'Consulta')}
                                                </div>
                                            </div>
                                            {appt.reason === 'blocked' && (
                                                <div className="text-[10px] px-2 py-1 rounded-full bg-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                                                    Bloqueado
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                {appointments.filter((a: Appointment) => a.patientId === previewPatient?.id).length === 0 && (
                                    <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Sin citas registradas</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-sky-50/50 p-4 rounded-2xl border border-sky-100/50 text-xs text-slate-600 leading-relaxed italic">
                            Acceda a la pestaña <b className="text-sky-700">Pacientes</b> para gestionar el expediente completo o editar información clínica detallada.
                        </div>

                        <Button onClick={() => setPreviewPatient(null)} className="w-full bg-slate-900 hover:bg-[#0f172a] text-white rounded-xl h-11 font-bold transition-all active:scale-95 border-0 shadow-none">
                            Entendido
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
