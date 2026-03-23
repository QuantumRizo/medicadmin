import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, CalendarPlus, CheckCircle, AlertTriangle } from "lucide-react";
import { useAppointments } from "../../appointments/hooks/useAppointments";
import { standardizePhone } from "@/lib/utils";

interface AddPatientDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (patientData: { name: string, email: string, phone: string }) => Promise<any>;
    onBookAppointment: (patientData: any) => void;
}

export const AddPatientDialog = ({ open, onOpenChange, onSave, onBookAppointment }: AddPatientDialogProps) => {
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: ''
    });

    const { patients } = useAppointments();
    const [createdPatient, setCreatedPatient] = useState<any>(null);
    const [existingMatch, setExistingMatch] = useState<any>(null);

    const handleChange = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
        
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

    const handleSubmit = async () => {
        // Basic validation
        if (!formData.name || !formData.phone) {
            alert("Por favor complete nombre y teléfono.");
            return;
        }

        setIsSubmitting(true);
        try {
            const newPatient = await onSave(formData);
            setCreatedPatient(newPatient); // Store for potential booking
            setStep('success');
        } catch (error: any) {
            alert(error.message || "Error al registrar paciente");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setFormData({ name: '', email: '', phone: '' });
        setStep('form');
        setCreatedPatient(null);
        setExistingMatch(null);
    };

    const handleClose = () => {
        handleReset();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) handleReset();
            onOpenChange(val);
        }}>
            <DialogContent className="sm:max-w-[500px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
                <div className="bg-[#0f172a] p-6 text-white text-center">
                    <DialogHeader>
                        <div className="mx-auto w-12 h-12 rounded-2xl bg-sky-500/20 flex items-center justify-center text-sky-400 mb-4">
                            {step === 'form' ? <UserPlus className="w-7 h-7" /> : <CheckCircle className="w-7 h-7 font-bold" />}
                        </div>
                        <DialogTitle className="text-2xl font-extrabold tracking-tight">
                            {step === 'form' ? "Nuevo Paciente" : "¡Registro Exitoso!"}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 font-medium mt-2">
                            {step === 'form'
                                ? "Complete los datos para dar de alta al paciente."
                                : "El perfil ha sido creado correctamente en el sistema."}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6">

                {step === 'form' ? (
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="new-name" className="text-slate-700 font-bold ml-1">Nombre Completo *</Label>
                            <Input
                                id="new-name"
                                placeholder="Ej: Maria Gonzalez"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                className="rounded-xl border-slate-200 h-11 focus-visible:ring-sky-500"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="new-email" className="text-slate-700 font-bold ml-1">Correo (Opcional)</Label>
                                <Input
                                    id="new-email"
                                    type="email"
                                    placeholder="correo@ejemplo.com"
                                    value={formData.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    className="rounded-xl border-slate-200 h-11 focus-visible:ring-sky-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-phone" className="text-slate-700 font-bold ml-1">Teléfono *</Label>
                                <Input
                                    id="new-phone"
                                    placeholder="55 1234 5678"
                                    value={formData.phone}
                                    onChange={(e) => handleChange('phone', e.target.value)}
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

                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
                            <Button variant="ghost" onClick={handleClose} disabled={isSubmitting} className="rounded-xl h-12 px-6 font-bold text-slate-500">Cancelar</Button>
                            <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-sky-500 hover:bg-sky-600 text-white rounded-xl h-12 px-8 font-bold shadow-xl shadow-sky-100 transition-all active:scale-95">
                                {isSubmitting ? "Guardando..." : "Registrar Paciente"}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="py-2 space-y-6">
                        <div className="flex flex-col items-center text-center p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <h3 className="text-xl font-extrabold text-slate-900">{createdPatient?.name}</h3>
                            <p className="text-slate-500 font-medium">{createdPatient?.email || 'Sin correo registrado'}</p>
                            <p className="text-sky-600 font-bold mt-1">{createdPatient?.phone}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="outline" className="h-auto py-5 px-4 flex flex-col gap-2 hover:bg-slate-50 border-slate-200 rounded-2xl transition-all hover:border-slate-300 group" onClick={handleClose}>
                                <CheckCircle className="w-6 h-6 text-slate-400 group-hover:text-slate-600 transition-colors" />
                                <div className="text-center">
                                    <span className="block font-bold text-slate-700">Solo Registrar</span>
                                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Finalizar proceso</span>
                                </div>
                            </Button>

                            <Button className="h-auto py-5 px-4 flex flex-col gap-2 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl shadow-xl shadow-sky-100 transition-all active:scale-95 group" onClick={() => {
                                handleClose();
                                onBookAppointment(formData);
                            }}>
                                <CalendarPlus className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                                <div className="text-center">
                                    <span className="block font-extrabold">Agendar Cita</span>
                                    <span className="text-[10px] text-sky-100 font-medium uppercase tracking-wider">Programar ahora</span>
                                </div>
                            </Button>
                        </div>
                    </div>
                )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
