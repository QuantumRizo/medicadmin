import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, UserCheck, Search, ArrowLeft, ArrowRight, User } from "lucide-react";
import type { Patient } from "../../appointments/types";

interface BookingTypeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onNewPatient: () => void;
    onExistingPatient: (patient: Patient) => void;
    patients: Patient[];
}

export const BookingTypeDialog = ({ open, onOpenChange, onNewPatient, onExistingPatient, patients }: BookingTypeDialogProps) => {
    const [view, setView] = useState<'options' | 'search'>('options');
    const [searchTerm, setSearchTerm] = useState('');

    // Reset state on open/close
    const handleOpenChange = (val: boolean) => {
        if (!val) {
            setTimeout(() => {
                setView('options');
                setSearchTerm('');
            }, 300);
        }
        onOpenChange(val);
    };

    const isSearching = searchTerm.length >= 2;

    const displayedPatients = useMemo(() => {
        if (!isSearching) return patients; // Show all patients when not searching
        const search = searchTerm.toLowerCase();
        return patients.filter(p =>
            p.name.toLowerCase().includes(search) ||
            p.email.toLowerCase().includes(search) ||
            p.phone.includes(search)
        );
    }, [patients, searchTerm, isSearching]);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[450px] max-h-[85vh] flex flex-col p-0 gap-0 rounded-2xl border-none shadow-2xl overflow-hidden">
                <div className="bg-[#0f172a] p-6 text-white text-center">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-center gap-3 text-xl font-bold">
                            {view === 'search' && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10 rounded-full absolute left-4" onClick={() => setView('options')}>
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                            )}
                            {view === 'options' ? "Agendar Cita" : "Buscar Paciente"}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 font-medium mt-2">
                            {view === 'options'
                                ? "¿El paciente ya está registrado en el sistema?"
                                : "Seleccione un paciente para programar su cita."}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col p-4">

                {view === 'options' ? (
                    <div className="grid grid-cols-2 gap-4 py-2">
                        <button
                            onClick={() => setView('search')}
                            className="flex flex-col items-center justify-center gap-4 p-5 rounded-2xl border border-slate-100 hover:border-sky-500 hover:bg-sky-50 transition-all group shadow-sm hover:shadow-md"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-sky-500 group-hover:text-white transition-all duration-300">
                                <UserCheck className="w-7 h-7" />
                            </div>
                            <div className="text-center">
                                <h3 className="font-bold text-slate-800 text-sm">Registrado</h3>
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-1">Busca en directorio</p>
                            </div>
                        </button>

                        <button
                            onClick={() => {
                                handleOpenChange(false);
                                onNewPatient();
                            }}
                            className="flex flex-col items-center justify-center gap-4 p-5 rounded-2xl border border-emerald-500 hover:bg-emerald-50 transition-all group shadow-sm hover:shadow-md"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                                <UserPlus className="w-7 h-7" />
                            </div>
                            <div className="text-center">
                                <h3 className="font-bold text-slate-800 text-sm">Nuevo</h3>
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-1">Crear registro</p>
                            </div>
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col flex-1 overflow-hidden">
                        <div className="pb-4 shrink-0 px-2">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                                <Input
                                    placeholder="Nombre o teléfono..."
                                    className="pl-11 rounded-xl border-slate-200 h-11 focus-visible:ring-sky-500 transition-all font-medium"
                                    autoFocus
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-slate-50/50 rounded-xl border border-slate-100 mb-2">
                            {displayedPatients.length === 0 ? (
                                <div className="h-[200px] flex flex-col items-center justify-center text-slate-300 p-8 text-center text-sm">
                                    <User className="w-10 h-10 opacity-20 mb-2" />
                                    No se encontraron pacientes
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 bg-white">
                                    {displayedPatients.map(patient => (
                                        <button
                                            key={patient.id}
                                            onClick={() => {
                                                handleOpenChange(false);
                                                onExistingPatient(patient);
                                            }}
                                            className="w-full text-left px-5 py-4 hover:bg-sky-50/50 transition-colors flex items-center justify-between group"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-slate-900 truncate group-hover:text-sky-600 transition-colors">{patient.name}</div>
                                                <div className="text-[10px] text-slate-400 font-medium flex gap-2 truncate mt-0.5">
                                                    <span>{patient.phone}</span>
                                                    {patient.email && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="truncate">{patient.email}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-sky-100 group-hover:text-sky-600 transition-all">
                                                <ArrowRight className="w-4 h-4" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
