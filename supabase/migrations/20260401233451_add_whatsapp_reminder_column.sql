-- Add whatsapp_reminder_sent to appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS whatsapp_reminder_sent BOOLEAN DEFAULT FALSE;

-- Index for efficient querying of pending reminders
CREATE INDEX IF NOT EXISTS idx_appointments_reminder_pending 
ON appointments (date, whatsapp_reminder_sent) 
WHERE whatsapp_reminder_sent = FALSE;
