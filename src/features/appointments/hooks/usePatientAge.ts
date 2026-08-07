/**
 * usePatientAge
 * Calcula la edad exacta de un paciente a partir de su fecha de nacimiento.
 * - isMinor: true si el paciente tiene menos de 18 años
 * - ageLabel: texto humanizado ("8 años", "14 meses", "3 semanas")
 *   Para menores de 24 meses muestra la edad en meses.
 *   Para menores de 4 semanas muestra en semanas.
 */

import { useMemo } from 'react';

interface UsePatientAgeResult {
    isMinor: boolean;
    ageLabel: string;
    ageInMonths: number;
    ageInYears: number;
}

export function usePatientAge(dateOfBirth?: string): UsePatientAgeResult {
    return useMemo(() => {
        if (!dateOfBirth) {
            return { isMinor: false, ageLabel: '', ageInMonths: 0, ageInYears: 0 };
        }

        const dob = new Date(dateOfBirth + 'T12:00:00'); // Evitar desfase UTC
        const now = new Date();

        if (isNaN(dob.getTime())) {
            return { isMinor: false, ageLabel: '', ageInMonths: 0, ageInYears: 0 };
        }

        const diffMs = now.getTime() - dob.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        // Calcular años completos
        let years = now.getFullYear() - dob.getFullYear();
        const mDiff = now.getMonth() - dob.getMonth();
        if (mDiff < 0 || (mDiff === 0 && now.getDate() < dob.getDate())) {
            years--;
        }

        // Calcular meses completos
        let months = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
        if (now.getDate() < dob.getDate()) months--;

        // Calcular semanas completas
        const weeks = Math.floor(diffDays / 7);

        // Determinar label
        let ageLabel = '';
        if (diffDays < 28) {
            ageLabel = weeks <= 1 ? `${diffDays} días` : `${weeks} semanas`;
        } else if (months < 24) {
            ageLabel = months === 1 ? '1 mes' : `${months} meses`;
        } else {
            ageLabel = years === 1 ? '1 año' : `${years} años`;
        }

        return {
            isMinor: years < 18,
            ageLabel,
            ageInMonths: months,
            ageInYears: years,
        };
    }, [dateOfBirth]);
}
