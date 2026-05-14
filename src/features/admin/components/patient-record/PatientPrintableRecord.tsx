import { format, parseISO } from 'date-fns';
import type { Patient, MedicalHistory, DoctorProfile } from '../../../appointments/types';
import { getNow } from '@/lib/dateUtils';

interface PatientPrintableRecordProps {
    patient: Patient;
    history: MedicalHistory;
    clinicProfile: DoctorProfile | null;
}

export const PatientPrintableRecord = ({ patient, history, clinicProfile }: PatientPrintableRecordProps) => {

    const calculateAge = (dobString?: string) => {
        if (!dobString) return '';
        const dob = new Date(dobString);
        const today = getNow();
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
            age--;
        }
        return age;
    };

    return (
        <div className="print-only p-4 bg-white text-gray-900 font-sans leading-tight" style={{ fontSize: '10pt' }}>
            {/* Header Médico Compacto */}
            <div className="flex justify-between items-center border-b-[1px] border-gray-400 pb-2 mb-4">
                <div>
                    <h1 className="text-lg font-black text-[#1c334a] uppercase tracking-tighter">
                        {clinicProfile?.doctorName || 'DR. RESPONSABLE'}
                    </h1>
                    <p className="text-[8pt] font-bold text-gray-500 uppercase tracking-widest">
                        {clinicProfile?.especialidad || 'Expediente Clínico'} {clinicProfile?.cedulaProfesional && `· Cédula: ${clinicProfile?.cedulaProfesional}`}
                    </p>
                </div>
                <div className="text-right text-[8pt] text-gray-400">
                    <p className="font-bold text-gray-600 uppercase">MedicAdmin</p>
                </div>
            </div>

            {/* Subcabecera de Identificación */}
            <div className="flex justify-between items-end mb-4 px-2">
                <h2 className="text-[9pt] font-black text-[#1c334a] uppercase tracking-widest border-b-2 border-[#1c334a]">
                    HISTORIA CLÍNICA CONSOLIDADA
                </h2>
                <p className="text-[8pt] font-medium text-gray-400">
                    Fecha de emisión: {format(getNow(), "dd/MM/yyyy")}
                </p>
            </div>

            {/* Ficha de Identificación del Paciente (3 Columnas) */}
            <div className="grid grid-cols-3 gap-x-4 gap-y-2 mb-6 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="col-span-1">
                    <label className="text-[7pt] font-black text-gray-400 uppercase">Nombre Completo</label>
                    <p className="text-[10pt] font-bold text-gray-800">{patient.name}</p>
                </div>
                <div className="col-span-1">
                    <label className="text-[7pt] font-black text-gray-400 uppercase">Fecha de Nacimiento</label>
                    <p className="text-[9pt] font-semibold text-gray-700">{history.dateOfBirth ? format(parseISO(history.dateOfBirth), 'dd/MM/yyyy') : 'n/a'} ({calculateAge(history.dateOfBirth) || 'n/a'} años)</p>
                </div>
                <div className="col-span-1">
                    <label className="text-[7pt] font-black text-gray-400 uppercase">CURP / Sexo</label>
                    <p className="text-[9pt] font-semibold text-gray-700">{history.curp || 'n/a'} · {history.sex || 'n/a'}</p>
                </div>
                {history.bloodType && (
                    <div className="col-span-1">
                        <label className="text-[7pt] font-black text-gray-400 uppercase">Grupo Sanguíneo</label>
                        <p className="text-[9pt] font-semibold text-gray-700">{history.bloodType}</p>
                    </div>
                )}
            </div>

            {/* Alergias (Solo si existen, muy compacto) */}
            {history.allergies && (
                <div className="mb-4 flex items-start gap-2 bg-red-50 p-2 rounded border border-red-100">
                    <span className="text-[7pt] font-black text-red-600 bg-red-100 px-1.5 py-0.5 rounded uppercase self-center tracking-tighter">Alergias</span>
                    <p className="text-[9pt] font-bold text-red-900">{history.allergies}</p>
                </div>
            )}

            {/* Antecedentes Clínicos Densos */}
            <div className="mb-6">
                <h3 className="text-[8pt] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 mb-2">Resumen de Antecedentes</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    <div className="text-[9pt]">
                        <span className="font-bold text-gray-600 uppercase text-[7pt] mr-2">Patológicos:</span>
                        <span className="text-gray-700">{history.pathologicalHistory || 'Negados'}</span>
                    </div>
                    <div className="text-[9pt]">
                        <span className="font-bold text-gray-600 uppercase text-[7pt] mr-2">No Patológicos:</span>
                        <span className="text-gray-700">{history.nonPathologicalHistory || 'Negados'}</span>
                    </div>
                    <div className="text-[9pt]">
                        <span className="font-bold text-gray-600 uppercase text-[7pt] mr-2">Heredofamiliares:</span>
                        <span className="text-gray-700">{history.familyHistory || 'Negados'}</span>
                    </div>
                    <div className="text-[9pt]">
                        <span className="font-bold text-gray-600 uppercase text-[7pt] mr-2">Quirúrgicos:</span>
                        <span className="text-gray-700">{history.surgeries || 'Negados'}</span>
                    </div>
                </div>
            </div>

            {/* Notas de Evolución Cronológicas */}
            <div className="mb-8">
                <h3 className="text-[8pt] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 mb-4">Crónica de Evolución (Notas Médicas)</h3>
                
                <div className="space-y-4">
                    {(history.clinicalSessions || [])
                        .filter(s => s.content?.trim() || s.finalized) // Incluir cualquier nota con contenido aunque no esté "finalizada"
                        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((s, idx) => (
                        <div key={idx} className="relative pl-4 border-l-[1px] border-gray-300 pb-2">
                            <span className="absolute -left-1 top-0 w-2 h-2 rounded-full bg-gray-400" />
                            <div className="flex justify-between items-baseline mb-1">
                                <p className="text-[8pt] font-black text-gray-800 uppercase">
                                    Fecha: {format(parseISO(s.date), "dd/MM/yyyy")}
                                </p>
                                {!s.finalized && <span className="text-[7pt] text-orange-500 font-black uppercase italic tracking-tighter">Borrador</span>}
                            </div>
                            <div className="text-[10pt] text-gray-700 leading-snug whitespace-pre-wrap font-serif italic antialiased">
                                {s.content || <span className="text-gray-400 italic">(Sin contenido guardado aún)</span>}
                            </div>
                        </div>
                    ))}
                    {(!history.clinicalSessions || history.clinicalSessions.filter(s => s.content?.trim()).length === 0) && (
                        <p className="text-sm italic text-gray-300">No se encontraron notas médicas guardadas en el historial.</p>
                    )}
                </div>
            </div>

            {/* Firma y Cierre Compacto */}
            <div className="mt-12 flex justify-between items-end border-t border-gray-100 pt-4">
                <div className="text-[7pt] text-gray-300 italic">
                    Generado por MedicAdmin · NOM-024-SSA3-2012
                </div>
                <div className="text-center min-w-[200px]">
                    <div className="w-full border-b border-gray-400 mb-1" />
                    <p className="text-[9pt] font-black text-gray-700 uppercase">{clinicProfile?.doctorName || 'Firma del Médico'}</p>
                    <p className="text-[7pt] text-gray-400 font-bold uppercase tracking-widest">Responsable Clínico</p>
                </div>
            </div>
        </div>
    );
};
