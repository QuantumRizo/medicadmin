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

// ─── Componente de Contenido (reutilizable en tab o página) ───
export const SuperAdminContent = () => {
    const { isSuperAdmin } = useAuth();
    const [doctors, setDoctors] = useState<DoctorStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<keyof DoctorStat>('created_at');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

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
            toast.success(`Plan de ${appId} cambiado a ${plan}`);
            await fetchDoctors();
        }
        setUpdatingId(null);
    };

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
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Doctores', value: totalDoctors, icon: Users, color: 'text-[#1c334a]', bg: 'bg-[#1c334a]/10' },
                    { label: 'Plan Pro', value: proCount, icon: Crown, color: 'text-[#1c334a]', bg: 'bg-[#1c334a]/10' },
                    { label: 'Plan Free', value: freeCount, icon: Shield, color: 'text-slate-500', bg: 'bg-slate-100' },
                    { label: 'Citas este mes', value: totalAppts, icon: Calendar, color: 'text-[#1c334a]', bg: 'bg-[#1c334a]/10' },
                ].map(kpi => (
                    <div key={kpi.label} className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 space-y-3">
                        <div className={`w-10 h-10 rounded-2xl ${kpi.bg} flex items-center justify-center`}>
                            <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                        </div>
                        <div>
                            <div className={`text-3xl font-black ${kpi.color}`}>{kpi.value}</div>
                            <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">{kpi.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Banner WhatsApp global */}
            <div className="bg-gradient-to-r from-[#1c334a]/10 to-[#1c334a]/5 border border-[#1c334a]/15 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-[#1c334a] text-white flex items-center justify-center shrink-0 shadow-md">
                    <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-center text-sm font-black text-[#1c334a] mb-1">
                        <span>WhatsApp enviados este mes (total global)</span>
                        <span className="text-[#1c334a] text-lg font-black">{totalWA} msgs</span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                        Sumatoria de todas las clínicas · {doctors.filter(d => d.whatsapp_enabled).length} de {totalDoctors} doctores tienen recordatorios activos.
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
                    <TrendingUp className="w-4 h-4 text-[#1c334a]" />
                    <span className="text-xs font-bold text-slate-700">{Math.round(totalWA / Math.max(1, totalDoctors))} prom/doctor</span>
                </div>
            </div>

            {/* Barra de Búsqueda y Filtro */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por nombre de doctor, correo o ID..."
                        className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1c334a] focus:ring-2 focus:ring-[#1c334a]/10 shadow-sm transition-all font-medium"
                    />
                </div>
                <div className="flex items-center gap-3 justify-end">
                    <button
                        onClick={fetchDoctors}
                        className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                        title="Actualizar datos"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-2 rounded-xl">
                        {sorted.length} doctores
                    </span>
                </div>
            </div>

            {/* Tabla de Doctores */}
            {loading ? (
                <div className="flex items-center justify-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <Loader2 className="w-8 h-8 animate-spin text-[#1c334a]" />
                </div>
            ) : sorted.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-3xl border border-slate-100 text-slate-400 font-bold">
                    No se encontraron doctores registrados.
                </div>
            ) : (
                <div className="space-y-3">
                    {/* Header ordenable */}
                    <div className="hidden lg:grid grid-cols-12 gap-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <button className="col-span-3 text-left group flex items-center" onClick={() => toggleSort('full_name')}>
                            Doctor / Clínica <SortIcon col="full_name" />
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
                                className="bg-white border border-slate-100 hover:border-slate-300 rounded-3xl p-6 transition-all shadow-sm hover:shadow-md"
                            >
                                <div className="lg:grid lg:grid-cols-12 lg:gap-3 lg:items-center space-y-4 lg:space-y-0">
                                    {/* Info doctor */}
                                    <div className="lg:col-span-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-[#1c334a] text-white flex items-center justify-center shrink-0 font-black text-sm shadow-md">
                                                {doc.full_name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-extrabold text-slate-800 text-sm truncate">{doc.full_name}</p>
                                                <p className="text-xs text-slate-400 font-medium truncate">{doc.email}</p>
                                                <p className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">{doc.app_id}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Badge Plan */}
                                    <div className="lg:col-span-1 flex lg:justify-center">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                            isPro
                                                ? 'bg-[#1c334a] text-white border-[#1c334a]'
                                                : 'bg-slate-100 border-slate-200 text-slate-600'
                                        }`}>
                                            {isPro ? <Crown className="w-3 h-3 text-amber-300" /> : <Shield className="w-3 h-3 text-slate-400" />}
                                            {doc.plan_name}
                                        </span>
                                    </div>

                                    {/* Estado Trial */}
                                    <div className="lg:col-span-2 lg:text-center">
                                        {isPro ? (
                                            <div className="flex items-center gap-1.5 text-[#1c334a] text-xs font-black lg:justify-center">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Activo (Pro)
                                            </div>
                                        ) : trialExpired ? (
                                            <div className="flex items-center gap-1.5 text-red-500 text-xs font-bold lg:justify-center">
                                                <AlertTriangle className="w-4 h-4" /> Expirado
                                            </div>
                                        ) : daysLeft !== null ? (
                                            <div className={`flex items-center gap-1.5 text-xs font-bold lg:justify-center ${daysLeft <= 5 ? 'text-amber-600' : 'text-slate-600'}`}>
                                                <Clock className="w-4 h-4" /> {daysLeft} días de prueba
                                            </div>
                                        ) : <span className="text-slate-400 text-xs">—</span>}
                                        {doc.created_at && (
                                            <p className="text-[10px] text-slate-400 font-medium mt-0.5 lg:text-center">
                                                Registrado {format(new Date(doc.created_at), "d MMM yyyy", { locale: es })}
                                            </p>
                                        )}
                                    </div>

                                    {/* Citas del mes */}
                                    <div className="lg:col-span-2">
                                        <div className="flex items-center justify-between lg:justify-center gap-2">
                                            <span className="text-xs text-slate-400 lg:hidden font-medium">Citas este mes:</span>
                                            <span className="text-xl font-black text-[#1c334a]">{doc.appointments_month}</span>
                                        </div>
                                    </div>

                                    {/* Uso de WhatsApp */}
                                    <div className="lg:col-span-2">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-slate-400 lg:hidden font-medium">WhatsApp:</span>
                                            <div className="flex items-center gap-1.5">
                                                {doc.whatsapp_enabled
                                                    ? <ToggleRight className="w-4 h-4 text-[#1c334a]" />
                                                    : <ToggleLeft className="w-4 h-4 text-slate-300" />
                                                }
                                                <span className="text-xs font-bold text-slate-700">{doc.whatsapp_sent} / {doc.whatsapp_limit}</span>
                                            </div>
                                        </div>
                                        <MiniBar
                                            value={doc.whatsapp_sent}
                                            max={doc.whatsapp_limit}
                                            color={waUsedPct >= 90 ? 'bg-red-500' : waUsedPct >= 70 ? 'bg-amber-400' : 'bg-[#1c334a]'}
                                        />
                                    </div>

                                    {/* Uso de Almacenamiento */}
                                    <div className="lg:col-span-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-slate-400 lg:hidden font-medium">Storage:</span>
                                            <span className="text-xs font-bold text-slate-700">
                                                {formatBytes(doc.storage_used_bytes)}
                                                {doc.storage_limit_mb && <span className="text-slate-400">/{doc.storage_limit_mb}MB</span>}
                                                {!doc.storage_limit_mb && <span className="text-slate-400"> ∞</span>}
                                            </span>
                                        </div>
                                        {doc.storage_limit_mb && (
                                            <MiniBar
                                                value={storagePct}
                                                max={100}
                                                color={storagePct >= 90 ? 'bg-red-500' : storagePct >= 70 ? 'bg-amber-400' : 'bg-[#1c334a]'}
                                            />
                                        )}
                                    </div>

                                    {/* Botón de Acción */}
                                    <div className="lg:col-span-1 flex lg:justify-center">
                                        {isUpdating ? (
                                            <Loader2 className="w-5 h-5 animate-spin text-[#1c334a]" />
                                        ) : isPro ? (
                                            <button
                                                onClick={() => handleSetPlan(doc.app_id, 'Free')}
                                                className="text-[11px] font-black px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all active:scale-95 shadow-sm"
                                            >
                                                Bajar a Free
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleSetPlan(doc.app_id, 'Pro')}
                                                className="text-[11px] font-black px-3.5 py-2 rounded-xl bg-[#1c334a] hover:bg-[#0f172a] text-white shadow-md shadow-slate-200 transition-all active:scale-95"
                                            >
                                                Subir a Pro ✦
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ─── Página Standalone (/superadmin) ──────────────────────────
export default function SuperAdminPage() {
    const { isSuperAdmin, fullName, signOut } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isSuperAdmin) navigate('/admin', { replace: true });
    }, [isSuperAdmin, navigate]);

    if (!isSuperAdmin) return null;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
            <header className="sticky top-0 z-50 bg-[#0f172a] text-white px-6 py-4 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#1c334a] rounded-xl flex items-center justify-center">
                        <Stethoscope className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <span className="font-black tracking-tight text-white text-lg">MedicAdmin</span>
                        <span className="ml-2 text-[10px] bg-[#1c334a] text-white border border-white/20 rounded-full px-2 py-0.5 font-black uppercase tracking-wider">
                            Super Admin
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-300 hidden sm:block">Hola, <span className="text-white font-bold">{fullName}</span></span>
                    <button
                        onClick={() => navigate('/admin')}
                        className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all"
                    >
                        Ir al Panel Médico →
                    </button>
                    <button
                        onClick={() => { signOut(); navigate('/login'); }}
                        className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        title="Cerrar sesión"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <SuperAdminContent />
            </div>
        </div>
    );
}
