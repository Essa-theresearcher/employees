-- Coffee & Code — FULL setup: schema (matches Prisma) + default EventSettings + BadgeSequence.
-- DDL is idempotent (re-run safe). For a true empty public schema, reset-public-schema.sql first.
-- On an existing DB you want to keep: prefer `npm run db:push -w backend`, or only
-- supabase/ensure-event-settings.sql / npm run db:seed -w backend if you just need defaults.

-- Coffee & Code — PostgreSQL schema (matches Prisma). Registration uses contributionFocus (enum ContributionFocus).
-- Apply via `npm run db:push -w backend` or Supabase SQL Editor. DDL below is idempotent (re-run safe).

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum (idempotent: no-op if type already exists — e.g. after Prisma db:push)
DO $$ BEGIN
  CREATE TYPE "ContributionFocus" AS ENUM ('FRONTEND_DEVELOPMENT', 'BACKEND_DEVELOPMENT', 'UI_UX_DESIGN', 'DATA_RESEARCH', 'PRESENTATION_PITCHING', 'BUSINESS_STRATEGY', 'CONTENT_SOCIAL_MEDIA', 'PROJECT_MANAGEMENT', 'BEGINNER_LEARNING', 'OPEN_TO_ANY_ROLE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SkillLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentMethod" AS ENUM ('MPESA', 'CASH', 'BANK');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "BadgeSequence" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "nextNum" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BadgeSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Admin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "EventSettings" (
    "id" TEXT NOT NULL,
    "singletonKey" INTEGER NOT NULL DEFAULT 1,
    "eventName" TEXT NOT NULL DEFAULT 'Coffee & Code',
    "amountKes" DECIMAL(12,2) NOT NULL,
    "mpesaChannelLabel" TEXT NOT NULL DEFAULT 'Send Money',
    "mpesaTillOrPaybill" TEXT NOT NULL,
    "accountReferenceHint" TEXT NOT NULL DEFAULT 'Use your full name',
    "scheduleNote" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Registration" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "contributionFocus" "ContributionFocus" NOT NULL,
    "skillLevel" "SkillLevel" NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "mpesaTransactionCode" TEXT,
    "mpesaConfirmationMessage" TEXT,
    "screenshotPath" TEXT,
    "agreementAccepted" BOOLEAN NOT NULL,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "checkedIn" BOOLEAN NOT NULL DEFAULT false,
    "checkedInAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Payment" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "amountKes" DECIMAL(12,2),
    "method" "PaymentMethod" NOT NULL,
    "mpesaCode" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Badge" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "qrTargetUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Team" (
    "id" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Score" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "judgeName" TEXT NOT NULL,
    "ideaClarityScore" INTEGER NOT NULL,
    "technicalExecutionScore" INTEGER NOT NULL,
    "businessValueScore" INTEGER NOT NULL,
    "presentationScore" INTEGER NOT NULL,
    "teamworkScore" INTEGER NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Score_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "TeamMember" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "roleInTeam" TEXT,
    "skills" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Question" (
    "id" TEXT NOT NULL,
    "attendeeName" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "isAnswered" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Poll" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Poll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PollVote" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "voterKey" TEXT NOT NULL,
    "selectedOption" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PollVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "EventSettings_singletonKey_key" ON "EventSettings"("singletonKey");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Registration_status_idx" ON "Registration"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Registration_email_idx" ON "Registration"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Registration_phone_idx" ON "Registration"("phone");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Registration_checkedIn_idx" ON "Registration"("checkedIn");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Registration_mpesaTransactionCode_key" ON "Registration"("mpesaTransactionCode");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_registrationId_key" ON "Payment"("registrationId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Badge_registrationId_key" ON "Badge"("registrationId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Badge_badgeId_key" ON "Badge"("badgeId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Team_teamName_key" ON "Team"("teamName");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Score_teamId_idx" ON "Score"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Score_teamId_judgeName_key" ON "Score"("teamId", "judgeName");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "TeamMember_registrationId_key" ON "TeamMember"("registrationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TeamMember_teamId_idx" ON "TeamMember"("teamId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Question_upvotes_idx" ON "Question"("upvotes");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Question_createdAt_idx" ON "Question"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PollVote_pollId_idx" ON "PollVote"("pollId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PollVote_pollId_voterKey_key" ON "PollVote"("pollId", "voterKey");

-- AddForeignKey (idempotent)
DO $$ BEGIN
  ALTER TABLE "Registration" ADD CONSTRAINT "Registration_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Payment" ADD CONSTRAINT "Payment_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Badge" ADD CONSTRAINT "Badge_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Score" ADD CONSTRAINT "Score_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "PollVote" ADD CONSTRAINT "PollVote_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;


-- =============================================================================
-- Default rows (avoids "Event not configured" and missing badge counter)
-- =============================================================================
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
  1000,
  'Send Money',
  '0723995078',
  'Use your full name',
  'Please arrive from 4:30 PM onward.',
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
