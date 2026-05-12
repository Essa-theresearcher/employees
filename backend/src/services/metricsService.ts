import { prisma } from '../prisma.js';

export async function getDashboardMetrics() {
  const event = await prisma.eventSettings.findUnique({ where: { singletonKey: 1 } });
  const amount = event?.amountKes ? Number(event.amountKes) : 0;

  const [totalRegistered, pending, verified, rejected] = await Promise.all([
    prisma.registration.count(),
    prisma.registration.count({ where: { status: 'PENDING' } }),
    prisma.registration.count({ where: { status: 'VERIFIED' } }),
    prisma.registration.count({ where: { status: 'REJECTED' } })
  ]);

  const activePipeline = totalRegistered - rejected;
  const expectedRevenue = amount * activePipeline;
  const verifiedRevenue = amount * verified;

  return {
    totalRegistered,
    pendingPayments: pending,
    verifiedAttendees: verified,
    rejectedRegistrations: rejected,
    totalExpectedRevenue: expectedRevenue,
    totalVerifiedRevenue: verifiedRevenue,
    ticketAmountKes: amount,
    eventName: event?.eventName ?? 'Coffee & Code'
  };
}
