import { User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { MedicalHistory } from '../../../appointments/types';

interface PatientGeneralDataProps {
    history: MedicalHistory;
    onChange: (field: keyof MedicalHistory, value: any) => void;
}

export const PatientGeneralData = ({ history, onChange }: PatientGeneralDataProps) => {
    return (
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
                    <Input type="date" className="h-8 text-sm bg-gray-50/50" value={history.dateOfBirth || ''} onChange={(e) => onChange('dateOfBirth', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <Label className="text-xs text-gray-500 uppercase font-semibold">Sangre</Label>
                        <select className="flex h-8 w-full rounded-md border border-input bg-gray-50/50 px-3 py-1 text-sm text-gray-700" value={history.bloodType || ''} onChange={(e) => onChange('bloodType', e.target.value)}>
                            <option value="">N/A</option>
                            <option value="A+">A+</option><option value="A-">A-</option>
                            <option value="B+">B+</option><option value="B-">B-</option>
                            <option value="AB+">AB+</option><option value="AB-">AB-</option>
                            <option value="O+">O+</option><option value="O-">O-</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-gray-500 uppercase font-semibold">Sexo</Label>
                        <select className="flex h-8 w-full rounded-md border border-input bg-gray-50/50 px-3 py-1 text-sm text-gray-700" value={history.sex || ''} onChange={(e) => onChange('sex', e.target.value)}>
                            <option value="">N/A</option>
                            <option value="Masculino">Masculino</option>
                            <option value="Femenino">Femenino</option>
                        </select>
                    </div>
                </div>
                <div className="space-y-1">
                    <Label className="text-xs text-gray-500 uppercase font-semibold">Estado Civil</Label>
                    <select className="flex h-8 w-full rounded-md border border-input bg-gray-50/50 px-3 py-1 text-sm text-gray-700" value={history.maritalStatus || ''} onChange={(e) => onChange('maritalStatus', e.target.value)}>
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
                    <Input placeholder="Ej. Arquitecto" className="h-8 text-sm bg-gray-50/50" value={history.occupation || ''} onChange={(e) => onChange('occupation', e.target.value)} />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs text-gray-500 uppercase font-semibold">CURP <span className="text-gray-300 normal-case">(opcional)</span></Label>
                    <Input
                        placeholder="Ej. GARJ900101HMCRCN09"
                        maxLength={18}
                        className="h-8 text-sm bg-gray-50/50 uppercase font-mono tracking-wider"
                        value={history.curp || ''}
                        onChange={(e) => onChange('curp', e.target.value.toUpperCase())}
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs text-gray-500 uppercase font-semibold">Deportes</Label>
                    <Input placeholder="Ej. Natación" className="h-8 text-sm bg-gray-50/50" value={history.sports || ''} onChange={(e) => onChange('sports', e.target.value)} />
                </div>
                <div className="pt-2 border-t">
                    <Label className="text-xs text-gray-500 uppercase mb-2 block font-semibold">Teléfonos Extra</Label>
                    <div className="grid grid-cols-2 gap-3">
                        <Input placeholder="Casa" className="h-8 text-sm bg-gray-50/50" value={history.homePhone || ''} onChange={(e) => onChange('homePhone', e.target.value)} />
                        <Input placeholder="Oficina" className="h-8 text-sm bg-gray-50/50" value={history.officePhone || ''} onChange={(e) => onChange('officePhone', e.target.value)} />
                    </div>
                </div>
                <div className="pt-2 border-t text-sm">
                    <Label className="text-xs text-gray-500 uppercase mb-2 block font-semibold">Seguro Médico</Label>
                    <div className="flex items-center gap-2 mb-2">
                        <input type="checkbox" id="insurance" className="h-4 w-4 rounded accent-[#1c334a]" checked={history.insurance || false} onChange={(e) => onChange('insurance', e.target.checked)} />
                        <Label htmlFor="insurance" className="text-sm cursor-pointer text-gray-600">Cuenta con Seguro</Label>
                    </div>
                    {history.insurance && (
                        <Input placeholder="Aseguradora" className="h-8 text-sm bg-gray-50/50 border-[#1c334a]/40" value={history.insuranceCompany || ''} onChange={(e) => onChange('insuranceCompany', e.target.value)} />
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
