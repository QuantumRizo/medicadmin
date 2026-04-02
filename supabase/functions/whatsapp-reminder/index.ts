import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

Deno.serve(async (_req) => {
  try {
    // 1. Inicializar Supabase con Service Role Key para poder actualizar la tabla
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

    // 2. Definir rango de tiempo (~12 horas en el futuro)
    // Buscamos citas que ocurran entre las 11.5 y 12.5 horas a partir de ahora
    const now = new Date();
    const startRange = new Date(now.getTime() + 11.5 * 60 * 60 * 1000).toISOString();
    const endRange = new Date(now.getTime() + 12.5 * 60 * 60 * 1000).toISOString();

    // 3. Consultar perfiles que tengan los recordatorios ACTIVADOS
    const { data: activeProfiles } = await supabaseAdmin
      .from('profiles')
      .select('app_id')
      .eq('whatsapp_reminders_enabled', true);

    const activeAppIds = activeProfiles?.map((p: { app_id: string }) => p.app_id) || [];

    if (activeAppIds.length === 0) {
      console.log("No hay perfiles con WhatsApp activado.");
      return new Response(JSON.stringify({ success: true, processed: 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`Buscando citas entre ${startRange} y ${endRange} para ${activeAppIds.length} perfiles activos.`);

    // 4. Consultar citas próximas que no hayan recibido recordatorio
    const { data: appointments, error } = await supabaseAdmin
      .from('appointments')
      .select(`
        id, 
        date, 
        patients (name, phone),
        app_id
      `)
      .in('app_id', activeAppIds)
      .gt('date', startRange)
      .lt('date', endRange)
      .eq('whatsapp_reminder_sent', false);

    if (error) throw error;

    console.log(`Encontradas ${appointments?.length || 0} citas.`);

    const results = [];

    // 5. Procesar cada cita
    for (const app of appointments || []) {
      const patient = Array.isArray(app.patients) ? app.patients[0] : app.patients;
      
      if (!patient?.phone) {
        console.log(`Cita ${app.id} no tiene número de teléfono.`);
        continue;
      }

      // Obtener nombre de la clínica (opcional)
      const { data: settings } = await supabaseAdmin
        .from('clinic_settings')
        .select('clinic_name')
        .eq('app_id', app.app_id)
        .single();

      // Formatear mensaje
      const appointmentDate = new Date(app.date);
      const timeStr = appointmentDate.toLocaleTimeString('es-MX', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
      
      const clinicName = settings?.clinic_name || 'MedicAdmin';
      const messageBody = `Hola ${patient.name}, te recordamos tu cita hoy a las ${timeStr} en ${clinicName}. ¡Te esperamos!`;

      // Asegurar formato internacional para México (+521 para móviles)
      let phone = patient.phone.trim().replace(/\s+/g, '');
      if (!phone.startsWith('+')) {
        // Asumiendo México (+52) si no tiene código
        phone = phone.length === 10 ? `+521${phone}` : `+${phone}`;
      }

      console.log(`Enviando mensaje a ${phone}...`);

      // 5. Enviar vía Twilio API
      const twilioRes = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Basic ${btoa(`${TWILIO_SID}:${TWILIO_AUTH_TOKEN}`)}`,
          },
          body: new URLSearchParams({
            To: `whatsapp:${phone}`,
            From: `whatsapp:${TWILIO_PHONE}`,
            Body: messageBody,
          }),
        }
      );

      if (twilioRes.ok) {
        // Marcar como enviado
        await supabaseAdmin
          .from('appointments')
          .update({ whatsapp_reminder_sent: true })
          .eq('id', app.id);
        
        results.push({ id: app.id, status: 'success' });
        console.log(`Mensaje enviado exitosamente para cita ${app.id}`);
      } else {
        const errorData = await twilioRes.json();
        results.push({ id: app.id, status: 'error', error: errorData });
        console.error(`Error de Twilio para cita ${app.id}:`, errorData);
      }
    }

    return new Response(JSON.stringify({ success: true, processed: results }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("Error en Function:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
