import { useState } from 'react';
import { Ruler, Plus, Trash2, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MedicalHistory, GrowthRecord } from '../../../appointments/types';
import { getTodayStr } from '@/lib/dateUtils';

interface GrowthTrackerProps {
    history: MedicalHistory;
    onChange: (field: keyof MedicalHistory, value: any) => void;
}

const emptyRecord = (): GrowthRecord => ({
    id: crypto.randomUUID(),
    date: getTodayStr(),
    weight: '',
    height: '',
    headCirc: '',
    notes: '',
});

export const GrowthTracker = ({ history, onChange }: GrowthTrackerProps) => {
    const [showForm, setShowForm] = useState(false);
    const [newRecord, setNewRecord] = useState<GrowthRecord>(emptyRecord());

    const records = (history.growthRecords || []).slice().sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const handleAdd = () => {
        if (!newRecord.date) return;
        const updated = [newRecord, ...(history.growthRecords || [])];
        onChange('growthRecords', updated);
        setNewRecord(emptyRecord());
        setShowForm(false);
    };

    const handleDelete = (id: string) => {
        onChange('growthRecords', (history.growthRecords || []).filter(r => r.id !== id));
    };

    return (
        <Card className="shadow-sm">
            <CardHeader className="bg-gray-50/50 pb-3 border-b">
                <CardTitle className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Ruler className="w-4 h-4 text-sky-500" />
                        Somatometría
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowForm(v => !v)}
                        className="h-7 text-xs rounded-lg border-sky-200 text-sky-600 hover:bg-sky-50"
                    >
                        {showForm ? <ChevronUp className="w-3 h-3 mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
                        {showForm ? 'Cancelar' : 'Agregar'}
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">

                {/* Formulario de nueva medición */}
                {showForm && (
                    <div className="bg-sky-50/50 border border-sky-100 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1 col-span-2">
                                <Label className="text-xs text-gray-500 uppercase font-semibold">Fecha</Label>
                                <Input
                                    type="date"
                                    className="h-8 text-sm bg-white"
                                    value={newRecord.date}
                                    onChange={e => setNewRecord(r => ({ ...r, date: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-500 uppercase font-semibold">Peso (kg)</Label>
                                <Input
                                    placeholder="Ej. 12.5"
                                    className="h-8 text-sm bg-white"
                                    value={newRecord.weight || ''}
                                    onChange={e => setNewRecord(r => ({ ...r, weight: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-500 uppercase font-semibold">Talla (cm)</Label>
                                <Input
                                    placeholder="Ej. 95"
                                    className="h-8 text-sm bg-white"
                                    value={newRecord.height || ''}
                                    onChange={e => setNewRecord(r => ({ ...r, height: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-500 uppercase font-semibold">P. Cefálico (cm)</Label>
                                <Input
                                    placeholder="Ej. 48"
                                    className="h-8 text-sm bg-white"
                                    value={newRecord.headCirc || ''}
                                    onChange={e => setNewRecord(r => ({ ...r, headCirc: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-500 uppercase font-semibold">Notas</Label>
                                <Input
                                    placeholder="Observaciones"
                                    className="h-8 text-sm bg-white"
                                    value={newRecord.notes || ''}
                                    onChange={e => setNewRecord(r => ({ ...r, notes: e.target.value }))}
                                />
                            </div>
                        </div>
                        <Button
                            size="sm"
                            onClick={handleAdd}
                            className="w-full h-8 bg-sky-500 hover:bg-sky-600 text-white text-xs rounded-lg"
                        >
                            Guardar Medición
                        </Button>
                    </div>
                )}

                {/* Tabla de registros */}
                {records.length === 0 ? (
                    <p className="text-xs text-gray-400 italic text-center py-4">Sin mediciones registradas</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider">
                                    <th className="pb-2 text-left font-bold">Fecha</th>
                                    <th className="pb-2 text-center font-bold">Peso</th>
                                    <th className="pb-2 text-center font-bold">Talla</th>
                                    <th className="pb-2 text-center font-bold">P.Cef.</th>
                                    <th className="pb-2 text-left font-bold pl-2">Notas</th>
                                    <th className="pb-2 w-6"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {records.map(r => (
                                    <tr key={r.id} className="hover:bg-gray-50/50 group">
                                        <td className="py-2 font-semibold text-gray-700 whitespace-nowrap">{r.date}</td>
                                        <td className="py-2 text-center text-gray-600">{r.weight ? `${r.weight} kg` : '—'}</td>
                                        <td className="py-2 text-center text-gray-600">{r.height ? `${r.height} cm` : '—'}</td>
                                        <td className="py-2 text-center text-gray-600">{r.headCirc ? `${r.headCirc} cm` : '—'}</td>
                                        <td className="py-2 text-gray-500 pl-2 max-w-[80px] truncate">{r.notes || '—'}</td>
                                        <td className="py-2">
                                            <button
                                                onClick={() => handleDelete(r.id)}
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
