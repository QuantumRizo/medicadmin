import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    appId: string | null;
    fullName: string | null;
    canUploadFiles: boolean;
    subscriptionStatus: string;
    planName: string;
    trialEndsAt: string | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [appId, setAppId] = useState<string | null>(null);
    const [fullName, setFullName] = useState<string | null>(null);
    const [canUploadFiles, setCanUploadFiles] = useState<boolean>(false);
    const [subscriptionStatus, setSubscriptionStatus] = useState<string>('trial');
    const [planName, setPlanName] = useState<string>('Free');
    const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active sessions
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setAppId(null);
                setFullName(null);
                setCanUploadFiles(false);
                setSubscriptionStatus('trial');
                setPlanName('Free');
                setTrialEndsAt(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string) => {
        setLoading(true); // Ensure loading is true while fetching the profile
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('app_id, full_name, can_upload_files, subscription_status, plan_name, trial_ends_at')
                .eq('id', userId)
                .single();

            if (error) throw error;

            if (data) {
                setAppId(data.app_id);
                setFullName(data.full_name);
                setCanUploadFiles(data.can_upload_files || false);
                setSubscriptionStatus(data.subscription_status || 'trial');
                setPlanName(data.plan_name || 'Free');
                setTrialEndsAt(data.trial_ends_at || null);
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

    return (
        <AuthContext.Provider value={{ 
            user, 
            appId, 
            fullName, 
            canUploadFiles, 
            subscriptionStatus, 
            planName, 
            trialEndsAt, 
            loading, 
            signOut 
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
