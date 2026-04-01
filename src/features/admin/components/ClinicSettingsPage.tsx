import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Save, User, Award, FileText, Loader2, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HospitalSettings } from './HospitalSettings';
import type { ClinicProfile } from '@/features/appointments/types';

const DEFAULT_AVISO = `Con fundamento en los artículos 15 y 16 de la Ley Federal de Protección de Datos Personales en Posesión de los Particulares, hacemos de su conocimiento que los datos personales y sensibles recabados (nombre, datos de contacto, historial clínico) serán utilizados exclusivamente para la prestación de servicios médicos, seguimiento de su salud y administración de citas. Sus datos son resguardados con medidas de seguridad conforme a la NOM-024-SSA3-2012. Usted tiene derecho de Acceso, Rectificación, Cancelación y Oposición (ARCO) sobre sus datos.`;

export const ClinicSettingsPage = () => {
    const { appId } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<ClinicProfile>({
        appId: appId || '',
        clinicName: '',
        doctorName: '',
        cedulaProfesional: '',
        especialidad: '',
        institucionEgreso: '',
        telefonoClinica: '',
        direccionClinica: '',
        logoUrl: '',
        avisoPrivacidad: DEFAULT_AVISO,
    });

    useEffect(() => {
        if (!appId) return;
        const fetchProfile = async () => {
            setLoading(true);
            const { data } = await supabase
                .from('clinic_settings')
                .select('*')
                .eq('app_id', appId)
                .maybeSingle();

            if (data) {
                setProfile({
                    appId: data.app_id,
                    clinicName: data.clinic_name || '',
                    doctorName: data.doctor_name || '',
                    cedulaProfesional: data.cedula_profesional || '',
                    especialidad: data.especialidad || '',
                    institucionEgreso: data.institucion_egreso || '',
                    telefonoClinica: data.telefono_clinica || '',
                    direccionClinica: data.direccion_clinica || '',
                    logoUrl: data.logo_url || '',
                    avisoPrivacidad: data.aviso_privacidad || DEFAULT_AVISO,
                });
            }
            setLoading(false);
        };
        fetchProfile();
    }, [appId]);

    const handleSave = async () => {
        if (!appId) return;
        setSaving(true);
        try {
            const { error } = await supabase.from('clinic_settings').upsert({
                app_id: appId,
                clinic_name: profile.clinicName,
                doctor_name: profile.doctorName,
                cedula_profesional: profile.cedulaProfesional,
                especialidad: profile.especialidad,
                institucion_egreso: profile.institucionEgreso,
                telefono_clinica: profile.telefonoClinica,
                direccion_clinica: profile.direccionClinica,
                logo_url: profile.logoUrl,
                aviso_privacidad: profile.avisoPrivacidad,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'app_id' });

            if (error) throw error;
            toast.success('Configuración guardada correctamente');
        } catch (err) {
            toast.error('Error al guardar la configuración');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const set = (key: keyof ClinicProfile, val: string) =>
        setProfile(p => ({ ...p, [key]: val }));

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-[#1c334a]" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-16 px-4 sm:px-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Mi Clínica</h2>
                    <p className="text-sm text-slate-500 mt-1 font-medium italic">
                        Personaliza tu perfil médico y sedes de atención.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="bg-slate-100 p-1 rounded-2xl w-full sm:w-auto h-auto grid grid-cols-2">
                    <TabsTrigger value="profile" className="rounded-xl py-3 px-8 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-[#1c334a] font-bold transition-all">
                        <User className="w-4 h-4 mr-2" />
                        Perfil Médico
                    </TabsTrigger>
                    <TabsTrigger value="hospitals" className="rounded-xl py-3 px-8 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-[#1c334a] font-bold transition-all">
                        <Building2 className="w-4 h-4 mr-2" />
                        Sucursales
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex justify-end">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-[#1c334a] hover:bg-[#152537] text-white rounded-xl h-11 px-6 font-bold shadow-xl shadow-slate-200 transition-all hover:-translate-y-0.5"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Guardar Perfil
                        </Button>
                    </div>

                    <Card className="shadow-xl shadow-slate-200/50 border-none rounded-3xl overflow-hidden bg-white">
                        <CardHeader className="pb-4 border-b border-slate-50 bg-slate-50/30">
                            <CardTitle className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Award className="w-4 h-4 text-[#1c334a]" />
                                Información Profesional
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Clínica / Institución</label>
                                    <Input
                                        value={profile.clinicName}
                                        onChange={e => set('clinicName', e.target.value)}
                                        placeholder="Ej. Clínica Dental Sonrisas"
                                        className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all shadow-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nombre Completo</label>
                                    <Input
                                        value={profile.doctorName}
                                        onChange={e => set('doctorName', e.target.value)}
                                        placeholder="Dr. Juan Pérez"
                                        className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all shadow-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Cédula Profesional</label>
                                    <Input
                                        value={profile.cedulaProfesional}
                                        onChange={e => set('cedulaProfesional', e.target.value)}
                                        placeholder="Ej. 12345678"
                                        className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all shadow-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Especialidad</label>
                                    <Input
                                        value={profile.especialidad}
                                        onChange={e => set('especialidad', e.target.value)}
                                        placeholder="Ej. Medicina Interna"
                                        className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all shadow-sm"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-xl shadow-slate-200/50 border-none rounded-3xl overflow-hidden bg-white">
                        <CardHeader className="pb-4 border-b border-slate-50 bg-slate-50/30">
                            <CardTitle className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <FileText className="w-4 h-4 text-[#1c334a]" />
                                Aviso de Privacidad (NOM-024)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <textarea
                                className="w-full min-h-[160px] text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all leading-relaxed"
                                value={profile.avisoPrivacidad}
                                onChange={e => set('avisoPrivacidad', e.target.value)}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="hospitals" className="animate-in fade-in duration-300">
                    <HospitalSettings />
                </TabsContent>
            </Tabs>

            <div className="flex items-start gap-4 bg-sky-50 border border-sky-100 rounded-3xl p-6 text-sky-800 shadow-sm">
                <Award className="w-6 h-6 text-sky-500 shrink-0" />
                <div className="space-y-1">
                    <p className="font-bold text-sm">Cumplimiento Mexicano Vigilado</p>
                    <p className="text-xs text-sky-600 font-medium leading-relaxed">
                        Los datos registrados aquí se integrarán automáticamente en tus recetas y bitácoras de auditoría para cumplir con la NOM-024-SSA3-2012 y la Ley General de Salud.
                    </p>
                </div>
            </div>
        </div>
    );
};
