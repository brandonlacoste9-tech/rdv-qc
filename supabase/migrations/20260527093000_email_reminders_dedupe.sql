-- Ensure reminder dedupe is enforced at the database level.
-- This script is idempotent and safe to run multiple times.

CREATE TABLE IF NOT EXISTS email_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id TEXT NOT NULL,
  reminder_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recipient_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Remove duplicate rows before adding the unique index.
DELETE FROM email_reminders a
USING email_reminders b
WHERE a.booking_id = b.booking_id
  AND a.reminder_type = b.reminder_type
  AND a.ctid < b.ctid;

CREATE UNIQUE INDEX IF NOT EXISTS email_reminders_booking_type_uidx
  ON email_reminders (booking_id, reminder_type);

CREATE INDEX IF NOT EXISTS email_reminders_sent_at_idx
  ON email_reminders (sent_at);
