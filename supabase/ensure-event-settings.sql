-- Run in Supabase → SQL Editor against the same DB your Render API uses.
-- Fixes public GET /api/event returning "Event not configured" (503) when no row exists.

INSERT INTO "EventSettings" (
  "id",
  "singletonKey",
  "eventName",
  "amountKes",
  "mpesaChannelLabel",
  "mpesaTillOrPaybill",
  "accountReferenceHint",
  "scheduleNote",
  "updatedAt"
)
VALUES (
  gen_random_uuid()::text,
  1,
  'Coffee & Code',
  2500,
  'Send Money',
  '0723995078',
  'Use your full name',
  '4th July',
  NOW()
)
ON CONFLICT ("singletonKey") DO UPDATE SET
  "eventName" = EXCLUDED."eventName",
  "amountKes" = EXCLUDED."amountKes",
  "mpesaChannelLabel" = EXCLUDED."mpesaChannelLabel",
  "mpesaTillOrPaybill" = EXCLUDED."mpesaTillOrPaybill",
  "accountReferenceHint" = EXCLUDED."accountReferenceHint",
  "scheduleNote" = EXCLUDED."scheduleNote",
  "updatedAt" = NOW();

-- Counter used when issuing badges (matches Prisma seed)
INSERT INTO "BadgeSequence" ("id", "nextNum")
VALUES (1, 0)
ON CONFLICT ("id") DO NOTHING;
