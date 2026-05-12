-- Supabase Storage: payment screenshot bucket (run in SQL Editor after Storage is enabled).
-- The API uploads with SUPABASE_SERVICE_ROLE_KEY (bypasses RLS). Public read allows admin UI to load images via public URLs.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'registration-uploads',
  'registration-uploads',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read registration screenshots" ON storage.objects;
CREATE POLICY "Public read registration screenshots"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'registration-uploads');
