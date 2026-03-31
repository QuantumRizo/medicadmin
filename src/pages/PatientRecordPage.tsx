import { useParams, useNavigate } from 'react-router-dom';
import { useAppointments } from '@/features/appointments/hooks/useAppointments';
import { PatientClinicalRecord } from '@/features/admin/components/PatientClinicalRecord';
import { AdminLayout } from '@/features/admin/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const PatientRecordPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { patients, appointments, updatePatient, deleteAppointment, updateAppointment, getAvailableSlots, loading, hospitals, fetchData } = useAppointments();

    if (loading) {
        return <div className="p-8 text-center text-gray-500 bg-gray-50 min-h-screen">Cargando expediente...</div>;
    }

    const patient = patients.find(p => p.id === id);

    if (!patient) {
        return (
            <div className="p-8 text-center bg-gray-50 min-h-screen flex flex-col items-center justify-center">
                <h2 className="text-xl font-bold mb-4">Paciente no encontrado</h2>
                <Button onClick={() => navigate('/admin?tab=patients')}>Volver a pacientes</Button>
            </div>
        );
    }

    return (
        <AdminLayout 
            title="Expediente Médico"
            subtitle={`${patient.name} - Historial y consultas`}
            headerActions={
                <Button variant="outline" onClick={() => navigate('/admin?tab=patients')} className="border-slate-200 rounded-2xl h-12 px-6 shadow-sm font-semibold transition-all active:scale-95">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Volver a Pacientes
                </Button>
            }
        >
            <div className="container mx-auto">
                <PatientClinicalRecord
                    patient={patient}
                    appointments={appointments}
                    hospitals={hospitals}
                    onUpdatePatient={updatePatient}
                    onDeleteAppointment={deleteAppointment}
                    onUpdateAppointment={updateAppointment}
                    getAvailableSlots={getAvailableSlots}
                    onFetchData={fetchData}
                />
            </div>
        </AdminLayout>
    );
};

export default PatientRecordPage;
