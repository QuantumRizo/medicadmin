import { useState, useEffect } from 'react';
import { FileText, AlertCircle, Save, Printer, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

import type { Patient, Appointment, MedicalHistory, Hospital, DoctorProfile, ClinicalSession } from '../../appointments/types';
import { getTodayStr } from '@/lib/dateUtils';
import { logActivity } from '@/lib/audit';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import { PatientFiles } from './PatientFiles';
import { PatientProfileCard } from './patient-record/PatientProfileCard';
import { PatientGeneralData } from './patient-record/PatientGeneralData';
import { PatientMedicalHistory } from './patient-record/PatientMedicalHistory';
import { PatientOdontogram } from './patient-record/PatientOdontogram';
import { PatientClinicalNotes } from './patient-record/PatientClinicalNotes';
import { PatientAppointments } from './patient-record/PatientAppointments';
import { PatientPrintableRecord } from './patient-record/PatientPrintableRecord';
import { printReport } from './patient-record/printRecordUtils';

interface PatientClinicalRecordProps {
    patient: Patient;
    appointments: Appointment[];
    hospitals?: Hospital[];
    onUpdatePatient: (patient: Patient) => Promise<void>;
    onDeleteAppointment?: (id: string) => Promise<void>;
    onUpdateAppointment?: (id: string, updates: Partial<Appointment>) => Promise<void>;
    getAvailableSlots?: (date: string, hospitalId: string) => string[];
    onFetchData?: () => Promise<void>;
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

const normalizeForCompareStatic = (val: any): string => {
    return JSON.stringify(val, (_key, value) => {
        if (value === "" || value === null || value === undefined) return undefined;
        return value;
    });
};

export const PatientClinicalRecord = ({
    patient: initialPatient,
    appointments,
    hospitals = [],
    onUpdatePatient,
    onDeleteAppointment,
    onUpdateAppointment,
    getAvailableSlots,
    onFetchData
}: PatientClinicalRecordProps) => {

    const [patient, setPatient] = useState<Patient>(initialPatient);
    const [generalNotes, setGeneralNotes] = useState<string>(initialPatient.notes || '');
    const [selectedDetailApt, setSelectedDetailApt] = useState<Appointment | null>(null);
    const [clinicProfile, setClinicProfile] = useState<DoctorProfile | null>(null);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const { appId } = useAuth();

    const [history, setHistory] = useState<MedicalHistory>({
        ...DEFAULT_HISTORY,
        ...(initialPatient.medicalHistory || {}),
        address: {
            street: '', number: '', neighborhood: '', municipality: '', city: '', state: '', zipCode: '',
            ...(initialPatient.medicalHistory?.address || {})
        }
    });
    const [hasRestoredFromBackup, setHasRestoredFromBackup] = useState(false);

    const [initialHistoryStr, setInitialHistoryStr] = useState(() => normalizeForCompareStatic({
        ...DEFAULT_HISTORY,
        ...(initialPatient.medicalHistory || {}),
        address: {
            street: '', number: '', neighborhood: '', municipality: '', city: '', state: '', zipCode: '',
            ...(initialPatient.medicalHistory?.address || {})
        }
    }));
    const [initialNotesStr, setInitialNotesStr] = useState(() => normalizeForCompareStatic(initialPatient.notes || ''));
    const [initialCoreStr, setInitialCoreStr] = useState(() => normalizeForCompareStatic({ name: initialPatient.name, phone: initialPatient.phone, email: initialPatient.email }));

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
        if (!appId) return;
        supabase
            .from('clinic_settings')
            .select('app_id, doctor_name, cedula_profesional, especialidad, aviso_privacidad')
            .eq('app_id', appId)
            .maybeSingle()
            .then(({ data }) => {
                if (data) setClinicProfile({
                    appId: data.app_id,
                    doctorName: data.doctor_name,
                    cedulaProfesional: data.cedula_profesional,
                    especialidad: data.especialidad,
                    avisoPrivacidad: data.aviso_privacidad,
                });
            });
    }, [appId]);

    useEffect(() => {
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
    }, [initialPatient.id]);

    useEffect(() => {
        if (appId && patient.id) {
            logActivity({
                appId,
                patientId: patient.id,
                action: 'VIEW_RECORD',
                details: { patientName: patient.name }
            });
        }
    }, [appId, patient.id, patient.name]);

    useEffect(() => {
        const sessions = history.clinicalSessions || [];
        if (sessions.length === 0 && generalNotes?.trim()) {
            const migrated: ClinicalSession = {
                id: crypto.randomUUID(),
                date: getTodayStr(),
                content: generalNotes.trim(),
                finalized: false,
            };
            const migratedHistory = { ...history, clinicalSessions: [migrated] };
            setHistory(migratedHistory);

            const saveTimer = setTimeout(async () => {
                try {
                    await onUpdatePatient({
                        ...patient,
                        notes: generalNotes,
                        medicalHistory: migratedHistory,
                    });
                    console.log('[Migración] Notas viejas migradas y guardadas en Supabase.');
                } catch (e) {
                    console.error('[Migración] Error guardando notas migradas:', e);
                }
            }, 600);
            return () => clearTimeout(saveTimer);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
        }, 200);

        return () => clearTimeout(timer);
    }, [patient.name, patient.phone, patient.email, generalNotes, history, hasUnsavedChanges, patient.id]);

    useEffect(() => {
        if (!hasUnsavedChanges) return;

        const autoSaveTimer = setInterval(() => {
            console.log("Auto-saving clinical record...");
            handleSaveAll(true);
        }, 30000);

        return () => clearInterval(autoSaveTimer);
    }, [hasUnsavedChanges, history, generalNotes, patient.id]);

    useEffect(() => {
        const saved = localStorage.getItem(`backup_patient_${patient.id}`);
        if (saved && !hasRestoredFromBackup) {
            try {
                const backup = JSON.parse(saved);
                const backupTime = new Date(backup.timestamp).getTime();

                const backupNotesStr = normalizeForCompareStatic(backup.generalNotes || '');
                const backupHistoryStr = normalizeForCompareStatic(backup.history || {});
                const dbNotesStr = normalizeForCompareStatic(initialPatient.notes || '');
                const dbHistoryStr = normalizeForCompareStatic(initialPatient.medicalHistory || {});

                const isActuallyDifferent = backupNotesStr !== dbNotesStr || backupHistoryStr !== dbHistoryStr;

                if (!isActuallyDifferent) {
                    localStorage.removeItem(`backup_patient_${patient.id}`);
                    setHasRestoredFromBackup(true);
                    console.log("[Backup] Backup matches DB data, discarding stale backup.");
                    return;
                }

                if (Date.now() - backupTime < 24 * 60 * 60 * 1000) {
                    if (Date.now() - backupTime < 5 * 60 * 1000) {
                        setPatient(prev => ({ ...prev, ...backup.patient }));
                        setGeneralNotes(backup.generalNotes);
                        setHistory(backup.history);
                        setHasRestoredFromBackup(true);
                        console.log("[Backup] Silent auto-recovery applied — data was different from DB.");
                        return;
                    }

                    toast("Se encontró un respaldo no guardado", {
                        description: "¿Deseas recuperar los datos escritos anteriormente?",
                        action: {
                            label: "Recuperar",
                            onClick: () => {
                                setPatient(prev => ({ ...prev, ...backup.patient }));
                                setGeneralNotes(backup.generalNotes);
                                setHistory(backup.history);
                                setHasRestoredFromBackup(true);
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
                localStorage.removeItem(`backup_patient_${patient.id}`);
                setHasRestoredFromBackup(true);
            }
        }
        if (!saved) setHasRestoredFromBackup(true);
    }, [patient.id, hasRestoredFromBackup]);

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

    const handleHistoryChange = (field: keyof MedicalHistory, value: any) => {
        setHistory(prev => ({ ...prev, [field]: value }));
    };

    const handlePatientChange = (field: keyof Patient, value: any) => {
        setPatient(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveAll = async (isSilent: boolean = false) => {
        try {
            if (!isSilent) console.log("Manual save triggered for patient:", patient.id);
            
            const updated = { 
                ...patient, 
                notes: generalNotes,
                medicalHistory: history 
            };

            if (appId) {
                logActivity({
                    appId,
                    patientId: patient.id,
                    action: 'SAVE_RECORD',
                    details: { isSilent }
                });
            }

            localStorage.removeItem(`backup_patient_${patient.id}`);
            
            await onUpdatePatient(updated);

            if (onFetchData) await onFetchData();
            
            setPatient(updated);
            setInitialHistoryStr(normalizeForCompare(history));
            setInitialNotesStr(normalizeForCompare(generalNotes));
            setInitialCoreStr(normalizeForCompare({ 
                name: updated.name, 
                phone: updated.phone, 
                email: updated.email 
            }));
            
            if (!isSilent) {
                toast.success("Expediente médico guardado correctamente");
                console.log("Manual save successful");
            }
        } catch (error: any) {
            console.error("Error saving patient", error);
            if (!isSilent) {
                toast.error("Error al guardar el expediente", {
                    description: error.message || "Ocurrió un error inesperado al conectar con el servidor."
                });
            }
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

    const handlePrint = () => {
        printReport({ patient, history, clinicProfile });
    };

    return (
        <div className="min-h-screen bg-slate-50/50">
            {/* ── INTERFAZ DE PANTALLA (Oculta al imprimir) ── */}
            <div className="print-hidden flex flex-col gap-6 pb-24 px-4 lg:px-8 max-w-7xl mx-auto py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* --- COLUMN 1: LEFT (3/12) --- */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                    <PatientProfileCard 
                        patient={patient} 
                        history={history} 
                        onChangePatient={handlePatientChange} 
                    />

                    <PatientGeneralData 
                        history={history} 
                        onChange={handleHistoryChange} 
                    />

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
                    <PatientMedicalHistory 
                        history={history} 
                        onChange={handleHistoryChange} 
                    />
                </div>

                {/* --- COLUMN 3: RIGHT (3/12) --- */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <Button
                            onClick={handlePrint}
                            variant="outline"
                            className="w-full h-11 text-[#1c334a] border-[#1c334a] hover:bg-[#1c334a]/5 font-bold text-sm shadow-sm transition-all"
                        >
                            <Printer className="w-4 h-4 mr-2" />
                            Imprimir Expediente
                        </Button>
                        <Button
                            onClick={() => setShowPrivacyModal(true)}
                            variant="ghost"
                            className="w-full h-9 text-gray-500 hover:text-[#1c334a] text-[10px] font-bold uppercase tracking-wider"
                        >
                            <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                            Ver Aviso de Privacidad
                        </Button>
                    </div>

                    <Button 
                        onClick={() => handleSaveAll()} 
                        className="w-full h-14 text-white bg-[#1c334a] hover:bg-[#2a4560] font-bold text-base shadow-lg group transition-all"
                    >
                        <Save className="w-6 h-6 mr-2 group-hover:scale-110 transition-transform" /> 
                        Guardar Expediente
                    </Button>

                    <PatientAppointments 
                        appointments={appointments}
                        patient={patient}
                        hospitals={hospitals}
                        selectedDetailApt={selectedDetailApt}
                        setSelectedDetailApt={setSelectedDetailApt}
                        onDeleteAppointment={handleDeleteAppointment}
                        onUpdateAppointment={handleUpdateAppointment}
                        getAvailableSlots={getAvailableSlots || (() => [])}
                    />
                </div>
            </div>

            {/* ══ FULL-WIDTH: Odontograma (solo clínica dental) ══ */}
            <PatientOdontogram 
                history={history} 
                hospitals={hospitals} 
                onChange={handleHistoryChange} 
            />

            {/* Notas de Evolución — sistema de sesiones (Opción A, NOM-024) */}
            <PatientClinicalNotes 
                history={history}
                patient={patient}
                generalNotes={generalNotes}
                appId={appId}
                onChange={handleHistoryChange}
                onUpdatePatient={onUpdatePatient}
            />

            {/* Unsaved Changes Banner */}
            <div className={`print-hidden fixed bottom-0 left-0 right-0 bg-white border-t border-orange-200 px-6 py-4 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.1)] z-50 flex justify-between items-center transition-transform duration-300 ${hasUnsavedChanges ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-orange-500 shrink-0" />
                    <div>
                        <p className="text-sm font-bold text-gray-800">Tienes cambios sin guardar</p>
                        <p className="text-xs text-gray-500 hidden sm:block">Asegúrate de presionar guardar para no perder el progreso de este expediente.</p>
                    </div>
                </div>
                <Button onClick={() => handleSaveAll()} className="bg-[#1c334a] hover:bg-[#2a4560] text-white font-bold h-10 px-6 shadow-md shrink-0">
                    <Save className="w-4 h-4 mr-2 hidden sm:block" /> Guardar
                </Button>
            </div>

            {/* ═ MODAL: Aviso de Privacidad (Oculto al imprimir) ═ */}
            <div className="print-hidden">
                <Dialog open={showPrivacyModal} onOpenChange={setShowPrivacyModal}>
                    <DialogContent className="max-w-2xl bg-white rounded-2xl p-0 overflow-hidden">
                        <DialogHeader className="bg-[#1c334a] text-white p-6">
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <ShieldCheck className="w-6 h-6" />
                                Aviso de Privacidad
                            </DialogTitle>
                            <DialogDescription className="text-blue-100/70 text-xs">
                                Ley Federal de Protección de Datos Personales en Posesión de los Particulares
                            </DialogDescription>
                        </DialogHeader>
                        <div className="p-8 max-h-[60vh] overflow-y-auto">
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {clinicProfile?.avisoPrivacidad || 'No se ha configurado un aviso de privacidad. Ve a Configuración para añadir uno.'}
                            </p>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            </div>

            {/* ═══════════════════════════════════════════════════════
                 REPORTE CLÍNICO PARA IMPRESIÓN (Invisible en pantalla)
                 ═══════════════════════════════════════════════════════ */}
            <PatientPrintableRecord 
                patient={patient}
                history={history}
                clinicProfile={clinicProfile}
            />
        </div>
    );
};
