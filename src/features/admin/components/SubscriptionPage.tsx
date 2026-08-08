import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Check, Sparkles, ShieldCheck,
    Calendar, Clock, Star, ArrowRight, HardDrive
} from 'lucide-react';


import { differenceInDays, parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getNow } from '@/lib/dateUtils';

const FREE_FEATURES = [
    { icon: Calendar,       text: 'Agenda médica multi-sucursal' },
    { icon: ShieldCheck,    text: 'Expediente clínico digital ilimitado' },
    { icon: Star,           text: 'Recetario profesional con firma' },
    { icon: ShieldCheck,    text: 'Cumplimiento NOM-024-SSA3-2012' },
    { icon: HardDrive,      text: 'Archivos: 5 MB / archivo · 100 MB total' },
];

const PRO_FEATURES = [
    { icon: Calendar,       text: 'Agenda médica multi-sucursal' },
    { icon: ShieldCheck,    text: 'Expediente clínico digital ilimitado' },
    { icon: Star,           text: 'Recetario profesional con firma' },
    { icon: ShieldCheck,    text: 'Cumplimiento NOM-024-SSA3-2012' },
    { icon: HardDrive,      text: 'Archivos: 25 MB / archivo · Almacenamiento ilimitado' },
    { icon: ShieldCheck,    text: 'Soporte técnico prioritario' },
];

