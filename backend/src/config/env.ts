import dotenv from 'dotenv';

dotenv.config();

const required = (key: string): string => {
  const v = process.env[key]?.trim();
  if (!v) throw new Error(`Missing required env var: ${key}`);
  return v;
};

const optional = (key: string): string | undefined => {
  const v = process.env[key]?.trim();
  return v || undefined;
};

const supabaseUrl = optional('SUPABASE_URL');
const supabaseServiceRoleKey = optional('SUPABASE_SERVICE_ROLE_KEY');
const supabaseStorageBucket = optional('SUPABASE_STORAGE_BUCKET') ?? 'registration-uploads';

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  publicAppUrl: process.env.PUBLIC_APP_URL ?? 'http://localhost:5173',
  uploadDir: process.env.UPLOAD_DIR ?? './uploads/screenshots',

  supabaseUrl,
  supabaseServiceRoleKey,
  supabaseStorageBucket,

  /** When true, payment screenshots go to Supabase Storage (no disk writes). */
  get supabaseStorageEnabled(): boolean {
    return Boolean(supabaseUrl && supabaseServiceRoleKey);
  },

  /** When true, API accepts Supabase Auth access tokens for admin routes (verify via service role). */
  get supabaseAuthEnabled(): boolean {
    return Boolean(supabaseUrl && supabaseServiceRoleKey);
  }
};
