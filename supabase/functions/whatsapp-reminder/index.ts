import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

Deno.serve(async (_req) => {
  try {
    // 1. Inicializar Supabase con Service Role Key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const TWILIO_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const TWILIO_PHONE = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!TWILIO_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE) {
      throw new Error("Missing Twilio configuration");
    }

    // 2. Definir rango de tiempo (~12 horas en el futuro para recordatorios automáticos)
    const now = new Date();
    const startRange = new Date(now.getTime() + 11.5 * 60 * 60 * 1000).toISOString();
    const endRange = new Date(now.getTime() + 12.5 * 60 * 60 * 1000).toISOString();

    // 3. Consultar perfiles que tengan los recordatorios ACTIVADOS
    const { data: activeProfiles } = await supabaseAdmin
      .from('profiles')
      .select('app_id, whatsapp_limit, whatsapp_extra_credits')
      .eq('whatsapp_reminders_enabled', true);

    const activeProfilesData = activeProfiles as { app_id: string, whatsapp_limit: number, whatsapp_extra_credits: number }[];
    const activeAppIds = activeProfilesData?.map(p => p.app_id) || [];
    const profilesMap = new Map(activeProfilesData?.map(p => [p.app_id, p]) || []);

    if (activeAppIds.length === 0) {
      return new Response(JSON.stringify({ success: true, processed: 0, message: "No active profiles" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Calcular el uso actual del mes para el sistema de cuotas
    const startOfMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const { data: usageData } = await supabaseAdmin
      .from('appointments')
      .select('app_id')
      .in('app_id', activeAppIds)
      .eq('whatsapp_reminder_sent', true)
      .gte('created_at', startOfMonthDate.toISOString());
    
    const usageMap = new Map<string, number>();
    usageData?.forEach(u => {
      usageMap.set(u.app_id, (usageMap.get(u.app_id) || 0) + 1);
    });

    // 5. Consultar citas próximas
    const { data: appointments, error } = await supabaseAdmin
      .from('appointments')
      .select(`
        id, 
        date, 
        patient:patient_id (name, phone),
        app_id
      `)
      .in('app_id', activeAppIds)
      .gt('date', startRange)
      .lt('date', endRange)
      .eq('whatsapp_reminder_sent', false);

    if (error) throw error;

    const results = [];

    // 6. Procesar envíos con validación de cuotas
    for (const app of appointments || []) {
      const patient = app.patient;
      if (!patient?.phone) continue;

      // Validar Límite de Cuota
      const profileInfo = profilesMap.get(app.app_id);
      const limit = profileInfo?.whatsapp_limit ?? 300;
      const extras = profileInfo?.whatsapp_extra_credits ?? 0;
      const currentUsage = usageMap.get(app.app_id) || 0;

      if (currentUsage >= (limit + extras)) {
        console.log(`Límite alcanzado para ${app.app_id}`);
        continue;
      }

      // Formatear Mensaje con Confirmación Bidireccional
      const timeStr = new Date(app.date).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
      const messageBody = `Hola ${patient.name}, te recordamos tu cita hoy a las ${timeStr}. ¿Confirmas tu asistencia? Responde SI para confirmar o NO para cancelar.`;

      let phone = patient.phone.trim().replace(/\s+/g, '');
      if (phone.length === 10) phone = `+52${phone}`;
      if (!phone.startsWith('+')) phone = `+${phone}`;

      const twilioRes = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${btoa(`${TWILIO_SID}:${TWILIO_AUTH_TOKEN}`)}`,
          },
          body: new URLSearchParams({
            To: `whatsapp:${phone}`,
            From: `whatsapp:${TWILIO_PHONE}`,
            Body: messageBody,
          }),
        }
      );

      if (twilioRes.ok) {
        await supabaseAdmin.from('appointments').update({ whatsapp_reminder_sent: true }).eq('id', app.id);
        results.push({ id: app.id, status: 'sent' });
        usageMap.set(app.app_id, currentUsage + 1);
      } else {
        const errorData = await twilioRes.json();
        results.push({ id: app.id, status: 'error', error: errorData });
      }
    }

    return new Response(JSON.stringify({ success: true, processed: results.length, details: results }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