export const SubscriptionPage = () => {
    const { subscriptionStatus, planName, trialEndsAt } = useAuth();

    const isPro = subscriptionStatus === 'active';
    const isFree = !isPro;

    const daysRemaining = trialEndsAt
        ? Math.max(0, differenceInDays(parseISO(trialEndsAt), getNow()))
        : 0;

    const trialPercent = trialEndsAt
        ? Math.max(0, Math.min(100, Math.round((daysRemaining / 30) * 100)))
        : 0;

    const trialColor = daysRemaining > 10
        ? 'bg-sky-500'
        : daysRemaining > 3
            ? 'bg-amber-400'
            : 'bg-red-500';

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-16 animate-in fade-in duration-500">

            {/* Hero — Estado actual */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-[#0f172a] text-white p-8 md:p-12 shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                    <Sparkles className="w-48 h-48" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                    <div className="space-y-3">
                        <Badge className={`${isPro ? 'bg-emerald-500' : 'bg-sky-500'} text-white border-none py-1.5 px-4 rounded-full font-black uppercase tracking-widest text-[10px]`}>
                            {isPro ? 'Plan Pro — Activo' : 'Plan Free — Período de Prueba'}
                        </Badge>
                        <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
                            {isPro
                                ? '¡Bienvenido al Plan Pro!'
                                : 'Tu mes de prueba gratuita'}
                        </h2>
                        <p className="text-slate-400 font-medium max-w-md">
                            {isPro
                                ? 'Tienes acceso completo a todas las herramientas de MedicAdmin.'
                                : 'Explora todas las funciones. Cuando termine tu prueba, elige el Plan Pro para seguir sin interrupciones.'}
                        </p>
                    </div>

                    {/* Panel de estado */}
                    <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 space-y-4 w-full md:w-72 shrink-0">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-bold uppercase tracking-wider text-xs">Plan Actual</span>
                            <span className={`font-black text-sm ${isPro ? 'text-emerald-400' : 'text-sky-400'}`}>{planName}</span>
                        </div>

                        {isFree && trialEndsAt && (
                            <div className="space-y-2.5">
                                <div className="flex justify-between text-sm font-bold">
                                    <span className="flex items-center gap-1.5 text-slate-300">
                                        <Clock className="w-3.5 h-3.5" />
                                        Días restantes
                                    </span>
                                    <span className={daysRemaining <= 3 ? 'text-red-400' : 'text-sky-300'}>
                                        {daysRemaining} días
                                    </span>
                                </div>
                                <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${trialColor}`}
                                        style={{ width: `${trialPercent}%` }}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-500 text-center font-medium">
                                    Vence el {format(parseISO(trialEndsAt), "d 'de' MMMM, yyyy", { locale: es })}
                                </p>
                            </div>
                        )}

                        {isPro && (
                            <div className="flex items-center gap-3 p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400">
                                <ShieldCheck className="w-5 h-5 shrink-0" />
                                <span className="text-xs font-bold">Acceso completo activo</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Comparativa de planes */}
            <div className="grid md:grid-cols-2 gap-6">

                {/* Tarjeta Plan Free */}
                <div className={`relative rounded-[2rem] overflow-hidden border-2 transition-all ${isFree ? 'border-sky-400 shadow-xl shadow-sky-100' : 'border-slate-100 shadow-lg shadow-slate-100 opacity-70'} bg-white`}>
                    {isFree && (
                        <div className="absolute top-4 right-4">
                            <Badge className="bg-sky-100 text-sky-700 border-none font-black text-[10px] uppercase tracking-wider px-3 py-1 rounded-full">
                                Tu plan actual
                            </Badge>
                        </div>
                    )}
                    <div className="p-8 border-b border-slate-50 bg-slate-50/50">
                        <div className="space-y-1 mb-4">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Plan Free</p>
                            <div className="flex items-end gap-1">
                                <span className="text-5xl font-black text-[#1c334a]">$0</span>
                                <span className="text-slate-400 font-bold mb-1.5">/ 30 días</span>
                            </div>
                            <p className="text-xs text-slate-400 font-medium">Un mes de prueba gratuita, sin tarjeta.</p>
                        </div>
                    </div>
                    <CardContent className="p-8">
                        <ul className="space-y-3.5">
                            {FREE_FEATURES.map((f, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm font-medium text-slate-600">
                                    <div className="w-5 h-5 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
                                        <Check className="w-3 h-3 text-sky-600" />
                                    </div>
                                    {f.text}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </div>

                {/* Tarjeta Plan Pro */}
                <div className={`relative rounded-[2rem] overflow-hidden border-2 transition-all ${isPro ? 'border-emerald-400 shadow-xl shadow-emerald-100' : 'border-[#1c334a] shadow-xl shadow-slate-200'} bg-white`}>
                    {/* Recomendado badge */}
                    {!isPro && (
                        <div className="absolute top-0 left-0 right-0 bg-[#1c334a] text-white text-center py-2 text-[10px] font-black uppercase tracking-widest">
                            Recomendado
                        </div>
                    )}
                    {isPro && (
                        <div className="absolute top-4 right-4">
                            <Badge className="bg-emerald-100 text-emerald-700 border-none font-black text-[10px] uppercase tracking-wider px-3 py-1 rounded-full">
                                Tu plan actual
                            </Badge>
                        </div>
                    )}
                    <div className={`p-8 border-b border-slate-50 bg-[#0f172a]/[0.02] ${!isPro ? 'pt-14' : ''}`}>
                        <div className="space-y-1 mb-4">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Plan Pro</p>
                            <div className="flex items-end gap-1">
                                <span className="text-2xl font-bold text-slate-400 mb-1.5">$</span>
                                <span className="text-5xl font-black text-[#1c334a]">699</span>
                                <span className="text-slate-400 font-bold mb-1.5">+ IVA / mes</span>
                            </div>
                            <p className="text-xs text-slate-400 font-medium">$810.84 MXN con IVA. Sin contratos, cancela cuando quieras.</p>

                        </div>
                    </div>
                    <CardContent className="p-8">
                        <ul className="space-y-3.5">
                            {PRO_FEATURES.map((f, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm font-medium text-slate-600">
                                    <div className="w-5 h-5 rounded-full bg-[#1c334a]/10 flex items-center justify-center shrink-0">
                                        <Check className="w-3 h-3 text-[#1c334a]" />
                                    </div>
                                    {f.text}
                                </li>
                            ))}
                        </ul>

                        {!isPro && (
                            <div className="mt-8 p-4 bg-[#0f172a]/5 rounded-2xl border border-[#1c334a]/10">
                                <div className="flex items-start gap-3">
                                    <ArrowRight className="w-4 h-4 text-[#1c334a] shrink-0 mt-0.5" />
                                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                        Para activar el Plan Pro, contáctanos directamente. Tu cuenta se actualiza de inmediato una vez confirmado el pago.
                                    </p>
                                </div>
                            </div>
                        )}

                        {isPro && (
                            <div className="mt-8 flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-700">
                                <ShieldCheck className="w-5 h-5 shrink-0" />
                                <p className="text-xs font-bold">Tienes acceso completo al Plan Pro.</p>
                            </div>
                        )}
                    </CardContent>
                </div>
            </div>

            {/* Nota de seguridad / pie */}
            <Card className="border-none shadow-sm bg-slate-50 rounded-3xl">
                <CardContent className="p-6 flex items-start gap-4">
                    <ShieldCheck className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        MedicAdmin cumple con la <strong>NOM-024-SSA3-2012</strong> y la Ley Federal de Protección de Datos Personales. Todos los datos clínicos están cifrados y almacenados en servidores seguros en la nube. Tu información y la de tus pacientes nunca se comparte con terceros.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};
