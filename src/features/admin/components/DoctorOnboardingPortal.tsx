import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth, isDefaultDoctorName } from '@/contexts/AuthContext';
import { useAppointmentsContext } from '@/contexts/AppointmentsContext';
import { toast } from 'sonner';
import { 
    Stethoscope, 
    UserCheck, 
    Building2, 
    Award, 
    FileText, 
    Sparkles, 
    ShieldCheck, 
    ArrowRight, 
    LogOut, 
    Loader2, 
    MapPin, 
    GraduationCap,
    CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const DEFAULT_AVISO = `Con fundamento en los artículos 15 y 16 de la Ley Federal de Protección de Datos Personales en Posesión de los Particulares, hacemos de su conocimiento que los datos personales y sensibles recabados (nombre, datos de contacto, historial clínico) serán utilizados exclusivamente para la prestación de servicios médicos, seguimiento de su salud y administración de citas. Sus datos son resguardados con medidas de seguridad conforme a la NOM-024-SSA3-2012. Usted tiene derecho de Acceso, Rectificación, Cancelación y Oposición (ARCO) sobre sus datos.`;

export const DoctorOnboardingPortal: React.FC = () => {
    const { user, appId, signOut, refreshProfile } = useAuth();
    let appointmentsContext: ReturnType<typeof useAppointmentsContext> | null = null;
    try {
        appointmentsContext = useAppointmentsContext();
    } catch {
        // AppointmentsContext might be optional if rendered outside provider
    }

    const [doctorName, setDoctorName] = useState('');
    const [especialidad, setEspecialidad] = useState('');
    const [cedula, setCedula] = useState('');
    const [institucion, setInstitucion] = useState('');
    const [clinicName, setClinicName] = useState('');
    const [clinicAddress, setClinicAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    useEffect(() => {
        if (!appId) return;

        // Fetch existing clinic settings if available
        const loadExistingSettings = async () => {
            const { data } = await supabase
                .from('clinic_settings')
                .select('doctor_name, especialidad, cedula_profesional, institucion_egreso')
                .eq('app_id', appId)
                .maybeSingle();

            if (data) {
                if (data.doctor_name && !isDefaultDoctorName(data.doctor_name)) {
                    setDoctorName(data.doctor_name);
                }
                if (data.especialidad) setEspecialidad(data.especialidad);
                if (data.cedula_profesional) setCedula(data.cedula_profesional);
                if (data.institucion_egreso) setInstitucion(data.institucion_egreso);
            }
        };

        loadExistingSettings();
    }, [appId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        const cleanName = doctorName.trim();
        if (!cleanName || isDefaultDoctorName(cleanName)) {
            setFormError('Por favor ingresa tu nombre médico real (diferente a "Nuevo Doctor").');
            toast.error('Nombre inválido', { description: 'Por favor ingresa tu nombre médico real.' });
            return;
        }

        setLoading(true);

        try {
            // 1. Update profiles table (full_name)
            if (user?.id) {
                const { error: profileErr } = await supabase
                    .from('profiles')
                    .update({ 
                        full_name: cleanName,
                        updated_at: new Date().toISOString() 
                    })
                    .eq('id', user.id);

                if (profileErr) throw profileErr;
            }

            // 2. Upsert clinic_settings table
            if (appId) {
                const { error: clinicErr } = await supabase
                    .from('clinic_settings')
                    .upsert({
                        app_id: appId,
                        doctor_name: cleanName,
                        especialidad: especialidad.trim() || null,
                        cedula_profesional: cedula.trim() || null,
                        institucion_egreso: institucion.trim() || null,
                        aviso_privacidad: DEFAULT_AVISO,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'app_id' });

                if (clinicErr) throw clinicErr;

                // 3. Update primary hospital if clinicName provided
                const cleanClinicName = clinicName.trim();
                if (cleanClinicName && cleanClinicName !== 'Consultorio Principal') {
                    const { data: defaultHospital } = await supabase
                        .from('hospitals')
                        .select('id')
                        .eq('app_id', appId)
                        .eq('name', 'Consultorio Principal')
                        .maybeSingle();

                    if (defaultHospital) {
                        await supabase
                            .from('hospitals')
                            .update({ 
                                name: cleanClinicName,
                                address: clinicAddress.trim() || undefined
                            })
                            .eq('id', defaultHospital.id);
                    }
                }
            }

            // 4. Trigger profile refresh to update AuthContext state
            await refreshProfile();

            if (appointmentsContext?.fetchData) {
                await appointmentsContext.fetchData();
            }

            toast.success('¡Perfil médico actualizado con éxito!', {
                description: 'Bienvenido a tu panel de gestión clínica MedicAdmin.'
            });

        } catch (err: any) {
            console.error('Error updating doctor profile:', err);
            const msg = err?.message || 'Error al guardar la información.';
            setFormError(msg);
            toast.error('Error de actualización', { description: msg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col relative overflow-hidden selection:bg-sky-500 selection:text-white">
            {/* Ambient Lighting & Mesh Gradients */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

            {/* Header / Navbar */}
            <header className="w-full border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-gradient-to-tr from-sky-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/20">
                            <Stethoscope className="text-white w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-white font-extrabold text-xl tracking-tight">MedicAdmin</span>
                                <span className="text-[10px] uppercase tracking-wider font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full">
                                    Portal de Activación
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 font-medium">Configuración de Expediente Médico Oficial</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-xs font-bold text-slate-300">{user?.email}</span>
                            <span className="text-[10px] text-slate-500">Cuenta activa</span>
                        </div>
                        <Button 
                            variant="ghost" 
                            onClick={signOut}
                            className="text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl text-xs font-bold gap-2"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Cerrar Sesión</span>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Portal Content */}
            <main className="flex-1 max-w-4xl w-full mx-auto p-6 sm:p-10 flex flex-col justify-center relative z-10">
                <div className="space-y-8">

                    {/* Banner Intro */}
                    <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-sky-950/40 border border-sky-500/20 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                            <Sparkles className="w-40 h-40 text-sky-400" />
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 relative z-10">
                            <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center shrink-0">
                                <ShieldCheck className="w-8 h-8 text-sky-400" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                                        ¡Bienvenido a tu Clínica Digital!
                                    </h1>
                                </div>
                                <p className="text-slate-300 text-sm font-medium leading-relaxed max-w-2xl">
                                    Tu cuenta actualmente cuenta con el nombre de usuario por defecto (<span className="text-sky-300 font-bold">Nuevo Doctor</span>). Para habilitar tus recetas electrónicas con validez oficial (<span className="text-sky-300 font-bold">NOM-024</span>) y la agenda médica, por favor completa tu nombre profesional y datos de tu consultorio.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form Container */}
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {formError && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-2xl text-sm font-medium text-center animate-shake">
                                {formError}
                            </div>
                        )}

                        {/* Card 1: Perfil Profesional */}
                        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-md">
                            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                                    <UserCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-extrabold text-white tracking-tight">1. Datos Oficiales del Médico</h2>
                                    <p className="text-xs text-slate-400">Información para expedientes clínicos y encabezado de recetas</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Doctor Name */}
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider ml-1 flex items-center gap-2">
                                        <span>Nombre Completo del Médico</span>
                                        <span className="text-sky-400">*</span>
                                    </label>
                                    <Input
                                        type="text"
                                        value={doctorName}
                                        onChange={e => setDoctorName(e.target.value)}
                                        placeholder="Ej. Dr. Alejandro Ramírez Mendoza"
                                        required
                                        className="h-14 rounded-2xl bg-slate-950/60 border-slate-700/80 focus:border-sky-500 focus:ring-sky-500/30 text-white placeholder:text-slate-600 font-semibold px-4 text-base transition-all"
                                    />
                                    <p className="text-xs text-slate-500 ml-1">
                                        Escribe el nombre con el que deseas identificarte ante tus pacientes y en recetas.
                                    </p>
                                </div>

                                {/* Especialidad */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                                        <Award className="w-3.5 h-3.5 text-sky-400" />
                                        <span>Especialidad Médica</span>
                                    </label>
                                    <Input
                                        type="text"
                                        value={especialidad}
                                        onChange={e => setEspecialidad(e.target.value)}
                                        placeholder="Ej. Medicina General / Pediatría"
                                        className="h-13 rounded-2xl bg-slate-950/60 border-slate-700/80 focus:border-sky-500 text-white placeholder:text-slate-600 font-medium px-4 transition-all"
                                    />
                                </div>

                                {/* Cédula Profesional */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 text-sky-400" />
                                        <span>Cédula Profesional</span>
                                    </label>
                                    <Input
                                        type="text"
                                        value={cedula}
                                        onChange={e => setCedula(e.target.value)}
                                        placeholder="Ej. 12345678"
                                        className="h-13 rounded-2xl bg-slate-950/60 border-slate-700/80 focus:border-sky-500 text-white placeholder:text-slate-600 font-medium px-4 transition-all"
                                    />
                                </div>

                                {/* Institución de Egreso */}
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                                        <GraduationCap className="w-3.5 h-3.5 text-sky-400" />
                                        <span>Universidad / Institución de Egreso</span>
                                    </label>
                                    <Input
                                        type="text"
                                        value={institucion}
                                        onChange={e => setInstitucion(e.target.value)}
                                        placeholder="Ej. Universidad Nacional Autónoma de México (UNAM)"
                                        className="h-13 rounded-2xl bg-slate-950/60 border-slate-700/80 focus:border-sky-500 text-white placeholder:text-slate-600 font-medium px-4 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Card 2: Configuración del Consultorio */}
                        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-md">
                            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-extrabold text-white tracking-tight">2. Tu Consultorio o Clínica Principal</h2>
                                    <p className="text-xs text-slate-400">Personaliza la sede donde atenderás a tus pacientes</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Clinic Name */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                                        <Building2 className="w-3.5 h-3.5 text-blue-400" />
                                        <span>Nombre del Consultorio</span>
                                    </label>
                                    <Input
                                        type="text"
                                        value={clinicName}
                                        onChange={e => setClinicName(e.target.value)}
                                        placeholder="Ej. Consultorio Médico San José"
                                        className="h-13 rounded-2xl bg-slate-950/60 border-slate-700/80 focus:border-blue-500 text-white placeholder:text-slate-600 font-medium px-4 transition-all"
                                    />
                                </div>

                                {/* Clinic Address */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-blue-400" />
                                        <span>Dirección (Opcional)</span>
                                    </label>
                                    <Input
                                        type="text"
                                        value={clinicAddress}
                                        onChange={e => setClinicAddress(e.target.value)}
                                        placeholder="Ej. Av. Insurgentes Sur 1234, CDMX"
                                        className="h-13 rounded-2xl bg-slate-950/60 border-slate-700/80 focus:border-blue-500 text-white placeholder:text-slate-600 font-medium px-4 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Live Prescription Preview Box */}
                        {doctorName.trim() && !isDefaultDoctorName(doctorName) && (
                            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-2 animate-fade-in">
                                <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Previsualización en Receta Electrónica</span>
                                </div>
                                <div className="bg-white text-slate-900 rounded-xl p-4 shadow-md font-serif text-sm">
                                    <p className="font-extrabold text-base text-[#1c334a]">
                                        {doctorName.trim().startsWith('Dr.') ? doctorName.trim() : `Dr. ${doctorName.trim()}`}
                                    </p>
                                    <p className="text-xs text-slate-600 font-sans mt-0.5">
                                        {especialidad.trim() || 'Médico General'} {cedula.trim() ? `• Céd. Prof: ${cedula.trim()}` : ''}
                                    </p>
                                    {institucion.trim() && (
                                        <p className="text-[11px] text-slate-500 font-sans italic mt-0.5">
                                            Egresado de: {institucion.trim()}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="pt-4 flex flex-col items-center space-y-4">
                            <Button
                                type="submit"
                                disabled={loading || !doctorName.trim() || isDefaultDoctorName(doctorName)}
                                className="w-full sm:w-auto h-14 px-10 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-sky-500/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Guardando Perfil...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Guardar Datos y Entrar al Panel</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </Button>

                            <p className="text-xs text-slate-500 text-center flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span>Tus datos se almacenan de forma segura bajo encriptación conforme a la NOM-024.</span>
                            </p>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};
