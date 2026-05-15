import { prisma } from '../prisma.js';
import { AppError } from '../utils/AppError.js';

export type EventPhaseDto = {
  eventName: string;
  amountKes: number;
  mpesaChannelLabel: string;
  mpesaTillOrPaybill: string;
  accountReferenceHint: string;
  scheduleNote: string;
  checkInClosed: boolean;
  teamsPublished: boolean;
  teamCount: number;
  /** Attendee portal (registration UI, levels, teams join) opens when both are true. */
  portalOpen: boolean;
};

async function loadEventSettings() {
  const event = await prisma.eventSettings.findUnique({ where: { singletonKey: 1 } });
  if (!event) throw new AppError('Event is not configured.', 503);
  return event;
}

export async function getEventPhase(): Promise<EventPhaseDto> {
  const [event, teamCount] = await Promise.all([
    loadEventSettings(),
    prisma.team.count()
  ]);

  const teamsPublished = event.teamsPublished || teamCount > 0;
  const checkInClosed = event.checkInClosed;

  return {
    eventName: event.eventName,
    amountKes: Number(event.amountKes),
    mpesaChannelLabel: event.mpesaChannelLabel,
    mpesaTillOrPaybill: event.mpesaTillOrPaybill,
    accountReferenceHint: event.accountReferenceHint,
    scheduleNote: event.scheduleNote,
    checkInClosed,
    teamsPublished,
    teamCount,
    portalOpen: checkInClosed && teamsPublished
  };
}

export async function setCheckInClosed(closed: boolean): Promise<EventPhaseDto> {
  await prisma.eventSettings.update({
    where: { singletonKey: 1 },
    data: { checkInClosed: closed }
  });
  return getEventPhase();
}

export async function markTeamsPublished(): Promise<void> {
  await prisma.eventSettings.update({
    where: { singletonKey: 1 },
    data: { teamsPublished: true }
  });
}
