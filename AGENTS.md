# MedicAdmin — guía rápida para cambios

## Stack y comandos

- React 19 + TypeScript + Vite + Tailwind; Supabase es la fuente de datos.
- Verificación completa: `npm run check`.
- No modifiques archivos generados ni secretos (`.env`). Las migraciones nuevas van en `supabase/migrations/`.

## Mapa del producto

- Rutas: `src/App.tsx`; panel principal: `src/features/admin/components/AdminDashboard.tsx`.
- Estado y CRUD de pacientes, citas y sucursales: `src/contexts/AppointmentsContext.tsx`.
- Agenda y detalle/reprogramación: `AdminCalendar.tsx` y `AppointmentDetailDialog.tsx`.
- Alta de una cita: `AdminAppointmentDialog.tsx`.
- Expediente: ruta `src/pages/PatientRecordPage.tsx`, contenedor `PatientClinicalRecord.tsx` y secciones en `src/features/admin/components/patient-record/`.
- Modelos de UI: `src/features/appointments/types.ts`. La historia clínica se persiste como JSON en `patients.medical_history`.

## Convenciones de datos importantes

- Las citas se guardan como `appointments.date` en formato ISO; el contexto las expone como `date` (`YYYY-MM-DD`) y `time` (`HH:mm`).
- La agenda representa horarios locales de la clínica en `America/Mexico_City`; no conviertas citas a UTC. Usa las utilidades de `src/lib/dateUtils.ts` para “hoy”, disponibilidad, comparaciones o estados de cita. Las citas antiguas pueden traer fecha y hora combinadas, por lo que la lectura debe conservar compatibilidad.
- Identificar pacientes por teléfono debe usar `standardizePhone` de `src/lib/utils.ts`.
- Las citas y pacientes se aíslan por `app_id`; conserva el filtro al leer, actualizar o eliminar datos.
- Para cambios de agenda, usa `getAvailableSlots`; considera sede, duración y traslapes. No permitir cambios en citas pasadas (`isAppointmentPast`).
- Las notas clínicas finalizadas son inmutables por cumplimiento NOM-024. Mantén la auditoría al guardar expedientes.

## Alcance típico de cambios

- Un campo de expediente suele requerir: tipo `MedicalHistory`, control de UI y confirmar que se conserva en `updatePatient`.
- Un dato capturado al agendar debe llegar a `saveAppointment` y fusionarse con `medical_history` existente, sin borrar otros datos.
- El acceso a un expediente usa `/admin/pacientes/:id`; desde módulos de agenda navega directamente a esa ruta.
