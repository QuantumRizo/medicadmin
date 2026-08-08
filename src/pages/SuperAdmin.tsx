import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    Users, MessageCircle, Calendar, Crown,
    Shield, TrendingUp, Loader2, RefreshCw, ChevronUp,
    ChevronDown, Stethoscope, LogOut, ToggleLeft, ToggleRight,
    AlertTriangle, Clock, CheckCircle2
} from 'lucide-react';

import { format, differenceInDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// ─── Tipos ───────────────────────────────────────────────────
interface DoctorStat {
    profile_id: string;
    app_id: string;
    full_name: string;
    email: string;
    subscription_status: string;
    plan_name: string;
    trial_ends_at: string | null;
    whatsapp_enabled: boolean;
    whatsapp_limit: number;
    whatsapp_sent: number;
    max_file_size_mb: number;
    storage_limit_mb: number | null;
    storage_used_bytes: number;
    appointments_month: number;
    created_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────
function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
    const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
    return (
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
            <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
        </div>
    );
}

// ─── Componente Principal ─────────────────────────────────────
export default function SuperAdminPage() {
    const { isSuperAdmin, fullName, signOut } = useAuth();
    const navigate = useNavigate();

    const [doctors, setDoctors] = useState<DoctorStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<keyof DoctorStat>('created_at');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    // Redirigir si no es super admin
    useEffect(() => {
        if (!isSuperAdmin) navigate('/admin', { replace: true });
    }, [isSuperAdmin, navigate]);

    const fetchDoctors = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_admin_doctor_stats');
        if (error) {
            toast.error('Error al cargar datos: ' + error.message);
        } else {
            setDoctors(data || []);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

    const handleSetPlan = async (appId: string, plan: 'Free' | 'Pro') => {
        setUpdatingId(appId);
        const { error } = await supabase.rpc('admin_set_plan', { p_app_id: appId, p_plan: plan });
        if (error) {
            toast.error('Error al cambiar plan: ' + error.message);
        } else {
            toast.success(`Plan actualizado a ${plan}`);
            await fetchDoctors();
        }
        setUpdatingId(null);
    };

    // Filtrado y ordenamiento
    const sorted = [...doctors]
        .filter(d =>
            d.full_name.toLowerCase().includes(search.toLowerCase()) ||
            d.email.toLowerCase().includes(search.toLowerCase()) ||
            d.app_id.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => {
            const av = a[sortKey] ?? '';
            const bv = b[sortKey] ?? '';
            const cmp = String(av).localeCompare(String(bv), 'es', { numeric: true });
            return sortDir === 'asc' ? cmp : -cmp;
        });

    const toggleSort = (key: keyof DoctorStat) => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('desc'); }
    };

    // KPIs globales
    const totalDoctors = doctors.length;
    const proCount = doctors.filter(d => d.plan_name === 'Pro').length;
    const freeCount = totalDoctors - proCount;
    const totalAppts = doctors.reduce((s, d) => s + d.appointments_month, 0);
    const totalWA = doctors.reduce((s, d) => s + d.whatsapp_sent, 0);

    if (!isSuperAdmin) return null;

    const SortIcon = ({ col }: { col: keyof DoctorStat }) => (
        sortKey === col
            ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3 inline ml-0.5" /> : <ChevronDown className="w-3 h-3 inline ml-0.5" />)
            : <span className="w-3 h-3 inline ml-0.5 opacity-0 group-hover:opacity-40"><ChevronDown className="w-3 h-3" /></span>
    );

    return (
        <div className="min-h-screen bg-[#0a0f1a] text-white font-sans">

            {/* Top nav */}
            <header className="sticky top-0 z-50 bg-[#0a0f1a]/90 backdrop-blur border-b border-white/5 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
                        <Stethoscope className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <span className="font-black tracking-tight text-white">MedicAdmin</span>
                        <span className="ml-2 text-[10px] bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-full px-2 py-0.5 font-bold uppercase tracking-wider">
                            Super Admin
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-400 hidden sm:block">Hola, <span className="text-white font-bold">{fullName}</span></span>
                    <button
                        onClick={fetchDoctors}
                        className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                        title="Actualizar"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => { signOut(); navigate('/login'); }}
                        className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                        title="Cerrar sesión"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

                {/* KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: 'Doctores', value: totalDoctors, icon: Users, color: 'text-sky-400', bg: 'bg-sky-500/10' },
                        { label: 'Plan Pro', value: proCount, icon: Crown, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                        { label: 'Plan Free', value: freeCount, icon: Shield, color: 'text-slate-400', bg: 'bg-slate-500/10' },
                        { label: 'Citas este mes', value: totalAppts, icon: Calendar, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    ].map(kpi => (
                        <div key={kpi.label} className="bg-white/5 border border-white/8 rounded-2xl p-5 space-y-3">
                            <div className={`w-9 h-9 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                            </div>
                            <div>
                                <div className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</div>
                                <div className="text-xs text-slate-500 font-medium mt-0.5">{kpi.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Barra WA global */}
                <div className="bg-white/5 border border-white/8 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                        <MessageCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between text-sm font-bold mb-1">
                            <span className="text-slate-300">WhatsApp enviados este mes (total)</span>
                            <span className="text-green-400">{totalWA} msgs</span>
                        </div>
                        <div className="text-xs text-slate-500">Suma de todos los doctores · {doctors.filter(d => d.whatsapp_enabled).length} con recordatorios activos</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-slate-500" />
                        <span className="text-xs text-slate-400 font-bold">{Math.round(totalWA / Math.max(1, totalDoctors))} prom/doctor</span>
                    </div>
                </div>

                {/* Búsqueda */}
                <div className="flex gap-3 items-center">
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar doctor, email o ID..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30 transition-all"
                    />
                    <span className="text-xs text-slate-500 shrink-0">{sorted.length} doctores</span>
                </div>

                {/* Tabla */}
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
                    </div>
                ) : sorted.length === 0 ? (
                    <div className="text-center py-24 text-slate-500 font-medium">No se encontraron doctores.</div>
                ) : (
                    <div className="space-y-3">
                        {/* Header ordenable — solo desktop */}
                        <div className="hidden lg:grid grid-cols-12 gap-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <button className="col-span-3 text-left group flex items-center" onClick={() => toggleSort('full_name')}>
                                Doctor <SortIcon col="full_name" />
                            </button>
                            <button className="col-span-1 text-center group" onClick={() => toggleSort('plan_name')}>
                                Plan <SortIcon col="plan_name" />
                            </button>
                            <button className="col-span-2 text-center group" onClick={() => toggleSort('trial_ends_at')}>
                                Trial <SortIcon col="trial_ends_at" />
                            </button>
                            <button className="col-span-2 text-center group" onClick={() => toggleSort('appointments_month')}>
                                Citas/mes <SortIcon col="appointments_month" />
                            </button>
                            <button className="col-span-2 text-center group" onClick={() => toggleSort('whatsapp_sent')}>
                                WhatsApp <SortIcon col="whatsapp_sent" />
                            </button>
                            <div className="col-span-1 text-center">Storage</div>
                            <div className="col-span-1 text-center">Acción</div>
                        </div>

                        {sorted.map(doc => {
                            const isPro = doc.plan_name === 'Pro';
                            const daysLeft = doc.trial_ends_at
                                ? differenceInDays(parseISO(doc.trial_ends_at), new Date())
                                : null;
                            const trialExpired = daysLeft !== null && daysLeft < 0;
                            const waUsedPct = Math.min(100, Math.round((doc.whatsapp_sent / doc.whatsapp_limit) * 100));
                            const storageUsedMB = doc.storage_used_bytes / (1024 * 1024);
                            const storagePct = doc.storage_limit_mb
                                ? Math.min(100, Math.round((storageUsedMB / doc.storage_limit_mb) * 100))
                                : 0;
                            const isUpdating = updatingId === doc.app_id;

                            return (
                                <div
                                    key={doc.app_id}
                                    className="bg-white/[0.04] hover:bg-white/[0.07] border border-white/8 rounded-2xl p-5 transition-all"
                                >
                                    {/* Grid desktop */}
                                    <div className="lg:grid lg:grid-cols-12 lg:gap-3 lg:items-center space-y-4 lg:space-y-0">

                                        {/* Doctor info */}
                                        <div className="lg:col-span-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center shrink-0 font-black text-slate-300 text-sm">
                                                    {doc.full_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-white text-sm truncate">{doc.full_name}</p>
                                                    <p className="text-xs text-slate-400 truncate">{doc.email}</p>
                                                    <p className="text-[10px] text-slate-600 font-mono">{doc.app_id}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Plan */}
                                        <div className="lg:col-span-1 flex lg:justify-center">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                                isPro
                                                    ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                                                    : 'bg-slate-500/20 border-slate-500/30 text-slate-400'
                                            }`}>
                                                {isPro ? <Crown className="w-2.5 h-2.5" /> : <Shield className="w-2.5 h-2.5" />}
                                                {doc.plan_name}
                                            </span>
                                        </div>

                                        {/* Trial */}
                                        <div className="lg:col-span-2 lg:text-center">
                                            {isPro ? (
                                                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold lg:justify-center">
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    Activo
                                                </div>
                                            ) : trialExpired ? (
                                                <div className="flex items-center gap-1.5 text-red-400 text-xs font-bold lg:justify-center">
                                                    <AlertTriangle className="w-3.5 h-3.5" />
                                                    Expirado
                                                </div>
                                            ) : daysLeft !== null ? (
                                                <div className={`flex items-center gap-1.5 text-xs font-bold lg:justify-center ${daysLeft <= 5 ? 'text-amber-400' : 'text-slate-400'}`}>
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {daysLeft}d restantes
                                                </div>
                                            ) : <span className="text-slate-600 text-xs">—</span>}
                                            {doc.created_at && (
                                                <p className="text-[10px] text-slate-600 mt-0.5 lg:text-center">
                                                    Desde {format(new Date(doc.created_at), "d MMM yy", { locale: es })}
                                                </p>
                                            )}
                                        </div>

                                        {/* Citas */}
                                        <div className="lg:col-span-2">
                                            <div className="flex items-center justify-between lg:justify-center gap-2">
                                                <span className="text-xs text-slate-400 lg:hidden">Citas este mes:</span>
                                                <span className="text-lg font-black text-white">{doc.appointments_month}</span>
                                            </div>
                                        </div>

                                        {/* WhatsApp */}
                                        <div className="lg:col-span-2">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs text-slate-400 lg:hidden">WhatsApp:</span>
                                                <div className="flex items-center gap-1.5">
                                                    {doc.whatsapp_enabled
                                                        ? <ToggleRight className="w-3.5 h-3.5 text-green-400" />
                                                        : <ToggleLeft className="w-3.5 h-3.5 text-slate-500" />
                                                    }
                                                    <span className="text-xs font-bold text-white">{doc.whatsapp_sent}/{doc.whatsapp_limit}</span>
                                                </div>
                                            </div>
                                            <MiniBar
                                                value={doc.whatsapp_sent}
                                                max={doc.whatsapp_limit}
                                                color={waUsedPct >= 90 ? 'bg-red-500' : waUsedPct >= 70 ? 'bg-amber-400' : 'bg-green-500'}
                                            />
                                        </div>

                                        {/* Storage */}
                                        <div className="lg:col-span-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs text-slate-400 lg:hidden">Storage:</span>
                                                <span className="text-xs font-bold text-white">
                                                    {formatBytes(doc.storage_used_bytes)}
                                                    {doc.storage_limit_mb && <span className="text-slate-500">/{doc.storage_limit_mb}MB</span>}
                                                    {!doc.storage_limit_mb && <span className="text-slate-500"> ∞</span>}
                                                </span>
                                            </div>
                                            {doc.storage_limit_mb && (
                                                <MiniBar
                                                    value={storagePct}
                                                    max={100}
                                                    color={storagePct >= 90 ? 'bg-red-500' : storagePct >= 70 ? 'bg-amber-400' : 'bg-sky-500'}
                                                />
                                            )}
                                        </div>

                                        {/* Acción */}
                                        <div className="lg:col-span-1 flex lg:justify-center">
                                            {isUpdating ? (
                                                <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
                                            ) : isPro ? (
                                                <button
                                                    onClick={() => handleSetPlan(doc.app_id, 'Free')}
                                                    className="text-[10px] font-black px-3 py-1.5 rounded-lg border border-slate-600 text-slate-400 hover:border-red-500/50 hover:text-red-400 transition-all"
                                                >
                                                    → Free
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleSetPlan(doc.app_id, 'Pro')}
                                                    className="text-[10px] font-black px-3 py-1.5 rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-all"
                                                >
                                                    → Pro ✦
                                                </button>
                                            )}
                                        </div>

                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Footer */}
                <p className="text-center text-[10px] text-slate-700 font-medium pt-4">
                    MedicAdmin Super Admin Panel · Solo accesible para el dueño del sistema
                </p>
            </div>
        </div>
    );
}
