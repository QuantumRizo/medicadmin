import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
    MessageCircle, CheckCircle2, XCircle, Loader2,
    Zap, Shield, ChevronRight, Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';


export const WhatsAppSettings = () => {
    const { appId, whatsappLimit } = useAuth();
    const [enabled, setEnabled] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [messagesSent, setMessagesSent] = useState(0);
    const [loadingUsage, setLoadingUsage] = useState(true);

    // Cargar estado actual del toggle desde profiles
    useEffect(() => {
        if (!appId) return;
        const fetch = async () => {
            setLoading(true);
            const { data } = await supabase
                .from('profiles')
                .select('whatsapp_reminders_enabled')
                .eq('app_id', appId)
                .maybeSingle();
            if (data) setEnabled(data.whatsapp_reminders_enabled ?? true);
            setLoading(false);
        };
        fetch();
    }, [appId]);

    // Cargar uso del mes actual
    useEffect(() => {
        if (!appId) return;
        const fetchUsage = async () => {
            setLoadingUsage(true);
            const now = new Date();
            const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const { data } = await supabase
                .from('whatsapp_usage')
                .select('messages_sent')
                .eq('app_id', appId)
                .eq('year_month', yearMonth)
                .maybeSingle();
            setMessagesSent(data?.messages_sent ?? 0);
            setLoadingUsage(false);
        };
        fetchUsage();
    }, [appId]);

    const handleToggle = async (newValue: boolean) => {
        if (!appId) return;
        setSaving(true);
        const { error } = await supabase
            .from('profiles')
            .update({ whatsapp_reminders_enabled: newValue })
            .eq('app_id', appId);

        if (error) {
            toast.error('Error al guardar el cambio');
        } else {
            setEnabled(newValue);
            toast.success(newValue ? 'Recordatorios activados' : 'Recordatorios desactivados');
        }
        setSaving(false);
    };

    const usedPercent = Math.min(100, Math.round((messagesSent / whatsappLimit) * 100));
    const remaining = Math.max(0, whatsappLimit - messagesSent);
    const isPro = whatsappLimit >= 300;

    const barColor = usedPercent >= 90
        ? 'bg-red-500'
        : usedPercent >= 70
            ? 'bg-amber-400'
            : 'bg-emerald-500';

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48">
                <Loader2 className="w-7 h-7 animate-spin text-[#1c334a]" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-2xl">

            {/* Status Card */}
            <Card className="shadow-xl shadow-slate-200/50 border-none rounded-3xl overflow-hidden bg-white">
                <CardHeader className="pb-4 border-b border-slate-50 bg-slate-50/30">
                    <CardTitle className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-[#1c334a]" />
                        Recordatorios Automáticos
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">

                    {/* Toggle principal */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-slate-800">
                                Enviar recordatorio 1 día antes
                            </p>
                            <p className="text-xs text-slate-500 font-medium">
                                Tus pacientes recibirán un WhatsApp automático a las 8:00 AM del día anterior a su cita.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-4">
                            {saving && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                            <Switch
                                id="whatsapp-toggle"
                                checked={enabled}
                                onCheckedChange={handleToggle}
                                disabled={saving}
                                className="data-[state=checked]:bg-emerald-500"
                            />
                        </div>
                    </div>

                    {/* Indicador de estado */}
                    <div className={`flex items-center gap-3 p-3.5 rounded-2xl border text-sm font-semibold ${enabled
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                        : 'bg-slate-50 border-slate-100 text-slate-500'
                        }`}>
                        {enabled
                            ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                            : <XCircle className="w-4 h-4 shrink-0" />
                        }
                        {enabled
                            ? 'Los recordatorios están activos. Se envían automáticamente cada día a las 8:00 AM.'
                            : 'Los recordatorios están pausados. Ningún paciente recibirá mensajes.'
                        }
                    </div>
                </CardContent>
            </Card>

            {/* Cuota del Mes */}
            <Card className="shadow-xl shadow-slate-200/50 border-none rounded-3xl overflow-hidden bg-white">
                <CardHeader className="pb-4 border-b border-slate-50 bg-slate-50/30">
                    <CardTitle className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Zap className="w-4 h-4 text-[#1c334a]" />
                        Uso del Mes Actual
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-5">

                    {/* Plan badge */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border ${isPro
                                ? 'bg-[#1c334a] text-white border-[#1c334a]'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}>
                                {isPro ? <Zap className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                                Plan {isPro ? 'Pro' : 'Free'}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                                {whatsappLimit} mensajes/mes
                            </span>
                        </div>
                        {loadingUsage
                            ? <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
                            : <span className="text-sm font-black text-slate-700">
                                {messagesSent} / {whatsappLimit}
                            </span>
                        }
                    </div>

                    {/* Barra de progreso */}
                    <div className="space-y-2">
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                                style={{ width: `${usedPercent}%` }}
                            />
                        </div>
                        <div className="flex items-center justify-between text-xs font-medium text-slate-400">
                            <span>{usedPercent}% utilizado</span>
                            <span className={remaining === 0 ? 'text-red-500 font-bold' : ''}>
                                {remaining === 0
                                    ? 'Sin mensajes disponibles este mes'
                                    : `${remaining} recordatorios disponibles`
                                }
                            </span>
                        </div>
                    </div>

                    {/* Nota de reset */}
                    <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 shrink-0" />
                        El contador se reinicia automáticamente el 1° de cada mes.
                    </p>
                </CardContent>
            </Card>

            {/* Info de plan */}
            {!isPro && (
                <div className="flex items-start gap-4 bg-gradient-to-r from-[#1c334a]/5 to-sky-50 border border-sky-100 rounded-3xl p-5 text-slate-700 shadow-sm">
                    <div className="w-10 h-10 rounded-2xl bg-[#1c334a] flex items-center justify-center shrink-0">
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div className="space-y-1.5 flex-1 min-w-0">
                        <p className="font-black text-sm text-[#1c334a]">¿Necesitas más recordatorios?</p>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            Con el Plan Pro obtienes hasta <strong>300 recordatorios al mes</strong> (~$70 MXN/mes en mensajes de WhatsApp). Contáctanos para actualizar tu plan.
                        </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                </div>
            )}

            {/* Nota de privacidad */}
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-4 text-amber-800">
                <Shield className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                <p className="text-xs font-medium leading-relaxed">
                    Los mensajes se envían desde un número dedicado exclusivo de tu clínica. Tu número personal permanece privado en todo momento. Los mensajes solo contienen fecha, hora y nombre del paciente.
                </p>
            </div>
        </div>
    );
};
