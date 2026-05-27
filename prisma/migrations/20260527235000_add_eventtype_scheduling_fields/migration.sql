ALTER TABLE "EventType"
ADD COLUMN IF NOT EXISTS "schedulingType" TEXT DEFAULT 'individual',
ADD COLUMN IF NOT EXISTS "teamMembers" JSONB;
