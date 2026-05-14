import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Phone, Mail } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Patient, MedicalHistory } from '../../../appointments/types';
import { getNow } from '@/lib/dateUtils';

interface PatientProfileCardProps {
    patient: Patient;
    history: MedicalHistory;
    onChangePatient: (field: keyof Patient, value: any) => void;
}

export const PatientProfileCard = ({ patient, history, onChangePatient }: PatientProfileCardProps) => {

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
        <Card className="shadow-sm border-t-4 border-t-[#1c334a]">
            <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-20 h-20 rounded-full bg-[#1c334a] text-white flex items-center justify-center text-3xl font-bold shadow-md">
                        {patient.name.charAt(0)}
                    </div>
                    <div>
                        <Input
                            value={patient.name || ''}
                            onChange={(e) => onChangePatient('name', e.target.value)}
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
                                value={patient.phone || ''}
                                onChange={(e) => onChangePatient('phone', e.target.value)}
                                className="h-8 text-xs bg-transparent border-none focus-visible:ring-0 px-1 font-medium"
                                placeholder="Teléfono"
                            />
                        </div>
                        <div className="flex items-center gap-2 px-2 bg-gray-50/50 rounded-lg">
                            <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <Input
                                value={patient.email || ''}
                                onChange={(e) => onChangePatient('email', e.target.value)}
                                className="h-8 text-xs bg-transparent border-none focus-visible:ring-0 px-1 font-medium"
                                placeholder="Correo electrónico"
                            />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
