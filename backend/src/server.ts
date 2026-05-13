import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './prisma.js';

async function main() {
  try {
    await prisma.$connect();
    // eslint-disable-next-line no-console
    console.log('Prisma: database connection OK');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Prisma: failed to connect — fix DATABASE_URL (Supabase URI often needs ?sslmode=require):', e);
    process.exit(1);
  }

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on port ${env.port}`);
  });
}

void main();
