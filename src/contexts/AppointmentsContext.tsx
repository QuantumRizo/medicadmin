import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { SERVICES } from '../features/appointments/types';
import type { Appointment, Patient, Hospital } from '../features/appointments/types';
import { isAppointmentPast } from '@/lib/dateUtils';
import { standardizePhone } from '@/lib/utils';
import { useAuth } from './AuthContext';

interface AppointmentsContextType {
    appointments: Appointment[];
    patients: Patient[];
    hospitals: Hospital[];
    loading: boolean;
    fetchData: () => Promise<void>;
    saveAppointment: (appointmentData: Partial<Appointment>, patientData: Patient) => Promise<boolean>;
    updatePatient: (patient: Patient) => Promise<void>;
    getAvailableSlots: (date: string, hospitalId: string) => string[];
    getAppointmentsByHospital: (hospitalId: string) => Appointment[];
    deleteAppointment: (appointmentId: string) => Promise<void>;
    deletePatient: (patientId: string) => Promise<void>;
    blockSlot: (hospitalId: string, date: string, time: string) => Promise<void>;
    updateAppointment: (appointmentId: string, updates: Partial<Appointment>) => Promise<void>;
    addPatient: (patientData: { name: string, email: string, phone: string, notes?: string }) => Promise<Patient>;
    services: typeof SERVICES;
}

const AppointmentsContext = createContext<AppointmentsContextType | undefined>(undefined);

export const useAppointmentsContext = () => {
    const context = useContext(AppointmentsContext);
    if (!context) {
        throw new Error('useAppointmentsContext must be used within an AppointmentsProvider');
    }
    return context;
};

