import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Stethoscope, ArrowLeft, History } from 'lucide-react';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    }
                }
            });

            if (error) {
                setError(error.message);
                return;
            }

            setSuccess(true);
            setTimeout(() => navigate('/login'), 5000);
        } catch (err) {
            console.error(err);
            setError('Ocurrió un error inesperado');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 text-center space-y-6">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <Stethoscope className="text-green-600 w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900">¡Registro Exitoso!</h2>
                    <p className="text-slate-600">
                        Te hemos enviado un correo de confirmación. Por favor verifica tu bandeja de entrada para activar tu cuenta médica.
                    </p>
                    <p className="text-sm text-slate-400">Redirigiendo al inicio de sesión...</p>
                    <Button asChild className="w-full bg-[#1e293b]">
                        <Link to="/login">Ir al Login ahora</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col lg:flex-row font-sans overflow-hidden">
            {/* Left Side: Brand Section (Consistent with Login) */}
            <div className="hidden lg:flex lg:w-2/5 bg-[#0f172a] relative items-center justify-center p-12 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#1e293b] to-[#0f172a]" />
                <div className="absolute -bottom-24 -right-24 opacity-5 animate-float pointer-events-none">
                    <Stethoscope size={600} strokeWidth={1} className="text-white" />
                </div>
                
                <div className="relative z-10 max-w-sm w-full">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                            <Stethoscope className="text-white w-6 h-6" />
                        </div>
                        <span className="text-white text-2xl font-bold tracking-tight">MedicAdmin</span>
                    </div>

                    <div className="space-y-6">
                        <h1 className="text-4xl font-extrabold text-white leading-tight">
                            Únete a la nueva era de <span className="text-[#38bdf8]">Gestión Clínica</span>
                        </h1>
                        <p className="text-slate-400">
                            Crea tu cuenta en segundos y obtén tu propio espacio de trabajo seguro para tus pacientes.
                        </p>
                    </div>

                    <div className="mt-12 space-y-4">
                        <div className="flex items-center gap-3 text-slate-300">
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                                <Lock className="w-4 h-4 text-sky-400" />
                            </div>
                            <span className="text-sm">Privacidad NOM-024</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-300">
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                                <History className="w-4 h-4 text-sky-400" />
                            </div>
                            <span className="text-sm">Aislamiento de Datos</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Register Form */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white relative">
                <Link to="/login" className="absolute top-8 left-8 lg:left-12 flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium">
                    <ArrowLeft className="w-4 h-4" />
                    Volver
                </Link>

                <div className="w-full max-w-sm">
                    <div className="mb-10 text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">Comienza ahora</h2>
                        <p className="text-slate-500">Regístrate para obtener tu propia plataforma clínica</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-5">
                        {error && (
                            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100 text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 ml-1">
                                Nombre Completo
                            </label>
                            <Input
                                type="text"
                                placeholder="Dr. Juan Pérez"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                className="h-12 px-4 rounded-xl border-slate-200 focus:border-sky-500 focus:ring-sky-500 transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 ml-1">
                                Correo Electrónico Profesional
                            </label>
                            <Input
                                type="email"
                                placeholder="contacto@clinicamedica.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-12 px-4 rounded-xl border-slate-200 focus:border-sky-500 focus:ring-sky-500 transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 ml-1">
                                Contraseña
                            </label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-12 px-4 rounded-xl border-slate-200 focus:border-sky-500 focus:ring-sky-500 transition-all"
                            />
                            <p className="text-[10px] text-slate-400 ml-1">Mínimo 6 caracteres</p>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 bg-[#1e293b] hover:bg-[#0f172a] text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-slate-200"
                            disabled={loading}
                        >
                            {loading ? 'Creando cuenta...' : 'Crear mi Clínica'}
                        </Button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-slate-500">
                            ¿Ya tienes una cuenta?{' '}
                            <Link to="/login" className="text-sky-600 font-bold hover:underline">
                                Inicia Sesión
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
