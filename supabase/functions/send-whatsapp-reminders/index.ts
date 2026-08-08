// ============================================================
// Edge Function: send-whatsapp-reminders
// Envía recordatorios de WhatsApp a pacientes con citas mañana.
// Se ejecuta vía pg_cron todos los días a las 13:00 UTC (8 AM CDMX).
// ============================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const TWILIO_WHATSAPP_FROM = Deno.env.get('TWILIO_WHATSAPP_FROM')!; // 'whatsapp:+1XXXXXXXXXX'
const TWILIO_CONTENT_SID = Deno.env.get('TWILIO_CONTENT_SID')!;    // 'HX...'

// Obtener la fecha de mañana en zona horaria de México (CDMX)
function getTomorrowMX(): string {
  const now = new Date();
  // CDMX es UTC-6 en invierno / UTC-5 en verano; usamos Intl para ser precisos
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  // Calcular mañana
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatter.format(tomorrow); // 'YYYY-MM-DD'
}

// Obtener año-mes actual en CDMX
function getCurrentYearMonthMX(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
  });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  return `${year}-${month}`;
}

// Formatear hora de 24h a 12h legible en español
function formatTime12h(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'pm' : 'am';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}

// Formatear fecha a texto legible en español
function formatDateES(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

// Enviar mensaje vía Twilio Content API
async function sendTwilioWhatsApp(
  toPhone: string,
  patientName: string,
  dateStr: string,
  timeStr: string
): Promise<{ success: boolean; error?: string }> {
  // Limpiar el teléfono: asegurar formato internacional
  let phone = toPhone.replace(/\D/g, ''); // solo dígitos
  if (phone.length === 10) phone = '52' + phone; // México sin código de país
  if (!phone.startsWith('+')) phone = '+' + phone;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

  const body = new URLSearchParams({
    From: TWILIO_WHATSAPP_FROM,
    To: `whatsapp:${phone}`,
    ContentSid: TWILIO_CONTENT_SID,
    ContentVariables: JSON.stringify({
      '1': patientName,
      '2': formatDateES(dateStr),
      '3': formatTime12h(timeStr),
    }),
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  const result = await response.json();

  if (!response.ok) {
    return { success: false, error: result.message || `HTTP ${response.status}` };
  }
  return { success: true };
}

// ─── Handler Principal ───────────────────────────────────────
Deno.serve(async (req) => {
  // Aceptar solo POST o peticiones de cron (GET también)
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const tomorrowStr = getTomorrowMX();
  const yearMonth = getCurrentYearMonthMX();

  console.log(`[WhatsApp Reminders] Procesando citas para: ${tomorrowStr}`);

  // 1. Obtener citas de mañana que aún no se les ha enviado recordatorio
  //    y cuyo doctor tiene los recordatorios activados
  const { data: appointments, error: aptError } = await supabase
    .from('appointments')
    .select(`
      id,
      app_id,
      date,
      time,
      reason,
      patient_id,
      patients (
        name,
        phone
      )
    `)
    .eq('date', tomorrowStr)
    .eq('whatsapp_reminder_sent', false)
    .neq('reason', 'blocked');  // no enviar a slots bloqueados

  if (aptError) {
    console.error('[WhatsApp Reminders] Error obteniendo citas:', aptError);
    return new Response(JSON.stringify({ error: aptError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!appointments || appointments.length === 0) {
    console.log('[WhatsApp Reminders] No hay citas para mañana. Fin.');
    return new Response(JSON.stringify({ sent: 0, skipped: 0, message: 'No hay citas para mañana.' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Obtener los perfiles únicos de doctores implicados
  const uniqueAppIds = [...new Set(appointments.map(a => a.app_id).filter(Boolean))];

  const { data: profiles } = await supabase
    .from('profiles')
    .select('app_id, whatsapp_reminders_enabled, whatsapp_limit')
    .in('app_id', uniqueAppIds);

  const profileMap = new Map(
    (profiles || []).map(p => [p.app_id, p])
  );

  // 3. Obtener uso actual del mes para cada app_id
  const { data: usageRows } = await supabase
    .from('whatsapp_usage')
    .select('app_id, messages_sent')
    .in('app_id', uniqueAppIds)
    .eq('year_month', yearMonth);

  const usageMap = new Map(
    (usageRows || []).map(u => [u.app_id, u.messages_sent as number])
  );

  // Contadores en memoria para no re-query en cada iteración
  const sentCounters = new Map<string, number>(
    uniqueAppIds.map(id => [id, usageMap.get(id) ?? 0])
  );

  let totalSent = 0;
  let totalSkipped = 0;
  const errors: string[] = [];

  // 4. Procesar cada cita
  for (const apt of appointments) {
    const appId = apt.app_id;
    const profile = profileMap.get(appId);
    const patient = apt.patients as { name: string; phone: string | null } | null;

    // Verificar que el doctor tiene recordatorios activados
    if (!profile || profile.whatsapp_reminders_enabled === false) {
      console.log(`[skip] app_id=${appId} — recordatorios desactivados`);
      totalSkipped++;
      continue;
    }

    // Verificar que el paciente tiene teléfono
    if (!patient?.phone) {
      console.log(`[skip] cita=${apt.id} — paciente sin teléfono`);
      totalSkipped++;
      continue;
    }

    // Verificar cuota disponible
    const limit = profile.whatsapp_limit ?? 30;
    const currentSent = sentCounters.get(appId) ?? 0;
    if (currentSent >= limit) {
      console.log(`[skip] app_id=${appId} — cuota agotada (${currentSent}/${limit})`);
      totalSkipped++;
      continue;
    }

    // 5. Enviar mensaje por Twilio
    const sendResult = await sendTwilioWhatsApp(
      patient.phone,
      patient.name,
      apt.date,
      apt.time
    );

    if (!sendResult.success) {
      console.error(`[error] cita=${apt.id} — ${sendResult.error}`);
      errors.push(`cita ${apt.id}: ${sendResult.error}`);
      totalSkipped++;
      continue;
    }

    // 6. Marcar cita como enviada
    await supabase
      .from('appointments')
      .update({ whatsapp_reminder_sent: true })
      .eq('id', apt.id);

    // 7. Incrementar contador en whatsapp_usage (upsert)
    const newCount = currentSent + 1;
    sentCounters.set(appId, newCount);

    await supabase
      .from('whatsapp_usage')
      .upsert(
        { app_id: appId, year_month: yearMonth, messages_sent: newCount, updated_at: new Date().toISOString() },
        { onConflict: 'app_id,year_month' }
      );

    totalSent++;
    console.log(`[ok] cita=${apt.id} — enviado a ${patient.name}`);
  }

  const summary = {
    date: tomorrowStr,
    sent: totalSent,
    skipped: totalSkipped,
    errors: errors.length > 0 ? errors : undefined,
  };

  console.log('[WhatsApp Reminders] Resumen:', summary);

  return new Response(JSON.stringify(summary), {
    headers: { 'Content-Type': 'application/json' },
  });
});
