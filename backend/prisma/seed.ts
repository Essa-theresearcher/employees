import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('ChangeMe123!', 12);

  await prisma.admin.upsert({
    where: { email: 'admin@coffeeandcode.com' },
    update: { passwordHash },
    create: {
      email: 'admin@coffeeandcode.com',
      passwordHash
    }
  });

  const eventDefaults = {
    amountKes: 2500,
    mpesaChannelLabel: 'Send Money',
    mpesaTillOrPaybill: '0723995078',
    scheduleNote: '4th July'
  };

  await prisma.eventSettings.upsert({
    where: { singletonKey: 1 },
    update: eventDefaults,
    create: {
      singletonKey: 1,
      eventName: 'Coffee & Code',
      accountReferenceHint: 'Use your full name',
      ...eventDefaults
    }
  });

  await prisma.badgeSequence.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, nextNum: 0 }
  });

  // eslint-disable-next-line no-console
  console.log('Seed OK — admin@coffeeandcode.com / ChangeMe123!');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
