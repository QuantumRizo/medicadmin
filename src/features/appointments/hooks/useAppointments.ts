import { useAppointmentsContext } from '@/contexts/AppointmentsContext';

export const useAppointments = () => {
    return useAppointmentsContext();
};

