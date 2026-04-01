import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard, Sparkles, AlertTriangle, Calendar, ExternalLink, ShieldCheck } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export const SubscriptionPage = () => {
    const { subscriptionStatus, planName, trialEndsAt } = useAuth();

    // Calculate days remaining if trial
    const daysRemaining = trialEndsAt 
        ? differenceInDays(parseISO(trialEndsAt), new Date()) 
        : 0;

    const isTrial = subscriptionStatus === 'trial';
    const isActive = subscriptionStatus === 'active';

    const features = [
        "Agenda Médica Multi-sucursal",
        "Expediente Clínico Digital Ilimitado",
        "Recetario Profesional con Firma",
        "Subida de Archivos y Estudios (Premium)",
        "Odontograma Interactivo (Modo Dental)",
        "Soporte Técnico Prioritario",
        "Cumplimiento NOM-024-SSA3-2012"
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-16 animate-in fade-in duration-500">
            {/* Account Status Hero */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-[#0f172a] text-white p-8 md:p-12 shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                    <Sparkles className="w-48 h-48" />
                </div>
                
                <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-4">
                        <Badge className={`${
                            isActive ? 'bg-green-500' : isTrial ? 'bg-sky-500' : 'bg-red-500'
                        } text-white border-none py-1 px-4 rounded-full font-bold uppercase tracking-widest text-[10px]`}>
                            Estado: {isActive ? 'Cuenta Activa' : isTrial ? 'Periodo de Prueba' : 'Suscripción Vencida'}
                        </Badge>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                            {isActive ? 'Tu Plan Premium está activo' : 'Potencia tu Clínica con Premium'}
                        </h2>
                        <p className="text-slate-400 text-lg font-medium max-w-md">
                            Gestión integral, seguridad de datos y cumplimiento normativo en una sola plataforma.
                        </p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-bold uppercase tracking-wider text-xs">Plan Actual</span>
                            <span className="text-sky-400 font-black">{planName}</span>
                        </div>
                        
                        {isTrial && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-bold">
                                    <span>Prueba gratuita</span>
                                    <span className="text-sky-300">{daysRemaining} días restantes</span>
                                </div>
                                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-sky-500 transition-all duration-1000" 
                                        style={{ width: `${(daysRemaining / 30) * 100}%` }}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-500 text-center italic">
                                    Vence el {trialEndsAt ? format(parseISO(trialEndsAt), "d 'de' MMMM, yyyy", { locale: es }) : '-'}
                                </p>
                            </div>
                        )}

                        {isActive && (
                            <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-2xl border border-green-500/20 text-green-400">
                                <ShieldCheck className="w-5 h-5 shrink-0" />
                                <span className="text-xs font-bold uppercase tracking-wider">Tu cuenta cumple con todos los requisitos premium.</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {!isActive ? (
                <div className="grid md:grid-cols-3 gap-8">
                    {/* Pricing Card */}
                    <Card className="md:col-span-1 rounded-[2rem] border-none shadow-xl shadow-slate-200 overflow-hidden bg-white flex flex-col">
                        <div className="p-8 bg-slate-50 border-b border-slate-100 text-center space-y-2">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Suscripción Mensual</span>
                            <div className="flex items-center justify-center gap-1">
                                <span className="text-2xl font-bold text-slate-400 mt-2">$</span>
                                <span className="text-6xl font-black text-[#1c334a]">500</span>
                                <span className="text-lg font-bold text-slate-400 mt-4">+ IVA</span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">Total: $580.00 MXN al mes</p>
                        </div>
                        
                        <CardContent className="p-8 flex-1 space-y-6">
                            <div className="space-y-4">
                                <p className="text-sm font-black text-[#1c334a] uppercase tracking-wider">Incluye:</p>
                                <ul className="space-y-3">
                                    {features.map((f, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-600 leading-tight">
                                            <div className="mt-1 bg-green-100 p-0.5 rounded-full text-green-600 shrink-0">
                                                <Check className="w-3 h-3" />
                                            </div>
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="pt-4">
                                <Button 
                                    className="w-full h-14 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl font-black shadow-lg shadow-sky-200 transition-all active:scale-95 group"
                                    onClick={() => window.open('https://buy.stripe.com/test_dR63ee7v3dE806s9AA', '_blank')} // Placeholder link
                                >
                                    <CreditCard className="w-5 h-5 mr-2" />
                                    Activar suscripción
                                    <ExternalLink className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </Button>
                                <p className="text-[10px] text-slate-400 text-center mt-4 px-4 leading-relaxed font-medium">
                                    Al pagar, recibirás una confirmación por correo. Tu cuenta se activará automáticamente tras la validación del pago.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Info Cards */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="grid sm:grid-cols-2 gap-6">
                            <Card className="rounded-3xl border-none shadow-lg shadow-slate-100 bg-white p-6 space-y-4 group hover:shadow-xl transition-all">
                                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <h4 className="font-black text-[#1c334a]">Seguridad Bancaria</h4>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                    Procesamos todos nuestros pagos a través de Stripe, líder mundial en seguridad de pagos. Tus datos bancarios nunca tocan nuestros servidores.
                                </p>
                            </Card>

                            <Card className="rounded-3xl border-none shadow-lg shadow-slate-100 bg-white p-6 space-y-4 group hover:shadow-xl transition-all">
                                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <h4 className="font-black text-[#1c334a]">Facturación Automática</h4>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                    Si requieres factura XML/PDF, podrás solicitarla directamente al finalizar tu pago en Stripe o contactar con nuestro equipo para el seguimiento.
                                </p>
                            </Card>
                        </div>

                        <Card className="rounded-3xl border-none shadow-lg shadow-slate-100 bg-white overflow-hidden">
                            <CardHeader className="bg-slate-50/50 p-6 border-b border-slate-100">
                                <CardTitle className="text-lg font-black text-[#1c334a] flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-sky-500" /> Historial de Pagos
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="flex flex-col items-center justify-center py-16 text-slate-300">
                                    <CreditCard className="w-12 h-12 mb-4 opacity-20" />
                                    <p className="text-sm font-bold">Aún no hay transacciones registradas.</p>
                                    <p className="text-[11px] font-medium">Tus próximos pagos aparecerán listados aquí.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-8">
                    <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200 bg-white p-8 space-y-6">
                        <div className="w-16 h-16 rounded-2xl bg-green-50 text-green-500 flex items-center justify-center">
                            <Sparkles className="w-8 h-8" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-[#1c334a]">¡Gracias por tu confianza!</h3>
                            <p className="text-slate-500 font-medium">
                                Tu plan <span className="text-sky-500 font-bold">{planName}</span> está activo y tienes acceso completo a todas las herramientas premium de MedicAdmin.
                            </p>
                        </div>
                        <ul className="space-y-3 pt-4">
                            {features.map((f, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-600">
                                    <div className="mt-1 bg-green-100 p-0.5 rounded-full text-green-600 shrink-0">
                                        <Check className="w-3 h-3" />
                                    </div>
                                    {f}
                                </li>
                            ))}
                        </ul>
                    </Card>

                    <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200 bg-white overflow-hidden flex flex-col">
                        <CardHeader className="p-8 bg-slate-50 border-b border-slate-100">
                            <CardTitle className="text-xl font-black text-[#1c334a]">Información de Cuenta</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 flex-1 flex flex-col justify-center items-center text-center space-y-4">
                            <div className="w-20 h-20 rounded-full bg-sky-50 flex items-center justify-center text-sky-500">
                                <ShieldCheck className="w-10 h-10" />
                            </div>
                            <div className="space-y-1">
                                <p className="font-black text-[#1c334a]">Suscripción Protegida</p>
                                <p className="text-sm text-slate-500 font-medium">
                                    Tu cuenta está vinculada a tu app_id y cifrada de extremo a extremo.
                                </p>
                            </div>
                            <Button variant="outline" className="mt-6 rounded-xl font-bold border-slate-200 text-slate-600">
                                Gestionar Facturación
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};
