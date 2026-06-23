-- Coffee & Code: update current event public defaults.
-- Run against the same Supabase database used by the API.

UPDATE "EventSettings"
SET
  "amountKes" = 2500,
  "scheduleNote" = '4th July',
  "updatedAt" = NOW()
WHERE "singletonKey" = 1;
