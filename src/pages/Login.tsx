import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Stethoscope, User, History, ClipboardPlus, FileText } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                setError(error.message === 'Invalid login credentials'
                    ? 'Correo o contraseña incorrectos'
                    : 'Error al iniciar sesión');
                return;
            }

            // Redirect to admin on success
            navigate('/admin');
        } catch (err) {
            console.error(err);
            setError('Ocurrió un error inesperado');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row font-sans overflow-hidden">
            {/* Left Side: Brand Section */}
            <div className="hidden lg:flex lg:w-3/5 bg-[#0f172a] relative items-center justify-center p-12 overflow-hidden">
                {/* Background Pattern/Watermark */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#1e293b] to-[#0f172a]" />
                <div className="absolute -bottom-24 -right-24 opacity-5 animate-float pointer-events-none">
                    <Stethoscope size={600} strokeWidth={1} className="text-white" />
                </div>
                
                <div className="relative z-10 max-w-xl w-full">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-10 animate-fade-in">
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                            <Stethoscope className="text-white w-7 h-7" />
                        </div>
                        <span className="text-white text-3xl font-bold tracking-tight">MedicAdmin</span>
                    </div>

                    {/* Headline */}
                    <div className="space-y-6 mb-12 animate-slide-up">
                        <h1 className="text-5xl lg:text-6xl font-extrabold text-white leading-[1.1]">
                            Gestión Médica 
                            <span className="block text-[#38bdf8]">Profesional & Segura</span>
                        </h1>
                        <p className="text-slate-400 text-lg lg:text-xl leading-relaxed max-w-md">
                            Optimiza la atención a tus pacientes con nuestra plataforma integral diseñada para la excelencia clínica.
                        </p>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-10 py-10 border-t border-white/10 animate-fade-in animation-delay-300">
                        <div className="flex items-start gap-3">
                            <div className="mt-1 w-10 h-10 rounded-full bg-sky-500/10 flex items-center justify-center flex-shrink-0">
                                <User className="text-sky-400 w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-white font-semibold">Digitalización</p>
                                <p className="text-slate-500 text-sm">Expedientes electrónicos integrales</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-1 w-10 h-10 rounded-full bg-sky-500/10 flex items-center justify-center flex-shrink-0">
                                <History className="text-sky-400 w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-white font-semibold">Historial Médico</p>
                                <p className="text-slate-500 text-sm">Control cronológico de consultas</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-1 w-10 h-10 rounded-full bg-sky-500/10 flex items-center justify-center flex-shrink-0">
                                <ClipboardPlus className="text-sky-400 w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-white font-semibold">Notas de Evolución</p>
                                <p className="text-slate-500 text-sm">Seguimiento clínico especializado</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-1 w-10 h-10 rounded-full bg-sky-500/10 flex items-center justify-center flex-shrink-0">
                                <FileText className="text-sky-400 w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-white font-semibold">Archivos y Estudios</p>
                                <p className="text-slate-500 text-sm">Radiografías y documentos seguros</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white relative">
                <div className="w-full max-w-sm">
                    {/* Header */}
                    <div className="mb-10 text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">Bienvenido de nuevo</h2>
                        <p className="text-slate-500">Ingresa tus credenciales para acceder al panel</p>
                    </div>

                    {/* Form Container */}
                    <div className="bg-white p-2 lg:p-0">
                        <form onSubmit={handleLogin} className="space-y-6">
                            {error && (
                                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100 text-center animate-fade-in">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">
                                    Correo Electrónico
                                </label>
                                <Input
                                    type="email"
                                    placeholder="ejemplo@doctor.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-12 px-4 rounded-xl border-slate-200 focus:border-sky-500 focus:ring-sky-500 transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-sm font-semibold text-slate-700">
                                        Contraseña
                                    </label>
                                </div>
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-12 px-4 rounded-xl border-slate-200 focus:border-sky-500 focus:ring-sky-500 transition-all"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 bg-[#1e293b] hover:bg-[#0f172a] text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-slate-200"
                                disabled={loading}
                            >
                                {loading ? (
                                    'Entrando...'
                                ) : (
                                    <>
                                        Iniciar Sesión
                                        <Lock className="w-4 h-4" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="mt-12 text-center">
                        <p className="text-slate-400 text-sm">
                            © 2026 MedicAdmin. Todos los derechos reservados.
                        </p>
                    </div>
                </div>

                {/* Mobile Tablet Logo (visible only on small screens) */}
                <div className="lg:hidden absolute top-8 left-8 flex items-center gap-2">
                    <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                        <Stethoscope className="text-white w-5 h-5" />
                    </div>
                    <span className="text-slate-900 font-bold">MedicAdmin</span>
                </div>
            </div>
        </div>
    );
};

export default Login;

