import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

Deno.serve(async (req) => {
  try {
    const formData = await req.formData();
    const from = formData.get("From")?.toString();
    const body = formData.get("Body")?.toString().trim().toLowerCase();
    
    if (!from || !body) {
      return new Response("<Response></Response>", { headers: { "Content-Type": "text/xml" } });
    }

    const rawPhone = from.replace("whatsapp:", "").replace("+", "");
    const last10 = rawPhone.slice(-10);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: patients, error: patientError } = await supabaseAdmin
      .from('patients')
      .select('id, app_id')
      .ilike('phone', `%${last10}`);

    if (patientError || !patients || patients.length === 0) {
      return new Response("<Response></Response>", { headers: { "Content-Type": "text/xml" } });
    }

    const patientIds = patients.map(p => p.id);
    let newStatus: 'confirmed' | 'cancelled' | null = null;
    let responseText = "";

    const positiveWords = ["si", "confirmar", "confirmo", "yes", "listo", "ok", "confirmado"];
    const negativeWords = ["no", "cancelar", "cancelo", "cancelada", "no puedo", "posponer"];

    if (positiveWords.some(word => body.includes(word))) {
      newStatus = "confirmed";
      responseText = "¡Gracias! Tu cita ha sido confirmada ✅. Te esperamos.";
    } else if (negativeWords.some(word => body.includes(word))) {
      newStatus = "cancelled";
      responseText = "Entendido. Hemos registrado tu cancelación ❌. Si deseas reprogramar, contacta a la clínica.";
    }

    if (newStatus) {
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      const { data: appointments, error: aptError } = await supabaseAdmin
          .from('appointments')
          .select('id')
          .in('patient_id', patientIds)
          .eq('status', 'pending')
          .gte('date', fortyEightHoursAgo)
          .order('date', { ascending: true })
          .limit(1);

      if (appointments && appointments.length > 0) {
        await supabaseAdmin.from('appointments').update({ status: newStatus }).eq('id', appointments[0].id);
      } else {
        responseText = "No encontramos ninguna cita pendiente reciente para confirmar.";
      }
    }

    const twiml = `<Response><Message>${responseText || "No pudimos procesar tu respuesta. Responde SÍ o NO."}</Message></Response>`;
    return new Response(twiml, { headers: { "Content-Type": "text/xml" } });

  } catch (err: any) {
    return new Response("<Response></Response>", { headers: { "Content-Type": "text/xml" } });
  }
});
