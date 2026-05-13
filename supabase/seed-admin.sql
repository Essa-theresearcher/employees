-- Default admin for legacy API login (POST /admin/login). Same as backend/prisma/seed.ts.
-- Run in Supabase SQL Editor if you applied schema without an Admin row, or to reset the dev password.
-- Credentials: admin@coffeeandcode.com / ChangeMe123!
-- If the frontend has VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY, use Supabase Auth instead (create a user in Authentication).

INSERT INTO "Admin" ("id", "email", "passwordHash", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'admin@coffeeandcode.com',
  '$2a$12$MzyMjVpS2w3tVHDhwiG5iOKRf/YUFkYUlpM.YXtIOmgxWWiUmNIGS',
  NOW(),
  NOW()
)
ON CONFLICT ("email") DO UPDATE SET
  "passwordHash" = EXCLUDED."passwordHash",
  "updatedAt" = NOW();
