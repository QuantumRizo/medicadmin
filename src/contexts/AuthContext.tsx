import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

// ─── Tipos ────────────────────────────────────────────────────
// Plan Free  → subscription_status = 'trial',  plan_name = 'Free',  whatsapp_limit = 30
// Plan Pro   → subscription_status = 'active', plan_name = 'Pro',   whatsapp_limit = 300
// El dueño del sistema cambia manualmente profiles para subir a Pro.
// ─────────────────────────────────────────────────────────────

interface AuthContextType {
    user: User | null;
    appId: string | null;
    fullName: string | null;
    /** true para ambos planes (Free y Pro) — acceso completo a la app */
    canUploadFiles: boolean;
    /** 'trial' = Plan Free   |   'active' = Plan Pro */
    subscriptionStatus: string;
    /** 'Free' | 'Pro' */
    planName: string;
    /** Fecha límite del período de prueba (solo Plan Free) */
    trialEndsAt: string | null;
    /** ¿El usuario tiene recordatorios de WhatsApp activados? */
    whatsappRemindersEnabled: boolean;
    /** Límite mensual de mensajes WhatsApp (30 Free / 300 Pro) */
    whatsappLimit: number;
    /** Tamaño máximo por archivo en MB (5 Free / 25 Pro) */
    maxFileSizeMb: number;
    /** Límite total de almacenamiento en MB (100 Free / null = ilimitado Pro) */
    storageLimitMb: number | null;
    /** true solo para el dueño del sistema */
    isSuperAdmin: boolean;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [appId, setAppId] = useState<string | null>(null);
    const [fullName, setFullName] = useState<string | null>(null);
    const [subscriptionStatus, setSubscriptionStatus] = useState<string>('trial');
    const [planName, setPlanName] = useState<string>('Free');
    const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
    const [whatsappRemindersEnabled, setWhatsappRemindersEnabled] = useState<boolean>(true);
    const [whatsappLimit, setWhatsappLimit] = useState<number>(30);
    const [maxFileSizeMb, setMaxFileSizeMb] = useState<number>(5);
    const [storageLimitMb, setStorageLimitMb] = useState<number | null>(100);
    const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);

    const resetState = () => {
        setAppId(null);
        setFullName(null);
        setSubscriptionStatus('trial');
        setPlanName('Free');
        setTrialEndsAt(null);
        setWhatsappRemindersEnabled(true);
        setWhatsappLimit(30);
        setMaxFileSizeMb(5);
        setStorageLimitMb(100);
        setIsSuperAdmin(false);
    };

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                resetState();
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('app_id, full_name, subscription_status, plan_name, trial_ends_at, whatsapp_reminders_enabled, whatsapp_limit, max_file_size_mb, storage_limit_mb, is_super_admin')
                .eq('id', userId)
                .single();

            if (error) throw error;

            if (data) {
                setAppId(data.app_id);
                setFullName(data.full_name);
                setSubscriptionStatus(data.subscription_status || 'trial');
                setPlanName(data.plan_name || 'Free');
                setTrialEndsAt(data.trial_ends_at || null);
                setWhatsappRemindersEnabled(data.whatsapp_reminders_enabled ?? true);
                setWhatsappLimit(data.whatsapp_limit ?? 30);
                setMaxFileSizeMb(data.max_file_size_mb ?? 5);
                setStorageLimitMb(data.storage_limit_mb ?? null);
                setIsSuperAdmin(data.is_super_admin ?? false);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const isPro = subscriptionStatus === 'active';

    return (
        <AuthContext.Provider value={{
            user,
            appId,
            fullName,
            canUploadFiles: true,   // ambos planes tienen acceso completo
            subscriptionStatus,
            planName,
            trialEndsAt,
            whatsappRemindersEnabled,
            whatsappLimit: isPro ? 300 : (whatsappLimit ?? 30),
            maxFileSizeMb: isPro ? 25 : (maxFileSizeMb ?? 5),
            storageLimitMb: isPro ? null : (storageLimitMb ?? 100),
            isSuperAdmin,
            loading,
            signOut,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
