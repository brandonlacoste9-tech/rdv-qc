-- Add isPrivate flag to EventType for public/private routing
ALTER TABLE "EventType" ADD COLUMN IF NOT EXISTS "isPrivate" BOOLEAN NOT NULL DEFAULT false;
