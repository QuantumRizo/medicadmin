import { useState } from 'react';
import { Activity, Clock, Baby, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import type { MedicalHistory } from '../../../appointments/types';
import { usePatientAge } from '../../../appointments/hooks/usePatientAge';

interface PatientMedicalHistoryProps {
    history: MedicalHistory;
    onChange: (field: keyof MedicalHistory, value: any) => void;
}

export const PatientMedicalHistory = ({ history, onChange }: PatientMedicalHistoryProps) => {
    const { isMinor } = usePatientAge(history.dateOfBirth);
    const [showPerinatal, setShowPerinatal] = useState(false);

    return (
        <div className="flex flex-col gap-6">

            {/* Historia Perinatal — solo si es menor */}
            {isMinor && (
                <Card className="shadow-sm border-sky-100">
                    <CardHeader className="pb-3 border-b bg-sky-50/40 cursor-pointer" onClick={() => setShowPerinatal(v => !v)}>
                        <CardTitle className="text-sm font-bold text-sky-700 uppercase tracking-wider flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Baby className="w-4 h-4 text-sky-500" />
                                Antecedentes Perinatales / Neonatales
                            </div>
                            {showPerinatal ? <ChevronUp className="w-4 h-4 text-sky-400" /> : <ChevronDown className="w-4 h-4 text-sky-400" />}
                        </CardTitle>
                    </CardHeader>
                    {showPerinatal && (
                        <CardContent className="pt-5 space-y-4 animate-in fade-in">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-gray-500 uppercase">Peso al Nacer (g)</Label>
                                    <Input
                                        placeholder="Ej. 3200"
                                        className="h-9 text-sm bg-gray-50/50"
                                        value={history.birthWeight || ''}
                                        onChange={e => onChange('birthWeight', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-gray-500 uppercase">Semanas de Gestación</Label>
                                    <Input
                                        placeholder="Ej. 38"
                                        className="h-9 text-sm bg-gray-50/50"
                                        value={history.gestationalAge || ''}
                                        onChange={e => onChange('gestationalAge', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-gray-500 uppercase">Tipo de Parto</Label>
                                    <select
                                        className="flex h-9 w-full rounded-md border border-input bg-gray-50/50 px-3 py-1 text-sm text-gray-700"
                                        value={history.deliveryType || ''}
                                        onChange={e => onChange('deliveryType', e.target.value)}
                                    >
                                        <option value="">N/A</option>
                                        <option value="Parto natural">Parto natural</option>
                                        <option value="Cesárea">Cesárea</option>
                                        <option value="Fórceps">Fórceps</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-gray-500 uppercase">Apgar (1' / 5')</Label>
                                    <Input
                                        placeholder="Ej. 8/9"
                                        className="h-9 text-sm bg-gray-50/50"
                                        value={history.apgarScore || ''}
                                        onChange={e => onChange('apgarScore', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-gray-500 uppercase">Complicaciones Neonatales</Label>
                                <Textarea
                                    className="min-h-[60px] resize-y text-sm bg-gray-50/30 font-medium"
                                    placeholder="UCIN, ictericia, sepsis neonatal..."
                                    value={history.neonatalComplications || ''}
                                    onChange={e => onChange('neonatalComplications', e.target.value)}
                                />
                            </div>
                        </CardContent>
                    )}
                </Card>
            )}

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
                                <Textarea className="min-h-[60px] resize-y text-sm bg-gray-50/30 font-medium" placeholder="Enfermedades previas, crónicas..." value={history.pathologicalHistory || ''} onChange={(e) => onChange('pathologicalHistory', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Antecedentes Heredofamiliares</Label>
                                <Textarea className="min-h-[60px] resize-y text-sm bg-gray-50/30 font-medium" placeholder="Diabetes, cáncer familiar..." value={history.familyHistory || ''} onChange={(e) => onChange('familyHistory', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Antecedentes No Patológicos</Label>
                                <Textarea className="min-h-[60px] resize-y text-sm bg-gray-50/30 font-medium" placeholder="Hábitos, alimentación..." value={history.nonPathologicalHistory || ''} onChange={(e) => onChange('nonPathologicalHistory', e.target.value)} />
                            </div>
                            {/* Label contextual: gineco-obstétricos para adulta, perinatales de la madre para menor */}
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                                    {isMinor ? 'Antecedentes Perinatales de la Madre' : 'Antecedentes Gineco-obstétricos'}
                                </Label>
                                <Textarea
                                    className="min-h-[60px] resize-y text-sm bg-gray-50/30 font-medium"
                                    placeholder={isMinor ? 'Embarazo, enfermedades maternas, medicamentos en gestación...' : 'Menstruación, Partos, etc...'}
                                    value={history.gynecoObstetricHistory || ''}
                                    onChange={(e) => onChange('gynecoObstetricHistory', e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-red-500 uppercase mb-1 block">Alergias</Label>
                                    <Textarea className="min-h-[60px] resize-y text-sm bg-red-50 border-red-200 font-medium text-red-900 placeholder:text-red-300" placeholder="Alergias conocidas..." value={history.allergies || ''} onChange={(e) => onChange('allergies', e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Cirugías Previas</Label>
                                    <Textarea className="min-h-[60px] resize-y text-sm bg-gray-50/30 font-medium" placeholder="Cirugías mayores o menores..." value={history.surgeries || ''} onChange={(e) => onChange('surgeries', e.target.value)} />
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
                                <Textarea className="min-h-[80px] resize-y text-sm bg-white font-medium" placeholder="Describa el motivo de la consulta..." value={history.currentCondition || ''} onChange={(e) => onChange('currentCondition', e.target.value)} />
                            </div>
                            <div className="space-y-1 shadow-sm border border-gray-100 rounded-md p-3 bg-gray-50/50">
                                <Label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Exploración Física</Label>
                                <Textarea className="min-h-[80px] resize-y text-sm bg-white font-medium" placeholder="Hallazgos en la exploración..." value={history.physicalExploration || ''} onChange={(e) => onChange('physicalExploration', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Laboratorios y Estudios</Label>
                                <Textarea className="min-h-[60px] resize-y text-sm bg-gray-50/30 font-medium" placeholder="Observaciones de gabinete..." value={history.labStudies || ''} onChange={(e) => onChange('labStudies', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-blue-600 uppercase mb-1 block">Diagnóstico</Label>
                                <Textarea className="min-h-[80px] resize-y text-sm bg-blue-50/50 border-blue-200 font-medium" placeholder="Diagnóstico definitivo o diferencial..." value={history.diagnosis || ''} onChange={(e) => onChange('diagnosis', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-green-600 uppercase mb-1 block">Tratamiento Planificado</Label>
                                <Textarea className="min-h-[80px] resize-y text-sm bg-green-50/40 border-green-200 font-medium" placeholder="Receta médica, recomendaciones..." value={history.treatment || ''} onChange={(e) => onChange('treatment', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Pronóstico</Label>
                                <Input className="h-10 text-sm bg-gray-50/30 font-medium" placeholder="Favorable, reservado..." value={history.prognosis || ''} onChange={(e) => onChange('prognosis', e.target.value)} />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

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
                        className="min-h-[100px] resize-y text-sm bg-white font-medium shadow-inner"
                        placeholder="Escriba los medicamentos que el paciente toma regularmente..."
                        value={history.medications || ''}
                        onChange={(e) => onChange('medications', e.target.value)}
                    />
                </CardContent>
            </Card>
        </div>
    );
};
