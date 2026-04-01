import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Stethoscope, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

const UpdatePassword = () => {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Supabase automatic detection of auth hash (recovery token)
        // Happens automatically when the user clicks the email link.
        // If they visit this page directly without a session, it might fail.
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setError('El enlace ha expirado o es inválido. Por favor solicita uno nuevo.');
            }
        };
        checkSession();
    }, []);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) {
                setError(error.message);
                return;
            }

            setSuccess(true);
            toast.success('Contraseña actualizada correctamente');
            setTimeout(() => navigate('/login'), 3000);
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
                <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-12 text-center space-y-6">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200">
                        <ShieldCheck className="text-green-600 w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 leading-tight">Seguridad Actualizada</h2>
                    <p className="text-slate-600">
                        Tu nueva contraseña ha sido establecida con éxito. Ya puedes iniciar sesión de forma normal.
                    </p>
                    <p className="text-sm text-slate-400">Redirigiendo al login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 font-sans">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 lg:p-12">
                <div className="flex justify-center mb-8">
                    <div className="w-16 h-16 bg-[#1e293b] rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
                        <Stethoscope className="text-white w-9 h-9" />
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Restablecer Contraseña</h1>
                    <p className="text-slate-500 text-sm">
                        Ingresa tu nueva contraseña para recuperar el acceso a tu plataforma médica.
                    </p>
                </div>

                <form onSubmit={handleUpdate} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-100 text-center animate-fade-in font-medium">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">
                            Nueva Contraseña
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="h-12 pl-11 pr-4 rounded-xl border-slate-200 focus:border-sky-500 focus:ring-sky-500 transition-all w-full"
                                disabled={!!error && !password}
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 ml-1 italic">
                            Por seguridad, elige una contraseña que no uses en otros sitios.
                        </p>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 bg-[#1e293b] hover:bg-[#0f172a] text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-slate-200"
                        disabled={loading || (!!error && !password)}
                    >
                        {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default UpdatePassword;
