import type { Prisma } from '@prisma/client';

export async function allocateNextBadgeId(tx: Prisma.TransactionClient): Promise<string> {
  await tx.badgeSequence.upsert({
    where: { id: 1 },
    create: { id: 1, nextNum: 0 },
    update: {}
  });

  const row = await tx.badgeSequence.update({
    where: { id: 1 },
    data: { nextNum: { increment: 1 } },
    select: { nextNum: true }
  });

  return `CC-${String(row.nextNum).padStart(4, '0')}`;
}