export const AppointmentsProvider = ({ children }: { children: ReactNode }) => {
    const { appId: APP_ID } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!APP_ID) {
            setLoading(false);
            return;
        }
        
        try {
            // Only set loading to true if we don't have data yet
            const isInitialLoad = appointments.length === 0 && patients.length === 0 && hospitals.length === 0;
            if (isInitialLoad) {
                setLoading(true);
            }
            
            const [{ data: appointmentsData, error: appointmentsError }, 
                   { data: patientsData, error: patientsError }, 
                   { data: hospitalsData, error: hospitalsError }] = await Promise.all([
                supabase.from('appointments').select('*').eq('app_id', APP_ID),
                supabase.from('patients').select('*').eq('app_id', APP_ID),
                supabase.from('hospitals').select('*').eq('app_id', APP_ID)
            ]);

            if (appointmentsError) throw appointmentsError;
            if (patientsError) throw patientsError;
            if (hospitalsError) throw hospitalsError;

            const mappedAppointments: Appointment[] = (appointmentsData || []).map((a: any) => {
                let dateStr = a.date;
                let timeStr = "";
                if (dateStr.includes('T')) {
                    const parts = dateStr.split('T');
                    dateStr = parts[0];
                    timeStr = parts[1].substring(0, 5);
                } else if (dateStr.includes(' ')) {
                    const parts = dateStr.split(' ');
                    dateStr = parts[0];
                    timeStr = parts[1].substring(0, 5);
                }
                return {
                    id: a.id,
                    hospitalId: a.hospital_id,
                    patientId: a.patient_id,
                    reason: a.reason,
                    date: dateStr,
                    time: timeStr,
                    serviceName: a.service_name,
                    specificService: a.specific_service,
                    appId: a.app_id
                };
            });

            const mappedHospitals: Hospital[] = (hospitalsData || []).map((h: any) => ({
                id: h.id,
                name: h.name,
                address: h.address,
                image: h.image,
                startTime: h.start_time,
                endTime: h.end_time,
                slotInterval: h.slot_interval
            }));

            const mappedPatients = (patientsData || [])
                .map((p: any) => ({
                    ...p,
                    medicalHistory: p.medical_history,
                    appId: p.app_id
                }))
                .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' }));

            setAppointments(mappedAppointments);
            setPatients(mappedPatients as Patient[]);
            setHospitals(mappedHospitals);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, [APP_ID]);

    useEffect(() => {
        if (!APP_ID) return;
        
        fetchData();

        const channel = supabase
            .channel(`realtime:appointments:${APP_ID}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments', filter: `app_id=eq.${APP_ID}` }, () => { fetchData(); })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'patients', filter: `app_id=eq.${APP_ID}` }, () => { fetchData(); })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'hospitals', filter: `app_id=eq.${APP_ID}` }, () => { fetchData(); })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [APP_ID, fetchData]);

    // Implementation of CRUD methods (copied and adapted from useAppointments.ts)
    const saveAppointment = async (appointmentData: Partial<Appointment>, patientData: Patient) => {
        try {
            const safePhone = standardizePhone(patientData.phone);
            
            // Match by phone first (prioritizing 10-digit match), then email
            const { data: results, error: searchError } = await supabase
                .from('patients')
                .select('id')
                .eq('app_id', APP_ID)
                .eq('phone', safePhone);
            
            if (searchError) throw searchError;

            let existingPatient = results && results.length > 0 ? results[0] : null;

            // If no phone match, try email
            if (!existingPatient && patientData.email) {
                const { data: emailResults } = await supabase
                    .from('patients')
                    .select('id')
                    .eq('app_id', APP_ID)
                    .eq('email', patientData.email);
                if (emailResults && emailResults.length > 0) existingPatient = emailResults[0];
            }

            let patientId = existingPatient?.id;
            if (patientId) {
                await supabase.from('patients').update({
                    name: patientData.name,
                    phone: patientData.phone,
                    email: patientData.email || null
                }).eq('id', patientId);
            } else {
                const { data: newPatient, error: createError } = await supabase.from('patients').insert([{
                    name: patientData.name,
                    email: patientData.email || null,
                    phone: patientData.phone,
                    app_id: APP_ID
                }]).select().single();
                if (createError) throw createError;
                patientId = newPatient.id;
            }

            const isoDateTime = `${appointmentData.date}T${appointmentData.time}:00`;
            const { error: appointmentError } = await supabase.from('appointments').insert([{
                patient_id: patientId,
                hospital_id: appointmentData.hospitalId,
                reason: appointmentData.reason,
                specific_service: appointmentData.specificService,
                date: isoDateTime,
                app_id: APP_ID
            }]);
            if (appointmentError) throw appointmentError;

            // Optional: Optimistic update or just let real-time handle it
            // fetchData() is already called by real-time subscription
            return true;
        } catch (error) {
            console.error('Error saving appointment:', error);
            throw error;
        }
    };

    const updatePatient = async (patient: Patient) => {
        try {
            const { error } = await supabase.from('patients').update({
                name: patient.name,
                phone: standardizePhone(patient.phone),
                email: patient.email,
                notes: patient.notes,
                medical_history: patient.medicalHistory
            }).eq('id', patient.id);
            if (error) throw error;
        } catch (error) {
            console.error('Error updating patient:', error);
        }
    };

    const getAvailableSlots = (date: string, hospitalId: string) => {
        const hospital = hospitals.find(h => h.id === hospitalId);
        if (!hospital) return [];
        const slots: string[] = [];
        const [startH, startM] = hospital.startTime.split(':').map(Number);
        const [endH, endM] = hospital.endTime.split(':').map(Number);
        const startHour = startH + (startM / 60);
        const endHour = endH + (endM / 60);
        const interval = hospital.slotInterval;
        const existingForDay = appointments.filter(a => a.date === date);
        const mxTimeString = new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" });
        const now = new Date(mxTimeString);
        const [year, month, day] = date.split('-').map(Number);
        let currentMinute = startHour * 60;
        const endMinute = endHour * 60;
        while (currentMinute < endMinute) {
            const h = Math.floor(currentMinute / 60);
            const m = currentMinute % 60;
            const timeString = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            const slotDateTime = new Date(year, month - 1, day, h, m);
            if (slotDateTime <= now) { currentMinute += interval; continue; }
            const isBlocked = existingForDay.some(a => a.time === timeString);
            if (!isBlocked) slots.push(timeString);
            currentMinute += interval;
        }
        return slots;
    };

    const getAppointmentsByHospital = (hospitalId: string) => {
        return appointments.filter(a => a.hospitalId === hospitalId);
    };

    const deleteAppointment = async (appointmentId: string) => {
        try {
            const existing = appointments.find(a => a.id === appointmentId);
            if (existing && isAppointmentPast(existing.date, existing.time)) {
                throw new Error("No se pueden eliminar citas que ya han pasado.");
            }
            const { error } = await supabase.from('appointments').delete().eq('id', appointmentId);
            if (error) throw error;
        } catch (error) {
            console.error('Error deleting appointment:', error);
            throw error;
        }
    };

    const deletePatient = async (patientId: string) => {
        try {
            await supabase.from('appointments').delete().eq('patient_id', patientId);
            const { error: patientError } = await supabase.from('patients').delete().eq('id', patientId);
            if (patientError) throw patientError;
        } catch (error) {
            console.error('Error deleting patient:', error);
            throw error;
        }
    };

    const blockSlot = async (hospitalId: string, date: string, time: string) => {
        try {
            let blockPatientId;
            const { data: existingBlockPatient } = await supabase.from('patients').select('id').eq('email', 'system@block.com').eq('app_id', APP_ID).maybeSingle();
            if (existingBlockPatient) {
                blockPatientId = existingBlockPatient.id;
            } else {
                const { data: newBlockPatient, error: createError } = await supabase.from('patients').insert([{
                    name: 'BLOQUEO DE HORARIO',
                    email: 'system@block.com',
                    phone: '0000000000',
                    notes: 'Usuario sistema para bloqueos',
                    app_id: APP_ID
                }]).select().single();
                if (createError) throw createError;
                blockPatientId = newBlockPatient.id;
            }
            const isoDateTime = `${date}T${time}:00`;
            const { error } = await supabase.from('appointments').insert([{
                patient_id: blockPatientId,
                hospital_id: hospitalId,
                reason: 'blocked',
                date: isoDateTime,
                specific_service: 'Horario Bloqueado Manualmente',
                app_id: APP_ID
            }]);
            if (error) throw error;
        } catch (error) {
            console.error('Error blocking slot:', error);
            throw error;
        }
    };

    const updateAppointment = async (appointmentId: string, updates: Partial<Appointment>) => {
        try {
            const existing = appointments.find(a => a.id === appointmentId);
            if (existing && isAppointmentPast(existing.date, existing.time)) {
                throw new Error("No se pueden modificar citas que ya han finalizado.");
            }
            const dbUpdates: any = {};
            if (updates.specificService) dbUpdates.specific_service = updates.specificService;
            if (updates.date && updates.time) {
                const newIsoDateTime = `${updates.date}T${updates.time}:00`;
                const { data: conflictAppointments, error: conflictError } = await supabase.from('appointments').select('id').eq('app_id', APP_ID).eq('date', newIsoDateTime).neq('id', appointmentId);
                if (conflictError) throw conflictError;
                if (conflictAppointments && conflictAppointments.length > 0) throw new Error("Este horario ya está ocupado.");
                dbUpdates.date = newIsoDateTime;
            }
            const { error } = await supabase.from('appointments').update(dbUpdates).eq('id', appointmentId);
            if (error) throw error;
        } catch (error) {
            console.error('Error updating appointment:', error);
            throw error;
        }
    };

    const addPatient = async (patientData: { name: string, email: string, phone: string, notes?: string }) => {
        try {
            const safePhone = standardizePhone(patientData.phone);
            
            // 1. Check if patient already exists by phone
            const { data: results, error: searchError } = await supabase
                .from('patients')
                .select('*')
                .eq('app_id', APP_ID)
                .eq('phone', safePhone);
            
            if (searchError) throw searchError;

            if (results && results.length > 0) {
                const existingPatient = results[0];
                console.log(`[Deduplication] Found existing patient: ${existingPatient.name} for phone ${safePhone}`);
                
                const mappedExisting = {
                    ...existingPatient,
                    medicalHistory: existingPatient.medical_history,
                    appId: existingPatient.app_id
                };
                return mappedExisting;
            }

            console.log(`[Deduplication] No match for ${safePhone}, creating new.`);

            // 2. If not, create new one
            const { data: newPatient, error: createError } = await supabase.from('patients').insert([{
                name: patientData.name,
                email: patientData.email || null,
                phone: safePhone,
                notes: patientData.notes || '',
                app_id: APP_ID
            }]).select().single();
            if (createError) throw createError;
            
            // Map the newly created patient as well
            const mappedNew = {
                ...newPatient,
                medicalHistory: newPatient.medical_history,
                appId: newPatient.app_id
            };
            return mappedNew;
        } catch (error) {
            console.error("Error adding patient:", error);
            throw error;
        }
    };

    const value = {
        appointments,
        patients,
        hospitals,
        loading,
        fetchData,
        saveAppointment,
        updatePatient,
        getAvailableSlots,
        getAppointmentsByHospital,
        deleteAppointment,
        deletePatient,
        blockSlot,
        updateAppointment,
        addPatient,
        services: SERVICES
    };

    return (
        <AppointmentsContext.Provider value={value}>
            {children}
        </AppointmentsContext.Provider>
    );
};
