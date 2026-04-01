import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useAppointments } from '@/features/appointments/hooks/useAppointments';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Printer, Plus, Trash2, Search, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import type { ClinicProfile } from '@/features/appointments/types';

interface Medication {
    id: string;
    drug: string;       // Medicamento
    dose: string;       // Dosis
    frequency: string;  // Frecuencia
    duration: string;   // Duración
}

const emptyMed = (): Medication => ({
    id: crypto.randomUUID(),
    drug: '', dose: '', frequency: '', duration: ''
});



export const RecetarioPage = () => {
    const { appId } = useAuth();
    const { hospitals } = useAppointments();

    const [selectedHospitalId, setSelectedHospitalId] = useState<string>('');
    useEffect(() => {
        if (hospitals.length > 0 && !selectedHospitalId) {
            setSelectedHospitalId(hospitals[0].id);
        }
    }, [hospitals, selectedHospitalId]);

    const [profile, setProfile] = useState<Partial<ClinicProfile>>({});
    const [patientName, setPatientName] = useState('');
    const [patientAge, setPatientAge] = useState('');
    const [patientSex, setPatientSex] = useState('');
    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
    
    const [diagnosis, setDiagnosis] = useState('');
    const [medications, setMedications] = useState<Medication[]>([emptyMed()]);
    const [instructions, setInstructions] = useState('');
    const printRef = useRef<HTMLDivElement>(null);

    // Cargar perfil de la clínica
    useEffect(() => {
        if (!appId) return;
        supabase
            .from('clinic_settings')
            .select('*')
            .eq('app_id', appId)
            .maybeSingle()
            .then(({ data }) => {
                if (data) setProfile({
                    clinicName: data.clinic_name,
                    doctorName: data.doctor_name,
                    cedulaProfesional: data.cedula_profesional,
                    especialidad: data.especialidad,
                    telefonoClinica: data.telefono_clinica,
                    direccionClinica: data.direccion_clinica,
                });
            });
    }, [appId]);

    const addMed = () => setMedications(m => [...m, emptyMed()]);
    const removeMed = (id: string) => setMedications(m => m.filter(x => x.id !== id));
    const updateMed = (id: string, field: keyof Medication, value: string) =>
        setMedications(m => m.map(x => x.id === id ? { ...x, [field]: value } : x));

    const handlePrint = () => {
        window.print();
    };

    const selectedHospital = hospitals.find(h => h.id === selectedHospitalId);

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">

            {/* Header */}
            <div className="flex items-center justify-between print:hidden">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Recetario Médico</h2>
                    <p className="text-sm text-gray-500 mt-1">Genera e imprime recetas con los datos de tu clínica</p>
                </div>
                <Button
                    onClick={handlePrint}
                    className="bg-[#1c334a] hover:bg-[#152537] text-white rounded-xl h-11 px-6 font-semibold shadow-sm"
                >
                    <Printer className="w-4 h-4 mr-2" />
                    Imprimir / PDF
                </Button>
            </div>

            {/* Form — only visible on screen */}
            <div className="print:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Paciente y Detalles */}
                <Card className="col-span-2 shadow-sm">
                    <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5 flex items-center gap-1">
                                <Search className="w-3 h-3" /> Paciente
                            </label>
                            <Input
                                className="bg-white rounded-lg"
                                placeholder="Nombre completo del paciente"
                                value={patientName}
                                onChange={e => setPatientName(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5 flex items-center gap-1">
                                <Building2 className="w-3 h-3" /> Clínica / Sucursal
                            </label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1c334a]"
                                value={selectedHospitalId}
                                onChange={(e) => setSelectedHospitalId(e.target.value)}
                            >
                                {hospitals.length === 0 && <option value="" disabled>Cargando hospitales...</option>}
                                {hospitals.map(h => (
                                    <option key={h.id} value={h.id}>{h.name}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">
                                Fecha
                            </label>
                            <Input
                                type="date"
                                className="bg-white rounded-lg cursor-pointer"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">
                                Edad
                            </label>
                            <Input
                                className="bg-white rounded-lg"
                                placeholder="Ej. 34 años"
                                value={patientAge}
                                onChange={e => setPatientAge(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">
                                Sexo
                            </label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1c334a]"
                                value={patientSex}
                                onChange={e => setPatientSex(e.target.value)}
                            >
                                <option value="">Seleccionar...</option>
                                <option value="Femenino">Femenino</option>
                                <option value="Masculino">Masculino</option>
                            </select>
                        </div>

                    </CardContent>
                </Card>

                {/* Diagnóstico */}
                <Card className="col-span-2 shadow-sm">
                    <CardContent className="pt-4">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Diagnóstico / Motivo</label>
                        <Input
                            value={diagnosis}
                            onChange={e => setDiagnosis(e.target.value)}
                            placeholder="Ej. Infección de vías respiratorias altas"
                            className="rounded-lg"
                        />
                    </CardContent>
                </Card>

                {/* Medicamentos */}
                <Card className="col-span-2 shadow-sm">
                    <CardContent className="pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Medicamentos</label>
                            <Button size="sm" variant="outline" onClick={addMed} className="h-8 rounded-lg text-xs">
                                <Plus className="w-3 h-3 mr-1" /> Agregar
                            </Button>
                        </div>
                        {medications.map((med, idx) => (
                            <div key={med.id} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-lg p-3">
                                <span className="col-span-1 text-xs font-bold text-gray-400 text-center">{idx + 1}</span>
                                <Input
                                    className="col-span-4 h-8 text-sm rounded-lg bg-white"
                                    placeholder="Medicamento"
                                    value={med.drug}
                                    onChange={e => updateMed(med.id, 'drug', e.target.value)}
                                />
                                <Input
                                    className="col-span-2 h-8 text-sm rounded-lg bg-white"
                                    placeholder="Dosis"
                                    value={med.dose}
                                    onChange={e => updateMed(med.id, 'dose', e.target.value)}
                                />
                                <Input
                                    className="col-span-2 h-8 text-sm rounded-lg bg-white"
                                    placeholder="Frecuencia"
                                    value={med.frequency}
                                    onChange={e => updateMed(med.id, 'frequency', e.target.value)}
                                />
                                <Input
                                    className="col-span-2 h-8 text-sm rounded-lg bg-white"
                                    placeholder="Duración"
                                    value={med.duration}
                                    onChange={e => updateMed(med.id, 'duration', e.target.value)}
                                />
                                <button
                                    onClick={() => removeMed(med.id)}
                                    className="col-span-1 flex items-center justify-center text-red-400 hover:text-red-600 transition-colors"
                                    disabled={medications.length === 1}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Instrucciones */}
                <Card className="col-span-2 shadow-sm">
                    <CardContent className="pt-4">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Instrucciones adicionales</label>
                        <textarea
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1c334a] resize-none bg-gray-50"
                            rows={3}
                            placeholder="Ej. Reposo absoluto por 3 días. Dieta blanda. Control en 7 días."
                            value={instructions}
                            onChange={e => setInstructions(e.target.value)}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* ══════════════ RECETA IMPRIMIBLE ══════════════ */}
            <div ref={printRef} className="prescription-sheet bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden print:shadow-none print:border-0 print:rounded-none">

                {/* Encabezado */}
                <div className="flex items-start justify-between gap-6 p-8 pb-6 border-b-2 border-[#1c334a]">
                    <div className="flex items-center gap-4 flex-1">
                        <div>
                            <h1 className="text-2xl font-black text-[#1c334a] leading-tight">
                                {selectedHospital?.name || profile.clinicName || 'Nombre de la Clínica'}
                            </h1>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {profile.especialidad || 'Especialidad'}
                            </p>
                            {(selectedHospital?.address || profile.direccionClinica) && (
                                <p className="text-xs text-gray-400 mt-0.5 max-w-[280px]">{selectedHospital?.address || profile.direccionClinica}</p>
                            )}
                        </div>
                    </div>

                    {/* Doctor */}
                    <div className="text-right shrink-0">
                        <p className="text-base font-bold text-gray-800">{profile.doctorName || 'Dr. Nombre Apellido'}</p>
                        <p className="text-xs text-gray-500">{profile.especialidad || ''}</p>
                        {profile.cedulaProfesional && (
                            <p className="text-xs text-gray-400 mt-0.5">Cédula Prof. {profile.cedulaProfesional}</p>
                        )}
                        {profile.telefonoClinica && (
                            <p className="text-xs text-gray-400">Tel. {profile.telefonoClinica}</p>
                        )}
                    </div>
                </div>

                {/* Meta Receta */}
                <div className="flex justify-between items-start px-8 pt-5 pb-3">
                    <div className="flex-1">
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Paciente</p>
                        <p className="text-lg font-bold text-gray-900 mt-0.5">
                            {patientName || <span className="text-gray-300 italic font-normal text-base">Nombre del paciente</span>}
                        </p>
                        <div className="flex gap-4 mt-1">
                            {patientAge && <p className="text-sm text-gray-500"><span className="font-medium text-gray-400">Edad:</span> {patientAge}</p>}
                            {patientSex && <p className="text-sm text-gray-500"><span className="font-medium text-gray-400">Sexo:</span> {patientSex}</p>}
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Fecha</p>
                        <p className="text-sm font-semibold text-gray-700 mt-0.5">
                            {date ? format(new Date(date + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: es }) : ''}
                        </p>
                    </div>
                </div>

                {/* Diagnóstico */}
                {diagnosis && (
                    <div className="px-8 pb-3">
                        <div className="bg-[#1c334a]/5 border border-[#1c334a]/10 rounded-lg px-4 py-2.5">
                            <span className="text-xs font-bold text-[#1c334a] uppercase tracking-wider">Diagnóstico: </span>
                            <span className="text-sm text-gray-700">{diagnosis}</span>
                        </div>
                    </div>
                )}

                {/* Medicamentos */}
                <div className="px-8 py-4">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="text-2xl font-black text-[#1c334a]">℞</div>
                        <div className="flex-1 h-px bg-[#1c334a]/20" />
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left border-b border-gray-200">
                                <th className="pb-2 text-xs font-bold text-gray-400 uppercase tracking-wider w-7">#</th>
                                <th className="pb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Medicamento</th>
                                <th className="pb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Dosis</th>
                                <th className="pb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Frecuencia</th>
                                <th className="pb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Duración</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {medications.filter(m => m.drug).map((med, idx) => (
                                <tr key={med.id} className="py-2">
                                    <td className="py-2.5 text-gray-400 font-bold text-xs">{idx + 1}</td>
                                    <td className="py-2.5 font-semibold text-gray-900">{med.drug}</td>
                                    <td className="py-2.5 text-gray-600">{med.dose}</td>
                                    <td className="py-2.5 text-gray-600">{med.frequency}</td>
                                    <td className="py-2.5 text-gray-600">{med.duration}</td>
                                </tr>
                            ))}
                            {!medications.some(m => m.drug) && (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-gray-300 italic">Sin medicamentos agregados</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Instrucciones adicionales */}
                {instructions && (
                    <div className="px-8 pb-4">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Indicaciones adicionales</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{instructions}</p>
                    </div>
                )}

                {/* Firma */}
                <div className="flex justify-end px-8 pb-8 pt-6 border-t border-dashed border-gray-200 mt-4">
                    <div className="text-center min-w-[200px]">
                        <div className="h-16 border-b border-gray-400 mb-2" />
                        <p className="text-sm font-bold text-gray-700">{profile.doctorName || 'Dr. Nombre Apellido'}</p>
                        {profile.cedulaProfesional && (
                            <p className="text-xs text-gray-400">Cédula Prof. {profile.cedulaProfesional}</p>
                        )}
                    </div>
                </div>

            </div>

        </div>
    );
};
