
export interface Hospital {
    id: string;
    name: string;
    address: string;
    image: string;
    startTime: string;   // ej. '09:00'
    endTime: string;     // ej. '20:30'
    slotInterval: number; // ej. 30
    isDentalClinic?: boolean;
}

export type AppointmentReason = 'first-visit' | 'follow-up' | 'specific-service' | 'blocked';

export interface Service {
    id: string;
    name: string;
    description?: string;
    durationMinutes: number; // default 90 (1.5h)
    price?: number;
}

// ──────────────────────────────────────────────────────────────
// NOM-024: Sesión clínica — una entrada del cuaderno de notas.
// Las sesiones finalizadas son inmutables (cumplimiento NOM-024).
// ──────────────────────────────────────────────────────────────
export interface ClinicalSession {
    id: string;               // UUID generado en cliente
    date: string;             // ISO date de creación de la sesión: "2026-04-01"
    content: string;          // Texto de la nota de evolución
    finalized: boolean;       // true = solo lectura, no editable
    finalizedAt?: string;     // ISO timestamp cuando se finalizó
}

export interface MedicalHistory {
    // Datos Generales
    sex?: 'Masculino' | 'Femenino';
    dateOfBirth?: string; // YYYY-MM-DD
    maritalStatus?: 'Soltero' | 'Casado' | 'Divorciado' | 'Viudo' | 'Unión Libre';
    spouseName?: string;
    homePhone?: string;
    officePhone?: string;
    occupation?: string;
    curp?: string;            // CURP del paciente (opcional, recomendado NOM-004)
    address?: {
        street: string;
        number: string;
        neighborhood: string; // Colonia
        municipality?: string; // Delegación o Municipio
        city: string;
        state: string;
        zipCode: string;
    };
    insurance?: boolean;
    insuranceCompany?: string;
    sports?: string;
    recommendedBy?: string;

    bloodType?: string;
    allergies: string;
    conditions: string; // Enfermedades
    medications: string;
    surgeries: string;
    familyHistory: string;

    // Historia Clínica
    nonPathologicalHistory?: string;
    pathologicalHistory?: string;
    gynecoObstetricHistory?: string;
    perinatalHistory?: string;
    currentCondition?: string;
    physicalExploration?: string;
    labStudies?: string;
    diagnosis?: string;
    treatment?: string;
    prognosis?: string;
    
    // Odontograma
    odontogramData?: Record<number, Record<string, string>>;
    odontogramNotes?: Record<number, string>;

    // NOM-024: Notas de evolución por sesión (Opción A — cuaderno con entradas)
    clinicalSessions?: ClinicalSession[];

    // Legado: texto libre de notas (se migra a clinicalSessions si existe)
    evolutionNotes?: string;
}

export interface SoapNote {
    subjective: string;
    objective: string;
    analysis: string;
    plan: string;
}

export interface Patient {
    id: string;
    name: string;
    email: string;
    phone: string;
    notes: string;
    history: string[];
    medicalHistory?: MedicalHistory;
    appId?: string;
}

// ──────────────────────────────────────────────────────────────
// NOM-024: Perfil de la clínica / médico (tabla clinic_settings)
// ──────────────────────────────────────────────────────────────
export interface ClinicProfile {
    id?: string;
    appId: string;
    clinicName?: string;
    doctorName?: string;
    cedulaProfesional?: string;
    especialidad?: string;
    institucionEgreso?: string;
    telefonoClinica?: string;
    direccionClinica?: string;
    logoUrl?: string;
    avisoPrivacidad?: string;
}

// ──────────────────────────────────────────────────────────────
// NOM-024: Bitácora de auditoría (tabla audit_logs)
// ──────────────────────────────────────────────────────────────
export type AuditAction =
    | 'VIEW_RECORD'
    | 'SAVE_RECORD'
    | 'FINALIZE_NOTE'
    | 'DELETE_PATIENT'
    | 'LOGIN'
    | 'LOGOUT';

export interface AuditLog {
    id?: string;
    appId: string;
    userId?: string;
    patientId?: string;
    action: AuditAction;
    details?: Record<string, any>;
    createdAt?: string;
}

export interface Appointment {
    id: string;
    patientId: string;
    patient?: Patient;
    hospitalId: string;
    serviceName?: string;
    reason: AppointmentReason;
    date: string;
    time: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'attended' | 'no-show';
    specificService?: string;
    appId?: string;
}

export const APPOINTMENT_CONFIG = {
    START_HOUR: 9,
    END_HOUR: 15,
    INTERVAL_MINUTES: 30
};

export const SERVICES: Service[] = [
    {
        id: 'srv-1',
        name: 'Consulta General',
        durationMinutes: 60,
    },
    {
        id: 'srv-2',
        name: 'Consulta de Seguimiento',
        durationMinutes: 30,
    }
];
