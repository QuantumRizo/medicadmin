import { useRef, useCallback } from 'react';
import { Activity, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Odontograma } from '../Odontograma';
import type { MedicalHistory, Hospital } from '../../../appointments/types';

interface PatientOdontogramProps {
    history: MedicalHistory;
    hospitals: Hospital[];
    onChange: (field: keyof MedicalHistory, value: any) => void;
}

export const PatientOdontogram = ({ history, hospitals, onChange }: PatientOdontogramProps) => {
    
    // Solo mostramos si alguna de las sucursales es dental
    if (!hospitals.some(h => h.isDentalClinic)) return null;

    const odontogramData = (history.odontogramData as any) || {};
    const notes = (history.odontogramNotes as Record<number, string>) || {};

    const findingRows: { tooth: number; findings: string[] }[] = Object.entries(odontogramData)
        .filter(([, data]: any) => {
            const hasColoredFace = Object.values(data.faces || {}).some((f: any) => f !== 'sano');
            const hasStatus = data.status && data.status !== 'presente';
            return hasColoredFace || hasStatus;
        })
        .map(([tooth, data]: any) => {
            const findings: string[] = [];
            if (Object.values(data.faces || {}).some((f: any) => f === 'caries')) findings.push('Caries');
            if (Object.values(data.faces || {}).some((f: any) => f === 'resina')) findings.push('Resina / Amalgama');
            if (data.status === 'ausente') findings.push('Ausente');
            if (data.status === 'endodoncia') findings.push('Endodoncia');
            if (data.status === 'implante') findings.push('Implante');
            return { tooth: Number(tooth), findings };
        })
        .sort((a, b) => a.tooth - b.tooth);

    const rowRefs = useRef<Record<number, HTMLTableRowElement | null>>({});

    const handleToothClick = useCallback((n: number) => {
        const el = rowRefs.current[n];
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('bg-yellow-50', 'ring-1', 'ring-yellow-300');
            setTimeout(() => el.classList.remove('bg-yellow-50', 'ring-1', 'ring-yellow-300'), 1800);
        }
    }, []);

    return (
        <>
            <Card className="shadow-sm border-t-4 border-t-[#1c334a]">
                <CardHeader className="bg-gray-50/50 pb-3 border-b">
                    <CardTitle className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[#1c334a]" />
                        Odontograma Clínico
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-3 pb-4">
                    <Odontograma
                        value={odontogramData}
                        onChange={(data) => onChange('odontogramData', data)}
                        onToothClick={handleToothClick}
                    />
                </CardContent>
            </Card>

            <Card className="shadow-sm">
                <CardHeader className="bg-gray-50/50 pb-3 border-b">
                    <CardTitle className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#1c334a]" />
                        Hallazgos del Odontograma
                        {findingRows.length > 0 && (
                            <span className="ml-auto text-[10px] font-normal text-gray-400 normal-case tracking-normal">
                                {findingRows.length} diente{findingRows.length !== 1 ? 's' : ''} con observaciones
                            </span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {findingRows.length === 0 ? (
                        <div className="py-8 text-center text-sm text-gray-400 italic">
                            No hay hallazgos registrados. Marca dientes en el odontograma para que aparezcan aquí.
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                                    <th className="text-left px-4 py-2 w-24">Diente</th>
                                    <th className="text-left px-4 py-2 w-48">Hallazgo</th>
                                    <th className="text-left px-4 py-2">Notas del dentista</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {findingRows.map(({ tooth, findings }) => (
                                    <tr
                                        key={tooth}
                                        ref={(el) => { rowRefs.current[tooth] = el; }}
                                        className="transition-all duration-500 hover:bg-gray-50/70"
                                    >
                                        <td className="px-4 py-2">
                                            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#1c334a] text-white text-xs font-bold shadow-sm">
                                                {tooth}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="flex flex-wrap gap-1">
                                                {findings.map(f => (
                                                    <span key={f} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                        f === 'Caries' ? 'bg-red-100 text-red-700' :
                                                        f === 'Resina / Amalgama' ? 'bg-blue-100 text-blue-700' :
                                                        f === 'Ausente' ? 'bg-gray-200 text-gray-600' :
                                                        f === 'Endodoncia' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-emerald-100 text-emerald-700'
                                                    }`}>{f}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="text"
                                                className="w-full text-sm bg-transparent border-b border-dashed border-gray-300 focus:border-[#1c334a] focus:outline-none py-1 placeholder:text-gray-300 text-gray-700"
                                                placeholder="Escribe una nota sobre este diente..."
                                                value={notes[tooth] || ''}
                                                onChange={(e) => {
                                                    const updated = { ...notes, [tooth]: e.target.value };
                                                    onChange('odontogramNotes', updated);
                                                }}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>
        </>
    );
};
