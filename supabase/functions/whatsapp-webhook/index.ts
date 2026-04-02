import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

Deno.serve(async (req) => {
  try {
    // 1. Extraer datos de la petición de Twilio (form-urlencoded)
    const formData = await req.formData();
    const from = formData.get("From")?.toString(); // Ejemplo: "whatsapp:+5215512345678"
    const body = formData.get("Body")?.toString().trim().toLowerCase();
    
    console.log(`Webhook recibido de ${from}: "${body}"`);

    if (!from || !body) {
      return new Response("<Response></Response>", { headers: { "Content-Type": "text/xml" } });
    }

    // Limpiar el número de teléfono (quitar 'whatsapp:' y '+')
    // Nos quedamos con los últimos 10 dígitos para máxima compatibilidad
    const rawPhone = from.replace("whatsapp:", "").replace("+", "");
    const last10 = rawPhone.slice(-10);

    // 2. Inicializar Supabase Admin
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 3. Buscar pacientes que coincidan con el teléfono
    const { data: patients, error: patientError } = await supabaseAdmin
      .from('patients')
      .select('id, app_id')
      .ilike('phone', `%${last10}`);

    if (patientError || !patients || patients.length === 0) {
      console.log(`No se encontró paciente para el teléfono terminado en ${last10}`);
      return new Response("<Response></Response>", { headers: { "Content-Type": "text/xml" } });
    }

    const patientIds = patients.map(p => p.id);

    // 4. Analizar la intención del mensaje
    let newStatus: 'confirmed' | 'cancelled' | null = null;
    let responseText = "";

    // Diccionario de respuestas positivas
    const positiveWords = ["si", "confirmar", "confirmo", "yes", "listo", "ok", "confirmado"];
    // Diccionario de respuestas negativas
    const negativeWords = ["no", "cancelar", "cancelo", "cancelada", "no puedo", "posponer"];

    if (positiveWords.some(word => body.includes(word))) {
      newStatus = "confirmed";
      responseText = "¡Gracias! Tu cita ha sido confirmada. Te esperamos.";
    } else if (negativeWords.some(word => body.includes(word))) {
      newStatus = "cancelled";
      responseText = "Entendido. Hemos registrado tu cancelación. Si deseas reprogramar, por favor contacta a la clínica.";
    }

    // 5. Si hay una intención clara, actualizar la cita pendiente más próxima
    if (newStatus) {
      const { data: appointments, error: aptError } = await supabaseAdmin
          .from('appointments')
          .select('id, app_id')
          .in('patient_id', patientIds)
          .eq('status', 'pending')
          .gte('date', new Date().toISOString())
          .order('date', { ascending: true })
          .limit(1);

      if (aptError) throw aptError;

      if (appointments && appointments.length > 0) {
        const appointmentId = appointments[0].id;
        
        const { error: updateError } = await supabaseAdmin
            .from('appointments')
            .update({ status: newStatus })
            .eq('id', appointmentId);

        if (updateError) throw updateError;
        
        console.log(`Cita ${appointmentId} actualizada exitosamente a: ${newStatus}`);
      } else {
        responseText = "No encontramos ninguna cita pendiente para confirmar. Si tienes dudas, contacta a la clínica.";
      }
    } else {
      // Si el mensaje no es claro, no cambiamos nada pero podríamos responder
      responseText = "No pudimos procesar tu respuesta automáticamente. Por favor, responde con 'SÍ' para confirmar o 'NO' para cancelar.";
    }

    // 6. Responder a Twilio con TwiML (Mensaje de vuelta al paciente)
    const twiml = `
      <Response>
        <Message>${responseText}</Message>
      </Response>
    `.trim();

    return new Response(twiml, { 
      headers: { "Content-Type": "text/xml" } 
    });

  } catch (err) {
    console.error("Error en Webhook:", err.message);
    // Retornar respuesta vacía para no romper el flujo de Twilio
    return new Response("<Response></Response>", { headers: { "Content-Type": "text/xml" } });
  }
});
