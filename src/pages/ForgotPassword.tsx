import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Stethoscope, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Note: In local development/standard Supabase, this will send an email
            // via their default SMTP server with a link to /update-password
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password`,
            });

            if (error) {
                setError(error.message);
                return;
            }

            setSuccess(true);
        } catch (err) {
            console.error(err);
            setError('Ocurrió un error inesperado');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 font-sans">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 lg:p-12 relative overflow-hidden">
                {/* Decoration */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-sky-50 rounded-full blur-3xl opacity-60" />
                
                <div className="relative z-10">
                    <div className="flex justify-center mb-8">
                        <div className="w-16 h-16 bg-[#1e293b] rounded-2xl flex items-center justify-center shadow-lg">
                            <Stethoscope className="text-white w-9 h-9" />
                        </div>
                    </div>

                    {!success ? (
                        <>
                            <div className="text-center mb-8">
                                <h1 className="text-2xl font-bold text-slate-900 mb-2">¿Olvidaste tu contraseña?</h1>
                                <p className="text-slate-500 text-sm">
                                    No te preocupes. Ingresa tu correo y te enviaremos un enlace para restablecerla.
                                </p>
                            </div>

                            <form onSubmit={handleReset} className="space-y-6">
                                {error && (
                                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100 text-center">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 ml-1">
                                        Correo Electrónico
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            type="email"
                                            placeholder="tu@correo.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="h-12 pl-11 pr-4 rounded-xl border-slate-200 focus:border-sky-500 focus:ring-sky-500 transition-all w-full"
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 bg-[#1e293b] hover:bg-[#0f172a] text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-slate-200"
                                    disabled={loading}
                                >
                                    {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                                </Button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center space-y-6 animate-fade-in">
                            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100">
                                <CheckCircle2 className="text-green-500 w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 leading-tight">Enlace enviado</h2>
                            <p className="text-slate-500 text-sm leading-relaxed">
                                Hemos enviado instrucciones a <span className="font-bold text-slate-700">{email}</span>. 
                                Revisa tu bandeja de entrada y sigue el enlace para cambiar tu contraseña.
                            </p>
                        </div>
                    )}

                    <div className="mt-10 text-center">
                        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-600 hover:text-sky-700 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            Volver al inicio de sesión
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
