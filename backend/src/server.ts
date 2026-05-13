import { Prisma } from '@prisma/client';
import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './prisma.js';

function prismaConnectHint(e: unknown): string {
  const code =
    e instanceof Prisma.PrismaClientInitializationError ? (e as { errorCode?: string }).errorCode : undefined;
  const msg = e instanceof Error ? e.message : '';
  if (code === 'P1000' || msg.includes('P1000')) {
    return (
      'Database rejected the username/password (P1000). In Supabase → Settings → Database, reset the database password if needed, copy a fresh URI, and set Render DATABASE_URL again. ' +
        'If you use the session pooler, the user must be postgres.<project-ref> exactly as in the Supabase “Connect” dialog. URL-encode special characters in the password.'
    );
  }
  return 'Check DATABASE_URL: host reachable, ?sslmode=require for Supabase, correct user/password.';
}

async function main() {
  try {
    await prisma.$connect();
    // eslint-disable-next-line no-console
    console.log('Prisma: database connection OK');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`Prisma: failed to connect — ${prismaConnectHint(e)}`, e);
    process.exit(1);
  }

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on port ${env.port}`);
  });
}

void main();
