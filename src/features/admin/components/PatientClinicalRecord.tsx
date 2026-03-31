import { useState, useEffect } from 'react';
import { isAfter, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Activity, Phone, Mail, Clock, FileText, User, AlertCircle, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import type { Patient, Appointment, MedicalHistory, Hospital } from '../../appointments/types';
import { PatientFiles } from './PatientFiles';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { AppointmentDetailDialog } from './AppointmentDetailDialog';
import { formatTime } from '../../appointments/utils';
import { Odontograma } from './Odontograma';

interface PatientClinicalRecordProps {
    patient: Patient;
    appointments: Appointment[];
    hospitals?: Hospital[];
    onUpdatePatient: (patient: Patient) => Promise<void>;
    onDeleteAppointment?: (id: string) => Promise<void>;
    onUpdateAppointment?: (id: string, updates: Partial<Appointment>) => Promise<void>;
    getAvailableSlots?: (date: string, hospitalId: string) => string[];
}

const DEFAULT_HISTORY: MedicalHistory = {
    allergies: '',
    conditions: '',
    surgeries: '',
    medications: '',
    familyHistory: '',
    bloodType: '',
    odontogramData: {}
};

export const PatientClinicalRecord = ({
    patient: initialPatient,
    appointments,
    hospitals = [],
    onUpdatePatient,
    onDeleteAppointment,
    onUpdateAppointment,
    getAvailableSlots
}: PatientClinicalRecordProps) => {

    const [patient, setPatient] = useState<Patient>(initialPatient);
    const [generalNotes, setGeneralNotes] = useState<string>(initialPatient.notes || '');
    const [selectedDetailApt, setSelectedDetailApt] = useState<Appointment | null>(null);

    // History State
    const [history, setHistory] = useState<MedicalHistory>({
        ...DEFAULT_HISTORY,
        ...(initialPatient.medicalHistory || {}),
        address: {
            street: '', number: '', neighborhood: '', municipality: '', city: '', state: '', zipCode: '',
            ...(initialPatient.medicalHistory?.address || {})
        }
    });
    const [hasRestoredFromBackup, setHasRestoredFromBackup] = useState(false);


    // Unsaved changes tracking
    const [initialHistoryStr, setInitialHistoryStr] = useState("");
    const [initialNotesStr, setInitialNotesStr] = useState("");
    const [initialCoreStr, setInitialCoreStr] = useState("");

    const normalizeForCompare = (val: any) => {
        return JSON.stringify(val, (_key, value) => {
            if (value === "" || value === null || value === undefined) return undefined;
            return value;
        });
    };
 
    const hasUnsavedChanges = 
        normalizeForCompare(history) !== initialHistoryStr || 
        normalizeForCompare(generalNotes) !== initialNotesStr ||
        normalizeForCompare({ name: patient.name, phone: patient.phone, email: patient.email }) !== initialCoreStr;


    useEffect(() => {
        // Only reset if the patient ID changed
        if (patient.id !== initialPatient.id) {
            setPatient(initialPatient);
            setGeneralNotes(initialPatient.notes || '');
            const loadedHistory = {
                ...DEFAULT_HISTORY,
                ...(initialPatient.medicalHistory || {}),
                address: {
                    street: '', number: '', neighborhood: '', municipality: '', city: '', state: '', zipCode: '',
                    ...(initialPatient.medicalHistory?.address || {})
                }
            };
            setHistory(loadedHistory);
            setInitialHistoryStr(normalizeForCompare(loadedHistory));
            setInitialNotesStr(normalizeForCompare(initialPatient.notes || ''));
            setInitialCoreStr(normalizeForCompare({ 
                name: initialPatient.name, 
                phone: initialPatient.phone, 
                email: initialPatient.email 
            }));
            setHasRestoredFromBackup(false);
        }
    }, [initialPatient.id]); // Only run when ID changes

    // Backup Logic: Save to localStorage when things change
    useEffect(() => {
        if (!hasUnsavedChanges) {
            localStorage.removeItem(`backup_patient_${patient.id}`);
            return;
        }

        const backupData = {
            patient: { name: patient.name, phone: patient.phone, email: patient.email },
            generalNotes,
            history,
            timestamp: new Date().toISOString()
        };

        const timer = setTimeout(() => {
            localStorage.setItem(`backup_patient_${patient.id}`, JSON.stringify(backupData));
        }, 1000);

        return () => clearTimeout(timer);
    }, [patient.name, patient.phone, patient.email, generalNotes, history, hasUnsavedChanges, patient.id]);

    // Restore Logic: Check for backup on mount
    useEffect(() => {
        const saved = localStorage.getItem(`backup_patient_${patient.id}`);
        if (saved && !hasRestoredFromBackup) {
            try {
                const backup = JSON.parse(saved);
                // If backup is newer than 24h
                const backupTime = new Date(backup.timestamp).getTime();
                if (Date.now() - backupTime < 24 * 60 * 60 * 1000) {
                    toast("Se encontró un respaldo no guardado", {
                        description: "¿Deseas recuperar los datos escritos anteriormente?",
                        action: {
                            label: "Recuperar",
                            onClick: () => {
                                setPatient(prev => ({ ...prev, ...backup.patient }));
                                setGeneralNotes(backup.generalNotes);
                                setHistory(backup.history);
                                setHasRestoredFromBackup(true);
                                toast.success("Se han restaurado los datos del respaldo");
                            }
                        },
                        cancel: {
                            label: "Descartar",
                            onClick: () => {
                                localStorage.removeItem(`backup_patient_${patient.id}`);
                                setHasRestoredFromBackup(true);
                            }
                        }
                    });
                }
            } catch (e) {
                console.error("Error parsing backup", e);
            }
        }
    }, [patient.id, hasRestoredFromBackup]);

    // BeforeUnload Guard
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);


    const handleChange = (field: keyof MedicalHistory, value: any) => {
        setHistory(prev => ({ ...prev, [field]: value }));
    };

    const calculateAge = (dobString?: string) => {
        if (!dobString) return '';
        const dob = new Date(dobString);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
            age--;
        }
        return age;
    };

    const handleSaveAll = async () => {
        try {
            const updated = { 
                ...patient, 
                notes: generalNotes,
                medicalHistory: history 
            };
            await onUpdatePatient(updated);
            setPatient(updated);
            setInitialHistoryStr(normalizeForCompare(history));
            setInitialNotesStr(normalizeForCompare(generalNotes));
            setInitialCoreStr(normalizeForCompare({ 
                name: updated.name, 
                phone: updated.phone, 
                email: updated.email 
            }));
            toast.success("Expediente médico guardado correctamente");
            localStorage.removeItem(`backup_patient_${patient.id}`);
        } catch (error) {
            console.error("Error saving patient", error);
            toast.error("Error al guardar el expediente");
        }
    };

    const handleDeleteAppointment = async (apptId: string) => {
        if (!onDeleteAppointment) return;
        try {
            await onDeleteAppointment(apptId);
            toast.success('Cita eliminada correctamente');
            setSelectedDetailApt(null);
        } catch (e) {
            toast.error('Error al eliminar la cita');
        }
    };

    const handleUpdateAppointment = async (apptId: string, data: any) => {
        if (!onUpdateAppointment) return;
        try {
            await onUpdateAppointment(apptId, data);
            toast.success('Cita reprogramada correctamente');
            setSelectedDetailApt(null);
        } catch (e: any) {
            toast.error('Error al reprogramar cita', { description: e.message });
        }
    };

    const patientAppointments = appointments
        .filter(a => a.patientId === patient.id)
        .sort((a, b) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime());

    const todayDate = new Date();
    const upcomingAppts = patientAppointments.filter(a => {
        const apptDate = new Date(a.date + 'T' + a.time);
        return isAfter(apptDate, todayDate) && a.reason !== 'blocked';
    });
    const pastAppts = patientAppointments.filter(a => {
        const apptDate = new Date(a.date + 'T' + a.time);
        return !isAfter(apptDate, todayDate) || a.reason === 'blocked';
    });

    return (
        <div className="flex flex-col gap-6 pb-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* --- COLUMN 1: LEFT (3/12) --- */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                    
                    {/* Profile Card */}
                    <Card className="shadow-sm border-t-4 border-t-[#1c334a]">
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-20 h-20 rounded-full bg-[#1c334a] text-white flex items-center justify-center text-3xl font-bold shadow-md">
                                    {patient.name.charAt(0)}
                                </div>
                                <div>
                                    <Input
                                        value={patient.name}
                                        onChange={(e) => setPatient(prev => ({ ...prev, name: e.target.value }))}
                                        className="text-xl font-bold text-[#1c334a] text-center bg-transparent border-none focus-visible:ring-1 focus-visible:ring-sky-500 mb-1 h-auto py-1 px-2"
                                        placeholder="Nombre del paciente"
                                    />
                                    <div className="text-sm text-gray-500 font-medium space-x-2">
                                        <span>{history.dateOfBirth ? format(parseISO(history.dateOfBirth), 'dd/MMM/yyyy', { locale: es }) : 'Sin fecha'}</span>
                                        <span>|</span>
                                        <span>{history.sex || 'Sexo n/a'}</span>
                                    </div>
                                    <div className="text-sm text-gray-400 mt-1">{calculateAge(history.dateOfBirth) ? `${calculateAge(history.dateOfBirth)} años` : ''}</div>
                                </div>
                                <div className="w-full pt-4 border-t border-gray-100 flex flex-col gap-2 text-sm text-gray-600">
                                    <div className="flex items-center gap-2 px-2 bg-gray-50/50 rounded-lg">
                                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                        <Input
                                            value={patient.phone}
                                            onChange={(e) => setPatient(prev => ({ ...prev, phone: e.target.value }))}
                                            className="h-8 text-xs bg-transparent border-none focus-visible:ring-0 px-1 font-medium"
                                            placeholder="Teléfono"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 px-2 bg-gray-50/50 rounded-lg">
                                        <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                        <Input
                                            value={patient.email}
                                            onChange={(e) => setPatient(prev => ({ ...prev, email: e.target.value }))}
                                            className="h-8 text-xs bg-transparent border-none focus-visible:ring-0 px-1 font-medium"
                                            placeholder="Correo electrónico"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Datos Generales */}
                    <Card className="shadow-sm">
                        <CardHeader className="bg-gray-50/50 pb-3 border-b">
                            <CardTitle className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                                <User className="w-4 h-4 text-[#1c334a]" />
                                Datos Generales
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-500 uppercase font-semibold">F. Nacimiento</Label>
                                <Input type="date" className="h-8 text-sm bg-gray-50/50" value={history.dateOfBirth || ''} onChange={(e) => handleChange('dateOfBirth', e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs text-gray-500 uppercase font-semibold">Sangre</Label>
                                    <select className="flex h-8 w-full rounded-md border border-input bg-gray-50/50 px-3 py-1 text-sm text-gray-700" value={history.bloodType || ''} onChange={(e) => handleChange('bloodType', e.target.value)}>
                                        <option value="">N/A</option>
                                        <option value="A+">A+</option><option value="A-">A-</option>
                                        <option value="B+">B+</option><option value="B-">B-</option>
                                        <option value="AB+">AB+</option><option value="AB-">AB-</option>
                                        <option value="O+">O+</option><option value="O-">O-</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-gray-500 uppercase font-semibold">Sexo</Label>
                                    <select className="flex h-8 w-full rounded-md border border-input bg-gray-50/50 px-3 py-1 text-sm text-gray-700" value={history.sex || ''} onChange={(e) => handleChange('sex', e.target.value)}>
                                        <option value="">N/A</option>
                                        <option value="Masculino">Masculino</option>
                                        <option value="Femenino">Femenino</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-500 uppercase font-semibold">Estado Civil</Label>
                                <select className="flex h-8 w-full rounded-md border border-input bg-gray-50/50 px-3 py-1 text-sm text-gray-700" value={history.maritalStatus || ''} onChange={(e) => handleChange('maritalStatus', e.target.value)}>
                                    <option value="">N/A</option>
                                    <option value="Soltero">Soltero</option>
                                    <option value="Casado">Casado</option>
                                    <option value="Divorciado">Divorciado</option>
                                    <option value="Viudo">Viudo</option>
                                    <option value="Unión Libre">Unión Libre</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-500 uppercase font-semibold">Ocupación</Label>
                                <Input placeholder="Ej. Arquitecto" className="h-8 text-sm bg-gray-50/50" value={history.occupation || ''} onChange={(e) => handleChange('occupation', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-500 uppercase font-semibold">Deportes</Label>
                                <Input placeholder="Ej. Natación" className="h-8 text-sm bg-gray-50/50" value={history.sports || ''} onChange={(e) => handleChange('sports', e.target.value)} />
                            </div>
                            <div className="pt-2 border-t">
                                <Label className="text-xs text-gray-500 uppercase mb-2 block font-semibold">Teléfonos Extra</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <Input placeholder="Casa" className="h-8 text-sm bg-gray-50/50" value={history.homePhone || ''} onChange={(e) => handleChange('homePhone', e.target.value)} />
                                    <Input placeholder="Oficina" className="h-8 text-sm bg-gray-50/50" value={history.officePhone || ''} onChange={(e) => handleChange('officePhone', e.target.value)} />
                                </div>
                            </div>
                            <div className="pt-2 border-t text-sm">
                                <Label className="text-xs text-gray-500 uppercase mb-2 block font-semibold">Seguro Médico</Label>
                                <div className="flex items-center gap-2 mb-2">
                                    <input type="checkbox" id="insurance" className="h-4 w-4 rounded accent-[#1c334a]" checked={history.insurance || false} onChange={(e) => handleChange('insurance', e.target.checked)} />
                                    <Label htmlFor="insurance" className="text-sm cursor-pointer text-gray-600">Cuenta con Seguro</Label>
                                </div>
                                {history.insurance && (
                                    <Input placeholder="Aseguradora" className="h-8 text-sm bg-gray-50/50 border-[#1c334a]/40" value={history.insuranceCompany || ''} onChange={(e) => handleChange('insuranceCompany', e.target.value)} />
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Patient Files */}
                    <Card className="shadow-sm">
                        <CardHeader className="bg-gray-50/50 pb-3 border-b">
                            <CardTitle className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                                <FileText className="w-4 h-4 text-[#1c334a]" />
                                Archivos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <PatientFiles patientId={patient.id} />
                        </CardContent>
                    </Card>
                </div>

                {/* --- COLUMN 2: MIDDLE (6/12) --- */}
                <div className="lg:col-span-6 flex flex-col gap-6">
                    
                    <Card className="shadow-sm border-t-4 border-t-[#1c334a]">
                        <CardHeader className="pb-3 border-b bg-white">
                            <CardTitle className="text-lg font-bold text-[#1c334a] uppercase tracking-wider flex items-center gap-2">
                                <Activity className="w-5 h-5 text-[#1c334a]" />
                                Historia Clínica
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-8 bg-white">
                            
                            {/* Section 1: Antecedentes */}
                            <div>
                                <h3 className="text-sm font-bold text-[#1c334a] uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Antecedentes</h3>
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <Label className="text-xs font-semibold text-gray-500 uppercase">Antecedentes Patológicos</Label>
                                        </div>
                                        <Textarea className="min-h-[60px] resize-y text-sm bg-gray-50/30 font-medium" placeholder="Enfermedades previas, crónicas..." value={history.pathologicalHistory || ''} onChange={(e) => handleChange('pathologicalHistory', e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Antecedentes Heredofamiliares</Label>
                                        <Textarea className="min-h-[60px] resize-y text-sm bg-gray-50/30 font-medium" placeholder="Diabetes, cáncer familiar..." value={history.familyHistory || ''} onChange={(e) => handleChange('familyHistory', e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Antecedentes No Patológicos</Label>
                                        <Textarea className="min-h-[60px] resize-y text-sm bg-gray-50/30 font-medium" placeholder="Hábitos, alimentación..." value={history.nonPathologicalHistory || ''} onChange={(e) => handleChange('nonPathologicalHistory', e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Antecedentes Gineco-obstétricos</Label>
                                        <Textarea className="min-h-[60px] resize-y text-sm bg-gray-50/30 font-medium" placeholder="Menstruación, Partos, etc..." value={history.gynecoObstetricHistory || ''} onChange={(e) => handleChange('gynecoObstetricHistory', e.target.value)} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-bold text-red-500 uppercase mb-1 block">Alergias</Label>
                                            <Textarea className="min-h-[60px] resize-y text-sm bg-red-50 border-red-200 font-medium text-red-900 placeholder:text-red-300" placeholder="Alergias conocidas..." value={history.allergies || ''} onChange={(e) => handleChange('allergies', e.target.value)} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Cirugías Previas</Label>
                                            <Textarea className="min-h-[60px] resize-y text-sm bg-gray-50/30 font-medium" placeholder="Cirugías mayores o menores..." value={history.surgeries || ''} onChange={(e) => handleChange('surgeries', e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Evaluación Actual */}
                            <div>
                                <h3 className="text-sm font-bold text-[#1c334a] uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Evaluación Clínica</h3>
                                <div className="space-y-4">
                                    <div className="space-y-1 shadow-sm border border-gray-100 rounded-md p-3 bg-gray-50/50">
                                        <Label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Padecimiento Actual (Síntomas)</Label>
                                        <Textarea className="min-h-[80px] resize-y text-sm bg-white font-medium" placeholder="Describa el motivo de la consulta..." value={history.currentCondition || ''} onChange={(e) => handleChange('currentCondition', e.target.value)} />
                                    </div>
                                    <div className="space-y-1 shadow-sm border border-gray-100 rounded-md p-3 bg-gray-50/50">
                                        <Label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Exploración Física</Label>
                                        <Textarea className="min-h-[80px] resize-y text-sm bg-white font-medium" placeholder="Hallazgos en la exploración..." value={history.physicalExploration || ''} onChange={(e) => handleChange('physicalExploration', e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Laboratorios y Estudios</Label>
                                        <Textarea className="min-h-[60px] resize-y text-sm bg-gray-50/30 font-medium" placeholder="Observaciones de gabinete..." value={history.labStudies || ''} onChange={(e) => handleChange('labStudies', e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-blue-600 uppercase mb-1 block">Diagnóstico</Label>
                                        <Textarea className="min-h-[80px] resize-y text-sm bg-blue-50/50 border-blue-200 font-medium" placeholder="Diagnóstico definitivo o diferencial..." value={history.diagnosis || ''} onChange={(e) => handleChange('diagnosis', e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-green-600 uppercase mb-1 block">Tratamiento Planificado</Label>
                                        <Textarea className="min-h-[80px] resize-y text-sm bg-green-50/40 border-green-200 font-medium" placeholder="Receta médica, recomendaciones..." value={history.treatment || ''} onChange={(e) => handleChange('treatment', e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Pronóstico</Label>
                                        <Input className="h-10 text-sm bg-gray-50/30 font-medium" placeholder="Favorable, reservado..." value={history.prognosis || ''} onChange={(e) => handleChange('prognosis', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Odontograma (Solo si es clínica dental) */}
                    {hospitals.some(h => h.isDentalClinic) && (
                        <Card className="shadow-sm border-t-4 border-t-[#1c334a]">
                            <CardHeader className="bg-gray-50/50 pb-3 border-b">
                                <CardTitle className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-[#1c334a]" />
                                    Odontograma Clínico
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <Odontograma 
                                    value={history.odontogramData as any} 
                                    onChange={(data) => handleChange('odontogramData', data)} 
                                />
                            </CardContent>
                        </Card>
                    )}

                    {/* Medicamentos Activos */}
                    <Card className="shadow-sm">
                        <CardHeader className="bg-gray-50/50 pb-3 border-b">
                            <CardTitle className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                                <Clock className="w-4 h-4 text-[#1c334a]" />
                                Medicamentos Activos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <Textarea 
                                className="min-h-[120px] resize-y text-sm bg-white font-medium shadow-inner" 
                                placeholder="Escriba los medicamentos que el paciente toma regularmente..." 
                                value={history.medications || ''} 
                                onChange={(e) => handleChange('medications', e.target.value)} 
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* --- COLUMN 3: RIGHT (3/12) --- */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                    
                    <Button 
                        onClick={handleSaveAll} 
                        className="w-full h-14 text-white bg-[#1c334a] hover:bg-[#2a4560] font-bold text-base shadow-lg group transition-all"
                    >
                        <Save className="w-6 h-6 mr-2 group-hover:scale-110 transition-transform" /> 
                        Guardar Expediente
                    </Button>

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
                                                            handleDeleteAppointment(appt.id);
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
                                                                handleDeleteAppointment(appt.id);
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
                </div>
            </div>

            {/* Notas de Evolución — cuaderno grande ancho completo */}
            <Card className="shadow-md border-t-4 border-t-[#1c334a]">
                <CardHeader className="pb-4 border-b bg-[#1c334a]">
                    <CardTitle className="text-base font-bold text-white uppercase tracking-widest flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Notas de Evolución
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0 overflow-hidden rounded-b-lg">
                    <div className="relative">
                        {/* Red margin line */}
                        <div className="absolute top-0 bottom-0 left-[3.5rem] w-px bg-red-300/70 pointer-events-none z-10" />
                        <textarea
                            className="w-full resize-y text-sm text-gray-800 focus:outline-none"
                            placeholder="Escriba aquí las notas de evolución del paciente..."
                            value={generalNotes}
                            onChange={(e) => setGeneralNotes(e.target.value)}
                            rows={36}
                            style={{
                                backgroundImage: 'linear-gradient(transparent calc(100% - 1px), #bfdbfe 1px)',
                                backgroundSize: '100% 2rem',
                                backgroundColor: '#fefefe',
                                lineHeight: '2rem',
                                paddingLeft: '4.5rem',
                                paddingRight: '2rem',
                                paddingTop: '0.75rem',
                                paddingBottom: '2rem',
                                minHeight: '700px',
                                border: 'none',
                                fontFamily: '"Georgia", serif',
                                fontSize: '0.9rem',
                                color: '#1e293b',
                                boxShadow: 'inset 2px 0 8px rgba(0,0,0,0.03)',
                            }}
                        ></textarea>
                    </div>
                </CardContent>
            </Card>

            {/* Unsaved Changes Banner */}
            <div className={`fixed bottom-0 left-0 right-0 bg-white border-t border-orange-200 px-6 py-4 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.1)] z-50 flex justify-between items-center transition-transform duration-300 ${hasUnsavedChanges ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-orange-500 shrink-0" />
                    <div>
                        <p className="text-sm font-bold text-gray-800">Tienes cambios sin guardar</p>
                        <p className="text-xs text-gray-500 hidden sm:block">Asegúrate de presionar guardar para no perder el progreso de este expediente.</p>
                    </div>
                </div>
                <Button onClick={handleSaveAll} className="bg-[#1c334a] hover:bg-[#2a4560] text-white font-bold h-10 px-6 shadow-md shrink-0">
                    <Save className="w-4 h-4 mr-2 hidden sm:block" /> Guardar
                </Button>
            </div>

            <AppointmentDetailDialog
                appointment={selectedDetailApt}
                patient={patient}
                hospitals={hospitals}
                isOpen={!!selectedDetailApt}
                onOpenChange={(open) => !open && setSelectedDetailApt(null)}
                onDelete={handleDeleteAppointment}
                onUpdate={handleUpdateAppointment}
                getAvailableSlots={getAvailableSlots || (() => [])}
            />
        </div>
    );
};
