import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { FileText, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from 'sonner';
import type { MedicalHistory, ClinicalSession, Patient } from '../../../appointments/types';
import { getTodayStr, getNow } from '@/lib/dateUtils';
import { logActivity } from '@/lib/audit';

interface PatientClinicalNotesProps {
    history: MedicalHistory;
    patient: Patient;
    generalNotes: string;
    appId: string | null | undefined;
    onChange: (field: keyof MedicalHistory, value: any) => void;
    onUpdatePatient: (patient: Patient) => Promise<void>;
}

export const PatientClinicalNotes = ({
    history,
    patient,
    generalNotes,
    appId,
    onChange,
    onUpdatePatient
}: PatientClinicalNotesProps) => {

    const sessions: ClinicalSession[] = history.clinicalSessions || [];

    const activeSession = sessions.find(s => !s.finalized);
    const pastSessions = sessions.filter(s => s.finalized).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const updateActiveContent = (content: string) => {
        const updated = activeSession
            ? sessions.map(s => s.finalized ? s : { ...s, content })
            : [
                ...sessions,
                {
                    id: crypto.randomUUID(),
                    date: getTodayStr(),
                    content,
                    finalized: false,
                }
            ];
        onChange('clinicalSessions', updated);
    };

    const finalizeSession = async () => {
        if (!activeSession?.content?.trim()) return;
        const updated = sessions.map(s =>
            s.finalized ? s : { ...s, finalized: true, finalizedAt: getNow().toISOString() }
        );
        onChange('clinicalSessions', updated);
        if (appId) logActivity({ appId, patientId: patient.id, action: 'FINALIZE_NOTE' });

        // Guardar inmediatamente en Supabase sin necesidad de presionar "Guardar"
        try {
            await onUpdatePatient({
                ...patient,
                notes: generalNotes,
                medicalHistory: { ...history, clinicalSessions: updated },
            });
            toast.success('Nota finalizada y guardada correctamente.');
        } catch {
            toast.error('Nota finalizada pero hubo un error al guardar. Usa el botón Guardar.');
        }
    };

    return (
        <Card id="notas-evolucion" className="shadow-md border-t-4 border-t-[#1c334a] scroll-mt-24">
            <CardHeader className="pb-4 border-b bg-[#1c334a] flex flex-row items-center justify-between">
                <CardTitle className="text-base font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Notas de Evolución
                    <span className="text-[10px] font-normal bg-white/10 px-2 py-0.5 rounded-full normal-case tracking-normal">
                        {sessions.filter(s => s.finalized).length} entrada{sessions.filter(s => s.finalized).length !== 1 ? 's' : ''} finalizada{sessions.filter(s => s.finalized).length !== 1 ? 's' : ''}
                    </span>
                </CardTitle>
                {activeSession?.content?.trim() && (
                    <button
                        onClick={finalizeSession}
                        className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all shadow-sm"
                        title="Finalizar esta nota — quedará en modo solo lectura (NOM-024)"
                    >
                        <Save className="w-3.5 h-3.5" />
                        Finalizar Nota
                    </button>
                )}
            </CardHeader>
            <CardContent className="p-0 overflow-hidden rounded-b-lg">

                {/* Sesión activa (editable) */}
                <div className="relative">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-5 pt-3 pb-1 bg-gray-50 border-b flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                        Nota activa · {activeSession?.date ? format(parseISO(activeSession.date), 'dd \' de \'MMMM yyyy', { locale: es }) : format(new Date(), 'dd \' de \'MMMM yyyy', { locale: es })}
                        <span className="ml-auto text-gray-300">Editable hasta finalizar</span>
                    </div>
                    <div className="absolute top-[2.5rem] bottom-0 left-[3.5rem] w-px bg-red-300/70 pointer-events-none z-10" />
                    <textarea
                        className="w-full resize-y text-sm text-gray-800 focus:outline-none"
                        placeholder="Escriba aquí la nota de evolución de esta consulta..."
                        value={activeSession?.content || ''}
                        onChange={(e) => updateActiveContent(e.target.value)}
                        rows={20}
                        style={{
                            backgroundImage: 'linear-gradient(transparent calc(100% - 1px), #bfdbfe 1px)',
                            backgroundSize: '100% 2rem',
                            backgroundColor: '#fefefe',
                            lineHeight: '2rem',
                            paddingLeft: '4.5rem',
                            paddingRight: '2rem',
                            paddingTop: '0.75rem',
                            paddingBottom: '2rem',
                            minHeight: '400px',
                            border: 'none',
                            fontFamily: '"Georgia", serif',
                            fontSize: '0.9rem',
                            color: '#1e293b',
                            boxShadow: 'inset 2px 0 8px rgba(0,0,0,0.03)',
                        }}
                    />
                </div>

                {/* Notas pasadas (solo lectura) */}
                {pastSessions.length > 0 && (
                    <div className="border-t-2 border-dashed border-gray-200">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-5 py-2 bg-gray-50">
                            Notas anteriores (solo lectura)
                        </div>
                        {pastSessions.map((s) => (
                            <div key={s.id} className="border-t border-gray-100">
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-5 py-1.5 bg-gray-50/80 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block" />
                                    {format(parseISO(s.date), "dd 'de' MMMM yyyy", { locale: es })}
                                    {s.finalizedAt && (
                                        <span className="ml-auto text-gray-300">
                                            Finalizado: {format(parseISO(s.finalizedAt), "dd/MM/yy HH:mm")}
                                        </span>
                                    )}
                                </div>
                                <div
                                    className="px-14 py-4 text-sm text-gray-600 whitespace-pre-wrap bg-gray-50/30"
                                    style={{ fontFamily: '"Georgia", serif', fontSize: '0.88rem', lineHeight: '1.8' }}
                                >
                                    {s.content || <span className="italic text-gray-300">Sin contenido</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </CardContent>
        </Card>
    );
};
