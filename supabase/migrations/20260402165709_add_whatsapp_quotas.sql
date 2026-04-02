-- WhatsApp Quota and Extra Credits system
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS whatsapp_limit INT DEFAULT 300,
ADD COLUMN IF NOT EXISTS whatsapp_extra_credits INT DEFAULT 0;

COMMENT ON COLUMN public.profiles.whatsapp_limit IS 'Mensajes de WhatsApp incluidos en la suscripción base por mes.';
COMMENT ON COLUMN public.profiles.whatsapp_extra_credits IS 'Mensajes de WhatsApp extra comprados (pre-pago) que no expiran mensualmente.';
