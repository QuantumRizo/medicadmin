-- Add whatsapp_reminders_enabled to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp_reminders_enabled BOOLEAN DEFAULT TRUE;

-- Index for performance when filtering enabled profiles
CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp_enabled ON profiles (app_id, whatsapp_reminders_enabled) WHERE whatsapp_reminders_enabled = TRUE;
