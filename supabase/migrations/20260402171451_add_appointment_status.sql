-- Agregar campo de estado a las citas
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' 
CHECK (status IN ('pending', 'confirmed', 'cancelled', 'attended', 'no-show'));

COMMENT ON COLUMN public.appointments.status IS 'Estado de la cita: pending, confirmed (por WhatsApp), cancelled (por Paciente o Doctor), attended, no-show.';
