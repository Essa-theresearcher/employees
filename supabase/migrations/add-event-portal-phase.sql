-- Coffee & Code: welcome splash / attendee portal phase
-- Run once on your production Postgres (Supabase SQL editor or psql).
-- Portal opens when checkInClosed = true AND (teamsPublished = true OR at least one row in "Team").

ALTER TABLE "EventSettings"
  ADD COLUMN IF NOT EXISTS "checkInClosed" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "EventSettings"
  ADD COLUMN IF NOT EXISTS "teamsPublished" BOOLEAN NOT NULL DEFAULT false;

-- Optional: mark teams as published if you already created teams before this migration
-- UPDATE "EventSettings" SET "teamsPublished" = true WHERE "singletonKey" = 1
--   AND EXISTS (SELECT 1 FROM "Team" LIMIT 1);
