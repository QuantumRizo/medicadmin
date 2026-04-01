import { useState } from 'react';
import { useAppointmentsContext } from '@/contexts/AppointmentsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, MapPin, Clock, Trash2, Edit2, Check, Stethoscope, BriefcaseMedical } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Switch } from '@/components/ui/switch';
import type { Hospital } from '@/features/appointments/types';

export const HospitalSettings = () => {
    const { hospitals, addHospital, updateHospital, deleteHospital } = useAppointmentsContext();
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Hospital>>({});
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleStartEdit = (hospital: Hospital) => {
        setEditForm(hospital);
        setIsEditing(hospital.id);
    };

    const handleCancel = () => {
        setIsEditing(null);
        setIsAdding(false);
        setEditForm({});
    };

    const handleSave = async () => {
        try {
            if (isAdding) {
                await addHospital({
                    name: editForm.name || 'Nueva Sucursal',
                    address: editForm.address || '',
                    image: '',
                    startTime: editForm.startTime || '09:00',
                    endTime: editForm.endTime || '18:00',
                    slotInterval: editForm.slotInterval || 30,
                    isDentalClinic: editForm.isDentalClinic || false
                });
                toast.success('Sucursal agregada correctamente');
            } else if (isEditing) {
                await updateHospital(isEditing, editForm);
                toast.success('Sucursal actualizada correctamente');
            }
            handleCancel();
        } catch (error: any) {
            toast.error(error.message || 'Error al guardar sucursal');
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await deleteHospital(deleteId);
            toast.success('Sucursal eliminada');
            setDeleteId(null);
        } catch (error: any) {
            toast.error(error.message || 'Error al eliminar sucursal');
        }
    };

    const renderForm = (isNew: boolean) => (
        <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-slate-500">Nombre de la Sucursal</Label>
                    <Input 
                        value={editForm.name || ''} 
                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                        placeholder="Ej. Consultorio Roma Norte"
                        className="rounded-xl border-slate-200"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-slate-500">Dirección</Label>
                    <Input 
                        value={editForm.address || ''} 
                        onChange={e => setEditForm({...editForm, address: e.target.value})}
                        placeholder="Calle, Número, Colonia..."
                        className="rounded-xl border-slate-200"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-slate-500">Hora Inicio</Label>
                    <Input 
                        type="time"
                        value={editForm.startTime || '09:00'} 
                        onChange={e => setEditForm({...editForm, startTime: e.target.value})}
                        className="rounded-xl border-slate-200"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-slate-500">Hora Fin</Label>
                    <Input 
                        type="time"
                        value={editForm.endTime || '18:00'} 
                        onChange={e => setEditForm({...editForm, endTime: e.target.value})}
                        className="rounded-xl border-slate-200"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-slate-500">Intervalo (minutos)</Label>
                    <Input 
                        type="number"
                        min="10"
                        max="120"
                        step="5"
                        value={editForm.slotInterval || 30} 
                        onChange={e => setEditForm({...editForm, slotInterval: parseInt(e.target.value)})}
                        className="rounded-xl border-slate-200"
                    />
                </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner">
                <div className="space-y-0.5">
                    <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Stethoscope className="w-4 h-4 text-sky-500" />
                        ¿Es Especialidad Dental?
                    </div>
                    <div className="text-[11px] text-slate-500">
                        Activa el odontograma interactivo para esta sucursal.
                    </div>
                </div>
                <Switch 
                    checked={editForm.isDentalClinic || false}
                    onCheckedChange={(checked: boolean) => setEditForm({...editForm, isDentalClinic: checked})}
                />
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={handleCancel} className="rounded-xl font-semibold">
                    Cancelar
                </Button>
                <Button onClick={handleSave} className="bg-[#1c334a] hover:bg-[#0f172a] text-white rounded-xl font-bold px-8 shadow-lg shadow-slate-200">
                    <Check className="w-4 h-4 mr-2" />
                    {isNew ? 'Crear Sucursal' : 'Guardar Cambios'}
                </Button>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-extrabold text-[#1c334a]">Mis Sucursales</h3>
                    <p className="text-xs text-slate-500">Gestiona las ubicaciones y horarios de tus consultorios.</p>
                </div>
                {!isAdding && !isEditing && (
                    <Button onClick={() => { setEditForm({ startTime: '09:00', endTime: '18:00', slotInterval: 30 }); setIsAdding(true); }} className="bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold shadow-lg shadow-sky-500/20">
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva Sucursal
                    </Button>
                )}
            </div>

            {isAdding && (
                <Card className="border-2 border-sky-500 shadow-xl shadow-sky-500/5 bg-white overflow-hidden">
                    <CardHeader className="bg-sky-50/50 pb-4 border-b border-sky-100">
                        <CardTitle className="text-sky-700 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Registrar Nueva Ubicación
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {renderForm(true)}
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 gap-4">
                {hospitals.map((hospital) => (
                    <div key={hospital.id}>
                        {isEditing === hospital.id ? (
                            <Card className="border-2 border-[#1c334a] shadow-xl shadow-slate-200 bg-white">
                                <CardHeader className="bg-slate-50 pb-4 border-b">
                                    <CardTitle className="text-slate-700 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                        <Edit2 className="w-4 h-4" /> Editando: {hospital.name}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {renderForm(false)}
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="group transition-all hover:shadow-lg hover:translate-y-[-2px] border-slate-100 shadow-md">
                                <CardContent className="p-0">
                                    <div className="flex flex-col md:flex-row md:items-center">
                                        <div className="p-6 flex-1 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <h4 className="text-xl font-black text-[#1c334a] flex items-center gap-2">
                                                        {hospital.name}
                                                        {hospital.isDentalClinic && (
                                                            <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-widest border border-blue-200">
                                                                Dental
                                                            </span>
                                                        )}
                                                    </h4>
                                                    <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                                                        <MapPin className="w-4 h-4 text-sky-500" />
                                                        {hospital.address || 'Sin dirección registrada'}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => handleStartEdit(hospital)} className="rounded-full hover:bg-sky-50 text-sky-600">
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(hospital.id)} className="rounded-full hover:bg-red-50 text-red-500">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-slate-50">
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Horario</span>
                                                    <div className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                                                        <Clock className="w-3 h-3 text-slate-400" />
                                                        {hospital.startTime} - {hospital.endTime}
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Intervalo</span>
                                                    <div className="text-sm font-bold text-slate-700">
                                                        Cada {hospital.slotInterval} min
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Próxima Cita</span>
                                                    <div className="text-sm font-bold text-sky-600">
                                                        Hoy, 10:00 AM
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado</span>
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-green-600">
                                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                                        Activa
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                ))}

                {hospitals.length === 0 && !isAdding && (
                    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 space-y-4">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md">
                            <BriefcaseMedical className="w-8 h-8 text-slate-300" />
                        </div>
                        <div className="text-center">
                            <p className="text-slate-500 font-bold">No tienes sucursales registradas</p>
                            <p className="text-xs text-slate-400">Agrega tu primer consultorio para empezar a agendar citas.</p>
                        </div>
                        <Button onClick={() => setIsAdding(true)} className="bg-[#1c334a] text-white rounded-xl">
                            Registrar Mi Clínica
                        </Button>
                    </div>
                )}
            </div>

            <ConfirmDialog 
                open={!!deleteId}
                onOpenChange={(open) => !open && setDeleteId(null)}
                onConfirm={handleDelete}
                title="¿Eliminar sucursal?"
                description="Esta acción no se puede deshacer. No podrás eliminar la sucursal si tiene citas registradas."
                confirmText="Sí, Eliminar"
                cancelText="Cancelar"
            />
        </div>
    );
};
