-- =============================================================================
-- DANGER: Wipes EVERYTHING in schema "public" (all Coffee & Code tables, enums,
-- data, and any other app objects living in public).
--
-- Does NOT drop: auth.*, storage.*, extensions schema, or Supabase internals.
--
-- Typical flow (Supabase → SQL Editor):
--   1. Run this file once.
--   2. Run supabase/full-setup.sql immediately after (same session: paste both,
--      then Run, is fine).
--   3. If you use screenshot uploads, run supabase/storage.sql (idempotent).
-- =============================================================================

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;
