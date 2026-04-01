import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Save, Building2, User, Award, MapPin, FileText, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
        <div className="max-w-3xl mx-auto space-y-6 pb-16">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Configuración de la Clínica</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Datos del perfil médico · Requeridos para cumplimiento NOM-024-SSA3-2012
                    </p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-[#1c334a] hover:bg-[#152537] text-white rounded-xl h-11 px-6 font-semibold shadow-sm"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
            </div>

            {/* Datos de la Clínica */}
            <Card className="shadow-sm border-t-4 border-t-[#1c334a]">
                <CardHeader className="pb-4 border-b bg-gray-50/50">
                    <CardTitle className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#1c334a]" />
                        Datos de la Clínica
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre de la Clínica</label>
                            <Input
                                value={profile.clinicName}
                                onChange={e => set('clinicName', e.target.value)}
                                placeholder="Ej. Clínica Dental García"
                                className="rounded-lg"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Teléfono</label>
                            <Input
                                value={profile.telefonoClinica}
                                onChange={e => set('telefonoClinica', e.target.value)}
                                placeholder="55 1234 5678"
                                className="rounded-lg"
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> Dirección
                        </label>
                        <Input
                            value={profile.direccionClinica}
                            onChange={e => set('direccionClinica', e.target.value)}
                            placeholder="Calle, Número, Colonia, Ciudad, Estado, C.P."
                            className="rounded-lg"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Datos del Médico */}
            <Card className="shadow-sm">
                <CardHeader className="pb-4 border-b bg-gray-50/50">
                    <CardTitle className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                        <User className="w-4 h-4 text-[#1c334a]" />
                        Datos del Médico Responsable
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre Completo</label>
                            <Input
                                value={profile.doctorName}
                                onChange={e => set('doctorName', e.target.value)}
                                placeholder="Dr. Juan García López"
                                className="rounded-lg"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                                <Award className="w-3 h-3" /> Cédula Profesional
                            </label>
                            <Input
                                value={profile.cedulaProfesional}
                                onChange={e => set('cedulaProfesional', e.target.value)}
                                placeholder="Ej. 12345678"
                                className="rounded-lg"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Especialidad</label>
                            <Input
                                value={profile.especialidad}
                                onChange={e => set('especialidad', e.target.value)}
                                placeholder="Ej. Cirugía Dental, Medicina General"
                                className="rounded-lg"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Institución de Egreso</label>
                            <Input
                                value={profile.institucionEgreso}
                                onChange={e => set('institucionEgreso', e.target.value)}
                                placeholder="Ej. UNAM, IPN, UAM"
                                className="rounded-lg"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Aviso de Privacidad */}
            <Card className="shadow-sm">
                <CardHeader className="pb-4 border-b bg-gray-50/50">
                    <CardTitle className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#1c334a]" />
                        Aviso de Privacidad
                        <span className="ml-auto text-[10px] font-normal text-gray-400 normal-case tracking-normal">
                            Ley Federal de Protección de Datos Personales · Derechos ARCO
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                    <p className="text-xs text-gray-400 mb-3">
                        Este texto aparecerá en el expediente del paciente para cumplir con la Ley ARCO. Puedes personalizarlo.
                    </p>
                    <textarea
                        className="w-full min-h-[160px] text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#1c334a] resize-y leading-relaxed"
                        value={profile.avisoPrivacidad}
                        onChange={e => set('avisoPrivacidad', e.target.value)}
                    />
                </CardContent>
            </Card>

            {/* Nota de cumplimiento */}
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
                <Award className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                    <p className="font-semibold">Cumplimiento NOM-024-SSA3-2012</p>
                    <p className="text-xs mt-1 text-blue-600">
                        La cédula profesional y nombre del médico se usarán automáticamente para identificar quién realizó cada registro clínico.
                        Los datos de la clínica aparecerán en documentos y recetas futuras.
                    </p>
                </div>
            </div>

        </div>
    );
};
