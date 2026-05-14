import { getNow } from '@/lib/dateUtils';
import type { Patient, MedicalHistory, DoctorProfile, ClinicalSession } from '../../../appointments/types';

interface PrintReportParams {
    patient: Patient;
    history: MedicalHistory;
    clinicProfile: DoctorProfile | null;
}

export const printReport = ({ patient, history, clinicProfile }: PrintReportParams) => {
    const doctorName = clinicProfile?.doctorName || 'DR. RESPONSABLE';
    const especialidad = clinicProfile?.especialidad || 'Expediente Clínico';
    const cedula = clinicProfile?.cedulaProfesional || '';
    const today = getNow();
    const todayStr = `${String(today.getDate()).padStart(2,'0')}/${String(today.getMonth()+1).padStart(2,'0')}/${today.getFullYear()}`;

    const calcAge = (dob: string | undefined) => {
        if (!dob) return 'n/a';
        const diff = Date.now() - new Date(dob).getTime();
        return String(Math.floor(diff / (365.25 * 24 * 3600 * 1000)));
    };

    const sessions = (history.clinicalSessions || [])
        .filter((s: ClinicalSession) => s.content?.trim())
        .sort((a: ClinicalSession, b: ClinicalSession) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const sessionRows = sessions.map((s: ClinicalSession) => {
        const d = new Date(s.date);
        const dateStr = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
        return `
            <div style="margin-bottom:14px; padding-left:12px; border-left:2px solid #cbd5e1;">
                <div style="font-size:8pt; font-weight:900; color:#1c334a; text-transform:uppercase; margin-bottom:4px;">
                    Fecha: ${dateStr}${!s.finalized ? ' <span style="color:#f97316;font-style:italic;">(Borrador)</span>' : ''}
                </div>
                <div style="font-size:10pt; color:#374151; white-space:pre-wrap; font-family:Georgia,serif; font-style:italic; line-height:1.5;">${s.content || ''}</div>
            </div>`;
    }).join('');

    const dobStr = history.dateOfBirth
        ? (() => { const d = new Date(history.dateOfBirth); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`; })()
        : 'n/a';

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Expediente Clínico – ${patient.name}</title>
  <style>
    @page { margin: 0; }
    body { font-family: Inter, Arial, sans-serif; font-size: 10pt; color: #111; background: white; margin: 0; padding: 1.5cm; }
    * { box-sizing: border-box; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1c334a; padding-bottom: 8px; margin-bottom: 12px; }
    .header-left h1 { margin: 0; font-size: 14pt; font-weight: 900; color: #1c334a; text-transform: uppercase; letter-spacing: -0.5px; }
    .header-left p { margin: 2px 0 0; font-size: 8pt; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; }
    .header-right { text-align: right; font-size: 8pt; color: #9ca3af; }
    .header-right p { margin: 1px 0; }
    .header-right .clinic { font-weight: 700; color: #374151; text-transform: uppercase; }
    .sub-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 10px; padding: 0 4px; }
    .sub-header h2 { margin: 0; font-size: 9pt; font-weight: 900; color: #1c334a; text-transform: uppercase; border-bottom: 2px solid #1c334a; padding-bottom: 2px; }
    .sub-header .date { font-size: 8pt; color: #9ca3af; }
    .id-card { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; margin-bottom: 12px; }
    .id-card label { display: block; font-size: 7pt; font-weight: 900; color: #9ca3af; text-transform: uppercase; margin-bottom: 2px; }
    .id-card p { margin: 0; font-size: 9pt; font-weight: 700; color: #1f2937; }
    .allergy-box { display: flex; align-items: center; gap: 8px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 6px 10px; margin-bottom: 12px; }
    .allergy-label { font-size: 7pt; font-weight: 900; color: #dc2626; background: #fee2e2; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; }
    .allergy-text { font-size: 9pt; font-weight: 700; color: #7f1d1d; }
    .section-title { font-size: 8pt; font-weight: 900; color: #9ca3af; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; margin-bottom: 8px; }
    .antec-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; margin-bottom: 14px; }
    .antec-item { font-size: 9pt; }
    .antec-item .label { font-size: 7pt; font-weight: 900; color: #4b5563; text-transform: uppercase; margin-right: 4px; }
    .sessions { margin-bottom: 16px; }
    .footer { display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 24px; }
    .footer-note { font-size: 7pt; color: #d1d5db; font-style: italic; }
    .firma { text-align: center; min-width: 200px; }
    .firma .line { border-bottom: 1px solid #6b7280; margin-bottom: 4px; }
    .firma .name { font-size: 9pt; font-weight: 900; text-transform: uppercase; color: #374151; }
    .firma .role { font-size: 7pt; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>${doctorName}</h1>
      <p>${especialidad}${cedula ? ` &middot; Cédula: ${cedula}` : ''}</p>
    </div>
    <div class="header-right">
      <p class="clinic">MedicAdmin</p>
    </div>
  </div>

  <div class="sub-header">
    <h2>HISTORIA CLÍNICA CONSOLIDADA</h2>
    <span class="date">Fecha de emisión: ${todayStr}</span>
  </div>

  <div class="id-card">
    <div><label>Nombre Completo</label><p>${patient.name}</p></div>
    <div><label>F. Nacimiento</label><p>${dobStr} (${calcAge(history.dateOfBirth)} años)</p></div>
    <div><label>CURP / Sexo</label><p>${history.curp || 'n/a'} &middot; ${history.sex || 'n/a'}</p></div>
    ${history.bloodType ? `<div><label>Grupo Sanguíneo</label><p>${history.bloodType}</p></div>` : ''}
  </div>

  ${history.allergies ? `
  <div class="allergy-box">
    <span class="allergy-label">Alergias</span>
    <span class="allergy-text">${history.allergies}</span>
  </div>` : ''}

  <div class="section-title">Resumen de Antecedentes</div>
  <div class="antec-grid">
    <div class="antec-item"><span class="label">Patológicos:</span>${history.pathologicalHistory || 'Negados'}</div>
    <div class="antec-item"><span class="label">No Patológicos:</span>${history.nonPathologicalHistory || 'Negados'}</div>
    <div class="antec-item"><span class="label">Heredofamiliares:</span>${history.familyHistory || 'Negados'}</div>
    <div class="antec-item"><span class="label">Quirúrgicos:</span>${history.surgeries || 'Negados'}</div>
  </div>

  <div class="section-title">Crónica de Evolución (Notas Médicas)</div>
  <div class="sessions">
    ${sessionRows || '<p style="font-size:9pt;color:#9ca3af;font-style:italic;">Sin notas de evolución registradas.</p>'}
  </div>

  <div class="footer">
    <div class="footer-note">Generado por MedicAdmin &middot; NOM-024-SSA3-2012</div>
    <div class="firma">
      <div class="line">&nbsp;</div>
      <div class="name">${doctorName}</div>
      <div class="role">Responsable Clínico</div>
    </div>
  </div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) { alert('Permite las ventanas emergentes para imprimir.'); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
};
