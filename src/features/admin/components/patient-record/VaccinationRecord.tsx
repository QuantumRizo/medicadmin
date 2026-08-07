import { useState } from 'react';
import { Syringe, Plus, Trash2, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MedicalHistory, Vaccination } from '../../../appointments/types';
import { getTodayStr } from '@/lib/dateUtils';

interface VaccinationRecordProps {
    history: MedicalHistory;
    onChange: (field: keyof MedicalHistory, value: any) => void;
}

const emptyVaccine = (): Vaccination => ({
    id: crypto.randomUUID(),
    vaccine: '',
    date: getTodayStr(),
    dose: '',
    lot: '',
    appliedBy: '',
});

export const VaccinationRecord = ({ history, onChange }: VaccinationRecordProps) => {
    const [showForm, setShowForm] = useState(false);
    const [newVax, setNewVax] = useState<Vaccination>(emptyVaccine());

    const vaccinations = (history.vaccinations || []).slice().sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const handleAdd = () => {
        if (!newVax.vaccine || !newVax.date) return;
        const updated = [newVax, ...(history.vaccinations || [])];
        onChange('vaccinations', updated);
        setNewVax(emptyVaccine());
        setShowForm(false);
    };

    const handleDelete = (id: string) => {
        onChange('vaccinations', (history.vaccinations || []).filter(v => v.id !== id));
    };

    return (
        <Card className="shadow-sm">
            <CardHeader className="bg-gray-50/50 pb-3 border-b">
                <CardTitle className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Syringe className="w-4 h-4 text-emerald-500" />
                        Vacunas
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowForm(v => !v)}
                        className="h-7 text-xs rounded-lg border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                    >
                        {showForm ? <ChevronUp className="w-3 h-3 mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
                        {showForm ? 'Cancelar' : 'Agregar'}
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">

                {/* Formulario nueva vacuna */}
                {showForm && (
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1 col-span-2">
                                <Label className="text-xs text-gray-500 uppercase font-semibold">Biológico / Vacuna *</Label>
                                <Input
                                    placeholder="Ej. Pentavalente, Influenza, COVID-19..."
                                    className="h-8 text-sm bg-white"
                                    value={newVax.vaccine}
                                    onChange={e => setNewVax(v => ({ ...v, vaccine: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-500 uppercase font-semibold">Fecha *</Label>
                                <Input
                                    type="date"
                                    className="h-8 text-sm bg-white"
                                    value={newVax.date}
                                    onChange={e => setNewVax(v => ({ ...v, date: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-500 uppercase font-semibold">Dosis</Label>
                                <select
                                    className="flex h-8 w-full rounded-md border border-input bg-white px-3 py-1 text-sm text-gray-700"
                                    value={newVax.dose || ''}
                                    onChange={e => setNewVax(v => ({ ...v, dose: e.target.value }))}
                                >
                                    <option value="">N/A</option>
                                    <option value="1ª dosis">1ª dosis</option>
                                    <option value="2ª dosis">2ª dosis</option>
                                    <option value="3ª dosis">3ª dosis</option>
                                    <option value="Refuerzo">Refuerzo</option>
                                    <option value="Dosis única">Dosis única</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-500 uppercase font-semibold">Lote</Label>
                                <Input
                                    placeholder="Nº de lote"
                                    className="h-8 text-sm bg-white"
                                    value={newVax.lot || ''}
                                    onChange={e => setNewVax(v => ({ ...v, lot: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-500 uppercase font-semibold">Aplicó</Label>
                                <Input
                                    placeholder="Dr. / Enf."
                                    className="h-8 text-sm bg-white"
                                    value={newVax.appliedBy || ''}
                                    onChange={e => setNewVax(v => ({ ...v, appliedBy: e.target.value }))}
                                />
                            </div>
                        </div>
                        <Button
                            size="sm"
                            onClick={handleAdd}
                            disabled={!newVax.vaccine}
                            className="w-full h-8 bg-emerald-500 hover:bg-emerald-600 text-white text-xs rounded-lg"
                        >
                            Registrar Vacuna
                        </Button>
                    </div>
                )}

                {/* Tabla de vacunas */}
                {vaccinations.length === 0 ? (
                    <p className="text-xs text-gray-400 italic text-center py-4">Sin vacunas registradas</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider">
                                    <th className="pb-2 text-left font-bold">Vacuna</th>
                                    <th className="pb-2 text-left font-bold">Fecha</th>
                                    <th className="pb-2 text-left font-bold">Dosis</th>
                                    <th className="pb-2 text-left font-bold">Lote</th>
                                    <th className="pb-2 w-6"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {vaccinations.map(v => (
                                    <tr key={v.id} className="hover:bg-gray-50/50 group">
                                        <td className="py-2 font-semibold text-gray-800">{v.vaccine}</td>
                                        <td className="py-2 text-gray-500 whitespace-nowrap">{v.date}</td>
                                        <td className="py-2 text-gray-500">{v.dose || '—'}</td>
                                        <td className="py-2 text-gray-400 font-mono">{v.lot || '—'}</td>
                                        <td className="py-2">
                                            <button
                                                onClick={() => handleDelete(v.id)}
                                                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
