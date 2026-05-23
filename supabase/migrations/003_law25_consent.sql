-- CreateTable: Law 25 consent tracking for Quebec privacy compliance
-- Note: uses integer IDs matching Cal.com schema convention (users.id is int4)
CREATE TABLE IF NOT EXISTS "Law25Consent" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "consentVersion" TEXT NOT NULL,
    "dataCollectionAllowed" BOOLEAN NOT NULL DEFAULT false,
    "crossBorderAllowed" BOOLEAN NOT NULL DEFAULT false,
    "ipAddress" TEXT NOT NULL,
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Law25Consent_userId_idx" ON "Law25Consent"("userId");

-- Add FK if not exists (manual check recommended before running)
-- ALTER TABLE "Law25Consent" ADD CONSTRAINT "Law25Consent_userId_fkey"
--   FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
